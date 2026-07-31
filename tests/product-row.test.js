import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../src/config.js";
import {
  PRODUCT_CUT_MODES,
  PRODUCT_DUPLEX_PREFERENCES,
  PRODUCT_PRINT_MODES,
  PRODUCT_ROTATION_POLICIES,
  expandProductRowToLegacyOrders,
  normalizeProductRow,
  normalizeProductRowDraft,
  validateProductRow,
  validateProductRowForUniformPipeline,
} from "../src/product-row.js";

function validRow(overrides = {}) {
  return normalizeProductRowDraft({
    id: "product:1",
    name: "Листовка A6",
    finished: { widthMm: 105, heightMm: 148 },
    quantityPerVariant: 5000,
    variantCount: 1,
    pages: 2,
    print: {
      mode: PRODUCT_PRINT_MODES.DUPLEX,
      frontColors: 4,
      backColors: 1,
      duplexPreference: PRODUCT_DUPLEX_PREFERENCES.AUTO,
    },
    bleed: { mode: "uniform", uniformMm: 0 },
    cut: { mode: PRODUCT_CUT_MODES.COMMON, gapMm: 0 },
    rotationPolicy: PRODUCT_ROTATION_POLICIES.AUTO,
    ...overrides,
  });
}

function issueCodes(result) {
  return result.issues.map(({ code }) => code);
}

test("product row draft is complete, deeply immutable and keeps explicit defaults", () => {
  const row = normalizeProductRowDraft({ id: "product:1" });

  assert.equal(row.schemaVersion, 1);
  assert.equal(row.id, "product:1");
  assert.equal(row.enabled, true);
  assert.equal(row.name, "");
  assert.deepEqual(row.finished, { widthMm: 105, heightMm: 148 });
  assert.equal(row.quantityPerVariant, null);
  assert.equal(row.variantCount, 1);
  assert.equal(row.pages, 2);
  assert.deepEqual(row.print, {
    mode: "duplex",
    frontColors: 4,
    backColors: 4,
    duplexPreference: "auto",
  });
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.bleed.sidesMm), true);
  assert.throws(() => { row.finished.widthMm = 1; }, TypeError);
});

test("numeric strings normalize while invalid draft text remains visible to validation", () => {
  const row = normalizeProductRowDraft({
    id: "product:1",
    name: "Test",
    finished: { widthMm: "105.5", heightMm: "bad" },
    quantityPerVariant: "2500",
    variantCount: "2",
    pages: "4",
  });
  const result = validateProductRow(row);

  assert.equal(row.finished.widthMm, 105.5);
  assert.equal(row.finished.heightMm, "bad");
  assert.equal(row.quantityPerVariant, 2500);
  assert.equal(row.variantCount, 2);
  assert.equal(row.pages, 4);
  assert.equal(result.valid, false);
  assert.equal(result.issues.some(({ field, code }) => (
    field === "finished.heightMm" && code === "invalidNumber"
  )), true);
});

test("simplex normalization clears back colors and duplex preference", () => {
  const row = validRow({
    print: {
      mode: "simplex",
      frontColors: 4,
      backColors: 8,
      duplexPreference: "workAndTurn",
    },
    pages: 1,
  });
  const general = validateProductRow(row);
  const uniform = validateProductRowForUniformPipeline(row);

  assert.equal(row.print.backColors, 0);
  assert.equal(row.print.duplexPreference, "auto");
  assert.equal(general.valid, true);
  assert.equal(uniform.valid, false);
  assert.equal(issueCodes(uniform).includes("uniformPipelineRequiresDuplex"), true);
  assert.equal(issueCodes(uniform).includes("uniformPipelineRequiresCompletePagePairs"), true);
});

test("common cut rejects non-zero bleed instead of silently changing production geometry", () => {
  const row = validRow({
    bleed: { mode: "uniform", uniformMm: 2 },
    cut: { mode: "commonCut", gapMm: 8 },
  });
  const result = validateProductRow(row);

  assert.equal(row.cut.gapMm, 0);
  assert.equal(result.valid, false);
  assert.equal(issueCodes(result).includes("commonCutRequiresZeroBleed"), true);
});

test("separated cut preserves side bleed and gap values", () => {
  const row = validRow({
    bleed: {
      mode: "sides",
      sidesMm: { left: 2, right: 3, top: 4, bottom: 5 },
    },
    cut: { mode: "separated", gapMm: 1.5 },
  });
  const result = validateProductRow(row);

  assert.equal(result.valid, true);
  assert.deepEqual(row.bleed.sidesMm, { left: 2, right: 3, top: 4, bottom: 5 });
  assert.equal(row.cut.gapMm, 1.5);
});

test("text limits are reported without truncating the operator draft", () => {
  const longName = "N".repeat(CONFIG.limits.maxProductNameLength + 1);
  const longFile = "F".repeat(CONFIG.limits.maxProductSourceFileNameLength + 1);
  const longNotes = "X".repeat(CONFIG.limits.maxProductNotesLength + 1);
  const row = validRow({ name: longName, sourceFileName: longFile, notes: longNotes });
  const result = validateProductRow(row);

  assert.equal(row.name, longName);
  assert.equal(row.sourceFileName, longFile);
  assert.equal(row.notes, longNotes);
  assert.deepEqual(
    issueCodes(result).filter((code) => code.endsWith("TooLong")),
    ["nameTooLong", "sourceFileNameTooLong", "notesTooLong"],
  );
});

test("total quantity guard uses quantity per variant multiplied by variant count", () => {
  const row = validRow({
    quantityPerVariant: CONFIG.limits.maxQuantity,
    variantCount: 2,
  });
  const result = validateProductRow(row);

  assert.equal(result.valid, false);
  assert.equal(result.summary.totalQuantity, CONFIG.limits.maxQuantity * 2);
  assert.equal(issueCodes(result).includes("totalQuantityTooLarge"), true);
});

test("uniform compatibility is explicit for odd pages, work-and-turn and forced rotation", () => {
  const row = validRow({
    pages: 3,
    print: {
      mode: "duplex",
      frontColors: 4,
      backColors: 1,
      duplexPreference: "workAndTurn",
    },
    rotationPolicy: "90",
  });
  const general = validateProductRow(row);
  const uniform = validateProductRowForUniformPipeline(row);

  assert.equal(general.valid, true);
  assert.equal(uniform.valid, false);
  assert.equal(issueCodes(uniform).includes("uniformPipelineRequiresCompletePagePairs"), true);
  assert.equal(issueCodes(uniform).includes("uniformPipelineWorkAndTurnNotGeneralized"), true);
  assert.equal(issueCodes(uniform).includes("uniformPipelineForcedRotationNotSupported"), true);
});

test("one product row expands variant count into legacy orders without losing origin", () => {
  const orders = expandProductRowToLegacyOrders(validRow({
    name: "Этикетка",
    quantityPerVariant: 1000,
    variantCount: 3,
    pages: 2,
    notes: "матовая бумага",
  }));

  assert.equal(orders.length, 3);
  assert.deepEqual(orders.map(({ file }) => file), [
    "Этикетка · 1",
    "Этикетка · 2",
    "Этикетка · 3",
  ]);
  assert.equal(orders.every(({ quantity }) => quantity === 1000), true);
  assert.equal(orders.every(({ productRowId }) => productRowId === "product:1"), true);
  assert.equal(Object.isFrozen(orders), true);
});

test("legacy file/quantity/pages row migrates into schema v1", () => {
  const row = normalizeProductRow({
    id: "product:4",
    file: "legacy.pdf",
    quantity: 4000,
    pages: 2,
    note: "old row",
    widthMm: 148,
    heightMm: 210,
    frontColors: 4,
    backColors: 1,
  });

  assert.equal(row.schemaVersion, 1);
  assert.equal(row.id, "product:4");
  assert.equal(row.name, "legacy.pdf");
  assert.equal(row.sourceFileName, "legacy.pdf");
  assert.deepEqual(row.finished, { widthMm: 148, heightMm: 210 });
  assert.equal(row.quantityPerVariant, 4000);
  assert.equal(row.pages, 2);
  assert.equal(row.notes, "old row");
});

test("product row rejects unsupported schema and invalid IDs", () => {
  assert.throws(
    () => normalizeProductRowDraft({ id: "row-1" }),
    /product:<positive integer>/,
  );
  assert.throws(
    () => normalizeProductRow({ schemaVersion: 99, id: "product:1" }),
    /Unsupported product row schemaVersion/,
  );
});
