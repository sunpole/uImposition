import test from "node:test";
import assert from "node:assert/strict";

import { calculatePlacementOptions } from "../src/geometry.js";
import { expandPagePairs } from "../src/orders.js";
import {
  createOddPageUniformProductionPlanSet,
  expandOddPageProductRowsToLegacyOrders,
  validateProductRowsForOddPageUniformPipeline,
} from "../src/odd-page-uniform-support.js";
import { normalizeProductRowCollection } from "../src/product-row-collection.js";
import { createDuplexPrintSpecification } from "../src/print-specification.js";
import { USER_UNIFORM_PLAN_FAMILY } from "../src/user-uniform-production-plans.js";

const sourceSheet = Object.freeze({ width: 620, height: 450 });
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

function collectionFor({
  pages,
  frontColors = 1,
  backColors = 1,
  duplexPreference = "auto",
}) {
  return normalizeProductRowCollection({ rows: [{
    id: "product:1",
    name: `Job-${pages}`,
    finished: { widthMm: 105, heightMm: 148 },
    quantityPerVariant: 100,
    variantCount: 1,
    pages,
    print: {
      mode: "duplex",
      frontColors,
      backColors,
      duplexPreference,
    },
    bleed: { mode: "uniform", uniformMm: 0 },
    cut: { mode: "commonCut", gapMm: 0 },
    rotationPolicy: "auto",
  }] });
}

function planSetFor({
  pages,
  frontColors = 1,
  backColors = 1,
  duplexPreference = "auto",
}) {
  const collection = collectionFor({
    pages,
    frontColors,
    backColors,
    duplexPreference,
  });
  const orders = expandOddPageProductRowsToLegacyOrders(collection);
  const pagePairs = expandPagePairs(orders);
  return {
    pagePairs,
    result: createOddPageUniformProductionPlanSet({
      pagePairs,
      placementOptions,
      sourceSheet,
      printSpecification: createDuplexPrintSpecification({ frontColors, backColors }),
      duplexPreference,
    }),
  };
}

function dedicatedZero(result) {
  return result.plans.find((plan) => (
    plan.family === USER_UNIFORM_PLAN_FAMILY.DEDICATED_PAIR_FORMS
    && plan.grid.rotation === 0
  ));
}

test("odd page rows are valid in auto mode but forced work-and-turn is blocked", () => {
  for (const pages of [1, 3, 5]) {
    const validation = validateProductRowsForOddPageUniformPipeline(collectionFor({ pages }));
    assert.equal(validation.valid, true);
    assert.equal(validation.summary.technicalBlankPageCount, 1);
    assert.equal(validation.issues.some(({ code }) => code === "uniformPipelineRequiresCompletePagePairs"), false);

    const forced = validateProductRowsForOddPageUniformPipeline(collectionFor({
      pages,
      duplexPreference: "workAndTurn",
    }));
    assert.equal(forced.valid, false);
    assert.ok(forced.issues.some(({ code }) => (
      code === "uniformPipelineWorkAndTurnRequiresCompletePagePairs"
    )));

    const orders = expandOddPageProductRowsToLegacyOrders(collectionFor({ pages }));
    assert.equal(orders[0].pages, pages);
    assert.equal(orders[0].printPairs, Math.ceil(pages / 2));
  }
});

test("odd jobs expose a technical blank back page without inventing content", () => {
  for (const pages of [1, 3, 5]) {
    const { pagePairs, result } = planSetFor({ pages });
    assert.equal(pagePairs.length, Math.ceil(pages / 2));
    assert.equal(pagePairs.at(-1).frontPage, pages);
    assert.equal(pagePairs.at(-1).backPage, null);
    assert.equal(result.technicalBlankPairCount, 1);
    assert.equal(result.scope.oddPageTechnicalBlanks, true);
    assert.equal(result.scope.workAndTurnEvaluated, false);
    assert.equal(result.scope.workAndTurnExcludedByTechnicalBlank, true);
    assert.equal(result.plans.some(({ duplexMode }) => duplexMode === "workAndTurn"), false);
    result.plans.forEach((plan) => {
      assert.equal(plan.report.valid, true);
      assert.equal(plan.report.duplexMode, "separateFrontBackForms");
      const blankBackCells = plan.impositions.flatMap(({ back }) => back.cells)
        .filter(({ backPage }) => backPage === null);
      assert.ok(blankBackCells.length > 0);
      assert.equal(blankBackCells.every(({ page, technicalBlank }) => page === null && technicalBlank === true), true);
    });
  }
});

test("even jobs preserve real work-and-turn reports and shared forms", () => {
  const { result } = planSetFor({
    pages: 2,
    frontColors: 4,
    backColors: 1,
    duplexPreference: "workAndTurn",
  });

  assert.equal(result.technicalBlankPairCount, 0);
  assert.equal(result.duplexPreference, "workAndTurn");
  assert.equal(result.plans.length, 1);
  const plan = result.plans[0];
  assert.equal(plan.family, USER_UNIFORM_PLAN_FAMILY.WORK_AND_TURN_DEDICATED_PAIRS);
  assert.equal(plan.duplexMode, "workAndTurn");
  assert.equal(plan.report.duplexMode, "workAndTurn");
  assert.equal(plan.report.totals.frontForms, 1);
  assert.equal(plan.report.totals.backForms, 0);
  assert.equal(plan.report.totals.forms, 1);
  assert.equal(plan.metrics.layoutForms, 1);
  assert.equal(plan.metrics.colorPlates, 4);
  assert.equal(plan.sharedPlates.length, 1);
  assert.equal(plan.sharedPlates[0].samePlateForBothPasses, true);
});

test("separate preference excludes work-and-turn without changing ordinary plans", () => {
  const { result } = planSetFor({
    pages: 2,
    frontColors: 4,
    backColors: 1,
    duplexPreference: "separateFrontBackForms",
  });

  assert.equal(result.plans.length, 4);
  assert.equal(result.plans.every(({ duplexMode }) => (
    duplexMode === "separateFrontBackForms"
  )), true);
  assert.equal(result.scope.workAndTurnEvaluated, false);
});

test("dedicated odd-page forms count only actually printed backs", () => {
  const cases = [
    { pages: 1, frontColors: 1, backColors: 1, frontForms: 1, backForms: 0, plates: 1 },
    { pages: 3, frontColors: 1, backColors: 1, frontForms: 2, backForms: 1, plates: 3 },
    { pages: 5, frontColors: 4, backColors: 4, frontForms: 3, backForms: 2, plates: 20 },
    { pages: 3, frontColors: 4, backColors: 1, frontForms: 2, backForms: 1, plates: 9 },
    { pages: 3, frontColors: 1, backColors: 4, frontForms: 2, backForms: 1, plates: 6 },
  ];

  cases.forEach((entry) => {
    const { result } = planSetFor(entry);
    const plan = dedicatedZero(result);
    assert.ok(plan);
    assert.equal(plan.report.totals.frontForms, entry.frontForms);
    assert.equal(plan.report.totals.backForms, entry.backForms);
    assert.equal(plan.report.totals.forms, entry.frontForms + entry.backForms);
    assert.equal(plan.metrics.layoutForms, entry.frontForms + entry.backForms);
    assert.equal(plan.metrics.colorPlates, entry.plates);
    assert.equal(
      plan.metrics.pressPasses,
      plan.report.runMetrics.impositions.reduce(
        (sum, metric) => sum + metric.runLength * (metric.backPrinted ? 2 : 1),
        0,
      ),
    );
  });
});

test("even jobs keep their existing duplex form and plate totals", () => {
  const { result } = planSetFor({
    pages: 4,
    frontColors: 4,
    backColors: 1,
    duplexPreference: "separateFrontBackForms",
  });
  const plan = dedicatedZero(result);
  assert.ok(plan);
  assert.equal(result.technicalBlankPairCount, 0);
  assert.equal(plan.report.totals.frontForms, 2);
  assert.equal(plan.report.totals.backForms, 2);
  assert.equal(plan.metrics.layoutForms, 4);
  assert.equal(plan.metrics.colorPlates, 10);
  assert.equal(plan.report.runMetrics.impositions.every(({ backPrinted }) => backPrinted), true);
});
