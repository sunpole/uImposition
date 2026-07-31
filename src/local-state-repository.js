import { CONFIG } from "./config.js";
import {
  deserializeApplicationState,
  serializeApplicationState,
} from "./application-state.js";
import { prepareApplicationStateForPersistence } from "./application-state-persistence.js";
import {
  SHEET_PRESS_PRESET_KINDS,
  normalizeSheetPressPreset,
} from "./sheet-press-presets.js";

export const LOCAL_PRESET_COLLECTION_SCHEMA_VERSION = 1;

const DEFAULT_APPLICATION_STATE_KEY = "uImposition.project.v1";
const DEFAULT_SHEET_PRESS_PRESET_KEY = "uImposition.sheetPressPresets.v1";

function assertStorage(storage) {
  if (!storage || typeof storage !== "object") {
    throw new TypeError("storage must be an object implementing getItem/setItem/removeItem");
  }
  ["getItem", "setItem", "removeItem"].forEach((method) => {
    if (typeof storage[method] !== "function") {
      throw new TypeError(`storage.${method} must be a function`);
    }
  });
  return storage;
}

function resolveNow(now) {
  const value = typeof now === "function" ? now() : now;
  const time = value instanceof Date ? value.getTime() : Date.parse(String(value));
  if (!Number.isFinite(time)) throw new TypeError("now must resolve to a valid date");
  return new Date(time).toISOString();
}

function parseJson(serialized, label) {
  try {
    return JSON.parse(serialized);
  } catch (error) {
    throw new SyntaxError(`Invalid ${label} JSON: ${error.message}`);
  }
}

function normalizeLocalPresetCollection(value) {
  const rawPresets = Array.isArray(value)
    ? value
    : value?.schemaVersion === 0
      ? value.presets
      : value?.schemaVersion === LOCAL_PRESET_COLLECTION_SCHEMA_VERSION
        ? value.presets
        : null;

  if (!Array.isArray(rawPresets)) {
    const version = value?.schemaVersion;
    if (version !== undefined && version !== 0 && version !== LOCAL_PRESET_COLLECTION_SCHEMA_VERSION) {
      throw new RangeError(`Unsupported local preset collection schemaVersion: ${version}`);
    }
    throw new TypeError("Local preset collection must contain a presets array");
  }

  const normalized = rawPresets.map((preset) => normalizeSheetPressPreset(preset));
  normalized.forEach((preset) => {
    if (preset.kind !== SHEET_PRESS_PRESET_KINDS.LOCAL) {
      throw new TypeError(`Only local presets may be persisted: ${preset.id}`);
    }
  });
  const ids = normalized.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new TypeError("Local preset collection contains duplicate ids");
  }
  return normalized;
}

function encodeLocalPresetCollection(presets) {
  const normalized = normalizeLocalPresetCollection({
    schemaVersion: LOCAL_PRESET_COLLECTION_SCHEMA_VERSION,
    presets,
  });
  const stablePresets = [...normalized].sort((a, b) => a.id.localeCompare(b.id, "en"));
  return JSON.stringify({
    schemaVersion: LOCAL_PRESET_COLLECTION_SCHEMA_VERSION,
    presets: stablePresets,
  });
}

function sortPresetsForUse(presets) {
  return [...presets].sort((left, right) => {
    if (left.metadata.favorite !== right.metadata.favorite) {
      return left.metadata.favorite ? -1 : 1;
    }
    const leftUsed = left.metadata.lastUsedAt ?? "";
    const rightUsed = right.metadata.lastUsedAt ?? "";
    if (leftUsed !== rightUsed) return rightUsed.localeCompare(leftUsed, "en");
    const byName = left.name.localeCompare(right.name, "ru");
    return byName || left.id.localeCompare(right.id, "en");
  });
}

export function createApplicationStateRepository({
  storage,
  key = CONFIG.storage.applicationStateKey ?? DEFAULT_APPLICATION_STATE_KEY,
  config = CONFIG,
} = {}) {
  const target = assertStorage(storage);
  const storageKey = String(key);

  function normalizeForStorage(state) {
    return prepareApplicationStateForPersistence(state, config);
  }

  return Object.freeze({
    load() {
      const serialized = target.getItem(storageKey);
      if (serialized === null) return null;
      return normalizeForStorage(deserializeApplicationState(serialized, config));
    },

    save(state) {
      const normalized = normalizeForStorage(state);
      target.setItem(storageKey, serializeApplicationState(normalized, config));
      return normalized;
    },

    clear() {
      target.removeItem(storageKey);
    },

    exportJson() {
      const serialized = target.getItem(storageKey);
      if (serialized === null) return null;
      const normalized = normalizeForStorage(deserializeApplicationState(serialized, config));
      return serializeApplicationState(normalized, config);
    },

    importJson(serialized) {
      const normalized = normalizeForStorage(deserializeApplicationState(serialized, config));
      target.setItem(storageKey, serializeApplicationState(normalized, config));
      return normalized;
    },
  });
}

export function createSheetPressPresetRepository({
  storage,
  key = CONFIG.storage.sheetPressPresetsKey ?? DEFAULT_SHEET_PRESS_PRESET_KEY,
  now = () => new Date(),
} = {}) {
  const target = assertStorage(storage);
  const storageKey = String(key);

  function loadRawPresets() {
    const serialized = target.getItem(storageKey);
    if (serialized === null) return [];
    return normalizeLocalPresetCollection(parseJson(serialized, "local preset collection"));
  }

  function persist(presets) {
    const serialized = encodeLocalPresetCollection(presets);
    target.setItem(storageKey, serialized);
    return normalizeLocalPresetCollection(JSON.parse(serialized));
  }

  return Object.freeze({
    list() {
      return sortPresetsForUse(loadRawPresets());
    },

    get(id) {
      const presetId = String(id ?? "");
      return loadRawPresets().find((preset) => preset.id === presetId) ?? null;
    },

    save(input) {
      const requested = normalizeSheetPressPreset(input);
      if (requested.kind !== SHEET_PRESS_PRESET_KINDS.LOCAL) {
        throw new TypeError("Built-in presets cannot be saved in the local repository");
      }
      const presets = loadRawPresets();
      const existing = presets.find((preset) => preset.id === requested.id);
      const timestamp = resolveNow(now);
      const saved = normalizeSheetPressPreset({
        ...requested,
        metadata: {
          ...requested.metadata,
          createdAt: existing?.metadata.createdAt ?? requested.metadata.createdAt ?? timestamp,
          updatedAt: timestamp,
        },
      });
      persist([
        ...presets.filter((preset) => preset.id !== saved.id),
        saved,
      ]);
      return saved;
    },

    remove(id) {
      const presetId = String(id ?? "");
      if (presetId.startsWith("builtin:")) {
        throw new TypeError("Built-in presets cannot be removed from the local repository");
      }
      const presets = loadRawPresets();
      const next = presets.filter((preset) => preset.id !== presetId);
      if (next.length === presets.length) return false;
      if (next.length === 0) target.removeItem(storageKey);
      else persist(next);
      return true;
    },

    markUsed(id) {
      const presetId = String(id ?? "");
      const presets = loadRawPresets();
      const index = presets.findIndex((preset) => preset.id === presetId);
      if (index < 0) return null;
      const timestamp = resolveNow(now);
      const updated = normalizeSheetPressPreset({
        ...presets[index],
        metadata: {
          ...presets[index].metadata,
          lastUsedAt: timestamp,
          updatedAt: timestamp,
        },
      });
      const next = [...presets];
      next[index] = updated;
      persist(next);
      return updated;
    },

    setFavorite(id, favorite) {
      const presetId = String(id ?? "");
      const presets = loadRawPresets();
      const index = presets.findIndex((preset) => preset.id === presetId);
      if (index < 0) return null;
      const timestamp = resolveNow(now);
      const updated = normalizeSheetPressPreset({
        ...presets[index],
        metadata: {
          ...presets[index].metadata,
          favorite: Boolean(favorite),
          updatedAt: timestamp,
        },
      });
      const next = [...presets];
      next[index] = updated;
      persist(next);
      return updated;
    },

    clear() {
      target.removeItem(storageKey);
    },

    exportJson() {
      const presets = loadRawPresets();
      return encodeLocalPresetCollection(presets);
    },

    importJson(serialized, { replace = false } = {}) {
      if (typeof serialized !== "string") {
        throw new TypeError("Serialized preset collection must be a string");
      }
      const imported = normalizeLocalPresetCollection(parseJson(serialized, "local preset collection"));
      const current = replace ? [] : loadRawPresets();
      const byId = new Map(current.map((preset) => [preset.id, preset]));
      imported.forEach((preset) => byId.set(preset.id, preset));
      const persisted = persist([...byId.values()]);
      return sortPresetsForUse(persisted);
    },
  });
}
