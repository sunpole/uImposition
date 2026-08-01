import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateExactIntegerColumnUtility,
  validateExactIntegerColumnUtilityOracleResult,
} from "../src/exact-integer-column-utility-oracle.js";
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

function simplexDemand(demandId, requiredQuantity = 8, frontColorCount = 1) {
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

function duplexDemand(demandId, pageOffset, requiredQuantity = 8, colors = [4, 1]) {
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

function allocationVector(column) {
  return column.allocation.map(({ positionsPerSheet }) => positionsPerSheet);
}

function findColumn(catalog, expected) {
  const column = catalog.columns.find((candidate) => (
    JSON.stringify(allocationVector(candidate)) === JSON.stringify(expected)
  ));
  assert.ok(column, `missing column ${expected.join("+")}`);
  return column;
}

function fullDedicatedSignatures(catalog) {
  const demandCount = catalog.demands.length;
  return catalog.demands.map((_, demandIndex) => {
    const expected = Array(demandCount).fill(0);
    expected[demandIndex] = catalog.geometryPattern.capacity;
    return findColumn(catalog, expected).columnSignature;
  }).sort();
}

test("R2-C simplex mixed 2+2 saves one form and one plate at the same four sheets", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
  const result = evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: fullDedicatedSignatures(catalog),
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });

  assert.ok(result.baselineBestPlan);
  assert.equal(result.baselineBestPlan.metrics.physicalSheets, 4);
  assert.equal(result.baselineBestPlan.metrics.layoutForms, 2);
  assert.equal(result.baselineBestPlan.metrics.colorPlates, 2);

  const best = result.bestImprovingCandidateEvaluation;
  assert.ok(best);
  assert.deepEqual(allocationVector(best.candidateColumn), [2, 2]);
  assert.equal(best.firstImprovedObjective, "layoutForms");
  assert.equal(best.bestPlanWithCandidate.metrics.physicalSheets, 4);
  assert.equal(best.bestPlanWithCandidate.metrics.layoutForms, 1);
  assert.equal(best.bestPlanWithCandidate.metrics.colorPlates, 1);
  assert.equal(best.bestPlanWithCandidate.metrics.pressPasses, 4);
  assert.deepEqual(best.metricDeltas, {
    physicalSheets: 0,
    layoutForms: -1,
    colorPlates: -1,
    pressPasses: 0,
    totalOverrun: 0,
    blankProductPositions: 0,
  });
  assert.equal(result.coverage.completeWithinSingleColumnAdditionSpace, true);
  assert.equal(result.coverage.globalCompletenessClaimed, false);
  assert.equal(validateExactIntegerColumnUtilityOracleResult(result), true);
});

test("R2-C separate duplex mixed 2+2 saves two forms and five plates", () => {
  const catalog = generateExactMultiProductSeparateDuplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [duplexDemand("a", 0), duplexDemand("b", 2)],
  });
  const result = evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: fullDedicatedSignatures(catalog),
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });

  assert.equal(result.baselineBestPlan.metrics.physicalSheets, 4);
  assert.equal(result.baselineBestPlan.metrics.layoutForms, 4);
  assert.equal(result.baselineBestPlan.metrics.colorPlates, 10);
  assert.equal(result.baselineBestPlan.metrics.pressPasses, 8);

  const best = result.bestImprovingCandidateEvaluation;
  assert.deepEqual(allocationVector(best.candidateColumn), [2, 2]);
  assert.equal(best.firstImprovedObjective, "layoutForms");
  assert.equal(best.bestPlanWithCandidate.metrics.physicalSheets, 4);
  assert.equal(best.bestPlanWithCandidate.metrics.layoutForms, 2);
  assert.equal(best.bestPlanWithCandidate.metrics.colorPlates, 5);
  assert.equal(best.bestPlanWithCandidate.metrics.pressPasses, 8);
  assert.equal(best.metricDeltas.layoutForms, -2);
  assert.equal(best.metricDeltas.colorPlates, -5);
});

test("R2-C an equal-metric alternative is not called improving because of its signature", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 4)],
  });
  const result = evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: fullDedicatedSignatures(catalog),
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });
  const twoPlusTwo = result.candidateEvaluations.find((evaluation) => (
    JSON.stringify(allocationVector(evaluation.candidateColumn)) === JSON.stringify([2, 2])
  ));

  assert.ok(twoPlusTwo);
  assert.equal(twoPlusTwo.metricallyEqualToBaseline, true);
  assert.equal(twoPlusTwo.improving, false);
  assert.equal(twoPlusTwo.firstImprovedObjective, null);
  assert.deepEqual(twoPlusTwo.metricDeltas, {
    physicalSheets: 0,
    layoutForms: 0,
    colorPlates: 0,
    pressPasses: 0,
    totalOverrun: 0,
    blankProductPositions: 0,
  });
});

test("R2-C adding a missing dedicated column can create the first feasible plan", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
  const existing = [findColumn(catalog, [4, 0]).columnSignature];
  const result = evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: existing,
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });

  assert.equal(result.baselineBestPlan, null);
  const dedicatedB = result.candidateEvaluations.find((evaluation) => (
    JSON.stringify(allocationVector(evaluation.candidateColumn)) === JSON.stringify([0, 4])
  ));
  assert.ok(dedicatedB);
  assert.equal(dedicatedB.createsFeasiblePlan, true);
  assert.equal(dedicatedB.improving, true);
  assert.equal(dedicatedB.firstImprovedObjective, "feasibility");
  assert.ok(dedicatedB.bestPlanWithCandidate);
  assert.equal(dedicatedB.bestPlanWithCandidate.metrics.physicalSheets, 4);
});

test("R2-C objective order is explicit and may prioritize forms before paper", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
  const result = evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: fullDedicatedSignatures(catalog),
    objectiveOrder: [
      "layoutForms",
      "physicalSheets",
      "colorPlates",
      "pressPasses",
      "totalOverrun",
      "blankProductPositions",
    ],
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });

  assert.equal(result.objectiveOrder[0], "layoutForms");
  assert.deepEqual(
    allocationVector(result.bestImprovingCandidateEvaluation.candidateColumn),
    [2, 2],
  );
  assert.equal(result.bestImprovingCandidateEvaluation.firstImprovedObjective, "layoutForms");
});

test("R2-C no candidates remain when every catalog column is already present", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(3),
    demands: [simplexDemand("a", 5), simplexDemand("b", 4)],
  });
  const result = evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: catalog.columns.map(({ columnSignature }) => columnSignature),
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });

  assert.equal(result.candidateEvaluations.length, 0);
  assert.equal(result.improvingCandidateEvaluations.length, 0);
  assert.equal(result.bestImprovingCandidateEvaluation, null);
  assert.equal(result.coverage.evaluatedCandidateCount, 0);
});

test("R2-C input order normalizes to the same utility result", () => {
  const geometryPattern = rowGeometry(4);
  const firstCatalog = generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [simplexDemand("b"), simplexDemand("a")],
  });
  const secondCatalog = generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
  const evaluate = (catalog) => evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: fullDedicatedSignatures(catalog),
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });
  const first = evaluate(firstCatalog);
  const second = evaluate(secondCatalog);

  assert.equal(first.requestSignature, second.requestSignature);
  assert.equal(
    first.bestImprovingCandidateEvaluation.candidateColumnSignature,
    second.bestImprovingCandidateEvaluation.candidateColumnSignature,
  );
  assert.deepEqual(
    first.bestImprovingCandidateEvaluation.metricDeltas,
    second.bestImprovingCandidateEvaluation.metricDeltas,
  );
});

test("R2-C invalid catalogs, objective orders and oversized evaluation spaces are rejected", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
  const existing = fullDedicatedSignatures(catalog);

  assert.throws(() => evaluateExactIntegerColumnUtility({
    columnCatalog: {
      ...catalog,
      coverage: {
        ...catalog.coverage,
        completeWithinRequestedSpace: false,
        truncated: true,
      },
    },
    existingColumnSignatures: existing,
  }), /complete non-truncated/);

  assert.throws(() => evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: existing,
    objectiveOrder: ["physicalSheets", "physicalSheets"],
  }), /duplicate objective/);

  assert.throws(() => evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: existing,
    maxCandidateEvaluationCount: 1,
  }), /exceeds maxCandidateEvaluationCount/);
});

test("R2-C output is immutable and validator detects a corrupted improvement flag", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
  const result = evaluateExactIntegerColumnUtility({
    columnCatalog: catalog,
    existingColumnSignatures: fullDedicatedSignatures(catalog),
    maxSelectedColumns: 2,
    maxRunLength: 8,
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidateEvaluations), true);
  assert.equal(Object.isFrozen(result.bestImprovingCandidateEvaluation), true);
  assert.equal(Object.isFrozen(result.coverage), true);

  const corrupted = {
    ...result,
    candidateEvaluations: result.candidateEvaluations.map((evaluation, index) => index === 0
      ? { ...evaluation, improving: !evaluation.improving }
      : evaluation),
  };
  assert.throws(() => validateExactIntegerColumnUtilityOracleResult(corrupted), /candidateEvaluations mismatch/);
});
