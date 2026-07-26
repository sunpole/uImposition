import test from "node:test";
import assert from "node:assert/strict";

import {
  OPTIMIZATION_OBJECTIVE_IDS,
} from "../src/optimization-objectives.js";
import {
  buildParetoFrontier,
} from "../src/pareto-alternatives.js";
import {
  DISPLAY_ALTERNATIVE_REASON,
  PARETO_DISPLAY_SET_KIND,
  buildParetoDisplaySet,
} from "../src/pareto-display-set.js";

function solution(id, overrides = {}) {
  return Object.freeze({
    id,
    metrics: Object.freeze({
      physicalSheets: 100,
      estimatedTotalCost: 1000,
      layoutForms: 10,
      colorPlates: 40,
      fileOverrun: 10,
      pairOverrun: 10,
      pressPasses: 200,
      splitOrders: 0,
      impositionCount: 5,
      layoutCompactness: 0.8,
      distinctOrdersPerImposition: 2,
      ...overrides,
    }),
  });
}

const paperMinimum = solution("paper-minimum", {
  physicalSheets: 90,
  estimatedTotalCost: 1400,
  layoutForms: 14,
  colorPlates: 56,
  fileOverrun: 8,
  pairOverrun: 2,
  pressPasses: 180,
  impositionCount: 7,
  layoutCompactness: 0.5,
  distinctOrdersPerImposition: 1,
});

const compact = solution("compact", {
  physicalSheets: 105,
  estimatedTotalCost: 700,
  layoutForms: 4,
  colorPlates: 16,
  fileOverrun: 20,
  pairOverrun: 20,
  pressPasses: 210,
  impositionCount: 2,
  layoutCompactness: 0.98,
  distinctOrdersPerImposition: 7,
});

const zeroOverrun = solution("zero-overrun", {
  physicalSheets: 115,
  estimatedTotalCost: 1100,
  layoutForms: 8,
  colorPlates: 32,
  fileOverrun: 0,
  pairOverrun: 0,
  pressPasses: 230,
  impositionCount: 4,
  layoutCompactness: 0.72,
  distinctOrdersPerImposition: 3,
});

const lowPasses = solution("low-passes", {
  physicalSheets: 94,
  estimatedTotalCost: 1250,
  layoutForms: 11,
  colorPlates: 44,
  fileOverrun: 14,
  pairOverrun: 14,
  pressPasses: 170,
  impositionCount: 6,
  layoutCompactness: 0.6,
  distinctOrdersPerImposition: 2,
});

const balancedA = solution("balanced-a", {
  physicalSheets: 98,
  estimatedTotalCost: 980,
  layoutForms: 7,
  colorPlates: 28,
  fileOverrun: 9,
  pairOverrun: 9,
  pressPasses: 196,
  impositionCount: 4,
  layoutCompactness: 0.82,
  distinctOrdersPerImposition: 3,
});

const balancedB = solution("balanced-b", {
  physicalSheets: 101,
  estimatedTotalCost: 870,
  layoutForms: 6,
  colorPlates: 24,
  fileOverrun: 12,
  pairOverrun: 12,
  pressPasses: 202,
  impositionCount: 3,
  layoutCompactness: 0.88,
  distinctOrdersPerImposition: 4,
});

const frontierSolutions = [paperMinimum, compact, zeroOverrun, lowPasses, balancedA, balancedB];

function createFrontier(solutions = frontierSolutions, options = {}) {
  return buildParetoFrontier(solutions, options);
}

test("buildParetoDisplaySet pins recommendation and unique required extrema", () => {
  const display = buildParetoDisplaySet(createFrontier(), { displayLimit: 6 });

  assert.equal(display.kind, PARETO_DISPLAY_SET_KIND);
  assert.equal(display.recommendedSolutionId, "paper-minimum");
  assert.deepEqual(display.mandatorySolutionIds, [
    "paper-minimum",
    "compact",
    "zero-overrun",
    "low-passes",
  ]);
  assert.equal(display.extremeSolutionIds.physicalSheets, "paper-minimum");
  assert.equal(display.extremeSolutionIds.estimatedTotalCost, "compact");
  assert.equal(display.extremeSolutionIds.layoutForms, "compact");
  assert.equal(display.extremeSolutionIds.colorPlates, "compact");
  assert.equal(display.extremeSolutionIds.fileOverrun, "zero-overrun");
  assert.equal(display.extremeSolutionIds.pairOverrun, "zero-overrun");
  assert.equal(display.extremeSolutionIds.pressPasses, "low-passes");

  const compactEntry = display.entries.find(({ solutionId }) => solutionId === "compact");
  assert.deepEqual(compactEntry.reasonKinds, [DISPLAY_ALTERNATIVE_REASON.EXTREME]);
  assert.deepEqual(compactEntry.extremeObjectiveIds, [
    "estimatedTotalCost",
    "layoutForms",
    "colorPlates",
  ]);
});

test("display limit expands instead of hiding mandatory alternatives", () => {
  const display = buildParetoDisplaySet(createFrontier(), { displayLimit: 2 });

  assert.equal(display.requestedDisplayLimit, 2);
  assert.equal(display.effectiveDisplayLimit, 4);
  assert.equal(display.limitExpandedBy, 2);
  assert.equal(display.displayedCount, 4);
  assert.deepEqual(display.entries.map(({ solutionId }) => solutionId), [
    "paper-minimum",
    "compact",
    "zero-overrun",
    "low-passes",
  ]);
  assert.equal(display.hiddenFrontierCount, 2);
  assert.equal(display.truncated, true);
});

test("diverse tradeoff fill is deterministic and records its nearest selected alternative", () => {
  const options = {
    displayLimit: 5,
    extremeObjectiveIds: ["physicalSheets", "estimatedTotalCost"],
  };
  const forward = buildParetoDisplaySet(createFrontier(frontierSolutions), options);
  const reverse = buildParetoDisplaySet(createFrontier([...frontierSolutions].reverse()), options);

  assert.deepEqual(
    forward.entries.map(({ solutionId }) => solutionId),
    reverse.entries.map(({ solutionId }) => solutionId),
  );
  assert.deepEqual(forward.mandatorySolutionIds, ["paper-minimum", "compact"]);
  assert.equal(forward.entries.length, 5);

  const diverseEntries = forward.entries.filter(
    ({ reasonKinds }) => reasonKinds.includes(DISPLAY_ALTERNATIVE_REASON.DIVERSE_TRADEOFF),
  );
  assert.equal(diverseEntries.length, 3);
  diverseEntries.forEach(({ diversity }) => {
    assert.ok(diversity.nearestSolutionId);
    assert.ok(diversity.objectiveId);
    assert.ok(diversity.normalizedDistance >= 0 && diversity.normalizedDistance <= 1);
  });
});

test("entries expose structured advantages and tradeoffs against the recommendation", () => {
  const display = buildParetoDisplaySet(createFrontier(), { displayLimit: 4 });
  const compactEntry = display.entries.find(({ solutionId }) => solutionId === "compact");

  assert.equal(compactEntry.comparison.referenceSolutionId, "paper-minimum");
  assert.ok(compactEntry.comparison.advantageObjectiveIds.includes("estimatedTotalCost"));
  assert.ok(compactEntry.comparison.advantageObjectiveIds.includes("layoutForms"));
  assert.ok(compactEntry.comparison.tradeoffObjectiveIds.includes("physicalSheets"));
  assert.equal(compactEntry.comparison.primaryAdvantageObjectiveId, "estimatedTotalCost");
  assert.equal(compactEntry.comparison.primaryTradeoffObjectiveId, "physicalSheets");

  const costDelta = compactEntry.comparison.deltas.find(
    ({ objectiveId }) => objectiveId === "estimatedTotalCost",
  );
  assert.equal(costDelta.leftValue, 700);
  assert.equal(costDelta.rightValue, 1400);
  assert.equal(costDelta.better, "left");
  assert.equal(costDelta.favorableDelta, 700);
});

test("pricing-incomplete Pareto sets omit cost comparisons without inventing zero", () => {
  const objectiveIds = OPTIMIZATION_OBJECTIVE_IDS.filter(
    (objectiveId) => objectiveId !== "estimatedTotalCost",
  );
  const incompleteSolutions = frontierSolutions.map((entry) => solution(entry.id, {
    ...entry.metrics,
    estimatedTotalCost: null,
  }));
  const pareto = createFrontier(incompleteSolutions, {
    objectiveIds,
    objectiveOrder: objectiveIds,
  });
  const display = buildParetoDisplaySet(pareto, { displayLimit: 4 });

  assert.equal(display.pricingComparable, false);
  assert.equal(display.objectiveIds.includes("estimatedTotalCost"), false);
  assert.equal(display.requiredExtremeObjectiveIds.includes("estimatedTotalCost"), false);
  assert.equal(Object.hasOwn(display.extremeSolutionIds, "estimatedTotalCost"), false);
  display.entries.forEach(({ comparison }) => {
    assert.equal(
      comparison.deltas.some(({ objectiveId }) => objectiveId === "estimatedTotalCost"),
      false,
    );
  });
});

test("explicit recommendation and reference must exist in the Pareto frontier", () => {
  const pareto = createFrontier();

  assert.throws(
    () => buildParetoDisplaySet(pareto, { recommendedSolutionId: "missing" }),
    /recommendedSolutionId is not present/,
  );
  assert.throws(
    () => buildParetoDisplaySet(pareto, { referenceSolutionId: "missing" }),
    /referenceSolutionId is not present/,
  );
  assert.throws(
    () => buildParetoDisplaySet(pareto, { displayLimit: 0 }),
    /displayLimit must be a positive integer/,
  );
});
