import test from "node:test";
import assert from "node:assert/strict";

import { USER_UNIFORM_PRODUCTION_PLAN_SET_KIND } from "../src/user-uniform-production-plans.js";
import {
  clearUserProductionPlanSelection,
  clearUserProductionPlanSet,
  getUserProductionPlanRuntime,
  selectUserProductionPlan,
  setUserProductionPlanSet,
  subscribeUserProductionPlanRuntime,
} from "../src/user-production-plans-runtime.js";

function plan(id, physicalSheets) {
  return Object.freeze({
    id,
    label: id,
    family: "test",
    grid: Object.freeze({ rotation: 0, rows: 1, columns: 1, capacity: 1 }),
    metrics: Object.freeze({
      physicalSheets,
      layoutForms: 2,
      colorPlates: 8,
      pressPasses: physicalSheets * 2,
      pairOverrun: 0,
      estimatedTotalCost: null,
      currency: null,
      pricingStatus: "pricing incomplete",
      zeroUnderproduction: true,
    }),
    impositions: Object.freeze([]),
    report: Object.freeze({ valid: true }),
  });
}

function planSet(plans) {
  return Object.freeze({
    kind: USER_UNIFORM_PRODUCTION_PLAN_SET_KIND,
    plans: Object.freeze(plans),
    catalog: Object.freeze({
      summary: Object.freeze({ feasibleSolutionCount: plans.length }),
    }),
  });
}

test("runtime never auto-selects a recommended plan for the operator", () => {
  clearUserProductionPlanSet();
  const first = plan("first", 10);
  const second = plan("second", 12);

  const snapshot = setUserProductionPlanSet(planSet([first, second]));

  assert.equal(snapshot.ready, true);
  assert.equal(snapshot.selectedPlanId, null);
  assert.equal(snapshot.selectedPlan, null);
  clearUserProductionPlanSet();
});

test("explicit selection survives recalculation while the same plan id remains", () => {
  clearUserProductionPlanSet();
  setUserProductionPlanSet(planSet([plan("first", 10), plan("second", 12)]));
  selectUserProductionPlan("second");

  const recalculated = setUserProductionPlanSet(planSet([
    plan("first", 9),
    plan("second", 11),
  ]));

  assert.equal(recalculated.selectedPlanId, "second");
  assert.equal(recalculated.selectedPlan.metrics.physicalSheets, 11);
  clearUserProductionPlanSet();
});

test("selection clears when recalculation removes the selected plan", () => {
  clearUserProductionPlanSet();
  setUserProductionPlanSet(planSet([plan("first", 10), plan("second", 12)]));
  selectUserProductionPlan("second");

  const recalculated = setUserProductionPlanSet(planSet([plan("first", 9)]));

  assert.equal(recalculated.selectedPlanId, null);
  assert.equal(recalculated.selectedPlan, null);
  clearUserProductionPlanSet();
});

test("runtime notifies subscribers and supports an explicit deselection", () => {
  clearUserProductionPlanSet();
  const seen = [];
  const unsubscribe = subscribeUserProductionPlanRuntime((snapshot) => {
    seen.push({ ready: snapshot.ready, selectedPlanId: snapshot.selectedPlanId });
  });

  setUserProductionPlanSet(planSet([plan("first", 10)]));
  selectUserProductionPlan("first");
  clearUserProductionPlanSelection();
  unsubscribe();

  assert.deepEqual(seen, [
    { ready: false, selectedPlanId: null },
    { ready: true, selectedPlanId: null },
    { ready: true, selectedPlanId: "first" },
    { ready: true, selectedPlanId: null },
  ]);
  clearUserProductionPlanSet();
});

test("runtime rejects unknown selection and invalid plan-set payloads", () => {
  clearUserProductionPlanSet();
  assert.throws(() => setUserProductionPlanSet({ kind: "wrong", plans: [] }), /plan set is required/);

  setUserProductionPlanSet(planSet([plan("first", 10)]));
  assert.throws(() => selectUserProductionPlan("missing"), /Unknown user production plan/);
  assert.equal(getUserProductionPlanRuntime().selectedPlanId, null);
  clearUserProductionPlanSet();
});
