import { CONFIG } from "./config.js";

export const SHEET_PRESS_PRESET_SCHEMA_VERSION = 1;

export const SHEET_PRESS_PRESET_KINDS = Object.freeze({
  BUILT_IN: "builtIn",
  LOCAL: "local",
});

export const SHEET_SIZE_STAGES = Object.freeze({
  BEFORE_TRIM: "beforeTrim",
  AFTER_TRIM: "afterTrim",
});

export const SHEET_TRIM_MODES = Object.freeze({
  UNIFORM: "uniform",
  SIDES: "sides",
});

const SIDES = Object.freeze(["left", "right", "top", "bottom"]);
const ID_PATTERN = /^(builtin|local):[a-z0-9][a-z0-9-]*$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value, label) {
  if (!isRecord(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function asFiniteNumber(value, label, { min = -Infinity, max = Infinity } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number`);
  if (number < min || number > max) {
    throw new RangeError(`${label} must be between ${min} and ${max}`);
  }
  return number;
}

function asNonEmptyString(value, label, maxLength = 120) {
  const text = String(value ?? "").trim();
  if (!text) throw new TypeError(`${label} must be a non-empty string`);
  if (text.length > maxLength) throw new RangeError(`${label} is too long`);
  return text;
}

function normalizeTimestamp(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const time = Date.parse(String(value));
  if (!Number.isFinite(time)) throw new TypeError(`${label} must be an ISO date string or null`);
  return new Date(time).toISOString();
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function normalizeSideValues(input, label, { min, max }, fallback) {
  const record = isRecord(input) ? input : {};
  return Object.fromEntries(SIDES.map((side) => [
    side,
    asFiniteNumber(record[side] ?? fallback[side], `${label}.${side}`, { min, max }),
  ]));
}

function normalizeTrim(trimInput, sizeStage, limits) {
  const trim = isRecord(trimInput) ? trimInput : {};
  const fallbackSides = CONFIG.defaults.trimSidesMm;
  const requestedMode = trim.mode
    ?? (trim.uniform === false ? SHEET_TRIM_MODES.SIDES : SHEET_TRIM_MODES.UNIFORM);
  if (!Object.values(SHEET_TRIM_MODES).includes(requestedMode)) {
    throw new RangeError(`sheet.trim.mode is not supported: ${requestedMode}`);
  }

  const uniformMm = asFiniteNumber(
    trim.uniformMm ?? trim.uniformValueMm ?? CONFIG.defaults.trimUniformMm,
    "sheet.trim.uniformMm",
    { min: limits.minTrimMm, max: limits.maxTrimMm },
  );
  let sidesMm = normalizeSideValues(
    trim.sidesMm ?? trim.sides,
    "sheet.trim.sidesMm",
    { min: limits.minTrimMm, max: limits.maxTrimMm },
    fallbackSides,
  );
  if (requestedMode === SHEET_TRIM_MODES.UNIFORM) {
    sidesMm = Object.fromEntries(SIDES.map((side) => [side, uniformMm]));
  }

  return {
    enabled: sizeStage === SHEET_SIZE_STAGES.BEFORE_TRIM && Boolean(trim.enabled),
    mode: requestedMode,
    uniformMm,
    sidesMm,
  };
}

export function normalizeSheetPressDefinition(input, limits = CONFIG.limits) {
  const definition = asRecord(input, "sheet/press definition");
  const sheet = asRecord(definition.sheet, "sheet");
  const press = isRecord(definition.press) ? definition.press : {};
  const sizeStage = sheet.sizeStage ?? CONFIG.defaults.sizeStage;
  if (!Object.values(SHEET_SIZE_STAGES).includes(sizeStage)) {
    throw new RangeError(`sheet.sizeStage is not supported: ${sizeStage}`);
  }

  const normalized = {
    sheet: {
      width: asFiniteNumber(sheet.width, "sheet.width", {
        min: limits.minDimensionMm,
        max: limits.maxDimensionMm,
      }),
      height: asFiniteNumber(sheet.height, "sheet.height", {
        min: limits.minDimensionMm,
        max: limits.maxDimensionMm,
      }),
      sizeStage,
      trim: normalizeTrim(sheet.trim, sizeStage, limits),
    },
    press: {
      marginsMm: normalizeSideValues(
        press.marginsMm ?? press.pressMarginsMm ?? press.margins,
        "press.marginsMm",
        { min: limits.minPressMarginMm, max: limits.maxPressMarginMm },
        CONFIG.defaults.pressMarginsMm,
      ),
    },
  };

  return deepFreeze(normalized);
}

function slugify(value) {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "preset";
}

export function allocateLocalSheetPressPresetId(name, existingPresets = []) {
  const usedIds = new Set(existingPresets.map((preset) => String(preset?.id ?? "")));
  const base = `local:${slugify(name)}`;
  if (!usedIds.has(base)) return base;
  let suffix = 2;
  while (usedIds.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function normalizePresetV1(input, limits) {
  const preset = asRecord(input, "preset");
  const kind = preset.kind ?? SHEET_PRESS_PRESET_KINDS.LOCAL;
  if (!Object.values(SHEET_PRESS_PRESET_KINDS).includes(kind)) {
    throw new RangeError(`preset.kind is not supported: ${kind}`);
  }

  const id = asNonEmptyString(preset.id, "preset.id", 96);
  if (!ID_PATTERN.test(id)) {
    throw new TypeError("preset.id must use the builtin: or local: namespace");
  }
  if (kind === SHEET_PRESS_PRESET_KINDS.BUILT_IN && !id.startsWith("builtin:")) {
    throw new TypeError("built-in preset id must start with builtin:");
  }
  if (kind === SHEET_PRESS_PRESET_KINDS.LOCAL && !id.startsWith("local:")) {
    throw new TypeError("local preset id must start with local:");
  }

  const definition = normalizeSheetPressDefinition({
    sheet: preset.sheet,
    press: preset.press,
  }, limits);
  const metadata = isRecord(preset.metadata) ? preset.metadata : {};

  return deepFreeze({
    schemaVersion: SHEET_PRESS_PRESET_SCHEMA_VERSION,
    id,
    kind,
    name: asNonEmptyString(preset.name ?? preset.label, "preset.name"),
    sheet: definition.sheet,
    press: definition.press,
    metadata: {
      favorite: Boolean(metadata.favorite),
      createdAt: normalizeTimestamp(metadata.createdAt, "preset.metadata.createdAt"),
      updatedAt: normalizeTimestamp(metadata.updatedAt, "preset.metadata.updatedAt"),
      lastUsedAt: normalizeTimestamp(metadata.lastUsedAt, "preset.metadata.lastUsedAt"),
    },
  });
}

function migrateLegacyPreset(input) {
  const preset = asRecord(input, "legacy preset");
  const name = preset.name ?? preset.label ?? preset.id ?? "Preset";
  const requestedKind = preset.kind === SHEET_PRESS_PRESET_KINDS.BUILT_IN
    ? SHEET_PRESS_PRESET_KINDS.BUILT_IN
    : SHEET_PRESS_PRESET_KINDS.LOCAL;
  const rawId = String(preset.id ?? name);
  const namespacedId = rawId.startsWith("builtin:") || rawId.startsWith("local:")
    ? rawId
    : `${requestedKind === SHEET_PRESS_PRESET_KINDS.BUILT_IN ? "builtin" : "local"}:${slugify(rawId)}`;

  const trimSides = preset.trimSidesMm
    ?? preset.trim?.sidesMm
    ?? preset.trim?.sides
    ?? CONFIG.defaults.trimSidesMm;

  return {
    schemaVersion: SHEET_PRESS_PRESET_SCHEMA_VERSION,
    id: namespacedId,
    kind: requestedKind,
    name,
    sheet: preset.sheet ?? {
      width: preset.width,
      height: preset.height,
      sizeStage: preset.sizeStage ?? CONFIG.defaults.sizeStage,
      trim: {
        enabled: preset.trimEnabled ?? preset.trim?.enabled ?? CONFIG.defaults.trimEnabled,
        mode: (preset.trimUniform ?? preset.trim?.uniform) === false
          ? SHEET_TRIM_MODES.SIDES
          : SHEET_TRIM_MODES.UNIFORM,
        uniformMm: preset.trimUniformMm ?? preset.trim?.uniformMm ?? CONFIG.defaults.trimUniformMm,
        sidesMm: trimSides,
      },
    },
    press: preset.press ?? {
      marginsMm: preset.pressMarginsMm ?? preset.marginsMm ?? CONFIG.defaults.pressMarginsMm,
    },
    metadata: preset.metadata ?? {},
  };
}

export function normalizeSheetPressPreset(input, limits = CONFIG.limits) {
  const preset = asRecord(input, "preset");
  const version = preset.schemaVersion ?? 0;
  if (version === 0) return normalizePresetV1(migrateLegacyPreset(preset), limits);
  if (version !== SHEET_PRESS_PRESET_SCHEMA_VERSION) {
    throw new RangeError(`Unsupported sheet/press preset schemaVersion: ${version}`);
  }
  return normalizePresetV1(preset, limits);
}

export function createLocalSheetPressPreset(input, {
  existingPresets = [],
  limits = CONFIG.limits,
} = {}) {
  const source = asRecord(input, "local preset input");
  const id = source.id ?? allocateLocalSheetPressPresetId(source.name ?? source.label, existingPresets);
  return normalizeSheetPressPreset({
    ...source,
    schemaVersion: SHEET_PRESS_PRESET_SCHEMA_VERSION,
    id,
    kind: SHEET_PRESS_PRESET_KINDS.LOCAL,
  }, limits);
}

export function createBuiltInSheetPressPresets(config = CONFIG) {
  const defaults = config.defaults;
  return deepFreeze(config.sheetPresets.map((preset) => normalizeSheetPressPreset({
    schemaVersion: SHEET_PRESS_PRESET_SCHEMA_VERSION,
    id: `builtin:${preset.id}`,
    kind: SHEET_PRESS_PRESET_KINDS.BUILT_IN,
    name: preset.label,
    sheet: {
      width: preset.width,
      height: preset.height,
      sizeStage: preset.sizeStage,
      trim: {
        enabled: preset.sizeStage === SHEET_SIZE_STAGES.BEFORE_TRIM && defaults.trimEnabled,
        mode: defaults.trimUniform ? SHEET_TRIM_MODES.UNIFORM : SHEET_TRIM_MODES.SIDES,
        uniformMm: defaults.trimUniformMm,
        sidesMm: defaults.trimSidesMm,
      },
    },
    press: { marginsMm: defaults.pressMarginsMm },
    metadata: {},
  }, config.limits)));
}
