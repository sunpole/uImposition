import test from "node:test";
import assert from "node:assert/strict";
import { createRestrictedMasterProblem } from "../src/restricted-master-foundation.js";
import { solveRestrictedMaster } from "../src/restricted-master-search.js";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function createProblem() {
  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const columnCatalog = generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [
      {
        demandId: "a",
        productId: "product-a",
        requiredQuantity: 8,
        frontPage: 1,
        backPage: null,
        frontColorCount: 1,
        backColorCount: 0,
      },
      {
        demandId: "b",
        productId: "product-b",
        requiredQuantity: 8,
        frontPage: 1,
        backPage: null,
        frontColorCount: 1,
        backColorCount: 0,
      },
    ],
  });
  return createRestrictedMasterProblem({
    columnCatalog,
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxStates: 7,
    maxMilliseconds: 5000,
    initialMixedColumnLimit: 2,
  });
}

test("R1-A2 runtime overrides cannot widen the problem search contract", () => {
  const problem = createProblem();
  const result = solveRestrictedMaster({
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 999,
    maxMilliseconds: 999999,
  });

  assert.equal(result.coverage.maxStates, 7);
  assert.equal(result.coverage.maxMilliseconds, 5000);
});

test("R1-A2 runtime overrides may tighten the problem search contract", () => {
  const problem = createProblem();
  const result = solveRestrictedMaster({
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 1,
    maxMilliseconds: 500,
  });

  assert.equal(result.coverage.maxStates, 1);
  assert.equal(result.coverage.maxMilliseconds, 500);
  assert.equal(result.coverage.truncated, true);
  assert.deepEqual(result.coverage.truncationReasons, ["stateLimit"]);
});
