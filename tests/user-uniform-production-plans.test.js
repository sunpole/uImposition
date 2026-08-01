import test from "node:test";
import assert from "node:assert/strict";

import { calculatePlacementOptions } from "../src/geometry.js";
import { expandPagePairs } from "../src/orders.js";
import { createDuplexPrintSpecification } from "../src/print-specification.js";
import { createPricingProfile } from "../src/production-cost.js";
import {
  USER_UNIFORM_PLAN_FAMILY,
  USER_UNIFORM_PRODUCTION_PLAN_SET_KIND,
  createUserUniformProductionPlanSet,
} from "../src/user-uniform-production-plans.js";

const sourceSheet = Object.freeze({ width: 620, height: 450 });
const printable = Object.freeze({ width: 608, height: 431 });
const placementOptions = calculatePlacementOptions({
  printable,
  product: {
    width: 105,
    height: 148,
    bleed: 0,
    spacingMode: "commonCut",
    gap: 0,
  },
});
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

function pagePairsForQuantities(quantities) {
  return expandPagePairs(quantities.map((quantity, index) => ({
    file: `F${index + 1}`,
    quantity,
    pages: 2,
  })));
}

function createPlanSet({
  quantities = [100, 100, 100],
  specification = printSpecification,
  withPricing = true,
} = {}) {
  return createUserUniformProductionPlanSet({
    pagePairs: pagePairsForQuantities(quantities),
    placementOptions,
    sourceSheet,
    printSpecification: specification,
    pricing: withPricing ? pricing : null,
  });
}

test("user plan set adds work-and-turn only for horizontally symmetric grids", () => {
  const result = createPlanSet();

  assert.equal(result.kind, USER_UNIFORM_PRODUCTION_PLAN_SET_KIND);
  assert.deepEqual(result.grids.map(({ rotation }) => rotation), [0, 90]);
  assert.deepEqual(result.grids.map(({ columns }) => columns), [5, 4]);
  assert.equal(result.plans.length, 5);
  assert.equal(result.catalog.summary.feasibleSolutionCount, 5);
  assert.equal(result.catalog.summary.hiddenSolutionCount, 0);
  assert.equal(result.catalog.coverage.completeWithinRequestedSpace, true);
  assert.equal(result.catalog.coverage.globalCompletenessClaimed, false);
  assert.equal(result.scope.completeWithinDeclaredFamilies, true);
  assert.equal(result.scope.globalCompletenessClaimed, false);
  assert.equal(result.scope.workAndTurnEvaluated, true);
  assert.equal(result.scope.workAndTurnMode, "horizontalDedicatedPairs");
  assert.deepEqual(result.scope.workAndTurnEligibleRotations, [90]);
  assert.deepEqual(result.scope.workAndTurnRejectedRotations, [0]);
  assert.equal(result.scope.arbitraryMixedWorkAndTurnEvaluated, false);

  result.plans.forEach((plan) => {
    assert.equal(plan.report.valid, true);
    assert.equal(plan.report.totals.underproduction, 0);
    assert.equal(plan.report.totals.fileUnderproduction, 0);
    assert.equal(plan.metrics.zeroUnderproduction, true);
    assert.equal(plan.metrics.pricingStatus, "pricing ready");
    assert.equal(plan.metrics.pressPasses, plan.metrics.physicalSheets * 2);
    assert.ok(Number.isFinite(plan.metrics.estimatedTotalCost));

    if (plan.family === USER_UNIFORM_PLAN_FAMILY.WORK_AND_TURN_DEDICATED_PAIRS) {
      assert.equal(plan.metrics.duplexMode, "workAndTurn");
      assert.equal(plan.metrics.colorPlates, plan.metrics.impositionCount * 4);
      assert.equal(plan.metrics.layoutForms, plan.metrics.impositionCount);
      assert.equal(plan.sharedPlates.length, plan.metrics.impositionCount);
      plan.sharedPlates.forEach((plate) => {
        assert.equal(plate.samePlateForBothPasses, true);
        assert.equal(plate.turnAxis, "horizontal");
      });
    } else {
      assert.equal(plan.metrics.duplexMode, "separateFrontBackForms");
      assert.equal(plan.metrics.colorPlates, plan.metrics.impositionCount * 5);
      assert.equal(plan.metrics.layoutForms, plan.metrics.impositionCount * 2);
      assert.equal(plan.sharedPlates.length, 0);
    }
  });

  result.grids.forEach(({ rotation }) => {
    const paper = result.plans.find(
      (plan) => plan.grid.rotation === rotation
        && plan.family === USER_UNIFORM_PLAN_FAMILY.PAPER_MINIMUM,
    );
    const dedicated = result.plans.find(
      (plan) => plan.grid.rotation === rotation
        && plan.family === USER_UNIFORM_PLAN_FAMILY.DEDICATED_PAIR_FORMS,
    );
    assert.ok(paper);
    assert.ok(dedicated);
    assert.ok(paper.metrics.physicalSheets <= dedicated.metrics.physicalSheets);
  });

  const paper90 = result.plans.find(
    (plan) => plan.grid.rotation === 90
      && plan.family === USER_UNIFORM_PLAN_FAMILY.PAPER_MINIMUM,
  );
  const dedicated90 = result.plans.find(
    (plan) => plan.grid.rotation === 90
      && plan.family === USER_UNIFORM_PLAN_FAMILY.DEDICATED_PAIR_FORMS,
  );
  const workAndTurn90 = result.plans.find(
    (plan) => plan.grid.rotation === 90
      && plan.family === USER_UNIFORM_PLAN_FAMILY.WORK_AND_TURN_DEDICATED_PAIRS,
  );
  assert.equal(paper90.metrics.physicalSheets, 20);
  assert.equal(paper90.proof.paperLowerBound, 19);
  assert.equal(paper90.proof.lowerBoundReached, false);
  assert.match(paper90.label, /Paper-focused feasible plan/);
  assert.equal(dedicated90.metrics.physicalSheets, 21);
  assert.equal(workAndTurn90.metrics.physicalSheets, 21);
  assert.equal(dedicated90.metrics.layoutForms, 6);
  assert.equal(workAndTurn90.metrics.layoutForms, 3);
  assert.equal(dedicated90.metrics.colorPlates, 15);
  assert.equal(workAndTurn90.metrics.colorPlates, 12);
  assert.equal(
    dedicated90.metrics.estimatedTotalCost - workAndTurn90.metrics.estimatedTotalCost,
    51,
  );

  assert.equal(result.plans.some(
    (plan) => plan.grid.rotation === 0
      && plan.family === USER_UNIFORM_PLAN_FAMILY.WORK_AND_TURN_DEDICATED_PAIRS,
  ), false);
});

test("work-and-turn plate count uses the larger side for both 4+1 and 1+4", () => {
  [
    createDuplexPrintSpecification({ frontColors: 4, backColors: 1 }),
    createDuplexPrintSpecification({ frontColors: 1, backColors: 4 }),
  ].forEach((specification) => {
    const result = createPlanSet({ quantities: [100], specification });
    const plan = result.plans.find(
      (entry) => entry.family === USER_UNIFORM_PLAN_FAMILY.WORK_AND_TURN_DEDICATED_PAIRS,
    );
    assert.ok(plan);
    assert.equal(plan.metrics.impositionCount, 1);
    assert.equal(plan.metrics.layoutForms, 1);
    assert.equal(plan.metrics.colorPlates, 4);
    assert.equal(plan.metrics.pressPasses, plan.metrics.physicalSheets * 2);
  });
});

test("user plan set remains available without pricing and removes only the money objective", () => {
  const result = createPlanSet({ quantities: [250, 125], withPricing: false });

  assert.equal(result.pricingReady, false);
  assert.equal(result.catalog.objectiveIds.includes("estimatedTotalCost"), false);
  assert.equal(result.catalog.objectiveOrder.includes("estimatedTotalCost"), false);
  assert.equal(result.plans.length, 5);
  result.plans.forEach((plan) => {
    assert.equal(plan.metrics.pricingStatus, "pricing incomplete");
    assert.equal(plan.metrics.estimatedTotalCost, null);
    assert.equal(plan.metrics.zeroUnderproduction, true);
  });
});

test("metric-equivalent separate plans remain lossless beside a better work-and-turn structure", () => {
  const result = createPlanSet({ quantities: [160] });

  assert.equal(result.plans.length, 5);
  assert.equal(result.catalog.summary.feasibleSolutionCount, 5);
  assert.ok(result.catalog.summary.metricEquivalentGroupCount >= 1);

  result.grids.forEach(({ rotation }) => {
    const separateEntries = result.catalog.entries.filter(({ solution }) => (
      solution.grid.rotation === rotation
      && solution.duplexMode === "separateFrontBackForms"
    ));
    assert.equal(separateEntries.length, 2);
    assert.equal(separateEntries.every(({ metricEquivalent }) => metricEquivalent), true);
  });

  const workAndTurn = result.catalog.entries.find(({ solution }) => (
    solution.family === USER_UNIFORM_PLAN_FAMILY.WORK_AND_TURN_DEDICATED_PAIRS
  ));
  assert.ok(workAndTurn);
  assert.equal(workAndTurn.metricEquivalent, false);
});

test("user plan set rejects an incomplete front/back pair instead of pricing a blank side", () => {
  const incompletePairs = expandPagePairs([{
    file: "Odd",
    quantity: 100,
    pages: 3,
  }]);

  assert.throws(() => createUserUniformProductionPlanSet({
    pagePairs: incompletePairs,
    placementOptions,
    sourceSheet,
    printSpecification,
    pricing,
  }), /require complete front\/back page pairs/);
});

test("user plan set rejects unsupported simplex pricing shape instead of inventing duplex totals", () => {
  const simplex = createDuplexPrintSpecification({ frontColors: 4, backColors: 0 });

  assert.throws(() => createUserUniformProductionPlanSet({
    pagePairs: pagePairsForQuantities([100]),
    placementOptions,
    sourceSheet,
    printSpecification: simplex,
    pricing,
  }), /require colors on both sides/);
});

test("user plan set rejects a product that fits neither uniform orientation", () => {
  const impossiblePlacement = calculatePlacementOptions({
    printable: { width: 100, height: 100 },
    product: {
      width: 200,
      height: 200,
      bleed: 0,
      spacingMode: "commonCut",
      gap: 0,
    },
  });

  assert.throws(() => createUserUniformProductionPlanSet({
    pagePairs: pagePairsForQuantities([100]),
    placementOptions: impossiblePlacement,
    sourceSheet,
    printSpecification,
    pricing,
  }), /does not fit/);
});
