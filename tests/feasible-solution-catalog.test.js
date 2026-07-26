import test from "node:test";
import assert from "node:assert/strict";

import {
  CATALOG_COVERAGE,
  FEASIBLE_SOLUTION_CATALOG_KIND,
  buildFeasibleSolutionCatalog,
} from "../src/feasible-solution-catalog.js";

function solution(id, metrics, extra = {}) {
  return Object.freeze({ id, metrics: Object.freeze(metrics), ...extra });
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
}, { layoutId: "layout-a" });

const sameMetricsDifferentLayout = solution("manual-same-metrics-other-layout", {
  ...manualCompact.metrics,
}, { layoutId: "layout-b" });

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

const dominatedExpensive = solution("dominated-expensive", {
  ...manualCompact.metrics,
  physicalSheets: 3400,
  estimatedTotalCost: 980,
  layoutForms: 9,
  colorPlates: 36,
  pressPasses: 6800,
  impositionCount: 5,
  layoutCompactness: 0.9,
});

test("catalog preserves dominated and metric-equivalent feasible solutions", () => {
  const result = buildFeasibleSolutionCatalog([
    dominatedExpensive,
    manualCompact,
    sameMetricsDifferentLayout,
    paperMinimum,
  ], {
    searchCoverage: {
      theoreticalCandidateCount: 4,
      evaluatedCandidateCount: 4,
    },
  });

  assert.equal(result.kind, FEASIBLE_SOLUTION_CATALOG_KIND);
  assert.equal(result.summary.feasibleSolutionCount, 4);
  assert.equal(result.summary.hiddenSolutionCount, 0);
  assert.equal(result.summary.dominatedSolutionCount, 1);
  assert.equal(result.summary.metricEquivalentGroupCount, 1);
  assert.equal(result.recommendedId, "paper-minimum");
  assert.deepEqual(result.entries.map(({ id }) => id), [
    "paper-minimum",
    "manual-compact",
    "manual-same-metrics-other-layout",
    "dominated-expensive",
  ]);

  const manualEntry = result.entries.find(({ id }) => id === "manual-compact");
  assert.equal(manualEntry.metricEquivalent, true);
  assert.deepEqual(manualEntry.equivalentSolutionIds, ["manual-same-metrics-other-layout"]);

  const dominatedEntry = result.entries.find(({ id }) => id === "dominated-expensive");
  assert.equal(dominatedEntry.dominated, true);
  assert.deepEqual(dominatedEntry.dominatedBy, [
    "manual-compact",
    "manual-same-metrics-other-layout",
  ]);

  assert.equal(result.coverage.state, CATALOG_COVERAGE.COMPLETE_WITHIN_REQUESTED_SPACE);
  assert.equal(result.coverage.completeWithinRequestedSpace, true);
  assert.equal(result.coverage.globalCompletenessClaimed, false);
});

test("catalog exposes truncated bounded search instead of claiming all global variants", () => {
  const result = buildFeasibleSolutionCatalog([manualCompact, paperMinimum], {
    searchCoverage: {
      theoreticalCandidateCount: 10000,
      evaluatedCandidateCount: 250,
    },
  });

  assert.equal(result.coverage.state, CATALOG_COVERAGE.TRUNCATED);
  assert.equal(result.coverage.truncatedCandidateCount, 9750);
  assert.equal(result.coverage.completeWithinRequestedSpace, false);
  assert.equal(result.coverage.globalCompletenessClaimed, false);
  assert.equal(result.summary.hiddenSolutionCount, 0);
});

test("catalog supports an active objective subset when pricing is unavailable", () => {
  const cheapUnknown = solution("cheap-unknown", { physicalSheets: 120 });
  const paperFirst = solution("paper-first", { physicalSheets: 100 });

  const result = buildFeasibleSolutionCatalog([cheapUnknown, paperFirst], {
    objectiveIds: ["physicalSheets"],
    objectiveOrder: ["physicalSheets"],
  });

  assert.equal(result.recommendedId, "paper-first");
  assert.equal(result.summary.feasibleSolutionCount, 2);
  assert.equal(result.coverage.state, CATALOG_COVERAGE.UNKNOWN);
});

test("catalog rejects impossible coverage metadata", () => {
  assert.throws(() => buildFeasibleSolutionCatalog([manualCompact, paperMinimum], {
    searchCoverage: {
      theoreticalCandidateCount: 1,
      evaluatedCandidateCount: 1,
    },
  }), /cannot be smaller than the solution count/);
});
