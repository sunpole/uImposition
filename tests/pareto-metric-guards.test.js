import test from "node:test";
import assert from "node:assert/strict";

import {
  buildParetoFrontier,
  compareSolutionsByObjective,
} from "../src/pareto-alternatives.js";

const validMetrics = Object.freeze({
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

function solution(id, overrides = {}) {
  return Object.freeze({
    id,
    metrics: Object.freeze({ ...validMetrics, ...overrides }),
  });
}

test("Pareto objectives reject null, undefined, and numeric strings instead of coercing zero", () => {
  const valid = solution("valid");

  for (const invalidValue of [null, undefined, "0", ""]) {
    const invalid = solution(`invalid-${String(invalidValue)}`, {
      estimatedTotalCost: invalidValue,
    });

    assert.throws(
      () => compareSolutionsByObjective(invalid, valid, "estimatedTotalCost"),
      /estimatedTotalCost must be finite/,
    );
    assert.throws(
      () => buildParetoFrontier([valid, invalid]),
      /estimatedTotalCost must be finite/,
    );
  }
});

test("pricing-incomplete candidates are valid only when cost is explicitly absent from Pareto objectives", () => {
  const objectiveIds = [
    "physicalSheets",
    "layoutForms",
    "colorPlates",
    "fileOverrun",
    "pairOverrun",
    "pressPasses",
    "splitOrders",
    "impositionCount",
    "layoutCompactness",
    "distinctOrdersPerImposition",
  ];
  const first = solution("first", { estimatedTotalCost: null, physicalSheets: 100 });
  const second = solution("second", { estimatedTotalCost: null, physicalSheets: 101 });

  const result = buildParetoFrontier([first, second], {
    objectiveIds,
    objectiveOrder: objectiveIds,
  });

  assert.deepEqual(result.objectiveIds, objectiveIds);
  assert.deepEqual(result.frontier.map(({ id }) => id), ["first"]);
});
