import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeImpositionOrderDistribution,
  distributionRowsFromPaperSolution,
  distributionRowsFromProductionImpositions,
} from "../src/imposition-distribution.js";

test("distribution counts unique orders, split orders, and extra fragments", () => {
  const result = analyzeImpositionOrderDistribution([
    { id: "A", files: ["1", "1", "2"] },
    { id: "B", files: ["2", "3"] },
    { id: "C", files: ["2"] },
  ]);

  assert.equal(result.impositionCount, 3);
  assert.equal(result.orderCount, 3);
  assert.equal(result.distinctOrdersPerImposition, 2);
  assert.equal(result.splitOrders, 1);
  assert.equal(result.fragmentedBlocks, 2);
  assert.deepEqual(result.appearancesByFile, {
    1: ["A"],
    2: ["A", "B", "C"],
    3: ["B"],
  });
});

test("production and paper adapters preserve real imposition membership", () => {
  const productionRows = distributionRowsFromProductionImpositions([
    {
      front: {
        id: "manual-1",
        cells: [
          { file: "10" },
          { file: "10" },
          { file: "11" },
        ],
      },
    },
  ]);
  const paperRows = distributionRowsFromPaperSolution({
    plannedRuns: [
      {
        candidate: {
          id: "paper-1",
          pairPositions: [
            { file: "10" },
            { file: "12" },
          ],
        },
      },
    ],
  });

  assert.deepEqual(productionRows, [{ id: "manual-1", files: ["10", "10", "11"] }]);
  assert.deepEqual(paperRows, [{ id: "paper-1", files: ["10", "12"] }]);
});

test("distribution rejects duplicate imposition ids and placeholder files", () => {
  assert.throws(
    () => analyzeImpositionOrderDistribution([
      { id: "same", files: ["1"] },
      { id: "same", files: ["2"] },
    ]),
    /Duplicate imposition id/,
  );
  assert.throws(
    () => analyzeImpositionOrderDistribution([{ id: "A", files: ["-"] }]),
    /is required/,
  );
});
