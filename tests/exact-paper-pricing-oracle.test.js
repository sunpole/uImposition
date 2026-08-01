import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateExactPaperPricing,
  validateExactPaperPricingOracleResult,
} from "../src/exact-paper-pricing-oracle.js";
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

function allocationVector(candidate) {
  return candidate.column.allocation.map(({ positionsPerSheet }) => positionsPerSheet);
}

function simplexCatalog() {
  return generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
}

test("R2-A symmetric shadow prices identify every full four-position column as improving", () => {
  const result = evaluateExactPaperPricing({
    columnCatalog: simplexCatalog(),
    demandShadowPrices: { a: 0.3, b: 0.3 },
  });

  assert.equal(result.evaluatedCandidates.length, 14);
  assert.equal(result.improvingCandidates.length, 5);
  assert.equal(result.addableImprovingCandidates.length, 5);
  assert.ok(result.improvingCandidates.every((candidate) => (
    candidate.occupiedPositionsPerSheet === 4
    && Math.abs(candidate.reducedCost + 0.2) < 1e-12
  )));
  assert.equal(result.bestImprovingCandidate.improving, true);
  assert.equal(result.coverage.completeWithinSuppliedCatalog, true);
  assert.equal(result.coverage.columnsGeneratedOnDemand, false);
  assert.equal(result.coverage.globalCompletenessClaimed, false);
  assert.equal(validateExactPaperPricingOracleResult(result), true);
});

test("R2-A asymmetric shadow prices prefer the dedicated high-value demand column", () => {
  const result = evaluateExactPaperPricing({
    columnCatalog: simplexCatalog(),
    demandShadowPrices: { a: 0.4, b: 0.1 },
  });

  assert.deepEqual(allocationVector(result.bestImprovingCandidate), [4, 0]);
  assert.equal(result.bestImprovingCandidate.coverageCredit, 1.6);
  assert.ok(Math.abs(result.bestImprovingCandidate.reducedCost + 0.6) < 1e-12);
  const balanced = result.evaluatedCandidates.find((candidate) => (
    JSON.stringify(allocationVector(candidate)) === JSON.stringify([2, 2])
  ));
  assert.equal(balanced.reducedCost, 0);
  assert.equal(balanced.improving, false);
});

test("R2-A existing improving columns remain visible but are not offered for addition", () => {
  const first = evaluateExactPaperPricing({
    columnCatalog: simplexCatalog(),
    demandShadowPrices: { a: 0.4, b: 0.1 },
  });
  const existingSignature = first.bestImprovingCandidate.columnSignature;
  const second = evaluateExactPaperPricing({
    columnCatalog: simplexCatalog(),
    demandShadowPrices: { a: 0.4, b: 0.1 },
    existingColumnSignatures: [existingSignature],
  });

  const existing = second.improvingCandidates.find(({ columnSignature }) => (
    columnSignature === existingSignature
  ));
  assert.equal(existing.existing, true);
  assert.equal(existing.eligibleForAddition, false);
  assert.notEqual(second.bestImprovingCandidate.columnSignature, existingSignature);
  assert.deepEqual(allocationVector(second.bestImprovingCandidate), [3, 1]);
});

test("R2-A no candidate is improving when all coverage credits stay below sheet cost", () => {
  const result = evaluateExactPaperPricing({
    columnCatalog: simplexCatalog(),
    demandShadowPrices: { a: 0.1, b: 0.1 },
  });

  assert.equal(result.improvingCandidates.length, 0);
  assert.equal(result.addableImprovingCandidates.length, 0);
  assert.equal(result.bestImprovingCandidate, null);
});

test("R2-A custom sheet unit cost changes the improvement threshold", () => {
  const result = evaluateExactPaperPricing({
    columnCatalog: simplexCatalog(),
    demandShadowPrices: { a: 0.3, b: 0.3 },
    sheetUnitCost: 2,
  });

  assert.equal(result.improvingCandidates.length, 0);
  assert.equal(result.bestImprovingCandidate, null);
  assert.equal(result.sheetUnitCost, 2);
});

test("R2-A simplex and separate duplex score identical allocation vectors equally", () => {
  const geometryPattern = rowGeometry(4);
  const simplex = evaluateExactPaperPricing({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern,
      demands: [simplexDemand("a"), simplexDemand("b")],
    }),
    demandShadowPrices: { a: 0.4, b: 0.1 },
  });
  const duplex = evaluateExactPaperPricing({
    columnCatalog: generateExactMultiProductSeparateDuplexColumns({
      geometryPattern,
      demands: [duplexDemand("a", 0), duplexDemand("b", 2)],
    }),
    demandShadowPrices: { a: 0.4, b: 0.1 },
  });

  assert.deepEqual(allocationVector(simplex.bestImprovingCandidate), [4, 0]);
  assert.deepEqual(allocationVector(duplex.bestImprovingCandidate), [4, 0]);
  assert.equal(
    simplex.bestImprovingCandidate.reducedCost,
    duplex.bestImprovingCandidate.reducedCost,
  );
  assert.equal(simplex.columnFamily, "multiProductSimplexColumn");
  assert.equal(duplex.columnFamily, "multiProductSeparateDuplexColumn");
  assert.equal(duplex.coverage.fixedFormCostsIncluded, false);
  assert.equal(duplex.coverage.fixedPlateCostsIncluded, false);
});

test("R2-A demand input order normalizes to the same pricing request and result", () => {
  const geometryPattern = rowGeometry(4);
  const first = evaluateExactPaperPricing({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern,
      demands: [simplexDemand("b"), simplexDemand("a")],
    }),
    demandShadowPrices: { b: 0.1, a: 0.4 },
  });
  const second = evaluateExactPaperPricing({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern,
      demands: [simplexDemand("a"), simplexDemand("b")],
    }),
    demandShadowPrices: { a: 0.4, b: 0.1 },
  });

  assert.equal(first.requestSignature, second.requestSignature);
  assert.equal(
    first.bestImprovingCandidate.columnSignature,
    second.bestImprovingCandidate.columnSignature,
  );
  assert.deepEqual(first.evaluatedCandidates, second.evaluatedCandidates);
});

test("R2-A rejects incomplete catalogs, invalid shadow prices and unknown existing columns", () => {
  const catalog = simplexCatalog();
  assert.throws(() => evaluateExactPaperPricing({
    columnCatalog: {
      ...catalog,
      coverage: {
        ...catalog.coverage,
        completeWithinRequestedSpace: false,
        truncated: true,
      },
    },
    demandShadowPrices: { a: 0.4, b: 0.1 },
  }), /complete non-truncated/);

  assert.throws(() => evaluateExactPaperPricing({
    columnCatalog: catalog,
    demandShadowPrices: { a: -0.1, b: 0.1 },
  }), /finite non-negative/);

  assert.throws(() => evaluateExactPaperPricing({
    columnCatalog: catalog,
    demandShadowPrices: { a: 0.4, b: 0.1 },
    existingColumnSignatures: ["unknown-column"],
  }), /not part of the supplied catalog/);
});

test("R2-A output is deeply immutable and validator rejects a corrupted score", () => {
  const result = evaluateExactPaperPricing({
    columnCatalog: simplexCatalog(),
    demandShadowPrices: { a: 0.4, b: 0.1 },
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.evaluatedCandidates), true);
  assert.equal(Object.isFrozen(result.bestImprovingCandidate), true);
  assert.equal(Object.isFrozen(result.demandShadowPrices), true);
  assert.equal(Object.isFrozen(result.coverage), true);

  const corrupted = {
    ...result,
    evaluatedCandidates: result.evaluatedCandidates.map((candidate, index) => index === 0
      ? { ...candidate, reducedCost: candidate.reducedCost + 1 }
      : candidate),
  };
  assert.throws(() => validateExactPaperPricingOracleResult(corrupted), /evaluatedCandidates mismatch/);
});
