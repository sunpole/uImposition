import test from "node:test";
import assert from "node:assert/strict";

import { calculatePlacementOptions } from "../src/geometry.js";
import { expandPagePairs } from "../src/orders.js";
import { createDuplexPrintSpecification } from "../src/print-specification.js";
import { createPricingProfile } from "../src/production-cost.js";
import { USER_OBJECTIVE_PRESETS } from "../src/user-objective-priority.js";
import {
  applyUserProductionObjectivePreset,
  clearUserProductionPlanSet,
  getUserProductionPlanRuntime,
  rerankUserProductionPlans,
  selectUserProductionPlan,
  setUserProductionPlanSet,
  subscribeUserProductionPlanRuntime,
} from "../src/user-production-plans-runtime.js";
import { createUserUniformProductionPlanSet } from "../src/user-uniform-production-plans.js";

function buildPlanSet() {
  return createUserUniformProductionPlanSet({
    pagePairs: expandPagePairs([
      { file: "A", quantity: 100, pages: 2 },
      { file: "B", quantity: 100, pages: 2 },
      { file: "C", quantity: 100, pages: 2 },
    ]),
    placementOptions: calculatePlacementOptions({
      printable: { width: 608, height: 431 },
      product: {
        width: 105,
        height: 148,
        bleed: 0,
        spacingMode: "commonCut",
        gap: 0,
      },
    }),
    sourceSheet: { width: 620, height: 450 },
    printSpecification: createDuplexPrintSpecification({
      frontColors: 4,
      backColors: 1,
    }),
    pricing: createPricingProfile({
      currency: "BYN",
      grammageGsm: 130,
      paperPricePerKg: 4,
      colorPlatePrice: 15,
      layoutFormPreparationPrice: 2,
    }),
  });
}

test("runtime priority presets change recommendation without overriding operator selection", () => {
  clearUserProductionPlanSet();
  const original = buildPlanSet();
  setUserProductionPlanSet(original);
  selectUserProductionPlan("uniform-r90-dedicated-pairs");

  const paper = applyUserProductionObjectivePreset(USER_OBJECTIVE_PRESETS.PAPER_FIRST);
  assert.equal(paper.planSet.catalog.recommendedId, "uniform-r90-paper-minimum");
  assert.equal(paper.selectedPlanId, "uniform-r90-dedicated-pairs");
  assert.equal(paper.planSet.plans, original.plans);

  const cost = applyUserProductionObjectivePreset(USER_OBJECTIVE_PRESETS.COST_FIRST);
  assert.equal(cost.planSet.catalog.recommendedId, "uniform-r90-dedicated-pairs");
  assert.equal(cost.selectedPlanId, "uniform-r90-dedicated-pairs");
  assert.equal(cost.planSet.plans, original.plans);
  assert.equal(cost.planSet.reranking.regeneratedPlanCount, 0);
  clearUserProductionPlanSet();
});

test("manual runtime move publishes a new ranking snapshot only", () => {
  clearUserProductionPlanSet();
  const original = buildPlanSet();
  setUserProductionPlanSet(original);
  const seen = [];
  const unsubscribe = subscribeUserProductionPlanRuntime((snapshot) => {
    seen.push({
      recommendedId: snapshot.planSet?.catalog?.recommendedId ?? null,
      plans: snapshot.planSet?.plans ?? null,
    });
  });

  const order = [...original.catalog.objectiveOrder];
  const costIndex = order.indexOf("estimatedTotalCost");
  order.splice(costIndex, 1);
  order.unshift("estimatedTotalCost");
  rerankUserProductionPlans(order);

  const snapshot = getUserProductionPlanRuntime();
  assert.equal(snapshot.planSet.catalog.recommendedId, "uniform-r90-dedicated-pairs");
  assert.equal(snapshot.planSet.plans, original.plans);
  assert.equal(snapshot.planSet.reranking.reusedGeneratedPlans, true);
  assert.equal(seen.at(-1).plans, original.plans);
  unsubscribe();
  clearUserProductionPlanSet();
});
