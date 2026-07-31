import test from "node:test";
import assert from "node:assert/strict";

import {
  APPLICATION_CALCULATION_STATUSES,
  createDefaultApplicationState,
  selectApplicationPlan,
} from "../src/application-state.js";
import {
  addApplicationProductRow,
  duplicateApplicationProductRow,
  getApplicationProductRows,
  moveApplicationProductRow,
  removeApplicationProductRow,
  replaceApplicationProductRows,
  setApplicationProductRowEnabled,
  updateApplicationProductRow,
  validateApplicationProductRows,
  validateApplicationProductRowsForUniformPipeline,
} from "../src/application-product-rows.js";
import {
  addProductRow,
  createEmptyProductRowCollection,
} from "../src/product-row-collection.js";

function input(name, overrides = {}) {
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

test("application adapter stores normalized product rows in the versioned input", () => {
  const state = createDefaultApplicationState();
  const next = addApplicationProductRow(state, input("A"));
  const collection = getApplicationProductRows(next);

  assert.equal(next.input.products.length, 1);
  assert.equal(next.input.products[0].schemaVersion, 1);
  assert.equal(next.input.products[0].id, "product:1");
  assert.equal(collection.schemaVersion, 1);
  assert.deepEqual(collection.rows, next.input.products);
  assert.equal(next.runtime.inputRevision, 1);
  assert.equal(next.runtime.calculation.status, APPLICATION_CALCULATION_STATUSES.DIRTY);
});

test("product row changes invalidate an existing operator selection", () => {
  let state = selectApplicationPlan(createDefaultApplicationState(), "plan-old");
  state = addApplicationProductRow(state, input("A"));

  assert.equal(state.runtime.selectedPlanId, null);
  assert.equal(state.runtime.inputRevision, 1);
});

test("all collection operations use one coherent application-state revision", () => {
  let state = createDefaultApplicationState();
  state = addApplicationProductRow(state, input("A"));
  state = duplicateApplicationProductRow(state, "product:1");
  state = updateApplicationProductRow(state, "product:2", {
    name: "B",
    quantityPerVariant: 2500,
  });
  state = setApplicationProductRowEnabled(state, "product:1", false);
  state = moveApplicationProductRow(state, "product:2", 0);
  state = removeApplicationProductRow(state, "product:1");

  assert.equal(state.runtime.inputRevision, 6);
  assert.deepEqual(state.input.products.map(({ id }) => id), ["product:2"]);
  assert.equal(state.input.products[0].name, "B");
  assert.equal(state.input.products[0].quantityPerVariant, 2500);
  assert.equal(state.input.products[0].enabled, true);
});

test("replacing an equivalent collection does not create a false input revision", () => {
  let collection = createEmptyProductRowCollection();
  collection = addProductRow(collection, input("A"));
  const state = replaceApplicationProductRows(createDefaultApplicationState(), collection);
  const same = replaceApplicationProductRows(state, collection);

  assert.equal(state.runtime.inputRevision, 1);
  assert.equal(same.runtime.inputRevision, 1);
  assert.deepEqual(same.input.products, state.input.products);
});

test("application validation exposes general drafts separately from uniform compatibility", () => {
  let state = createDefaultApplicationState();
  state = addApplicationProductRow(state, input("One-sided", {
    pages: 1,
    print: {
      mode: "simplex",
      frontColors: 4,
      backColors: 0,
      duplexPreference: "auto",
    },
  }));

  const general = validateApplicationProductRows(state);
  const uniform = validateApplicationProductRowsForUniformPipeline(state);

  assert.equal(general.valid, true);
  assert.equal(uniform.valid, false);
  assert.equal(
    uniform.issues.some(({ code }) => code === "uniformPipelineRequiresDuplex"),
    true,
  );
});

test("legacy product arrays in application state are normalized on adapter read", () => {
  const state = {
    ...createDefaultApplicationState(),
    input: {
      ...createDefaultApplicationState().input,
      products: [
        { file: "legacy.pdf", quantity: 4000, pages: 2 },
      ],
    },
  };
  const collection = getApplicationProductRows(state);

  assert.equal(collection.rows.length, 1);
  assert.equal(collection.rows[0].id, "product:1");
  assert.equal(collection.rows[0].name, "legacy.pdf");
  assert.equal(collection.rows[0].quantityPerVariant, 4000);
});
