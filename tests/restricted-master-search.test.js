import test from "node:test";
import assert from "node:assert/strict";
import {
  solveExactProductionSmallMaster,
} from "../src/exact-production-small-master.js";
import { createRestrictedMasterProblem } from "../src/restricted-master-foundation.js";
import {
  solveRestrictedMaster,
  validateRestrictedMasterSearchResult,
} from "../src/restricted-master-search.js";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import { generateExactMultiProductSeparateDuplexColumns } from "../src/multi-product-duplex-columns.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function rowGeometry(capacity) {
  return createUniformGridPattern({
    printableArea: { widthMm: capacity * 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function simplexDemand(demandId, requiredQuantity, frontColorCount = 1) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: 1,
    backPage: null,
    frontColorCount,
    backColorCount: 0,
  };
}

function duplexDemand(demandId, requiredQuantity, pageOffset = 0, colors = [1, 1]) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: pageOffset + 1,
    backPage: pageOffset + 2,
    frontColorCount: colors[0],
    backColorCount: colors[1],
  };
}

function exactBest(catalog, maxSelectedColumns, maxRunLength) {
  const exact = solveExactProductionSmallMaster({
    columnCatalog: catalog,
    maxSelectedColumns,
    maxRunLength,
    maxExactStateCount: 1000000,
  });
  return {
    catalog: exact,
    plan: exact.plans.find(({ id }) => id === exact.bestPlanIds.physicalSheets),
  };
}

function createProblem(catalog, maxSelectedColumns, maxRunLength) {
  return createRestrictedMasterProblem({
    columnCatalog: catalog,
    maxSelectedColumns,
    maxRunLength,
    maxStates: 100000,
    maxMilliseconds: 10000,
    initialMixedColumnLimit: 4,
  });
}

test("R1-A2 simplex branch-and-bound matches the exact best plan", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
  });
  const maxSelectedColumns = 2;
  const maxRunLength = 4;
  const exact = exactBest(catalog, maxSelectedColumns, maxRunLength);
  const problem = createProblem(catalog, maxSelectedColumns, maxRunLength);
  const result = solveRestrictedMaster({
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 100000,
    maxMilliseconds: 10000,
  });

  assert.ok(result.bestPlan);
  assert.equal(result.bestPlan.planSignature, exact.plan.planSignature);
  assert.deepEqual(result.bestPlan.metrics, exact.plan.metrics);
  assert.equal(result.bestPlan.metrics.physicalSheets, 4);
  assert.equal(result.bounds.rootPhysicalSheetsLowerBound, 4);
  assert.equal(result.bounds.provenPhysicalSheetsLowerBound, 4);
  assert.equal(result.bounds.absoluteGap, 0);
  assert.equal(result.coverage.completeWithinRestrictedColumnSpace, true);
  assert.equal(result.coverage.provenOptimalWithinRestrictedSpace, true);
  assert.equal(result.coverage.truncated, false);
  assert.equal(result.coverage.completeFeasibleCatalogEnumerated, false);
  assert.ok(result.counters.objectivePrunedStateCount > 0);
  assert.equal(validateRestrictedMasterSearchResult(result, problem), true);
});

test("R1-A2 separate-duplex branch-and-bound matches exact forms, plates and passes", () => {
  const catalog = generateExactMultiProductSeparateDuplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [
      duplexDemand("a", 8, 0, [4, 1]),
      duplexDemand("b", 4, 2, [4, 1]),
    ],
  });
  const maxSelectedColumns = 2;
  const maxRunLength = 4;
  const exact = exactBest(catalog, maxSelectedColumns, maxRunLength);
  const problem = createProblem(catalog, maxSelectedColumns, maxRunLength);
  const result = solveRestrictedMaster({
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 100000,
    maxMilliseconds: 10000,
  });

  assert.equal(result.bestPlan.planSignature, exact.plan.planSignature);
  assert.deepEqual(result.bestPlan.metrics, exact.plan.metrics);
  assert.equal(result.bestPlan.metrics.physicalSheets, 3);
  assert.equal(result.bestPlan.metrics.selectedColumnCount, 2);
  assert.equal(result.bestPlan.metrics.layoutForms, 4);
  assert.equal(result.bestPlan.metrics.colorPlates, 10);
  assert.equal(result.bestPlan.metrics.pressPasses, 6);
  assert.equal(result.coverage.provenOptimalWithinRestrictedSpace, true);
});

test("R1-A2 default restricted set uses deterministic warm-start columns", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
  });
  const problem = createProblem(catalog, 2, 4);
  const result = solveRestrictedMaster({
    problem,
    maxStates: 100000,
    maxMilliseconds: 10000,
  });

  assert.deepEqual(result.candidateColumnSignatures, problem.initialColumns.initialColumnSignatures);
  assert.equal(result.bestPlan.metrics.physicalSheets, 4);
  assert.equal(result.coverage.columnsOutsideRestrictedSetConsidered, false);
  assert.equal(result.coverage.globalCompletenessClaimed, false);
});

test("R1-A2 proves infeasibility inside restrictive limits without visiting search states", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(2),
    demands: [simplexDemand("a", 100), simplexDemand("b", 100)],
  });
  const problem = createRestrictedMasterProblem({
    columnCatalog: catalog,
    maxSelectedColumns: 1,
    maxRunLength: 1,
    maxStates: 100,
    maxMilliseconds: 10000,
  });
  const result = solveRestrictedMaster({ problem });

  assert.equal(result.bestPlan, null);
  assert.equal(result.counters.visitedStateCount, 0);
  assert.equal(result.coverage.completeWithinRestrictedColumnSpace, true);
  assert.equal(result.coverage.provenInfeasibleWithinRestrictedSpace, true);
  assert.equal(result.coverage.provenOptimalWithinRestrictedSpace, false);
  assert.equal(result.coverage.truncated, false);
});

test("R1-A2 state-limited search retains a greedy incumbent but does not claim proof", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
  });
  const problem = createProblem(catalog, 2, 4);
  const result = solveRestrictedMaster({
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 1,
    maxMilliseconds: 10000,
  });

  assert.ok(result.bestPlan);
  assert.equal(result.bestPlan.metrics.physicalSheets, 4);
  assert.equal(result.bounds.absoluteGap, 0);
  assert.equal(result.coverage.truncated, true);
  assert.deepEqual(result.coverage.truncationReasons, ["stateLimit"]);
  assert.equal(result.coverage.completeWithinRestrictedColumnSpace, false);
  assert.equal(result.coverage.provenOptimalWithinRestrictedSpace, false);
  assert.equal(result.coverage.provenInfeasibleWithinRestrictedSpace, false);
});

test("R1-A2 explicit column subset is the only searched scope", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
  });
  const problem = createProblem(catalog, 2, 4);
  const dedicatedOnly = problem.columns
    .filter((column) => column.metrics.activeDemandCount === 1)
    .map(({ columnSignature }) => columnSignature);
  const result = solveRestrictedMaster({
    problem,
    candidateColumnSignatures: dedicatedOnly,
    maxStates: 100000,
    maxMilliseconds: 10000,
  });

  assert.deepEqual(new Set(result.candidateColumnSignatures), new Set(dedicatedOnly));
  assert.equal(result.bestPlan.metrics.physicalSheets, 4);
  assert.equal(result.bestPlan.metrics.selectedColumnCount, 2);
  assert.equal(result.coverage.provenOptimalWithinRestrictedSpace, true);
  assert.equal(result.coverage.columnsOutsideRestrictedSetConsidered, false);
});

test("R1-A2 deterministic replay returns identical proof data", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(3),
    demands: [simplexDemand("a", 5), simplexDemand("b", 4)],
  });
  const problem = createProblem(catalog, 2, 4);
  const request = {
    id: "replay",
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 100000,
    maxMilliseconds: 10000,
  };
  const first = solveRestrictedMaster(request);
  const second = solveRestrictedMaster(request);

  assert.deepEqual(first, second);
});

test("R1-A2 encountered Pareto set retains the best plan and contains no dominated pair", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 7), simplexDemand("b", 5)],
  });
  const problem = createProblem(catalog, 2, 5);
  const result = solveRestrictedMaster({
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 100000,
    maxMilliseconds: 10000,
  });

  assert.ok(result.encounteredParetoPlans.some(
    (plan) => plan.planSignature === result.bestPlan.planSignature,
  ));
  for (let a = 0; a < result.encounteredParetoPlans.length; a += 1) {
    for (let b = 0; b < result.encounteredParetoPlans.length; b += 1) {
      if (a === b) continue;
      const left = result.encounteredParetoPlans[a].metrics;
      const right = result.encounteredParetoPlans[b].metrics;
      const keys = [
        "physicalSheets",
        "layoutForms",
        "colorPlates",
        "pressPasses",
        "totalOverrun",
        "blankProductPositions",
      ];
      const dominates = keys.every((key) => left[key] <= right[key])
        && keys.some((key) => left[key] < right[key]);
      assert.equal(dominates, false);
    }
  }
});

test("R1-A2 result validator detects a false optimality claim", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
  });
  const problem = createProblem(catalog, 2, 4);
  const valid = solveRestrictedMaster({
    problem,
    maxStates: 1,
    maxMilliseconds: 10000,
  });
  const corrupted = {
    ...valid,
    coverage: {
      ...valid.coverage,
      provenOptimalWithinRestrictedSpace: true,
    },
  };
  assert.throws(() => validateRestrictedMasterSearchResult(corrupted, problem), /proven-optimal/);
});

test("R1-A2 output is deeply immutable", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(3),
    demands: [simplexDemand("a", 5), simplexDemand("b", 4)],
  });
  const problem = createProblem(catalog, 2, 4);
  const result = solveRestrictedMaster({ problem });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.bestPlan), true);
  assert.equal(Object.isFrozen(result.encounteredParetoPlans), true);
  assert.equal(Object.isFrozen(result.incumbentHistory), true);
  assert.equal(Object.isFrozen(result.bounds), true);
  assert.equal(Object.isFrozen(result.counters), true);
  assert.equal(Object.isFrozen(result.coverage), true);
});
