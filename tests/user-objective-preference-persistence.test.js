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
  resetUserProductionObjectivePreference,
  selectUserProductionPlan,
  setUserProductionPlanSet,
} from "../src/user-production-plans-runtime.js";
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
const printSpecification = createDuplexPrintSpecification({ frontColors: 4, backColors: 1 });
const pricing = createPricingProfile({
  currency: "BYN",
  grammageGsm: 130,
  paperPricePerKg: 4,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 2,
});
const workAndTurnId = "uniform-r90-work-and-turn-dedicated-pairs";

function buildPlanSet(withPricing) {
  return createUserUniformProductionPlanSet({
    pagePairs,
    placementOptions,
    sourceSheet: { width: 620, height: 450 },
    printSpecification,
    pricing: withPricing ? pricing : null,
  });
}

test("pricing introduced after an unpriced calculation enters the default second position", () => {
  clearUserProductionPlanSet();
  resetUserProductionObjectivePreference();

  const withoutPricing = setUserProductionPlanSet(buildPlanSet(false));
  assert.equal(withoutPricing.planSet.catalog.objectiveOrder[0], "physicalSheets");
  assert.equal(withoutPricing.planSet.catalog.objectiveOrder.includes("estimatedTotalCost"), false);

  const withPricing = setUserProductionPlanSet(buildPlanSet(true));
  assert.deepEqual(withPricing.planSet.catalog.objectiveOrder.slice(0, 3), [
    "physicalSheets",
    "estimatedTotalCost",
    "layoutForms",
  ]);

  clearUserProductionPlanSet();
  resetUserProductionObjectivePreference();
});

test("cost priority survives temporary removal and restoration of pricing", () => {
  clearUserProductionPlanSet();
  resetUserProductionObjectivePreference();

  setUserProductionPlanSet(buildPlanSet(true));
  const costFirst = applyUserProductionObjectivePreset(USER_OBJECTIVE_PRESETS.COST_FIRST);
  assert.equal(costFirst.planSet.catalog.objectiveOrder[0], "estimatedTotalCost");

  const withoutPricing = setUserProductionPlanSet(buildPlanSet(false));
  assert.equal(withoutPricing.planSet.catalog.objectiveOrder.includes("estimatedTotalCost"), false);
  assert.equal(withoutPricing.planSet.catalog.objectiveOrder[0], "physicalSheets");

  const restored = setUserProductionPlanSet(buildPlanSet(true));
  assert.equal(restored.planSet.catalog.objectiveOrder[0], "estimatedTotalCost");
  assert.equal(restored.planSet.catalog.recommendedId, workAndTurnId);

  clearUserProductionPlanSet();
  resetUserProductionObjectivePreference();
});

test("recalculation preserves explicit plan selection and operator objective order", () => {
  clearUserProductionPlanSet();
  resetUserProductionObjectivePreference();

  setUserProductionPlanSet(buildPlanSet(true));
  selectUserProductionPlan("uniform-r90-paper-minimum");
  applyUserProductionObjectivePreset(USER_OBJECTIVE_PRESETS.FORMS_FIRST);

  const recalculated = setUserProductionPlanSet(buildPlanSet(true));
  assert.deepEqual(recalculated.planSet.catalog.objectiveOrder.slice(0, 3), [
    "layoutForms",
    "colorPlates",
    "impositionCount",
  ]);
  assert.equal(recalculated.selectedPlanId, "uniform-r90-paper-minimum");
  assert.equal(recalculated.planSet.catalog.recommendedId, workAndTurnId);

  const reset = resetUserProductionObjectivePreference();
  assert.deepEqual(reset.planSet.catalog.objectiveOrder.slice(0, 3), [
    "physicalSheets",
    "estimatedTotalCost",
    "layoutForms",
  ]);
  assert.equal(reset.selectedPlanId, "uniform-r90-paper-minimum");

  clearUserProductionPlanSet();
  resetUserProductionObjectivePreference();
});
