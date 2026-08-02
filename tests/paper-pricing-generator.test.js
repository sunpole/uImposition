import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExactPaperPricing } from "../src/exact-paper-pricing-oracle.js";
import {
  generatePaperPricingColumns,
  validatePaperPricingGeneratorResult,
} from "../src/paper-pricing-generator.js";
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

function simplexDemand(demandId, requiredQuantity = 100) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: 1,
    backPage: null,
    frontColorCount: 1,
    backColorCount: 0,
  };
}

function duplexDemand(demandId, pageOffset, requiredQuantity = 100) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: pageOffset + 1,
    backPage: pageOffset + 2,
    frontColorCount: 4,
    backColorCount: 1,
  };
}

function candidateProjection(candidate) {
  return {
    columnSignature: candidate.columnSignature,
    allocationSignature: candidate.allocationSignature,
    coverageCredit: candidate.coverageCredit,
    reducedCost: candidate.reducedCost,
  };
}

function assertMatchesExact({
  columnFamily,
  geometryPattern,
  demands,
  columnCatalog,
  demandShadowPrices,
  existingColumnSignatures = [],
  maxCandidates = 4,
}) {
  const exact = evaluateExactPaperPricing({
    columnCatalog,
    demandShadowPrices,
    existingColumnSignatures,
  });
  const generated = generatePaperPricingColumns({
    columnFamily,
    geometryPattern,
    demands,
    demandShadowPrices,
    existingColumnSignatures,
    maxCandidates,
    maxVisitedStates: 100000,
  });
  assert.deepEqual(
    generated.generatedCandidates.map(candidateProjection),
    exact.addableImprovingCandidates.slice(0, maxCandidates).map(candidateProjection),
  );
  assert.equal(generated.coverage.completePricingConclusionWithinAllocationSpace, true);
  assert.equal(generated.coverage.topCandidatesProvenWithinAllocationSpace, true);
  assert.equal(generated.coverage.truncated, false);
  assert.equal(generated.coverage.completeCatalogConstructed, false);
  assert.equal(generated.coverage.columnsGeneratedOnDemand, true);
  return { exact, generated };
}

test("R2-B simplex on-demand pricing returns the same top candidates as exact oracle", () => {
  const geometryPattern = rowGeometry(4);
  const demands = [simplexDemand("a"), simplexDemand("b")];
  const { generated } = assertMatchesExact({
    columnFamily: "multiProductSimplexColumn",
    geometryPattern,
    demands,
    columnCatalog: generateExactMultiProductSimplexColumns({ geometryPattern, demands }),
    demandShadowPrices: { a: 0.4, b: 0.1 },
    maxCandidates: 4,
  });

  assert.deepEqual(
    generated.bestImprovingCandidate.column.allocation.map(({ positionsPerSheet }) => positionsPerSheet),
    [4, 0],
  );
  assert.ok(generated.counters.materializedColumnCount < 14);
  assert.ok(generated.counters.topCandidateBoundPrunedStateCount > 0);
});

test("R2-B existing best column is skipped and the next exact candidate is found", () => {
  const geometryPattern = rowGeometry(4);
  const demands = [simplexDemand("a"), simplexDemand("b")];
  const columnCatalog = generateExactMultiProductSimplexColumns({ geometryPattern, demands });
  const first = evaluateExactPaperPricing({
    columnCatalog,
    demandShadowPrices: { a: 0.4, b: 0.1 },
  });
  const existingColumnSignatures = [first.bestImprovingCandidate.columnSignature];
  const { generated } = assertMatchesExact({
    columnFamily: "multiProductSimplexColumn",
    geometryPattern,
    demands,
    columnCatalog,
    demandShadowPrices: { a: 0.4, b: 0.1 },
    existingColumnSignatures,
    maxCandidates: 3,
  });

  assert.notEqual(generated.bestImprovingCandidate.columnSignature, existingColumnSignatures[0]);
  assert.deepEqual(
    generated.bestImprovingCandidate.column.allocation.map(({ positionsPerSheet }) => positionsPerSheet),
    [3, 1],
  );
  assert.ok(generated.counters.existingImprovingColumnCount >= 1);
});

test("R2-B proves that no improving column exists without materializing the full catalog", () => {
  const geometryPattern = rowGeometry(6);
  const demands = [simplexDemand("a"), simplexDemand("b"), simplexDemand("c")];
  const generated = generatePaperPricingColumns({
    columnFamily: "multiProductSimplexColumn",
    geometryPattern,
    demands,
    demandShadowPrices: { a: 0.1, b: 0.1, c: 0.1 },
    maxCandidates: 3,
    maxVisitedStates: 1000,
  });

  assert.equal(generated.bestImprovingCandidate, null);
  assert.equal(generated.generatedCandidates.length, 0);
  assert.equal(generated.coverage.noImprovingColumnProven, true);
  assert.equal(generated.coverage.completePricingConclusionWithinAllocationSpace, true);
  assert.equal(generated.counters.materializedColumnCount, 0);
  assert.ok(generated.counters.nonImprovingBoundPrunedStateCount > 0);
  assert.equal(generated.coverage.allocationSpaceFullyEnumerated, false);
});

test("R2-B separate-duplex pricing matches exact allocation scores", () => {
  const geometryPattern = rowGeometry(4);
  const demands = [duplexDemand("a", 0), duplexDemand("b", 2)];
  const { generated } = assertMatchesExact({
    columnFamily: "multiProductSeparateDuplexColumn",
    geometryPattern,
    demands,
    columnCatalog: generateExactMultiProductSeparateDuplexColumns({ geometryPattern, demands }),
    demandShadowPrices: { a: 0.35, b: 0.2 },
    maxCandidates: 5,
  });

  assert.equal(generated.columnStrategy, "separateFrontBackFormsCandidate");
  assert.equal(generated.bestImprovingCandidate.column.metrics.layoutFormsPerColumn, 2);
  assert.equal(generated.bestImprovingCandidate.column.metrics.colorPlatesPerColumn, 5);
  assert.equal(generated.coverage.fixedFormCostsIncluded, false);
  assert.equal(generated.coverage.fixedPlateCostsIncluded, false);
});

test("R2-B state limit returns a truncated result without a false pricing proof", () => {
  const geometryPattern = rowGeometry(8);
  const demands = [
    simplexDemand("a"),
    simplexDemand("b"),
    simplexDemand("c"),
    simplexDemand("d"),
  ];
  const generated = generatePaperPricingColumns({
    columnFamily: "multiProductSimplexColumn",
    geometryPattern,
    demands,
    demandShadowPrices: { a: 0.4, b: 0.3, c: 0.2, d: 0.1 },
    maxCandidates: 4,
    maxVisitedStates: 1,
  });

  assert.equal(generated.coverage.truncated, true);
  assert.deepEqual(generated.coverage.truncationReasons, ["stateLimit"]);
  assert.equal(generated.coverage.completePricingConclusionWithinAllocationSpace, false);
  assert.equal(generated.coverage.topCandidatesProvenWithinAllocationSpace, false);
  assert.equal(generated.coverage.noImprovingColumnProven, false);
});

test("R2-B demand order normalizes to an identical request and candidate set", () => {
  const geometryPattern = rowGeometry(4);
  const first = generatePaperPricingColumns({
    columnFamily: "multiProductSimplexColumn",
    geometryPattern,
    demands: [simplexDemand("b"), simplexDemand("a")],
    demandShadowPrices: { b: 0.1, a: 0.4 },
    maxCandidates: 4,
  });
  const second = generatePaperPricingColumns({
    columnFamily: "multiProductSimplexColumn",
    geometryPattern,
    demands: [simplexDemand("a"), simplexDemand("b")],
    demandShadowPrices: { a: 0.4, b: 0.1 },
    maxCandidates: 4,
  });

  assert.equal(first.requestSignature, second.requestSignature);
  assert.deepEqual(
    first.generatedCandidates.map(candidateProjection),
    second.generatedCandidates.map(candidateProjection),
  );
});

test("R2-B result is deeply immutable and validator rejects score corruption", () => {
  const geometryPattern = rowGeometry(4);
  const result = generatePaperPricingColumns({
    columnFamily: "multiProductSimplexColumn",
    geometryPattern,
    demands: [simplexDemand("a"), simplexDemand("b")],
    demandShadowPrices: { a: 0.4, b: 0.1 },
    maxCandidates: 3,
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.generatedCandidates), true);
  assert.equal(Object.isFrozen(result.bestImprovingCandidate), true);
  assert.equal(Object.isFrozen(result.counters), true);
  assert.equal(Object.isFrozen(result.coverage), true);

  const corrupted = {
    ...result,
    generatedCandidates: result.generatedCandidates.map((candidate, index) => index === 0
      ? { ...candidate, reducedCost: candidate.reducedCost + 1 }
      : candidate),
  };
  assert.throws(() => validatePaperPricingGeneratorResult(corrupted), /generatedCandidates mismatch/);
});
