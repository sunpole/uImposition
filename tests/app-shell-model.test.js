import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_SCREEN_IDS,
  createAppShellNavigationState,
  normalizeAppScreenId,
} from "../src/app-shell-model.js";

test("application shell exposes the fixed production workflow", () => {
  assert.deepEqual(APP_SCREEN_IDS, [
    "order",
    "check",
    "alternatives",
    "selected",
    "export",
  ]);
});

test("unknown screen IDs fall back to the order workspace", () => {
  assert.equal(normalizeAppScreenId("missing"), "order");
  assert.equal(normalizeAppScreenId(" selected "), "selected");
});

test("selected and export screens stay unavailable before operator selection", () => {
  const state = createAppShellNavigationState({
    activeScreenId: "selected",
    hasPlans: true,
    selectedPlanId: null,
  });

  assert.equal(state.activeScreenId, "alternatives");
  assert.equal(state.screens.find(({ id }) => id === "selected").enabled, false);
  assert.equal(state.screens.find(({ id }) => id === "export").enabled, false);
  assert.deepEqual(state.primaryAction, {
    id: "selectPlan",
    targetScreenId: null,
    disabled: true,
  });
});

test("operator selection unlocks selected plan and export without replacing recommendation", () => {
  const state = createAppShellNavigationState({
    activeScreenId: "alternatives",
    hasPlans: true,
    selectedPlanId: "uniform-r90-paper-minimum",
  });

  assert.equal(state.hasSelection, true);
  assert.equal(state.selectedPlanId, "uniform-r90-paper-minimum");
  assert.equal(state.screens.find(({ id }) => id === "selected").enabled, true);
  assert.equal(state.screens.find(({ id }) => id === "export").enabled, true);
  assert.deepEqual(state.primaryAction, {
    id: "selected",
    targetScreenId: "selected",
    disabled: false,
  });
});

test("workflow actions move through review, alternatives, selected plan and export", () => {
  const order = createAppShellNavigationState({ activeScreenId: "order" });
  const check = createAppShellNavigationState({ activeScreenId: "check" });
  const selected = createAppShellNavigationState({
    activeScreenId: "selected",
    hasPlans: true,
    selectedPlanId: "plan-a",
  });
  const exported = createAppShellNavigationState({
    activeScreenId: "export",
    hasPlans: true,
    selectedPlanId: "plan-a",
  });

  assert.equal(order.primaryAction.targetScreenId, "check");
  assert.equal(check.primaryAction.targetScreenId, "alternatives");
  assert.equal(selected.primaryAction.targetScreenId, "export");
  assert.equal(exported.primaryAction, null);
});
