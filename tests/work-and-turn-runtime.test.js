import test from "node:test";
import assert from "node:assert/strict";

import { createPricingProfile } from "../src/production-cost.js";
import {
  DUPLEX_SEARCH_MODES,
  DUPLEX_STRATEGIES,
  WORK_AND_TURN_RUNTIME_STATUS,
  createWorkAndTurnRuntimeState,
  prepareWorkAndTurnRuntime,
} from "../src/work-and-turn-runtime.js";

const pricing = createPricingProfile({
  currency: "BYN",
  grammageGsm: 130,
  paperPricePerKg: 4,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 0,
});

test("runtime keeps one prepared comparison while search mode only filters alternatives", () => {
  const prepared = prepareWorkAndTurnRuntime({
    pricingState: { state: "costReady", pricing },
  });
  const compareBoth = createWorkAndTurnRuntimeState({
    prepared,
    searchMode: DUPLEX_SEARCH_MODES.COMPARE_BOTH,
  });
  const separateOnly = createWorkAndTurnRuntimeState({
    prepared,
    searchMode: DUPLEX_SEARCH_MODES.SEPARATE_ONLY,
  });
  const workAndTurnOnly = createWorkAndTurnRuntimeState({
    prepared,
    searchMode: DUPLEX_SEARCH_MODES.WORK_AND_TURN_ONLY,
  });

  assert.equal(compareBoth.status, WORK_AND_TURN_RUNTIME_STATUS.READY);
  assert.equal(compareBoth.alternatives.length, 2);
  assert.equal(compareBoth.recommendedStrategy, DUPLEX_STRATEGIES.WORK_AND_TURN);
  assert.deepEqual(separateOnly.alternatives.map((item) => item.duplexMode), [
    DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS,
  ]);
  assert.equal(separateOnly.recommendedStrategy, DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS);
  assert.deepEqual(workAndTurnOnly.alternatives.map((item) => item.duplexMode), [
    DUPLEX_STRATEGIES.WORK_AND_TURN,
  ]);
  assert.equal(workAndTurnOnly.recommendedStrategy, DUPLEX_STRATEGIES.WORK_AND_TURN);
  assert.equal(compareBoth.platePreview, separateOnly.platePreview);
  assert.equal(compareBoth.controlCase, workAndTurnOnly.controlCase);
});

test("runtime suppresses all money until an operator pricing profile exists", () => {
  const prepared = prepareWorkAndTurnRuntime({
    pricingState: { state: "incomplete", pricing: null },
  });
  const state = createWorkAndTurnRuntimeState({ prepared });

  assert.equal(state.status, WORK_AND_TURN_RUNTIME_STATUS.READY_WITHOUT_PRICING);
  assert.equal(state.pricingReady, false);
  state.alternatives.forEach((metrics) => {
    assert.equal(metrics.estimatedTotalCost, null);
    assert.equal(metrics.paperCost, null);
    assert.equal(metrics.colorPlateCost, null);
  });
  assert.equal(state.savings.estimatedTotalCost, null);
  assert.equal(state.savings.colorPlateCost, null);
});

test("runtime exposes only sanitized control metrics and plate preview", () => {
  const prepared = prepareWorkAndTurnRuntime({
    pricingState: { state: "costReady", pricing },
  });
  const state = createWorkAndTurnRuntimeState({ prepared });

  assert.equal("reports" in state, false);
  assert.equal("pagePairs" in state, false);
  assert.equal("impositions" in state, false);
  assert.equal("front" in state, false);
  assert.equal("back" in state, false);
  assert.equal("halfRows" in state, false);
  assert.equal(Array.isArray(state.platePreview.cells), true);
  state.platePreview.cells.forEach((cell) => {
    assert.deepEqual(Object.keys(cell).sort(), [
      "column",
      "direction",
      "file",
      "page",
      "pageRole",
      "position",
      "row",
    ]);
  });
});

test("priced runtime records the exact one-plate saving", () => {
  const prepared = prepareWorkAndTurnRuntime({
    pricingState: { state: "ready", pricing },
  });
  const state = createWorkAndTurnRuntimeState({ prepared });

  assert.equal(state.pricingReady, true);
  assert.equal(state.savings.physicalSheets, 0);
  assert.equal(state.savings.pressPasses, 0);
  assert.equal(state.savings.layoutForms, 1);
  assert.equal(state.savings.colorPlates, 1);
  assert.ok(Math.abs(state.savings.estimatedTotalCost - 15) < 1e-9);
});
