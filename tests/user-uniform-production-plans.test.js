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

test("user plan set builds both supported plan families for every fitting orientation", () => {
  const result = createUserUniformProductionPlanSet({
    pagePairs: pagePairsForQuantities([100, 100, 100]),
    placementOptions,
    sourceSheet,
    printSpecification,
    pricing,
  });

  assert.equal(result.kind, USER_UNIFORM_PRODUCTION_PLAN_SET_KIND);
  assert.deepEqual(result.grids.map(({ rotation }) => rotation), [0, 90]);
  assert.equal(result.plans.length, 4);
  assert.equal(result.catalog.summary.feasibleSolutionCount, 4);
  assert.equal(result.catalog.summary.hiddenSolutionCount, 0);
  assert.equal(result.catalog.coverage.completeWithinRequestedSpace, true);
  assert.equal(result.catalog.coverage.globalCompletenessClaimed, false);
  assert.equal(result.scope.completeWithinDeclaredFamilies, true);
  assert.equal(result.scope.globalCompletenessClaimed, false);

  result.plans.forEach((plan) => {
    assert.equal(plan.report.valid, true);
    assert.equal(plan.report.totals.underproduction, 0);
    assert.equal(plan.report.totals.fileUnderproduction, 0);
    assert.equal(plan.metrics.zeroUnderproduction, true);
    assert.equal(plan.metrics.pricingStatus, "pricing ready");
    assert.equal(plan.metrics.colorPlates, plan.metrics.impositionCount * 5);
    assert.equal(plan.metrics.layoutForms, plan.metrics.impositionCount * 2);
    assert.equal(plan.metrics.pressPasses, plan.metrics.physicalSheets * 2);
    assert.ok(Number.isFinite(plan.metrics.estimatedTotalCost));
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
  assert.equal(paper90.metrics.physicalSheets, 20);
  assert.equal(paper90.proof.paperLowerBound, 19);
  assert.equal(paper90.proof.lowerBoundReached, false);
  assert.match(paper90.label, /Paper-focused feasible plan/);
  assert.equal(dedicated90.metrics.physicalSheets, 21);
});

test("user plan set remains available without pricing and removes only the money objective", () => {
  const result = createUserUniformProductionPlanSet({
    pagePairs: pagePairsForQuantities([250, 125]),
    placementOptions,
    sourceSheet,
    printSpecification,
  });

  assert.equal(result.pricingReady, false);
  assert.equal(result.catalog.objectiveIds.includes("estimatedTotalCost"), false);
  assert.equal(result.catalog.objectiveOrder.includes("estimatedTotalCost"), false);
  assert.equal(result.plans.length, 4);
  result.plans.forEach((plan) => {
    assert.equal(plan.metrics.pricingStatus, "pricing incomplete");
    assert.equal(plan.metrics.estimatedTotalCost, null);
    assert.equal(plan.metrics.zeroUnderproduction, true);
  });
});

test("metric-equivalent but structurally distinct plans remain in the lossless catalog", () => {
  const result = createUserUniformProductionPlanSet({
    pagePairs: pagePairsForQuantities([160]),
    placementOptions,
    sourceSheet,
    printSpecification,
    pricing,
  });

  assert.equal(result.plans.length, 4);
  assert.equal(result.catalog.summary.feasibleSolutionCount, 4);
  assert.ok(result.catalog.summary.metricEquivalentGroupCount >= 1);

  result.grids.forEach(({ rotation }) => {
    const entries = result.catalog.entries.filter(({ solution }) => solution.grid.rotation === rotation);
    assert.equal(entries.length, 2);
    assert.equal(entries.every(({ metricEquivalent }) => metricEquivalent), true);
  });
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
