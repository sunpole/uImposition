import test from "node:test";
import assert from "node:assert/strict";

import { calculatePlacementOptions } from "../src/geometry.js";
import { expandPagePairs } from "../src/orders.js";
import { createDuplexPrintSpecification } from "../src/print-specification.js";
import { createPricingProfile } from "../src/production-cost.js";
import {
  USER_OBJECTIVE_PRESETS,
  applyUserObjectivePreset,
  createUserObjectivePresetOrder,
  moveUserObjectiveBy,
  rerankUserProductionPlanSet,
} from "../src/user-objective-priority.js";
import { createUserUniformProductionPlanSet } from "../src/user-uniform-production-plans.js";

const placementOptions = calculatePlacementOptions({
  printable: { width: 608, height: 431 },
  product: {
    width: 105,
    height: 148,
    bleed: 0,
    spacingMode: "commonCut",
    gap: 0,
  },
});
const pagePairs = expandPagePairs([
  { file: "A", quantity: 100, pages: 2 },
  { file: "B", quantity: 100, pages: 2 },
  { file: "C", quantity: 100, pages: 2 },
]);
const printSpecification = createDuplexPrintSpecification({
  frontColors: 4,
  backColors: 1,
});
const pricing = createPricingProfile({
  currency: "BYN",
  grammageGsm: 130,
  paperPricePerKg: 4,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 2,
});

function planSet(withPricing = true) {
  return createUserUniformProductionPlanSet({
    pagePairs,
    placementOptions,
    sourceSheet: { width: 620, height: 450 },
    printSpecification,
    pricing: withPricing ? pricing : null,
  });
}

test("cost-first and paper-first change recommendation while reusing exact plans", () => {
  const original = planSet(true);
  const plans = original.plans;
  const paperFirst = applyUserObjectivePreset(original, USER_OBJECTIVE_PRESETS.PAPER_FIRST);
  const costFirst = applyUserObjectivePreset(original, USER_OBJECTIVE_PRESETS.COST_FIRST);

  assert.equal(paperFirst.plans, plans);
  assert.equal(costFirst.plans, plans);
  plans.forEach((plan, index) => {
    assert.equal(paperFirst.plans[index], plan);
    assert.equal(costFirst.plans[index], plan);
  });
  assert.equal(paperFirst.reranking.regeneratedPlanCount, 0);
  assert.equal(costFirst.reranking.regeneratedPlanCount, 0);
  assert.equal(paperFirst.catalog.recommendedId, "uniform-r90-paper-minimum");
  assert.equal(costFirst.catalog.recommendedId, "uniform-r90-dedicated-pairs");
  assert.notEqual(paperFirst.catalog.recommendedId, costFirst.catalog.recommendedId);
});

test("moving an objective keeps a valid active permutation", () => {
  const original = planSet(true);
  const current = original.catalog.objectiveOrder;
  const moved = moveUserObjectiveBy(original, current, "estimatedTotalCost", -1);

  assert.equal(moved.length, current.length);
  assert.equal(new Set(moved).size, current.length);
  assert.equal(moved.indexOf("estimatedTotalCost"), current.indexOf("estimatedTotalCost") - 1);

  const reranked = rerankUserProductionPlanSet(original, moved);
  assert.deepEqual(reranked.catalog.objectiveOrder, moved);
  assert.equal(reranked.plans, original.plans);
});

test("forms preset moves the complete forms group to the front", () => {
  const original = planSet(true);
  const order = createUserObjectivePresetOrder(
    original,
    USER_OBJECTIVE_PRESETS.FORMS_FIRST,
  );

  assert.deepEqual(order.slice(0, 3), [
    "layoutForms",
    "colorPlates",
    "impositionCount",
  ]);
  const reranked = rerankUserProductionPlanSet(original, order);
  assert.equal(reranked.catalog.recommendedId, "uniform-r90-dedicated-pairs");
});

test("cost objective and cost-first preset remain unavailable without pricing", () => {
  const original = planSet(false);
  assert.equal(original.catalog.objectiveIds.includes("estimatedTotalCost"), false);
  assert.throws(
    () => applyUserObjectivePreset(original, USER_OBJECTIVE_PRESETS.COST_FIRST),
    /inactive objective/,
  );

  const moved = moveUserObjectiveBy(
    original,
    original.catalog.objectiveOrder,
    "physicalSheets",
    3,
  );
  const reranked = rerankUserProductionPlanSet(original, moved);
  assert.equal(reranked.catalog.objectiveOrder.includes("estimatedTotalCost"), false);
  assert.equal(reranked.plans, original.plans);
});

test("invalid objective orders are rejected before catalog mutation", () => {
  const original = planSet(true);
  const duplicate = [...original.catalog.objectiveOrder];
  duplicate[1] = duplicate[0];

  assert.throws(() => rerankUserProductionPlanSet(original, duplicate), /Duplicate objective/);
  assert.throws(
    () => moveUserObjectiveBy(original, original.catalog.objectiveOrder, "missing", 1),
    /not active/,
  );
});
