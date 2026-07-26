import test from "node:test";
import assert from "node:assert/strict";

import {
  PARETO_ALTERNATIVES_KIND,
  buildParetoFrontier,
  compareSolutionsByObjective,
  dedupeSolutionAlternatives,
  describeMetricDelta,
  selectExtremeAlternatives,
  solutionDominates,
} from "../src/pareto-alternatives.js";

function solution(id, metrics) {
  return Object.freeze({ id, metrics: Object.freeze(metrics) });
}

const baseMetrics = Object.freeze({
  physicalSheets: 100,
  estimatedTotalCost: 1000,
  layoutForms: 10,
  colorPlates: 40,
  fileOverrun: 0,
  pairOverrun: 0,
  pressPasses: 200,
  splitOrders: 0,
  impositionCount: 5,
  layoutCompactness: 0.8,
  distinctOrdersPerImposition: 2,
});

const manualCompact = solution("manual-compact", {
  ...baseMetrics,
  physicalSheets: 3395,
  estimatedTotalCost: 972.55,
  layoutForms: 8,
  colorPlates: 32,
  pairOverrun: 1450,
  pressPasses: 6790,
  impositionCount: 4,
  layoutCompactness: 0.95,
  distinctOrdersPerImposition: 8,
});

const paperMinimum = solution("paper-minimum", {
  ...baseMetrics,
  physicalSheets: 3305,
  estimatedTotalCost: 7199.49,
  layoutForms: 112,
  colorPlates: 448,
  pairOverrun: 10,
  pressPasses: 6610,
  impositionCount: 56,
  layoutCompactness: 0.45,
  distinctOrdersPerImposition: 1,
});

const dominatedByManual = solution("dominated-by-manual", {
  ...manualCompact.metrics,
  physicalSheets: 3400,
  estimatedTotalCost: 980,
  layoutForms: 9,
  colorPlates: 36,
  pairOverrun: 1450,
  pressPasses: 6800,
  impositionCount: 5,
  layoutCompactness: 0.9,
});

const manualDuplicate = solution("manual-duplicate", {
  ...manualCompact.metrics,
});

test("dedupeSolutionAlternatives removes full metric duplicates and keeps the first solution", () => {
  const result = dedupeSolutionAlternatives([manualCompact, manualDuplicate, paperMinimum]);

  assert.deepEqual(result.solutions.map(({ id }) => id), ["manual-compact", "paper-minimum"]);
  assert.deepEqual(result.duplicates.map(({ duplicateId, keptId }) => [duplicateId, keptId]), [
    ["manual-duplicate", "manual-compact"],
  ]);
});

test("compareSolutionsByObjective respects minimize and maximize directions", () => {
  assert.equal(compareSolutionsByObjective(paperMinimum, manualCompact, "physicalSheets"), -1);
  assert.equal(compareSolutionsByObjective(manualCompact, paperMinimum, "estimatedTotalCost"), -1);
  assert.equal(compareSolutionsByObjective(manualCompact, paperMinimum, "layoutCompactness"), -1);
});

test("solutionDominates requires no worse metrics and at least one strictly better metric", () => {
  assert.equal(solutionDominates(manualCompact, dominatedByManual), true);
  assert.equal(solutionDominates(dominatedByManual, manualCompact), false);
  assert.equal(solutionDominates(manualCompact, manualDuplicate), false);
  assert.equal(solutionDominates(manualCompact, paperMinimum), false);
});

test("buildParetoFrontier removes duplicates and dominated variants while preserving tradeoffs", () => {
  const result = buildParetoFrontier([
    dominatedByManual,
    manualCompact,
    manualDuplicate,
    paperMinimum,
  ], {
    displayLimit: 1,
  });

  assert.equal(result.kind, PARETO_ALTERNATIVES_KIND);
  assert.deepEqual(result.frontier.map(({ id }) => id), ["paper-minimum", "manual-compact"]);
  assert.deepEqual(result.visibleFrontier.map(({ id }) => id), ["paper-minimum"]);
  assert.equal(result.hiddenFrontierCount, 1);
  assert.deepEqual(result.dominated.map(({ solution, dominatedBy }) => [solution.id, dominatedBy]), [
    ["dominated-by-manual", "manual-compact"],
  ]);
  assert.deepEqual(result.duplicates.map(({ duplicateId }) => duplicateId), ["manual-duplicate"]);
});

test("selectExtremeAlternatives pins required edge cases by objective", () => {
  const extremes = selectExtremeAlternatives([manualCompact, paperMinimum, dominatedByManual]);

  assert.equal(extremes.physicalSheets, "paper-minimum");
  assert.equal(extremes.estimatedTotalCost, "manual-compact");
  assert.equal(extremes.layoutForms, "manual-compact");
  assert.equal(extremes.colorPlates, "manual-compact");
  assert.equal(extremes.pairOverrun, "paper-minimum");
  assert.equal(extremes.pressPasses, "paper-minimum");
});

test("describeMetricDelta exposes human-readable comparison data", () => {
  const delta = describeMetricDelta(manualCompact, paperMinimum, "estimatedTotalCost");

  assert.equal(delta.metricKey, "estimatedTotalCost");
  assert.equal(delta.leftValue, 972.55);
  assert.equal(delta.rightValue, 7199.49);
  assert.equal(delta.delta, -6226.94);
  assert.equal(delta.better, "left");
  assert.equal(delta.favorableDelta, 6226.94);
});
