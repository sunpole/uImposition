import test from "node:test";
import assert from "node:assert/strict";
import {
  countPositiveSingleFormAllocations,
  createMultiProductSimplexPattern,
  generateExactMultiProductSimplexPatterns,
  validateMultiProductSimplexPattern,
} from "../src/multi-product-simplex-patterns.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function simplexDemand(id, requiredQuantity, overrides = {}) {
  return {
    demandId: id,
    productId: `product-${id}`,
    requiredQuantity,
    frontPage: 1,
    backPage: null,
    frontColorCount: 4,
    backColorCount: 0,
    ...overrides,
  };
}

function uniformGeometry(columns, rows) {
  return createUniformGridPattern({
    printableArea: { widthMm: columns * 10, heightMm: rows * 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function allocationCounts(pattern) {
  return pattern.allocation.map((entry) => entry.positionsPerSheet);
}

test("P1 positive allocation count uses the exact combinations formula", () => {
  assert.equal(countPositiveSingleFormAllocations(16, 1), 16n);
  assert.equal(countPositiveSingleFormAllocations(16, 2), 120n);
  assert.equal(countPositiveSingleFormAllocations(16, 4), 1820n);
  assert.equal(countPositiveSingleFormAllocations(4, 5), 0n);
});

test("P1 two equal quantities find the exact 8+8 allocation on a 16-position form", () => {
  const catalog = generateExactMultiProductSimplexPatterns({
    id: "equal-two",
    geometryPattern: uniformGeometry(4, 4),
    demands: [
      simplexDemand("b", 1000),
      simplexDemand("a", 1000),
    ],
  });

  assert.equal(catalog.coverage.theoreticalAllocationCount, "120");
  assert.equal(catalog.coverage.generatedAllocationCount, 120);
  assert.equal(catalog.coverage.completeWithinRequestedSpace, true);
  assert.equal(catalog.coverage.truncated, false);
  const balanced = catalog.patterns.find((pattern) => allocationCounts(pattern).join(",") === "8,8");
  assert.ok(balanced);
  assert.equal(balanced.runLength, 125);
  assert.equal(balanced.metrics.physicalSheets, 125);
  assert.equal(balanced.metrics.occupiedPositionsPerSheet, 16);
  assert.equal(balanced.metrics.blankPositionsPerSheet, 0);
  assert.equal(balanced.metrics.overrun, 0);
  assert.equal(balanced.metrics.underproduction, 0);
  assert.equal(catalog.bestPhysicalSheetsPatternId, balanced.id);
});

test("P1 two different quantities find the exact 12+4 zero-overrun allocation", () => {
  const catalog = generateExactMultiProductSimplexPatterns({
    id: "different-two",
    geometryPattern: uniformGeometry(4, 4),
    demands: [
      simplexDemand("a", 1200),
      simplexDemand("b", 400),
    ],
  });

  const best = catalog.patterns[0];
  assert.deepEqual(allocationCounts(best), [12, 4]);
  assert.equal(best.runLength, 100);
  assert.deepEqual(best.demandMetrics.map((metric) => metric.producedQuantity), [1200, 400]);
  assert.equal(best.metrics.overrun, 0);
  assert.equal(best.metrics.underproduction, 0);
});

test("P1 four equal quantities retain the exact 4+4+4+4 form", () => {
  const catalog = generateExactMultiProductSimplexPatterns({
    id: "equal-four",
    geometryPattern: uniformGeometry(4, 4),
    demands: ["a", "b", "c", "d"].map((id) => simplexDemand(id, 100)),
  });

  assert.equal(catalog.patterns.length, 1820);
  const balanced = catalog.patterns.find((pattern) => allocationCounts(pattern).join(",") === "4,4,4,4");
  assert.ok(balanced);
  assert.equal(balanced.runLength, 25);
  assert.equal(balanced.metrics.physicalSheets, 25);
  assert.equal(balanced.metrics.overrun, 0);
  assert.equal(catalog.bestPhysicalSheetsPatternId, balanced.id);
});

test("P1 four different quantities enumerate the exact 4+3+2+1 composition", () => {
  const catalog = generateExactMultiProductSimplexPatterns({
    id: "different-four",
    geometryPattern: uniformGeometry(5, 2),
    demands: [
      simplexDemand("a", 400),
      simplexDemand("b", 300),
      simplexDemand("c", 200),
      simplexDemand("d", 100),
    ],
  });

  assert.equal(catalog.coverage.theoreticalAllocationCount, "210");
  const exact = catalog.patterns.find((pattern) => allocationCounts(pattern).join(",") === "4,3,2,1");
  assert.ok(exact);
  assert.equal(exact.runLength, 100);
  assert.equal(exact.metrics.overrun, 0);
  assert.equal(catalog.bestPhysicalSheetsPatternId, exact.id);
});

test("P1 supports every demand count from one through geometry capacity", () => {
  const geometryPattern = uniformGeometry(4, 1);
  const expectedCounts = [4, 6, 4, 1];
  for (let demandCount = 1; demandCount <= geometryPattern.capacity; demandCount += 1) {
    const demands = Array.from({ length: demandCount }, (_, index) => simplexDemand(
      String.fromCharCode(97 + index),
      20,
    ));
    const catalog = generateExactMultiProductSimplexPatterns({
      id: `demand-count-${demandCount}`,
      geometryPattern,
      demands,
    });
    assert.equal(catalog.patterns.length, expectedCounts[demandCount - 1]);
    assert.equal(catalog.patterns.every((pattern) => pattern.metrics.underproduction === 0), true);
    assert.equal(catalog.patterns.every(validateMultiProductSimplexPattern), true);
  }
});

test("P1 explicit partial form keeps deterministic cells and blank slots", () => {
  const pattern = createMultiProductSimplexPattern({
    id: "partial-form",
    geometryPattern: uniformGeometry(4, 1),
    demands: [
      simplexDemand("b", 10),
      simplexDemand("a", 10),
    ],
    allocationCounts: [1, 1],
  });

  assert.deepEqual(pattern.demands.map((demand) => demand.demandId), ["a", "b"]);
  assert.deepEqual(pattern.frontCells.map((cell) => cell.demandId), ["a", "b"]);
  assert.deepEqual(pattern.frontCells.map((cell) => cell.sourceSlotId), [
    "uniform-grid-r0-row1-col1",
    "uniform-grid-r0-row1-col2",
  ]);
  assert.deepEqual(pattern.blankSlots.map((slot) => slot.slotId), [
    "uniform-grid-r0-row1-col3",
    "uniform-grid-r0-row1-col4",
  ]);
  assert.equal(pattern.metrics.blankPositionsPerSheet, 2);
  assert.equal(pattern.metrics.colorPlates, 4);
  assert.equal(pattern.sharedFrontColorModel.requiresNamedInkCompatibilityCheck, true);
});

test("P1 generation is deterministic regardless of demand input order", () => {
  const geometryPattern = uniformGeometry(4, 2);
  const demands = [
    simplexDemand("a", 300),
    simplexDemand("b", 200),
    simplexDemand("c", 100),
  ];
  const first = generateExactMultiProductSimplexPatterns({
    id: "deterministic",
    geometryPattern,
    demands,
  });
  const second = generateExactMultiProductSimplexPatterns({
    id: "deterministic",
    geometryPattern,
    demands: [...demands].reverse(),
  });

  assert.deepEqual(
    first.patterns.map((pattern) => pattern.planSignature),
    second.patterns.map((pattern) => pattern.planSignature),
  );
  assert.equal(first.bestPhysicalSheetsPatternId, second.bestPhysicalSheetsPatternId);
});

test("P1 structural identity is reusable while plan identity preserves quantities", () => {
  const geometryPattern = uniformGeometry(4, 1);
  const first = createMultiProductSimplexPattern({
    id: "first",
    geometryPattern,
    demands: [simplexDemand("a", 100), simplexDemand("b", 50)],
    allocationCounts: [2, 2],
  });
  const second = createMultiProductSimplexPattern({
    id: "second",
    geometryPattern,
    demands: [simplexDemand("a", 200), simplexDemand("b", 100)],
    allocationCounts: [2, 2],
  });

  assert.equal(first.structuralSignature, second.structuralSignature);
  assert.notEqual(first.planSignature, second.planSignature);
});

test("P1 outputs are deeply immutable", () => {
  const catalog = generateExactMultiProductSimplexPatterns({
    id: "immutable",
    geometryPattern: uniformGeometry(3, 2),
    demands: [simplexDemand("a", 100), simplexDemand("b", 100)],
  });
  const pattern = catalog.patterns[0];

  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.coverage), true);
  assert.equal(Object.isFrozen(catalog.patterns), true);
  assert.equal(Object.isFrozen(pattern), true);
  assert.equal(Object.isFrozen(pattern.frontCells), true);
  assert.equal(Object.isFrozen(pattern.blankSlots), true);
  assert.equal(Object.isFrozen(pattern.demandMetrics), true);
  assert.equal(Object.isFrozen(pattern.metrics), true);
});

test("P1 validator rejects corrupted allocations, cells and run length", () => {
  const valid = createMultiProductSimplexPattern({
    id: "valid",
    geometryPattern: uniformGeometry(4, 1),
    demands: [simplexDemand("a", 100), simplexDemand("b", 100)],
    allocationCounts: [2, 2],
  });
  const corruptedAllocation = {
    ...valid,
    allocation: valid.allocation.map((entry, index) => index === 0
      ? { ...entry, positionsPerSheet: 3 }
      : entry),
  };
  assert.throws(() => validateMultiProductSimplexPattern(corruptedAllocation), /exceed geometry capacity/);

  const corruptedCell = {
    ...valid,
    frontCells: valid.frontCells.map((cell, index) => index === 0
      ? { ...cell, page: 99 }
      : cell),
  };
  assert.throws(() => validateMultiProductSimplexPattern(corruptedCell), /frontCells\[0\] mismatch/);

  assert.throws(() => validateMultiProductSimplexPattern({
    ...valid,
    runLength: valid.runLength + 1,
  }), /runLength mismatch/);
});

test("P1 rejects unsupported demand spaces and oversized exact enumeration", () => {
  const geometryPattern = uniformGeometry(4, 1);
  assert.throws(() => generateExactMultiProductSimplexPatterns({
    geometryPattern,
    demands: [simplexDemand("a", 100, { backPage: 2, backColorCount: 4 })],
  }), /must be simplex/);

  assert.throws(() => generateExactMultiProductSimplexPatterns({
    geometryPattern,
    demands: [
      simplexDemand("a", 100, { frontColorCount: 4 }),
      simplexDemand("b", 100, { frontColorCount: 1 }),
    ],
  }), /same frontColorCount/);

  assert.throws(() => generateExactMultiProductSimplexPatterns({
    geometryPattern,
    demands: [simplexDemand("a", 100), simplexDemand("a", 200)],
  }), /duplicate demandId/);

  assert.throws(() => generateExactMultiProductSimplexPatterns({
    geometryPattern,
    demands: ["a", "b", "c", "d", "e"].map((id) => simplexDemand(id, 100)),
  }), /demand count exceeds geometry capacity/);

  assert.throws(() => generateExactMultiProductSimplexPatterns({
    geometryPattern: uniformGeometry(4, 4),
    demands: [simplexDemand("a", 100), simplexDemand("b", 100)],
    maxExactAllocationCount: 100,
  }), /exact allocation space 120 exceeds/);
});
