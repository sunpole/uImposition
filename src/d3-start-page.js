import { CONFIG } from "./config.js";

export const D3_DRAFT_SCHEMA_VERSION = 1;

export const D3_STANDARD_FORMATS = Object.freeze(Object.fromEntries(
  CONFIG.productPresets.map((preset) => [
    preset.id,
    Object.freeze({ widthMm: preset.width, heightMm: preset.height }),
  ]),
));

function finiteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveInteger(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 ? value : null;
  }
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
}

function issue(field, code) {
  return Object.freeze({ field, code });
}

function rounded(value, digits) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function emptyD3Draft() {
  return {
    schemaVersion: D3_DRAFT_SCHEMA_VERSION,
    name: "",
    format: "",
    widthMm: "",
    heightMm: "",
    colorfulness: "",
    bleedMm: "",
    pages: "",
    quantity: "",
  };
}

export function recognizeD3Format(widthMm, heightMm) {
  const width = finiteNumber(widthMm);
  const height = finiteNumber(heightMm);
  if (width === null || height === null) return "";
  for (const [name, size] of Object.entries(D3_STANDARD_FORMATS)) {
    if (
      (width === size.widthMm && height === size.heightMm)
      || (width === size.heightMm && height === size.widthMm)
    ) {
      return name;
    }
  }
  return "custom";
}

export function formatD3Decimal(value, digits = CONFIG.d3StartPage.dimensionDecimals) {
  const numeric = finiteNumber(value);
  if (numeric === null) return "";
  return numeric.toLocaleString("ru-RU", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatD3Integer(value) {
  const numeric = positiveInteger(value);
  if (numeric === null) return "";
  return numeric
    .toLocaleString("ru-RU", { maximumFractionDigits: 0 })
    .replace(/[\u00a0\u202f]/g, " ");
}

function normalizeColorfulness(value) {
  if (typeof value !== "string") return null;
  const compact = value.replace(/\s+/g, "");
  const match = /^(\d+)\+(\d+)$/.exec(compact);
  if (!match) return null;
  const frontColors = Number(match[1]);
  const backColors = Number(match[2]);
  if (
    !Number.isInteger(frontColors)
    || !Number.isInteger(backColors)
    || frontColors < 1
    || frontColors > CONFIG.limits.maxColorUnits
    || backColors < 0
    || backColors > CONFIG.limits.maxColorUnits
  ) {
    return null;
  }
  return {
    value: `${frontColors}+${backColors}`,
    frontColors,
    backColors,
  };
}

function normalizeBleed(value) {
  const numeric = finiteNumber(value);
  if (numeric === null) return null;
  const clamped = Math.max(CONFIG.limits.minBleedMm, Math.min(CONFIG.limits.maxBleedMm, numeric));
  return rounded(clamped, CONFIG.d3StartPage.bleedDecimals);
}

function normalizeDimension(value) {
  const numeric = finiteNumber(value);
  return numeric === null ? null : rounded(numeric, CONFIG.d3StartPage.dimensionDecimals);
}

function fitsPrintableArea(widthMm, heightMm, bleedMm, printable) {
  const printableWidth = finiteNumber(printable?.width);
  const printableHeight = finiteNumber(printable?.height);
  if (
    printableWidth === null
    || printableHeight === null
    || printableWidth <= 0
    || printableHeight <= 0
  ) {
    return null;
  }
  const occupiedWidth = widthMm + (2 * bleedMm);
  const occupiedHeight = heightMm + (2 * bleedMm);
  if (occupiedWidth <= printableWidth && occupiedHeight <= printableHeight) return "direct";
  if (occupiedHeight <= printableWidth && occupiedWidth <= printableHeight) return "rotated";
  return null;
}

export function validateD3Draft(draft, printable) {
  const source = { ...emptyD3Draft(), ...(draft ?? {}) };
  const issues = [];
  const widthMm = normalizeDimension(source.widthMm);
  const heightMm = normalizeDimension(source.heightMm);
  const colorfulness = normalizeColorfulness(String(source.colorfulness ?? ""));
  const bleedMm = normalizeBleed(source.bleedMm);
  const pages = positiveInteger(source.pages);
  const quantity = positiveInteger(source.quantity);
  const minimumDimension = CONFIG.limits.minProductDimensionMm;

  if (!source.format && (widthMm === null || heightMm === null)) issues.push(issue("format", "required"));
  if (widthMm === null) issues.push(issue("widthMm", "invalidNumber"));
  else if (widthMm < minimumDimension) issues.push(issue("widthMm", "outOfRange"));
  if (heightMm === null) issues.push(issue("heightMm", "invalidNumber"));
  else if (heightMm < minimumDimension) issues.push(issue("heightMm", "outOfRange"));
  if (!colorfulness) issues.push(issue("colorfulness", "outOfRange"));
  if (bleedMm === null) issues.push(issue("bleedMm", "invalidNumber"));
  if (pages === null) issues.push(issue("pages", "integerRequired"));
  if (quantity === null) issues.push(issue("quantity", "integerRequired"));

  let fit = null;
  if (
    widthMm !== null
    && heightMm !== null
    && widthMm >= minimumDimension
    && heightMm >= minimumDimension
    && bleedMm !== null
  ) {
    fit = fitsPrintableArea(widthMm, heightMm, bleedMm, printable);
    if (!fit) issues.push(issue("size", "doesNotFit"));
  }

  const format = widthMm !== null && heightMm !== null
    ? recognizeD3Format(widthMm, heightMm)
    : String(source.format ?? "");

  const normalized = {
    schemaVersion: D3_DRAFT_SCHEMA_VERSION,
    name: String(source.name ?? "").trim(),
    format,
    widthMm,
    heightMm,
    colorfulness: colorfulness?.value ?? String(source.colorfulness ?? "").trim(),
    frontColors: colorfulness?.frontColors ?? null,
    backColors: colorfulness?.backColors ?? null,
    bleedMm,
    pages,
    quantity,
    fit,
  };

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues),
    normalized: Object.freeze(normalized),
  });
}

export function createD3ProductInput(validation, { fallbackName } = {}) {
  if (!validation?.valid) throw new TypeError("D3 draft must be valid before creating a product row");
  const value = validation.normalized;
  const name = value.name || String(fallbackName ?? "").trim();
  if (!name) throw new TypeError("D3 product row requires a name or fallbackName");
  return {
    enabled: true,
    name,
    sourceFileName: null,
    finished: {
      widthMm: value.widthMm,
      heightMm: value.heightMm,
    },
    quantityPerVariant: value.quantity,
    variantCount: 1,
    pages: value.pages,
    print: {
      mode: "duplex",
      frontColors: value.frontColors,
      backColors: value.backColors,
      duplexPreference: "auto",
    },
    bleed: {
      mode: "uniform",
      uniformMm: value.bleedMm,
    },
    cut: {
      mode: value.bleedMm > 0 ? "separated" : "commonCut",
      gapMm: 0,
    },
    rotationPolicy: "auto",
    notes: "",
  };
}

export function createD3CopyName(sourceName, sequences = {}) {
  const source = String(sourceName ?? "").trim() || "Заказ";
  const match = /^(.*?)(?:\s+(\d+))?$/.exec(source);
  const base = (match?.[1] || source).trim() || "Заказ";
  const explicit = match?.[2] ? Number(match[2]) : 1;
  const current = Math.max(Number(sequences[base]) || 1, explicit);
  const next = current + 1;
  return Object.freeze({
    name: `${base} ${next}`,
    sequences: Object.freeze({ ...sequences, [base]: next }),
  });
}
