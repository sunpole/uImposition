import { CONFIG } from "./config.js";
import { parseOrders } from "./orders.js";
import {
  PRODUCT_ISSUE_SEVERITIES,
  expandProductRowToLegacyOrders,
  normalizeProductRow,
  normalizeProductRowDraft,
  validateProductRow,
  validateProductRowForUniformPipeline,
} from "./product-row.js";

export const PRODUCT_ROW_COLLECTION_SCHEMA_VERSION = 1;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function collectionIssue(severity, code, field, details = {}, blocking = true) {
  return Object.freeze({
    severity,
    code,
    field,
    messageKey: `products.${code}`,
    details: deepFreeze({ ...details }),
    blocking,
  });
}

function decorateRowIssue(entry, row, index, blocking = row.enabled) {
  return deepFreeze({
    ...entry,
    rowId: row.id,
    index,
    blocking,
  });
}

function isBlockingError(entry) {
  return entry.severity === PRODUCT_ISSUE_SEVERITIES.ERROR && entry.blocking !== false;
}

function issueSignature(entry) {
  return [entry.rowId ?? "collection", entry.code, entry.field].join("|");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function rowsFromInput(input) {
  if (Array.isArray(input)) return { version: 0, rows: input };
  if (!isRecord(input)) throw new TypeError("Product row collection must be an object or array");
  const version = input.schemaVersion ?? 0;
  if (version !== 0 && version !== PRODUCT_ROW_COLLECTION_SCHEMA_VERSION) {
    throw new RangeError(`Unsupported product row collection schemaVersion: ${version}`);
  }
  if (!Array.isArray(input.rows)) throw new TypeError("Product row collection must contain rows[]");
  return { version, rows: input.rows };
}

export function allocateProductRowId(rows = []) {
  const maximum = rows.reduce((max, row) => {
    const match = /^product:([1-9]\d*)$/.exec(String(row?.id ?? ""));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `product:${maximum + 1}`;
}

export function normalizeProductRowCollection(input = { rows: [] }, config = CONFIG) {
  const { rows } = rowsFromInput(input);
  const normalized = [];
  const explicitIds = new Set();

  rows.forEach((source) => {
    const providedId = String(source?.id ?? "").trim();
    if (providedId && explicitIds.has(providedId)) {
      throw new TypeError(`Duplicate product row id: ${providedId}`);
    }
    const id = providedId || allocateProductRowId(normalized);
    const row = normalizeProductRow(source, { id, config });
    if (explicitIds.has(row.id)) throw new TypeError(`Duplicate product row id: ${row.id}`);
    explicitIds.add(row.id);
    normalized.push(row);
  });

  if (normalized.length > config.limits.maxOrders) {
    throw new RangeError(`Product row count exceeds ${config.limits.maxOrders}`);
  }

  return deepFreeze({
    schemaVersion: PRODUCT_ROW_COLLECTION_SCHEMA_VERSION,
    rows: normalized,
  });
}

export function createEmptyProductRowCollection() {
  return deepFreeze({
    schemaVersion: PRODUCT_ROW_COLLECTION_SCHEMA_VERSION,
    rows: [],
  });
}

export function createProductRowDraft(input = {}, collection = createEmptyProductRowCollection(), config = CONFIG) {
  const normalizedCollection = normalizeProductRowCollection(collection, config);
  const id = String(input?.id ?? "").trim() || allocateProductRowId(normalizedCollection.rows);
  return normalizeProductRowDraft(input, { id, config });
}

export function addProductRow(collection, input = {}, config = CONFIG) {
  const current = normalizeProductRowCollection(collection, config);
  if (current.rows.length >= config.limits.maxOrders) {
    throw new RangeError(`Product row count exceeds ${config.limits.maxOrders}`);
  }
  const row = createProductRowDraft(input, current, config);
  if (current.rows.some(({ id }) => id === row.id)) {
    throw new TypeError(`Duplicate product row id: ${row.id}`);
  }
  return normalizeProductRowCollection({ rows: [...current.rows, row] }, config);
}

function mergeRow(row, patch) {
  const source = isRecord(patch) ? patch : {};
  return {
    ...row,
    ...source,
    id: row.id,
    finished: { ...row.finished, ...(isRecord(source.finished) ? source.finished : {}) },
    print: { ...row.print, ...(isRecord(source.print) ? source.print : {}) },
    bleed: {
      ...row.bleed,
      ...(isRecord(source.bleed) ? source.bleed : {}),
      sidesMm: {
        ...row.bleed.sidesMm,
        ...(isRecord(source.bleed?.sidesMm) ? source.bleed.sidesMm : {}),
      },
    },
    cut: { ...row.cut, ...(isRecord(source.cut) ? source.cut : {}) },
  };
}

export function updateProductRow(collection, id, patch, config = CONFIG) {
  const current = normalizeProductRowCollection(collection, config);
  const index = current.rows.findIndex((row) => row.id === id);
  if (index < 0) throw new RangeError(`Unknown product row id: ${id}`);
  const rows = [...current.rows];
  rows[index] = normalizeProductRowDraft(mergeRow(rows[index], patch), { id, config });
  return normalizeProductRowCollection({ rows }, config);
}

export function setProductRowEnabled(collection, id, enabled, config = CONFIG) {
  return updateProductRow(collection, id, { enabled: Boolean(enabled) }, config);
}

export function duplicateProductRow(collection, id, config = CONFIG) {
  const current = normalizeProductRowCollection(collection, config);
  const source = current.rows.find((row) => row.id === id);
  if (!source) throw new RangeError(`Unknown product row id: ${id}`);
  return addProductRow(current, { ...source, id: undefined }, config);
}

export function removeProductRow(collection, id, config = CONFIG) {
  const current = normalizeProductRowCollection(collection, config);
  const rows = current.rows.filter((row) => row.id !== id);
  if (rows.length === current.rows.length) return current;
  return normalizeProductRowCollection({ rows }, config);
}

export function moveProductRow(collection, id, targetIndex, config = CONFIG) {
  const current = normalizeProductRowCollection(collection, config);
  const fromIndex = current.rows.findIndex((row) => row.id === id);
  if (fromIndex < 0) throw new RangeError(`Unknown product row id: ${id}`);
  const numericTarget = Number(targetIndex);
  if (!Number.isInteger(numericTarget)) throw new TypeError("targetIndex must be an integer");
  const toIndex = Math.max(0, Math.min(current.rows.length - 1, numericTarget));
  if (fromIndex === toIndex) return current;
  const rows = [...current.rows];
  const [row] = rows.splice(fromIndex, 1);
  rows.splice(toIndex, 0, row);
  return normalizeProductRowCollection({ rows }, config);
}

export function validateProductRowCollection(collection, config = CONFIG) {
  const current = normalizeProductRowCollection(collection, config);
  const rowResults = current.rows.map((row, index) => {
    const result = validateProductRow(row, config);
    const issues = result.issues.map((entry) => decorateRowIssue(entry, row, index));
    return deepFreeze({
      rowId: row.id,
      index,
      row: result.row,
      issues,
      valid: !issues.some(isBlockingError),
      draftValid: result.valid,
      summary: result.summary,
    });
  });
  const issues = rowResults.flatMap(({ issues: rowIssues }) => rowIssues);
  const enabledRows = current.rows.filter(({ enabled }) => enabled);
  if (enabledRows.length === 0) {
    issues.push(collectionIssue(
      PRODUCT_ISSUE_SEVERITIES.WARNING,
      "noEnabledRows",
      "rows",
      {},
      false,
    ));
  }

  const summary = current.rows.reduce((result, row) => {
    const quantity = typeof row.quantityPerVariant === "number" ? row.quantityPerVariant : 0;
    const variants = typeof row.variantCount === "number" ? row.variantCount : 0;
    return {
      rowCount: result.rowCount + 1,
      enabledRowCount: result.enabledRowCount + (row.enabled ? 1 : 0),
      variantCount: result.variantCount + (row.enabled ? variants : 0),
      totalQuantity: result.totalQuantity + (row.enabled ? quantity * variants : 0),
    };
  }, { rowCount: 0, enabledRowCount: 0, variantCount: 0, totalQuantity: 0 });

  return deepFreeze({
    collection: current,
    rows: rowResults,
    issues,
    valid: !issues.some(isBlockingError),
    summary,
  });
}

function uniformGeometrySignature(row) {
  return JSON.stringify(canonicalize({
    finished: row.finished,
    print: {
      mode: row.print.mode,
      frontColors: row.print.frontColors,
      backColors: row.print.backColors,
      duplexPreference: row.print.duplexPreference,
    },
    bleed: row.bleed,
    cut: row.cut,
    rotationPolicy: row.rotationPolicy,
  }));
}

export function validateProductRowsForUniformPipeline(collection, config = CONFIG) {
  const base = validateProductRowCollection(collection, config);
  const issues = [...base.issues];
  const signatures = new Set(issues.map(issueSignature));
  const enabledRows = base.collection.rows.filter(({ enabled }) => enabled);

  if (enabledRows.length === 0) {
    const emptyIssue = collectionIssue(
      PRODUCT_ISSUE_SEVERITIES.ERROR,
      "uniformPipelineRequiresEnabledRows",
      "rows",
    );
    issues.push(emptyIssue);
    signatures.add(issueSignature(emptyIssue));
  }

  const rowResults = enabledRows.map((row) => validateProductRowForUniformPipeline(row, config));
  rowResults.forEach((result) => {
    const index = base.collection.rows.findIndex(({ id }) => id === result.row.id);
    result.issues.forEach((entry) => {
      const decorated = decorateRowIssue(entry, result.row, index, true);
      const signature = issueSignature(decorated);
      if (!signatures.has(signature)) {
        issues.push(decorated);
        signatures.add(signature);
      }
    });
  });

  const compatibleRows = rowResults.filter(({ valid }) => valid).map(({ row }) => row);
  if (compatibleRows.length > 1) {
    const expected = uniformGeometrySignature(compatibleRows[0]);
    const mixed = compatibleRows.filter((row) => uniformGeometrySignature(row) !== expected);
    if (mixed.length > 0) {
      issues.push(collectionIssue(
        PRODUCT_ISSUE_SEVERITIES.ERROR,
        "uniformPipelineRequiresSharedGeometryAndColor",
        "rows",
        { rowIds: mixed.map(({ id }) => id) },
      ));
    }
  }

  return deepFreeze({
    ...base,
    issues,
    valid: !issues.some(isBlockingError),
  });
}

export function expandProductRowsToLegacyOrders(collection, config = CONFIG) {
  const result = validateProductRowsForUniformPipeline(collection, config);
  if (!result.valid) {
    const error = new TypeError("Product rows are not compatible with the current uniform pipeline");
    error.issues = result.issues;
    throw error;
  }
  return deepFreeze(result.collection.rows
    .filter(({ enabled }) => enabled)
    .flatMap((row) => expandProductRowToLegacyOrders(row, config)));
}

export function serializeProductRowCollection(collection, config = CONFIG) {
  const normalized = normalizeProductRowCollection(collection, config);
  return JSON.stringify(canonicalize(normalized));
}

export function deserializeProductRowCollection(serialized, config = CONFIG) {
  if (typeof serialized !== "string") {
    throw new TypeError("Serialized product row collection must be a string");
  }
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new SyntaxError(`Invalid product row collection JSON: ${error.message}`);
  }
  return normalizeProductRowCollection(parsed, config);
}

export function migrateLegacyOrdersToProductRowCollection(input, {
  finishedWidthMm = CONFIG.productRows.defaults.finishedWidthMm,
  finishedHeightMm = CONFIG.productRows.defaults.finishedHeightMm,
  printMode = CONFIG.productRows.defaults.printMode,
  frontColors = CONFIG.productRows.defaults.frontColors,
  backColors = CONFIG.productRows.defaults.backColors,
  bleedMm = CONFIG.productRows.defaults.bleedUniformMm,
  cutMode = CONFIG.productRows.defaults.cutMode,
  gapMm = CONFIG.productRows.defaults.gapMm,
  rotationPolicy = CONFIG.productRows.defaults.rotationPolicy,
  config = CONFIG,
} = {}) {
  let orders;
  let parseErrors = [];
  if (typeof input === "string") {
    const parsed = parseOrders(input, config.limits);
    orders = parsed.orders;
    parseErrors = parsed.errors;
  } else if (Array.isArray(input)) {
    orders = input;
  } else {
    throw new TypeError("Legacy orders must be text or an array");
  }

  const rows = orders.map((order, index) => normalizeProductRow({
    schemaVersion: 0,
    id: `product:${index + 1}`,
    file: order.file,
    quantity: order.quantity,
    pages: order.pages,
    note: order.note,
    widthMm: finishedWidthMm,
    heightMm: finishedHeightMm,
    variantCount: 1,
    printMode,
    frontColors,
    backColors,
    bleedMm,
    spacingMode: cutMode,
    gapMm,
    rotationPolicy,
  }, { config }));

  const issues = parseErrors.map((error) => collectionIssue(
    PRODUCT_ISSUE_SEVERITIES.ERROR,
    "legacyOrderParseError",
    error.line > 0 ? `legacy.line.${error.line}` : "legacy",
    { message: error.message, source: error.source },
  ));

  return deepFreeze({
    collection: normalizeProductRowCollection({ rows }, config),
    issues,
    valid: !issues.some(isBlockingError),
  });
}
