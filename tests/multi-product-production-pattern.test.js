import test from "node:test";
import assert from "node:assert/strict";
import {
  MULTI_PRODUCT_PRINT_STRATEGIES,
  countMultiProductAllocations,
  createMultiProductProductionPattern,
  enumerateMultiProductProductionPatterns,
  validateMultiProductProductionPattern,
} from "../src/multi-product-production-pattern.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function rowGeometry(capacity) {
  return createUniformGridPattern({
    printableArea: { widthMm: capacity * 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function simplexDemand(demandId, requiredQuantity, overrides = {}) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: 1,
    backPage: null,
    frontColorCount: 1,
    backColorCount: 0,
    ...overrides,
  };
}

function duplexDemand(demandId, requiredQuantity, pageOffset, overrides = {}) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: pageOffset + 1,
    backPage: pageOffset + 2,
    frontColorCount: 1,
    backColorCount: 1,
    ...overrides,
  };
}

test("P1 two equal duplex demands use an exact 8+8 allocation on a 16-position form", () => {
  const geometry = rowGeometry(16);
  const pattern = createMultiProductProductionPattern({
    id: "equal-8-8",
    geometryPattern: geometry,
    demands: [
      duplexDemand("b", 1000, 2),
      duplexDemand("a", 1000, 0),
    ],
    allocation: { b: 8, a: 8 },
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  });

  assert.deepEqual(pattern.demands.map(({ demandId }) => demandId), ["a", "b"]);
  assert.equal(pattern.runLength, 125);
  assert.equal(pattern.metrics.physicalSheets, 125);
  assert.equal(pattern.metrics.usedPositionsPerSheet, 16);
  assert.equal(pattern.metrics.blankPositionsPerSheet, 0);
  assert.equal(pattern.metrics.layoutForms, 2);
  assert.equal(pattern.metrics.colorPlates, 2);
  assert.equal(pattern.metrics.pressPasses, 250);
  assert.equal(pattern.metrics.totalOverrun, 0);
  assert.equal(pattern.metrics.totalUnderproduction, 0);
  assert.deepEqual(pattern.frontCells.map(({ demandId }) => demandId), [
    ...new Array(8).fill("a"),
    ...new Array(8).fill("b"),
  ]);
  assert.deepEqual(pattern.backCells.map(({ demandId }) => demandId), [
    ...new Array(8).fill("b"),
    ...new Array(8).fill("a"),
  ]);
  assert.equal(validateMultiProductProductionPattern(pattern), true);
});

test("P1 exact allocation catalog proves 8+8 as the best equal-quantity allocation", () => {
  const catalog = enumerateMultiProductProductionPatterns({
    idPrefix: "equal",
    geometryPattern: rowGeometry(16),
    demands: [
      simplexDemand("a", 1000),
      simplexDemand("b", 1000),
    ],
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(catalog.coverage.theoreticalAllocationCount, 120);
  assert.equal(catalog.coverage.generatedAllocationCount, 120);
  assert.equal(catalog.coverage.completeWithinRequestedSpace, true);
  assert.equal(catalog.coverage.truncated, false);
  assert.ok(catalog.provenBestPattern);
  assert.deepEqual(catalog.provenBestPattern.allocation.positionCountByDemand, { a: 8, b: 8 });
  assert.equal(catalog.provenBestPattern.runLength, 125);
  assert.equal(catalog.provenBestPattern.metrics.totalOverrun, 0);
});

test("P1 different quantities can leave one slot blank to produce exact 10+5 output", () => {
  const catalog = enumerateMultiProductProductionPatterns({
    idPrefix: "different",
    geometryPattern: rowGeometry(16),
    demands: [
      simplexDemand("a", 1000),
      simplexDemand("b", 500),
    ],
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  const best = catalog.provenBestPattern;
  assert.deepEqual(best.allocation.positionCountByDemand, { a: 10, b: 5 });
  assert.equal(best.runLength, 100);
  assert.equal(best.metrics.physicalSheets, 100);
  assert.equal(best.metrics.usedPositionsPerSheet, 15);
  assert.equal(best.metrics.blankPositionsPerSheet, 1);
  assert.equal(best.metrics.totalOverrun, 0);
  assert.deepEqual(best.metrics.demandMetrics.map(({ producedQuantity }) => producedQuantity), [1000, 500]);
});

test("P1 four equal quantities prove the 4+4+4+4 allocation", () => {
  const catalog = enumerateMultiProductProductionPatterns({
    idPrefix: "four-equal",
    geometryPattern: rowGeometry(16),
    demands: ["a", "b", "c", "d"].map((id) => simplexDemand(id, 1000)),
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(catalog.coverage.theoreticalAllocationCount, 1820);
  assert.equal(catalog.coverage.completeWithinRequestedSpace, true);
  assert.deepEqual(catalog.provenBestPattern.allocation.positionCountByDemand, {
    a: 4,
    b: 4,
    c: 4,
    d: 4,
  });
  assert.equal(catalog.provenBestPattern.runLength, 250);
  assert.equal(catalog.provenBestPattern.metrics.totalOverrun, 0);
});

test("P1 four proportional quantities prove a 4+3+2+1 allocation", () => {
  const catalog = enumerateMultiProductProductionPatterns({
    idPrefix: "four-proportional",
    geometryPattern: rowGeometry(10),
    demands: [
      simplexDemand("a", 400),
      simplexDemand("b", 300),
      simplexDemand("c", 200),
      simplexDemand("d", 100),
    ],
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(catalog.coverage.theoreticalAllocationCount, 210);
  assert.deepEqual(catalog.provenBestPattern.allocation.positionCountByDemand, {
    a: 4,
    b: 3,
    c: 2,
    d: 1,
  });
  assert.equal(catalog.provenBestPattern.runLength, 100);
  assert.equal(catalog.provenBestPattern.metrics.totalOverrun, 0);
});

test("P1 supports one demand per slot when demand count equals capacity", () => {
  const catalog = enumerateMultiProductProductionPatterns({
    geometryPattern: rowGeometry(4),
    demands: ["a", "b", "c", "d"].map((id) => simplexDemand(id, 100)),
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(catalog.coverage.theoreticalAllocationCount, 1);
  assert.deepEqual(catalog.provenBestPattern.allocation.positionCountByDemand, {
    a: 1,
    b: 1,
    c: 1,
    d: 1,
  });
  assert.equal(catalog.provenBestPattern.runLength, 100);
});

test("P1 allocation counting distinguishes partial and fully occupied forms", () => {
  assert.equal(countMultiProductAllocations({
    capacity: 16,
    demandCount: 2,
    allowUnusedPositions: true,
  }), 120n);
  assert.equal(countMultiProductAllocations({
    capacity: 16,
    demandCount: 2,
    allowUnusedPositions: false,
  }), 15n);
  assert.equal(countMultiProductAllocations({
    capacity: 3,
    demandCount: 4,
  }), 0n);
});

test("P1 truncated catalogs expose a best-known result but no proven best", () => {
  const catalog = enumerateMultiProductProductionPatterns({
    geometryPattern: rowGeometry(16),
    demands: [
      simplexDemand("a", 1000),
      simplexDemand("b", 500),
    ],
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
    maxAllocationCount: 5,
  });

  assert.equal(catalog.patterns.length, 5);
  assert.equal(catalog.coverage.completeWithinRequestedSpace, false);
  assert.equal(catalog.coverage.truncated, true);
  assert.deepEqual(catalog.coverage.truncationReasons, ["allocationLimit"]);
  assert.ok(catalog.bestKnownPattern);
  assert.equal(catalog.provenBestPattern, null);
  assert.equal(catalog.coverage.generalPlacementCompletenessClaimed, false);
});

test("P1 rejects incompatible side and color profiles instead of silently combining them", () => {
  const geometry = rowGeometry(8);
  assert.throws(() => createMultiProductProductionPattern({
    id: "simplex-colors",
    geometryPattern: geometry,
    demands: [
      simplexDemand("a", 100, { frontColorCount: 1 }),
      simplexDemand("b", 100, { frontColorCount: 4 }),
    ],
    allocation: { a: 4, b: 4 },
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  }), /same front color count/);

  assert.throws(() => createMultiProductProductionPattern({
    id: "duplex-colors",
    geometryPattern: geometry,
    demands: [
      duplexDemand("a", 100, 0, { backColorCount: 1 }),
      duplexDemand("b", 100, 2, { backColorCount: 4 }),
    ],
    allocation: { a: 4, b: 4 },
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  }), /same front and back color counts/);

  assert.throws(() => createMultiProductProductionPattern({
    id: "duplex-blank",
    geometryPattern: geometry,
    demands: [
      duplexDemand("a", 100, 0),
      simplexDemand("b", 100),
    ],
    allocation: { a: 4, b: 4 },
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  }), /every back page to print/);
});

test("P1 normalization is independent of input and allocation key order", () => {
  const geometry = rowGeometry(8);
  const first = createMultiProductProductionPattern({
    id: "first",
    geometryPattern: geometry,
    demands: [simplexDemand("b", 400), simplexDemand("a", 200)],
    allocation: { b: 4, a: 2 },
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });
  const second = createMultiProductProductionPattern({
    id: "second",
    geometryPattern: geometry,
    demands: [simplexDemand("a", 200), simplexDemand("b", 400)],
    allocation: { a: 2, b: 4 },
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(first.planSignature, second.planSignature);
  assert.deepEqual(first.slotAssignments, second.slotAssignments);
  assert.deepEqual(first.metrics, second.metrics);
});

test("P1 output is deeply immutable and validator detects corrupted assignment data", () => {
  const pattern = createMultiProductProductionPattern({
    id: "immutable",
    geometryPattern: rowGeometry(8),
    demands: [simplexDemand("a", 200), simplexDemand("b", 400)],
    allocation: { a: 2, b: 4 },
    strategy: MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(Object.isFrozen(pattern), true);
  assert.equal(Object.isFrozen(pattern.demands), true);
  assert.equal(Object.isFrozen(pattern.allocation), true);
  assert.equal(Object.isFrozen(pattern.slotAssignments), true);
  assert.equal(Object.isFrozen(pattern.metrics), true);
  assert.equal(Object.isFrozen(pattern.metrics.demandMetrics), true);

  const corrupted = {
    ...pattern,
    slotAssignments: pattern.slotAssignments.map((assignment, index) => index === 0
      ? { ...assignment, demandId: "b" }
      : assignment),
  };
  assert.throws(() => validateMultiProductProductionPattern(corrupted), /canonical demand blocks/);
});
