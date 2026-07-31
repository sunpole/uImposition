import { CONFIG } from "./config.js";

export const PRODUCT_ROW_SCHEMA_VERSION = 1;

export const PRODUCT_PRINT_MODES = Object.freeze({
  SIMPLEX: "simplex",
  DUPLEX: "duplex",
});

export const PRODUCT_BLEED_MODES = Object.freeze({
  UNIFORM: "uniform",
  SIDES: "sides",
});

export const PRODUCT_CUT_MODES = Object.freeze({
  COMMON: "commonCut",
  SEPARATED: "separated",
});

export const PRODUCT_ROTATION_POLICIES = Object.freeze({
  AUTO: "auto",
  ZERO: "0",
  NINETY: "90",
});

export const PRODUCT_DUPLEX_PREFERENCES = Object.freeze({
  AUTO: "auto",
  SEPARATE_FRONT_BACK: "separateFrontBackForms",
  WORK_AND_TURN: "workAndTurn",
});

export const PRODUCT_ISSUE_SEVERITIES = Object.freeze({
  ERROR: "error",
  WARNING: "warning",
});

const PRODUCT_ID_PATTERN = /^product:[1-9]\d*$/;
const SIDES = Object.freeze(["left", "right", "top", "bottom"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value) {
  return isRecord(value) ? value : {};
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function normalizeText(value, maxLength) {
  const text = String(value ?? "").trim();
  return text.slice(0, maxLength);
}

function normalizeOptionalText(value, maxLength) {
  const text = normalizeText(value, maxLength);
  return text || null;
}

function normalizeDraftNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  const text = String(value).trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : text;
}

function normalizeEnum(value, supported, fallback) {
  return Object.values(supported).includes(value) ? value : fallback;
}

function normalizeSideDrafts(value, fallback) {
  const record = asRecord(value);
  return Object.fromEntries(SIDES.map((side) => [
    side,
    normalizeDraftNumber(record[side] ?? fallback[side]),
  ]));
}

function issue(severity, code, field, details = {}) {
  return Object.freeze({
    severity,
    code,
    field,
    messageKey: `product.${code}`,
    details: deepFreeze({ ...details }),
  });
}

function validateNumber(value, field, {
  required = true,
  integer = false,
  min = -Infinity,
  max = Infinity,
} = {}) {
  const issues = [];
  if (value === null || value === undefined || value === "") {
    if (required) issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "required", field));
    return { value: null, issues };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "invalidNumber", field));
    return { value: null, issues };
  }
  if (integer && !Number.isInteger(value)) {
    issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "integerRequired", field, { value }));
  }
  if (value < min || value > max) {
    issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "outOfRange", field, { value, min, max }));
  }
  return { value, issues };
}

function normalizeBleed(input, defaults) {
  const bleed = asRecord(input);
  const mode = normalizeEnum(bleed.mode, PRODUCT_BLEED_MODES, defaults.mode);
  const uniformMm = normalizeDraftNumber(bleed.uniformMm ?? defaults.uniformMm);
  let sidesMm = normalizeSideDrafts(bleed.sidesMm, defaults.sidesMm);
  if (mode === PRODUCT_BLEED_MODES.UNIFORM) {
    sidesMm = Object.fromEntries(SIDES.map((side) => [side, uniformMm]));
  }
  return { mode, uniformMm, sidesMm };
}

function normalizePrint(input, defaults) {
  const print = asRecord(input);
  const mode = normalizeEnum(print.mode, PRODUCT_PRINT_MODES, defaults.mode);
  const frontColors = normalizeDraftNumber(print.frontColors ?? defaults.frontColors);
  const backColors = mode === PRODUCT_PRINT_MODES.SIMPLEX
    ? 0
    : normalizeDraftNumber(print.backColors ?? defaults.backColors);
  const duplexPreference = mode === PRODUCT_PRINT_MODES.SIMPLEX
    ? PRODUCT_DUPLEX_PREFERENCES.AUTO
    : normalizeEnum(
      print.duplexPreference,
      PRODUCT_DUPLEX_PREFERENCES,
      defaults.duplexPreference,
    );
  return { mode, frontColors, backColors, duplexPreference };
}

function normalizeCut(input, defaults) {
  const cut = asRecord(input);
  const mode = normalizeEnum(cut.mode, PRODUCT_CUT_MODES, defaults.mode);
  return {
    mode,
    gapMm: mode === PRODUCT_CUT_MODES.COMMON
      ? 0
      : normalizeDraftNumber(cut.gapMm ?? defaults.gapMm),
  };
}

function defaultBleedSides(uniformMm) {
  return { left: uniformMm, right: uniformMm, top: uniformMm, bottom: uniformMm };
}

function productDefaults(config) {
  const defaults = config.productRows.defaults;
  return {
    finished: {
      widthMm: defaults.finishedWidthMm,
      heightMm: defaults.finishedHeightMm,
    },
    quantityPerVariant: defaults.quantityPerVariant,
    variantCount: defaults.variantCount,
    pages: defaults.pages,
    print: {
      mode: defaults.printMode,
      frontColors: defaults.frontColors,
      backColors: defaults.backColors,
      duplexPreference: defaults.duplexPreference,
    },
    bleed: {
      mode: defaults.bleedMode,
      uniformMm: defaults.bleedUniformMm,
      sidesMm: defaultBleedSides(defaults.bleedUniformMm),
    },
    cut: {
      mode: defaults.cutMode,
      gapMm: defaults.gapMm,
    },
    rotationPolicy: defaults.rotationPolicy,
  };
}

export function normalizeProductRowDraft(input, {
  id = undefined,
  config = CONFIG,
} = {}) {
  const source = asRecord(input);
  const defaults = productDefaults(config);
  const resolvedId = String(source.id ?? id ?? "").trim();
  if (!PRODUCT_ID_PATTERN.test(resolvedId)) {
    throw new TypeError("product row id must use the product:<positive integer> format");
  }

  const finished = asRecord(source.finished);
  const row = {
    schemaVersion: PRODUCT_ROW_SCHEMA_VERSION,
    id: resolvedId,
    enabled: source.enabled !== false,
    name: normalizeText(source.name, config.limits.maxProductNameLength),
    sourceFileName: normalizeOptionalText(
      source.sourceFileName,
      config.limits.maxProductSourceFileNameLength,
    ),
    finished: {
      widthMm: normalizeDraftNumber(finished.widthMm ?? source.widthMm ?? defaults.finished.widthMm),
      heightMm: normalizeDraftNumber(finished.heightMm ?? source.heightMm ?? defaults.finished.heightMm),
    },
    quantityPerVariant: normalizeDraftNumber(
      source.quantityPerVariant ?? source.quantity ?? defaults.quantityPerVariant,
    ),
    variantCount: normalizeDraftNumber(
      source.variantCount ?? source.fileCount ?? defaults.variantCount,
    ),
    pages: normalizeDraftNumber(source.pages ?? defaults.pages),
    print: normalizePrint(source.print, defaults.print),
    bleed: normalizeBleed(source.bleed, defaults.bleed),
    cut: normalizeCut(source.cut, defaults.cut),
    rotationPolicy: normalizeEnum(
      source.rotationPolicy,
      PRODUCT_ROTATION_POLICIES,
      defaults.rotationPolicy,
    ),
    notes: normalizeText(source.notes ?? source.note, config.limits.maxProductNotesLength),
  };

  return deepFreeze(row);
}

function migrateLegacyRow(input, id, config) {
  const row = asRecord(input);
  return normalizeProductRowDraft({
    id,
    name: row.name ?? row.file ?? row.sourceFileName ?? "",
    sourceFileName: row.sourceFileName ?? row.file ?? null,
    finished: row.finished ?? {
      widthMm: row.widthMm ?? config.productRows.defaults.finishedWidthMm,
      heightMm: row.heightMm ?? config.productRows.defaults.finishedHeightMm,
    },
    quantityPerVariant: row.quantityPerVariant ?? row.quantity ?? null,
    variantCount: row.variantCount ?? row.fileCount ?? 1,
    pages: row.pages ?? null,
    print: row.print ?? {
      mode: row.printMode ?? config.productRows.defaults.printMode,
      frontColors: row.frontColors ?? config.productRows.defaults.frontColors,
      backColors: row.backColors ?? config.productRows.defaults.backColors,
      duplexPreference: row.duplexPreference ?? config.productRows.defaults.duplexPreference,
    },
    bleed: row.bleed ?? {
      mode: row.bleedMode ?? config.productRows.defaults.bleedMode,
      uniformMm: row.bleedMm ?? config.productRows.defaults.bleedUniformMm,
    },
    cut: row.cut ?? {
      mode: row.spacingMode ?? config.productRows.defaults.cutMode,
      gapMm: row.gapMm ?? config.productRows.defaults.gapMm,
    },
    rotationPolicy: row.rotationPolicy ?? config.productRows.defaults.rotationPolicy,
    enabled: row.enabled,
    notes: row.notes ?? row.note ?? "",
  }, { id, config });
}

export function normalizeProductRow(input, {
  id = undefined,
  config = CONFIG,
} = {}) {
  const source = asRecord(input);
  const version = source.schemaVersion ?? 0;
  if (version === 0) {
    const resolvedId = String(source.id ?? id ?? "").trim();
    return migrateLegacyRow(source, resolvedId, config);
  }
  if (version !== PRODUCT_ROW_SCHEMA_VERSION) {
    throw new RangeError(`Unsupported product row schemaVersion: ${version}`);
  }
  return normalizeProductRowDraft(source, { id, config });
}

export function validateProductRow(input, config = CONFIG) {
  const row = normalizeProductRow(input, { config });
  const limits = config.limits;
  const issues = [];

  if (!row.name) {
    issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "nameRequired", "name"));
  }

  const width = validateNumber(row.finished.widthMm, "finished.widthMm", {
    min: limits.minProductDimensionMm,
    max: limits.maxProductDimensionMm,
  });
  const height = validateNumber(row.finished.heightMm, "finished.heightMm", {
    min: limits.minProductDimensionMm,
    max: limits.maxProductDimensionMm,
  });
  const quantity = validateNumber(row.quantityPerVariant, "quantityPerVariant", {
    integer: true,
    min: 1,
    max: limits.maxQuantity,
  });
  const variants = validateNumber(row.variantCount, "variantCount", {
    integer: true,
    min: 1,
    max: limits.maxProductVariants,
  });
  const pages = validateNumber(row.pages, "pages", {
    integer: true,
    min: 1,
    max: limits.maxPagesPerFile,
  });
  const frontColors = validateNumber(row.print.frontColors, "print.frontColors", {
    integer: true,
    min: 0,
    max: limits.maxColorUnits,
  });
  const backColors = validateNumber(row.print.backColors, "print.backColors", {
    integer: true,
    min: 0,
    max: limits.maxColorUnits,
  });

  [width, height, quantity, variants, pages, frontColors, backColors]
    .forEach((result) => issues.push(...result.issues));

  if (row.print.mode === PRODUCT_PRINT_MODES.SIMPLEX) {
    if (row.print.frontColors === 0) {
      issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "simplexFrontColorsRequired", "print.frontColors"));
    }
  } else {
    if (row.print.frontColors === 0) {
      issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "duplexFrontColorsRequired", "print.frontColors"));
    }
    if (row.print.backColors === 0) {
      issues.push(issue(PRODUCT_ISSUE_SEVERITIES.ERROR, "duplexBackColorsRequired", "print.backColors"));
    }
  }

  const bleedValues = row.bleed.mode === PRODUCT_BLEED_MODES.UNIFORM
    ? [["bleed.uniformMm", row.bleed.uniformMm]]
    : SIDES.map((side) => [`bleed.sidesMm.${side}`, row.bleed.sidesMm[side]]);
  bleedValues.forEach(([field, value]) => {
    issues.push(...validateNumber(value, field, {
      min: limits.minBleedMm,
      max: limits.maxBleedMm,
    }).issues);
  });

  issues.push(...validateNumber(row.cut.gapMm, "cut.gapMm", {
    min: limits.minGapMm,
    max: limits.maxGapMm,
  }).issues);

  const effectiveBleed = row.bleed.mode === PRODUCT_BLEED_MODES.UNIFORM
    ? [row.bleed.uniformMm]
    : SIDES.map((side) => row.bleed.sidesMm[side]);
  if (
    row.cut.mode === PRODUCT_CUT_MODES.COMMON
    && effectiveBleed.some((value) => typeof value === "number" && value !== 0)
  ) {
    issues.push(issue(
      PRODUCT_ISSUE_SEVERITIES.ERROR,
      "commonCutRequiresZeroBleed",
      "cut.mode",
    ));
  }

  if (
    typeof row.quantityPerVariant === "number"
    && typeof row.variantCount === "number"
    && Number.isFinite(row.quantityPerVariant * row.variantCount)
    && row.quantityPerVariant * row.variantCount > limits.maxTotalProductQuantity
  ) {
    issues.push(issue(
      PRODUCT_ISSUE_SEVERITIES.ERROR,
      "totalQuantityTooLarge",
      "variantCount",
      {
        totalQuantity: row.quantityPerVariant * row.variantCount,
        max: limits.maxTotalProductQuantity,
      },
    ));
  }

  return deepFreeze({
    row,
    issues,
    valid: !issues.some(({ severity }) => severity === PRODUCT_ISSUE_SEVERITIES.ERROR),
    summary: {
      totalQuantity: typeof row.quantityPerVariant === "number"
        && typeof row.variantCount === "number"
        ? row.quantityPerVariant * row.variantCount
        : null,
      printPairCount: typeof row.pages === "number" ? Math.ceil(row.pages / 2) : null,
    },
  });
}

export function validateProductRowForUniformPipeline(input, config = CONFIG) {
  const base = validateProductRow(input, config);
  const issues = [...base.issues];
  const row = base.row;

  if (row.print.mode !== PRODUCT_PRINT_MODES.DUPLEX) {
    issues.push(issue(
      PRODUCT_ISSUE_SEVERITIES.ERROR,
      "uniformPipelineRequiresDuplex",
      "print.mode",
    ));
  }
  if (typeof row.pages === "number" && row.pages % 2 !== 0) {
    issues.push(issue(
      PRODUCT_ISSUE_SEVERITIES.ERROR,
      "uniformPipelineRequiresCompletePagePairs",
      "pages",
      { pages: row.pages },
    ));
  }
  if (row.print.duplexPreference === PRODUCT_DUPLEX_PREFERENCES.WORK_AND_TURN) {
    issues.push(issue(
      PRODUCT_ISSUE_SEVERITIES.ERROR,
      "uniformPipelineWorkAndTurnNotGeneralized",
      "print.duplexPreference",
    ));
  }

  return deepFreeze({
    ...base,
    issues,
    valid: !issues.some(({ severity }) => severity === PRODUCT_ISSUE_SEVERITIES.ERROR),
  });
}

export function materializeProductRow(input, config = CONFIG) {
  const result = validateProductRow(input, config);
  if (!result.valid) {
    const error = new TypeError("Product row is not valid");
    error.issues = result.issues;
    throw error;
  }
  return result.row;
}

export function expandProductRowToLegacyOrders(input, config = CONFIG) {
  const result = validateProductRowForUniformPipeline(input, config);
  if (!result.valid) {
    const error = new TypeError("Product row is not compatible with the current uniform pipeline");
    error.issues = result.issues;
    throw error;
  }
  const row = result.row;
  return deepFreeze(Array.from({ length: row.variantCount }, (_, index) => ({
    file: row.variantCount === 1 ? row.name : `${row.name} · ${index + 1}`,
    quantity: row.quantityPerVariant,
    pages: row.pages,
    printPairs: Math.ceil(row.pages / 2),
    note: row.notes,
    productRowId: row.id,
    variantIndex: index + 1,
  })));
}
