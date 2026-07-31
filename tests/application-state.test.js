import test from "node:test";
import assert from "node:assert/strict";

import {
  APPLICATION_CALCULATION_STATUSES,
  APPLICATION_SCREEN_IDS,
  applySheetPressPresetToApplicationState,
  beginApplicationCalculation,
  completeApplicationCalculation,
  createDefaultApplicationState,
  deserializeApplicationState,
  failApplicationCalculation,
  normalizeApplicationState,
  replaceApplicationInput,
  selectApplicationPlan,
  serializeApplicationState,
  setApplicationActiveScreen,
} from "../src/application-state.js";
import { createBuiltInSheetPressPresets } from "../src/sheet-press-presets.js";

test("default application state is complete, immutable and versioned", () => {
  const state = createDefaultApplicationState();

  assert.equal(state.schemaVersion, 1);
  assert.equal(state.input.sheet.width, 620);
  assert.equal(state.input.sheet.height, 450);
  assert.equal(state.input.products.length, 0);
  assert.equal(state.runtime.inputRevision, 0);
  assert.equal(state.runtime.calculation.status, APPLICATION_CALCULATION_STATUSES.IDLE);
  assert.equal(state.runtime.activeScreen, APPLICATION_SCREEN_IDS.ORDER);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.input.sheet.trim.sidesMm), true);
  assert.throws(() => { state.input.sheet.width = 1; }, TypeError);
});

test("serialization is deterministic and round-trips the normalized state", () => {
  const state = createDefaultApplicationState();
  const first = serializeApplicationState(state);
  const second = serializeApplicationState({
    runtime: state.runtime,
    schemaVersion: state.schemaVersion,
    input: state.input,
    project: state.project,
  });

  assert.equal(first, second);
  assert.deepEqual(deserializeApplicationState(first), state);
  assert.throws(() => deserializeApplicationState("{broken"), /Invalid application state JSON/);
});

test("legacy flattened sheet inputs migrate without duplicate trim semantics", () => {
  const state = normalizeApplicationState({
    sheetPresetId: "650x313",
    sheetWidth: 650,
    sheetHeight: 313,
    sizeStage: "afterTrim",
    trimEnabled: true,
    trimUniform: true,
    trimUniformMm: 2,
    pressMarginsMm: { left: 4, right: 4, top: 2, bottom: 13 },
    products: [{ id: "job-a", quantity: 5000 }],
  });

  assert.equal(state.schemaVersion, 1);
  assert.equal(state.input.selectedSheetPressPresetId, "builtin:650x313");
  assert.equal(state.input.sheet.trim.enabled, false);
  assert.deepEqual(state.input.products, [{ id: "job-a", quantity: 5000 }]);
});

test("applying a preset changes only sheet/press input and invalidates stale selection", () => {
  const original = selectApplicationPlan(createDefaultApplicationState(), "plan-old");
  const preset = createBuiltInSheetPressPresets()
    .find(({ id }) => id === "builtin:650x313");
  const next = applySheetPressPresetToApplicationState(original, preset);

  assert.equal(original.input.sheet.width, 620);
  assert.equal(original.runtime.selectedPlanId, "plan-old");
  assert.equal(next.input.selectedSheetPressPresetId, "builtin:650x313");
  assert.equal(next.input.sheet.width, 650);
  assert.equal(next.input.sheet.height, 313);
  assert.equal(next.runtime.inputRevision, 1);
  assert.equal(next.runtime.calculation.status, APPLICATION_CALCULATION_STATUSES.DIRTY);
  assert.equal(next.runtime.selectedPlanId, null);
  assert.deepEqual(next.input.products, original.input.products);
  assert.deepEqual(next.input.pricing, original.input.pricing);
});

test("replacing unchanged input does not create a new revision", () => {
  const state = createDefaultApplicationState();
  const same = replaceApplicationInput(state, state.input);

  assert.equal(same.runtime.inputRevision, 0);
  assert.equal(same.runtime.calculation.status, APPLICATION_CALCULATION_STATUSES.IDLE);
});

test("calculation completion accepts only the current input revision", () => {
  let state = createDefaultApplicationState();
  state = beginApplicationCalculation(state);
  const completed = completeApplicationCalculation(state, {
    revision: 0,
    selectedPlanId: "plan-ready",
  });

  assert.equal(completed.runtime.calculation.status, APPLICATION_CALCULATION_STATUSES.READY);
  assert.equal(completed.runtime.calculation.lastCompletedRevision, 0);
  assert.equal(completed.runtime.calculation.lastValidRevision, 0);
  assert.equal(completed.runtime.selectedPlanId, "plan-ready");

  const changed = replaceApplicationInput(completed, {
    ...completed.input,
    products: [{ id: "new-job", quantity: 1000 }],
  });
  const calculating = beginApplicationCalculation(changed);
  const changedAgain = replaceApplicationInput(calculating, {
    ...calculating.input,
    products: [{ id: "new-job", quantity: 2000 }],
  });
  const staleCompletion = completeApplicationCalculation(changedAgain, {
    revision: 1,
    selectedPlanId: "stale-plan",
  });

  assert.equal(staleCompletion.runtime.inputRevision, 2);
  assert.equal(staleCompletion.runtime.calculation.status, APPLICATION_CALCULATION_STATUSES.DIRTY);
  assert.equal(staleCompletion.runtime.selectedPlanId, null);
  assert.equal(staleCompletion.runtime.calculation.lastValidRevision, 0);
});

test("calculation errors preserve the last valid revision", () => {
  let state = beginApplicationCalculation(createDefaultApplicationState());
  state = completeApplicationCalculation(state, { revision: 0, selectedPlanId: "plan-a" });
  state = replaceApplicationInput(state, { ...state.input, products: [{ id: "A" }] });
  state = beginApplicationCalculation(state);
  state = failApplicationCalculation(state, { revision: 1, error: "No feasible plans" });

  assert.equal(state.runtime.calculation.status, APPLICATION_CALCULATION_STATUSES.ERROR);
  assert.equal(state.runtime.calculation.lastCompletedRevision, 1);
  assert.equal(state.runtime.calculation.lastValidRevision, 0);
  assert.equal(state.runtime.calculation.error, "No feasible plans");
});

test("screen and selection changes do not mutate production input", () => {
  const initial = createDefaultApplicationState();
  const selected = selectApplicationPlan(initial, "plan-a");
  const layout = setApplicationActiveScreen(selected, APPLICATION_SCREEN_IDS.LAYOUT);

  assert.deepEqual(layout.input, initial.input);
  assert.equal(layout.runtime.selectedPlanId, "plan-a");
  assert.equal(layout.runtime.activeScreen, APPLICATION_SCREEN_IDS.LAYOUT);
  assert.throws(
    () => setApplicationActiveScreen(layout, "debug"),
    /Unsupported application screen/,
  );
});

test("state validation rejects unsupported schemas and unsafe product data", () => {
  assert.throws(
    () => normalizeApplicationState({ schemaVersion: 99 }),
    /Unsupported application state schemaVersion/,
  );
  assert.throws(
    () => replaceApplicationInput(createDefaultApplicationState(), {
      ...createDefaultApplicationState().input,
      products: [{ width: Number.NaN }],
    }),
    /non-finite number/,
  );
});
