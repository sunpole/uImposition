import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../src/config.js";
import {
  addProductRow,
  allocateProductRowId,
  createEmptyProductRowCollection,
  deserializeProductRowCollection,
  duplicateProductRow,
  expandProductRowsToLegacyOrders,
  migrateLegacyOrdersToProductRowCollection,
  moveProductRow,
  normalizeProductRowCollection,
  removeProductRow,
  serializeProductRowCollection,
  setProductRowEnabled,
  updateProductRow,
  validateProductRowCollection,
  validateProductRowsForUniformPipeline,
} from "../src/product-row-collection.js";

function row(name, overrides = {}) {
  return {
    name,
    finished: { widthMm: 105, heightMm: 148 },
    quantityPerVariant: 1000,
    variantCount: 1,
    pages: 2,
    print: {
      mode: "duplex",
      frontColors: 4,
      backColors: 1,
      duplexPreference: "auto",
    },
    bleed: { mode: "uniform", uniformMm: 0 },
    cut: { mode: "commonCut", gapMm: 0 },
    rotationPolicy: "auto",
    ...overrides,
  };
}

function codes(result) {
  return result.issues.map(({ code }) => code);
}

test("empty collection is versioned, immutable and allocates monotonic IDs", () => {
  const empty = createEmptyProductRowCollection();
  const withFirst = addProductRow(empty, row("A"));
  const withSecond = addProductRow(withFirst, row("B"));

  assert.equal(empty.schemaVersion, 1);
  assert.deepEqual(empty.rows, []);
  assert.equal(Object.isFrozen(empty), true);
  assert.deepEqual(withSecond.rows.map(({ id }) => id), ["product:1", "product:2"]);
  assert.equal(allocateProductRowId([
    { id: "product:2" },
    { id: "legacy" },
    { id: "product:7" },
  ]), "product:8");
});

test("legacy arrays receive stable IDs and duplicate explicit IDs are rejected", () => {
  const normalized = normalizeProductRowCollection([
    { file: "a.pdf", quantity: 1000, pages: 2 },
    { file: "b.pdf", quantity: 2000, pages: 2 },
  ]);

  assert.deepEqual(normalized.rows.map(({ id }) => id), ["product:1", "product:2"]);
  assert.deepEqual(normalized.rows.map(({ name }) => name), ["a.pdf", "b.pdf"]);
  assert.throws(
    () => normalizeProductRowCollection({ rows: [
      { ...row("A"), id: "product:1" },
      { ...row("B"), id: "product:1" },
    ] }),
    /Duplicate product row id/,
  );
});

test("update merges nested fields without changing row identity", () => {
  const original = addProductRow(createEmptyProductRowCollection(), row("A"));
  const updated = updateProductRow(original, "product:1", {
    quantityPerVariant: 2500,
    finished: { widthMm: 148 },
    print: { backColors: 4 },
    bleed: { mode: "sides", sidesMm: { left: 2, right: 3 } },
    cut: { mode: "separated", gapMm: 1 },
  });
  const value = updated.rows[0];

  assert.equal(value.id, "product:1");
  assert.equal(value.name, "A");
  assert.deepEqual(value.finished, { widthMm: 148, heightMm: 148 });
  assert.equal(value.quantityPerVariant, 2500);
  assert.equal(value.print.frontColors, 4);
  assert.equal(value.print.backColors, 4);
  assert.equal(value.bleed.mode, "sides");
  assert.deepEqual(value.bleed.sidesMm, { left: 2, right: 3, top: 0, bottom: 0 });
  assert.equal(value.cut.gapMm, 1);
  assert.equal(original.rows[0].quantityPerVariant, 1000);
});

test("duplicate creates a new stable ID while preserving production fields", () => {
  const original = addProductRow(createEmptyProductRowCollection(), row("A", {
    quantityPerVariant: 3300,
    notes: "keep",
  }));
  const duplicated = duplicateProductRow(original, "product:1");

  assert.deepEqual(duplicated.rows.map(({ id }) => id), ["product:1", "product:2"]);
  assert.equal(duplicated.rows[1].name, "A");
  assert.equal(duplicated.rows[1].quantityPerVariant, 3300);
  assert.equal(duplicated.rows[1].notes, "keep");
});

test("enable, move and remove operations are deterministic and immutable", () => {
  let collection = createEmptyProductRowCollection();
  collection = addProductRow(collection, row("A"));
  collection = addProductRow(collection, row("B"));
  collection = addProductRow(collection, row("C"));
  const disabled = setProductRowEnabled(collection, "product:2", false);
  const moved = moveProductRow(disabled, "product:3", 0);
  const removed = removeProductRow(moved, "product:1");

  assert.equal(disabled.rows[1].enabled, false);
  assert.deepEqual(moved.rows.map(({ id }) => id), ["product:3", "product:1", "product:2"]);
  assert.deepEqual(removed.rows.map(({ id }) => id), ["product:3", "product:2"]);
  assert.deepEqual(collection.rows.map(({ id }) => id), ["product:1", "product:2", "product:3"]);
  assert.deepEqual(removeProductRow(removed, "product:999"), removed);
  assert.throws(() => moveProductRow(removed, "product:999", 0), /Unknown product row id/);
});

test("disabled invalid draft remains visible but does not block the active order", () => {
  let collection = createEmptyProductRowCollection();
  collection = addProductRow(collection, row("Ready"));
  collection = addProductRow(collection, {
    name: "",
    quantityPerVariant: "not-a-number",
  });
  collection = setProductRowEnabled(collection, "product:2", false);
  const result = validateProductRowCollection(collection);
  const disabledIssues = result.issues.filter(({ rowId }) => rowId === "product:2");

  assert.equal(result.valid, true);
  assert.equal(result.rows[1].draftValid, false);
  assert.equal(result.rows[1].valid, true);
  assert.equal(disabledIssues.length > 0, true);
  assert.equal(disabledIssues.every(({ blocking }) => blocking === false), true);
  assert.deepEqual(result.summary, {
    rowCount: 2,
    enabledRowCount: 1,
    variantCount: 1,
    totalQuantity: 1000,
  });
});

test("no enabled rows is a general warning but a uniform calculation error", () => {
  let collection = addProductRow(createEmptyProductRowCollection(), row("A"));
  collection = setProductRowEnabled(collection, "product:1", false);
  const general = validateProductRowCollection(collection);
  const uniform = validateProductRowsForUniformPipeline(collection);

  assert.equal(general.valid, true);
  assert.equal(codes(general).includes("noEnabledRows"), true);
  assert.equal(uniform.valid, false);
  assert.equal(codes(uniform).includes("uniformPipelineRequiresEnabledRows"), true);
  assert.throws(
    () => expandProductRowsToLegacyOrders(collection),
    /not compatible with the current uniform pipeline/,
  );
});

test("uniform compatibility requires shared geometry, color and production settings", () => {
  let collection = createEmptyProductRowCollection();
  collection = addProductRow(collection, row("A"));
  collection = addProductRow(collection, row("B", {
    finished: { widthMm: 148, heightMm: 210 },
    print: {
      mode: "duplex",
      frontColors: 4,
      backColors: 4,
      duplexPreference: "auto",
    },
  }));
  const result = validateProductRowsForUniformPipeline(collection);

  assert.equal(result.valid, false);
  assert.equal(codes(result).includes("uniformPipelineRequiresSharedGeometryAndColor"), true);
});

test("valid enabled rows expand variants into the current legacy order pipeline", () => {
  let collection = createEmptyProductRowCollection();
  collection = addProductRow(collection, row("Label", {
    quantityPerVariant: 1200,
    variantCount: 2,
  }));
  collection = addProductRow(collection, row("Disabled", {
    quantityPerVariant: 9999,
  }));
  collection = setProductRowEnabled(collection, "product:2", false);
  const orders = expandProductRowsToLegacyOrders(collection);

  assert.equal(orders.length, 2);
  assert.deepEqual(orders.map(({ file }) => file), ["Label · 1", "Label · 2"]);
  assert.equal(orders.every(({ quantity }) => quantity === 1200), true);
  assert.equal(orders.every(({ productRowId }) => productRowId === "product:1"), true);
});

test("collection serialization is deterministic and preserves row order", () => {
  const first = normalizeProductRowCollection({ rows: [
    { ...row("B"), id: "product:2" },
    { ...row("A"), id: "product:1" },
  ] });
  const serialized = serializeProductRowCollection(first);
  const reorderedKeys = serializeProductRowCollection({
    rows: first.rows,
    schemaVersion: first.schemaVersion,
  });
  const restored = deserializeProductRowCollection(serialized);

  assert.equal(serialized, reorderedKeys);
  assert.deepEqual(restored.rows.map(({ id }) => id), ["product:2", "product:1"]);
  assert.deepEqual(restored, first);
  assert.throws(
    () => deserializeProductRowCollection("{broken"),
    /Invalid product row collection JSON/,
  );
});

test("legacy text migration keeps valid rows and reports exact parse failures", () => {
  const migrated = migrateLegacyOrdersToProductRowCollection([
    { file: "A", quantity: 1000, pages: 2, note: "one" },
    { file: "B", quantity: 2000, pages: 4, note: "two" },
  ], {
    finishedWidthMm: 148,
    finishedHeightMm: 210,
    frontColors: 4,
    backColors: 1,
  });

  assert.equal(migrated.valid, true);
  assert.equal(migrated.collection.rows.length, 2);
  assert.deepEqual(migrated.collection.rows[0].finished, { widthMm: 148, heightMm: 210 });
  assert.equal(migrated.collection.rows[1].quantityPerVariant, 2000);
  assert.equal(migrated.collection.rows[1].pages, 4);

  const withError = migrateLegacyOrdersToProductRowCollection(
    "A | 1000 | 2\nbroken row\nB | 2000 | 4",
  );
  assert.equal(withError.valid, false);
  assert.equal(withError.collection.rows.length, 2);
  assert.equal(codes(withError).includes("legacyOrderParseError"), true);
  assert.equal(withError.issues[0].field, "legacy.line.2");
});

test("unsupported collection schemas and row-count overflow fail explicitly", () => {
  assert.throws(
    () => normalizeProductRowCollection({ schemaVersion: 99, rows: [] }),
    /Unsupported product row collection schemaVersion/,
  );

  const restrictedConfig = {
    ...CONFIG,
    limits: { ...CONFIG.limits, maxOrders: 1 },
  };
  const rows = [
    { ...row("A"), id: "product:1" },
    { ...row("B"), id: "product:2" },
  ];
  assert.throws(
    () => normalizeProductRowCollection({ rows }, restrictedConfig),
    /Product row count exceeds 1/,
  );
});
