import { CONFIG } from "./config.js";
import {
  normalizeSheetPressDefinition,
  normalizeSheetPressPreset,
} from "./sheet-press-presets.js";

export const APPLICATION_STATE_SCHEMA_VERSION = 1;

export const APPLICATION_SCREEN_IDS = Object.freeze({
  ORDER: "order",
  ALTERNATIVES: "alternatives",
  LAYOUT: "layout",
});

export const APPLICATION_CALCULATION_STATUSES = Object.freeze({
  IDLE: "idle",
  DIRTY: "dirty",
  CALCULATING: "calculating",
  READY: "ready",
  ERROR: "error",
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value, label) {
  if (!isRecord(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function asNullableString(value, label, maxLength = 240) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!text) return null;
  if (text.length > maxLength) throw new RangeError(`${label} is too long`);
  return text;
}

function asString(value, label, maxLength = 240) {
  const text = String(value ?? "").trim();
  if (text.length > maxLength) throw new RangeError(`${label} is too long`);
  return text;
}

function asNonNegativeInteger(value, label, fallback = 0) {
  const resolved = value ?? fallback;
  const number = Number(resolved);
  if (!Number.isInteger(number) || number < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function asOptionalNonNegativeNumber(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new TypeError(`${label} must be a non-negative number or null`);
  }
  return number;
}

function normalizeTimestamp(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const time = Date.parse(String(value));
  if (!Number.isFinite(time)) throw new TypeError(`${label} must be an ISO date string or null`);
  return new Date(time).toISOString();
}

function normalizeJsonValue(value, path = "value") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${path} contains a non-finite number`);
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeJsonValue(item, `${path}[${index}]`));
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      normalizeJsonValue(item, `${path}.${key}`),
    ]));
  }
  throw new TypeError(`${path} must contain JSON-safe values only`);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function normalizeObjectiveOrder(value, config) {
  const source = value ?? config.optimizer.decision.defaultObjectiveOrder;
  if (!Array.isArray(source) || source.length === 0) {
    throw new TypeError("input.objectivePreferences.order must be a non-empty array");
  }
  const order = source.map((id, index) => {
    const text = String(id ?? "").trim();
    if (!text) throw new TypeError(`input.objectivePreferences.order[${index}] is empty`);
    return text;
  });
  if (new Set(order).size !== order.length) {
    throw new TypeError("input.objectivePreferences.order contains duplicates");
  }
  return order;
}

function normalizePricing(value, config) {
  const pricing = isRecord(value) ? value : {};
  return {
    currency: asString(pricing.currency ?? config.pricing.currency, "input.pricing.currency", 12),
    grammageGsm: asOptionalNonNegativeNumber(
      pricing.grammageGsm ?? config.pricing.defaults.grammageGsm,
      "input.pricing.grammageGsm",
    ),
    paperPricePerKg: asOptionalNonNegativeNumber(
      pricing.paperPricePerKg ?? config.pricing.defaults.paperPricePerKg,
      "input.pricing.paperPricePerKg",
    ),
    colorPlatePrice: asOptionalNonNegativeNumber(
      pricing.colorPlatePrice ?? config.pricing.defaults.colorPlatePrice,
      "input.pricing.colorPlatePrice",
    ),
    layoutFormPreparationPrice: asOptionalNonNegativeNumber(
      pricing.layoutFormPreparationPrice ?? config.pricing.defaults.layoutFormPreparationPrice,
      "input.pricing.layoutFormPreparationPrice",
    ),
  };
}

function createDefaultSheetPressDefinition(config) {
  const defaults = config.defaults;
  return normalizeSheetPressDefinition({
    sheet: {
      width: defaults.sheetWidth,
      height: defaults.sheetHeight,
      sizeStage: defaults.sizeStage,
      trim: {
        enabled: defaults.trimEnabled,
        mode: defaults.trimUniform ? "uniform" : "sides",
        uniformMm: defaults.trimUniformMm,
        sidesMm: defaults.trimSidesMm,
      },
    },
    press: { marginsMm: defaults.pressMarginsMm },
  }, config.limits);
}

function normalizeApplicationInput(value, config) {
  const input = isRecord(value) ? value : {};
  const fallbackDefinition = createDefaultSheetPressDefinition(config);
  const definition = normalizeSheetPressDefinition({
    sheet: input.sheet ?? fallbackDefinition.sheet,
    press: input.press ?? fallbackDefinition.press,
  }, config.limits);
  const products = input.products ?? [];
  if (!Array.isArray(products)) throw new TypeError("input.products must be an array");

  return {
    selectedSheetPressPresetId: asNullableString(
      input.selectedSheetPressPresetId,
      "input.selectedSheetPressPresetId",
      96,
    ),
    sheet: definition.sheet,
    press: definition.press,
    products: normalizeJsonValue(products, "input.products"),
    pricing: normalizePricing(input.pricing, config),
    objectivePreferences: {
      order: normalizeObjectiveOrder(input.objectivePreferences?.order, config),
    },
  };
}

function normalizeProject(value) {
  const project = isRecord(value) ? value : {};
  return {
    id: asNullableString(project.id, "project.id", 120),
    name: asString(project.name, "project.name", 160),
    createdAt: normalizeTimestamp(project.createdAt, "project.createdAt"),
    updatedAt: normalizeTimestamp(project.updatedAt, "project.updatedAt"),
  };
}

function normalizeRuntime(value) {
  const runtime = isRecord(value) ? value : {};
  const calculation = isRecord(runtime.calculation) ? runtime.calculation : {};
  const status = calculation.status ?? APPLICATION_CALCULATION_STATUSES.IDLE;
  if (!Object.values(APPLICATION_CALCULATION_STATUSES).includes(status)) {
    throw new RangeError(`runtime.calculation.status is not supported: ${status}`);
  }
  const activeScreen = runtime.activeScreen ?? APPLICATION_SCREEN_IDS.ORDER;
  if (!Object.values(APPLICATION_SCREEN_IDS).includes(activeScreen)) {
    throw new RangeError(`runtime.activeScreen is not supported: ${activeScreen}`);
  }

  return {
    inputRevision: asNonNegativeInteger(runtime.inputRevision, "runtime.inputRevision"),
    calculation: {
      status,
      activeRevision: calculation.activeRevision === null || calculation.activeRevision === undefined
        ? null
        : asNonNegativeInteger(calculation.activeRevision, "runtime.calculation.activeRevision"),
      lastCompletedRevision: calculation.lastCompletedRevision === null
        || calculation.lastCompletedRevision === undefined
        ? null
        : asNonNegativeInteger(
          calculation.lastCompletedRevision,
          "runtime.calculation.lastCompletedRevision",
        ),
      lastValidRevision: calculation.lastValidRevision === null
        || calculation.lastValidRevision === undefined
        ? null
        : asNonNegativeInteger(calculation.lastValidRevision, "runtime.calculation.lastValidRevision"),
      error: asNullableString(calculation.error, "runtime.calculation.error", 1000),
    },
    selectedPlanId: asNullableString(runtime.selectedPlanId, "runtime.selectedPlanId", 240),
    activeScreen,
  };
}

function normalizeStateV1(value, config) {
  const state = asRecord(value, "application state");
  return deepFreeze({
    schemaVersion: APPLICATION_STATE_SCHEMA_VERSION,
    project: normalizeProject(state.project),
    input: normalizeApplicationInput(state.input, config),
    runtime: normalizeRuntime(state.runtime),
  });
}

function migrateLegacyApplicationState(value, config) {
  const legacy = asRecord(value, "legacy application state");
  const nestedInput = isRecord(legacy.input) ? legacy.input : {};
  const legacyTrimSides = legacy.trimSidesMm ?? legacy.trim?.sidesMm ?? config.defaults.trimSidesMm;

  return {
    schemaVersion: APPLICATION_STATE_SCHEMA_VERSION,
    project: legacy.project ?? {
      id: legacy.projectId ?? null,
      name: legacy.projectName ?? "",
      createdAt: legacy.createdAt ?? null,
      updatedAt: legacy.updatedAt ?? null,
    },
    input: {
      selectedSheetPressPresetId: nestedInput.selectedSheetPressPresetId
        ?? legacy.selectedSheetPressPresetId
        ?? (legacy.sheetPresetId && legacy.sheetPresetId !== "custom"
          ? `builtin:${legacy.sheetPresetId}`
          : null),
      sheet: nestedInput.sheet ?? legacy.sheet ?? {
        width: legacy.sheetWidth ?? config.defaults.sheetWidth,
        height: legacy.sheetHeight ?? config.defaults.sheetHeight,
        sizeStage: legacy.sizeStage ?? config.defaults.sizeStage,
        trim: {
          enabled: legacy.trimEnabled ?? config.defaults.trimEnabled,
          mode: (legacy.trimUniform ?? config.defaults.trimUniform) ? "uniform" : "sides",
          uniformMm: legacy.trimUniformMm ?? config.defaults.trimUniformMm,
          sidesMm: legacyTrimSides,
        },
      },
      press: nestedInput.press ?? legacy.press ?? {
        marginsMm: legacy.pressMarginsMm ?? config.defaults.pressMarginsMm,
      },
      products: nestedInput.products ?? legacy.products ?? [],
      pricing: nestedInput.pricing ?? legacy.pricing ?? config.pricing.defaults,
      objectivePreferences: nestedInput.objectivePreferences ?? legacy.objectivePreferences ?? {
        order: config.optimizer.decision.defaultObjectiveOrder,
      },
    },
    runtime: legacy.runtime ?? {
      inputRevision: legacy.inputRevision ?? 0,
      calculation: legacy.calculation ?? { status: APPLICATION_CALCULATION_STATUSES.IDLE },
      selectedPlanId: legacy.selectedPlanId ?? null,
      activeScreen: legacy.activeScreen ?? APPLICATION_SCREEN_IDS.ORDER,
    },
  };
}

export function normalizeApplicationState(value, config = CONFIG) {
  const state = asRecord(value, "application state");
  const version = state.schemaVersion ?? 0;
  if (version === 0) return normalizeStateV1(migrateLegacyApplicationState(state, config), config);
  if (version !== APPLICATION_STATE_SCHEMA_VERSION) {
    throw new RangeError(`Unsupported application state schemaVersion: ${version}`);
  }
  return normalizeStateV1(state, config);
}

export function createDefaultApplicationState(config = CONFIG) {
  return normalizeApplicationState({
    schemaVersion: APPLICATION_STATE_SCHEMA_VERSION,
    project: {},
    input: {},
    runtime: {},
  }, config);
}

export function serializeApplicationState(value, config = CONFIG) {
  const normalized = normalizeApplicationState(value, config);
  return JSON.stringify(canonicalize(normalized));
}

export function deserializeApplicationState(serialized, config = CONFIG) {
  if (typeof serialized !== "string") {
    throw new TypeError("Serialized application state must be a string");
  }
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new SyntaxError(`Invalid application state JSON: ${error.message}`);
  }
  return normalizeApplicationState(parsed, config);
}

function stateWithInput(state, input, config) {
  const normalizedState = normalizeApplicationState(state, config);
  const normalizedInput = normalizeApplicationInput(input, config);
  if (JSON.stringify(canonicalize(normalizedState.input)) === JSON.stringify(canonicalize(normalizedInput))) {
    return normalizedState;
  }

  return normalizeApplicationState({
    ...normalizedState,
    input: normalizedInput,
    runtime: {
      ...normalizedState.runtime,
      inputRevision: normalizedState.runtime.inputRevision + 1,
      calculation: {
        ...normalizedState.runtime.calculation,
        status: APPLICATION_CALCULATION_STATUSES.DIRTY,
        activeRevision: null,
        error: null,
      },
      selectedPlanId: null,
    },
  }, config);
}

export function replaceApplicationInput(state, replacement, config = CONFIG) {
  return stateWithInput(state, replacement, config);
}

export function applySheetPressPresetToApplicationState(state, preset, config = CONFIG) {
  const normalizedState = normalizeApplicationState(state, config);
  const normalizedPreset = normalizeSheetPressPreset(preset, config.limits);
  return stateWithInput(normalizedState, {
    ...normalizedState.input,
    selectedSheetPressPresetId: normalizedPreset.id,
    sheet: normalizedPreset.sheet,
    press: normalizedPreset.press,
  }, config);
}

export function beginApplicationCalculation(state, config = CONFIG) {
  const normalized = normalizeApplicationState(state, config);
  return normalizeApplicationState({
    ...normalized,
    runtime: {
      ...normalized.runtime,
      calculation: {
        ...normalized.runtime.calculation,
        status: APPLICATION_CALCULATION_STATUSES.CALCULATING,
        activeRevision: normalized.runtime.inputRevision,
        error: null,
      },
    },
  }, config);
}

export function completeApplicationCalculation(state, {
  revision,
  selectedPlanId = undefined,
} = {}, config = CONFIG) {
  const normalized = normalizeApplicationState(state, config);
  const resolvedRevision = asNonNegativeInteger(revision, "calculation revision");
  if (
    normalized.runtime.calculation.activeRevision !== resolvedRevision
    || normalized.runtime.inputRevision !== resolvedRevision
  ) {
    return normalized;
  }

  return normalizeApplicationState({
    ...normalized,
    runtime: {
      ...normalized.runtime,
      calculation: {
        status: APPLICATION_CALCULATION_STATUSES.READY,
        activeRevision: null,
        lastCompletedRevision: resolvedRevision,
        lastValidRevision: resolvedRevision,
        error: null,
      },
      selectedPlanId: selectedPlanId === undefined
        ? normalized.runtime.selectedPlanId
        : selectedPlanId,
    },
  }, config);
}

export function failApplicationCalculation(state, {
  revision,
  error,
} = {}, config = CONFIG) {
  const normalized = normalizeApplicationState(state, config);
  const resolvedRevision = asNonNegativeInteger(revision, "calculation revision");
  if (
    normalized.runtime.calculation.activeRevision !== resolvedRevision
    || normalized.runtime.inputRevision !== resolvedRevision
  ) {
    return normalized;
  }

  return normalizeApplicationState({
    ...normalized,
    runtime: {
      ...normalized.runtime,
      calculation: {
        ...normalized.runtime.calculation,
        status: APPLICATION_CALCULATION_STATUSES.ERROR,
        activeRevision: null,
        lastCompletedRevision: resolvedRevision,
        error: asNullableString(error, "calculation error", 1000) ?? "Calculation failed",
      },
    },
  }, config);
}

export function selectApplicationPlan(state, selectedPlanId, config = CONFIG) {
  const normalized = normalizeApplicationState(state, config);
  return normalizeApplicationState({
    ...normalized,
    runtime: {
      ...normalized.runtime,
      selectedPlanId: asNullableString(selectedPlanId, "selectedPlanId", 240),
    },
  }, config);
}

export function setApplicationActiveScreen(state, activeScreen, config = CONFIG) {
  const normalized = normalizeApplicationState(state, config);
  if (!Object.values(APPLICATION_SCREEN_IDS).includes(activeScreen)) {
    throw new RangeError(`Unsupported application screen: ${activeScreen}`);
  }
  return normalizeApplicationState({
    ...normalized,
    runtime: { ...normalized.runtime, activeScreen },
  }, config);
}
