import test from "node:test";
import assert from "node:assert/strict";
import {
  countNonEmptySimplexCandidateColumns,
  createMultiProductSimplexColumn,
  generateExactMultiProductSimplexColumns,
  validateMultiProductSimplexColumn,
} from "../src/multi-product-simplex-columns.js";
import { generateExactMultiProductSimplexPatterns } from "../src/multi-product-simplex-patterns.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function simplexDemand(id, requiredQuantity = 100, overrides = {}) {
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

function uniformGeometry(columns, rows = 1) {
  return createUniformGridPattern({
    printableArea: { widthMm: columns * 10, heightMm: rows * 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function counts(item) {
  return item.allocation.map((entry) => entry.positionsPerSheet);
}

test("P1-B exact candidate-column count includes every non-empty non-negative allocation", () => {
  assert.equal(countNonEmptySimplexCandidateColumns(4, 1), 4n);
  assert.equal(countNonEmptySimplexCandidateColumns(4, 2), 14n);
  assert.equal(countNonEmptySimplexCandidateColumns(4, 4), 69n);
  assert.equal(countNonEmptySimplexCandidateColumns(16, 2), 152n);
});

test("P1-B two-demand capacity-4 catalog contains dedicated, mixed and partial columns", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    id: "two-demand-columns",
    geometryPattern: uniformGeometry(4),
    demands: [simplexDemand("b"), simplexDemand("a")],
  });

  assert.equal(catalog.coverage.theoreticalColumnCount, "14");
  assert.equal(catalog.coverage.generatedColumnCount, 14);
  assert.equal(catalog.coverage.completeWithinRequestedSpace, true);
  assert.equal(catalog.coverage.zeroCountSubsetsIncluded, true);
  assert.equal(catalog.coverage.runLengthsEvaluated, false);
  for (const expected of ["4,0", "0,4", "2,2", "1,0", "0,1"]) {
    assert.ok(catalog.columns.find((column) => counts(column).join(",") === expected));
  }
  assert.equal(catalog.columns.some((column) => counts(column).every((count) => count === 0)), false);
});

test("P1-B positive subset exactly agrees with the all-demands P1 catalog", () => {
  const geometryPattern = uniformGeometry(4);
  const demands = [simplexDemand("a"), simplexDemand("b")];
  const columns = generateExactMultiProductSimplexColumns({
    id: "column-agreement",
    geometryPattern,
    demands,
  });
  const patterns = generateExactMultiProductSimplexPatterns({
    id: "pattern-agreement",
    geometryPattern,
    demands,
  });

  const positiveColumnAllocations = columns.columns
    .filter((column) => counts(column).every((count) => count > 0))
    .map((column) => counts(column).join(","))
    .sort();
  const patternAllocations = patterns.patterns
    .map((pattern) => counts(pattern).join(","))
    .sort();
  assert.deepEqual(positiveColumnAllocations, patternAllocations);
  assert.equal(positiveColumnAllocations.length, 6);
});

test("P1-B dedicated column materializes only its active demand and explicit blanks", () => {
  const column = createMultiProductSimplexColumn({
    id: "dedicated-a",
    geometryPattern: uniformGeometry(4),
    demands: [simplexDemand("a"), simplexDemand("b")],
    allocationCounts: [2, 0],
  });

  assert.deepEqual(column.frontCells.map((cell) => cell.demandId), ["a", "a"]);
  assert.deepEqual(column.frontCells.map((cell) => cell.sourceSlotId), [
    "uniform-grid-r0-row1-col1",
    "uniform-grid-r0-row1-col2",
  ]);
  assert.deepEqual(column.blankSlots.map((slot) => slot.slotId), [
    "uniform-grid-r0-row1-col3",
    "uniform-grid-r0-row1-col4",
  ]);
  assert.equal(column.metrics.activeDemandCount, 1);
  assert.equal(column.metrics.occupiedPositionsPerSheet, 2);
  assert.equal(column.metrics.blankPositionsPerSheet, 2);
  assert.equal(column.metrics.colorPlatesPerColumn, 4);
  assert.equal(Object.hasOwn(column, "runLength"), false);
  assert.equal(validateMultiProductSimplexColumn(column), true);
});

test("P1-B can create candidate columns when demand count exceeds one-form capacity", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    id: "more-demands-than-slots",
    geometryPattern: uniformGeometry(2),
    demands: [simplexDemand("a"), simplexDemand("b"), simplexDemand("c")],
  });

  assert.equal(catalog.coverage.theoreticalColumnCount, "9");
  assert.equal(catalog.columns.length, 9);
  assert.ok(catalog.columns.find((column) => counts(column).join(",") === "1,1,0"));
  assert.ok(catalog.columns.find((column) => counts(column).join(",") === "0,0,2"));
  assert.equal(catalog.columns.every((column) => column.metrics.occupiedPositionsPerSheet <= 2), true);
});

test("P1-B generation is deterministic regardless of demand input order", () => {
  const geometryPattern = uniformGeometry(3);
  const demands = [simplexDemand("a"), simplexDemand("b"), simplexDemand("c")];
  const first = generateExactMultiProductSimplexColumns({
    id: "deterministic-columns",
    geometryPattern,
    demands,
  });
  const second = generateExactMultiProductSimplexColumns({
    id: "deterministic-columns",
    geometryPattern,
    demands: [...demands].reverse(),
  });

  assert.deepEqual(
    first.columns.map((column) => column.columnSignature),
    second.columns.map((column) => column.columnSignature),
  );
});

test("P1-B structural identity is reusable across changed quantities", () => {
  const geometryPattern = uniformGeometry(4);
  const first = createMultiProductSimplexColumn({
    id: "first-column",
    geometryPattern,
    demands: [simplexDemand("a", 100), simplexDemand("b", 50)],
    allocationCounts: [1, 3],
  });
  const second = createMultiProductSimplexColumn({
    id: "second-column",
    geometryPattern,
    demands: [simplexDemand("a", 1000), simplexDemand("b", 500)],
    allocationCounts: [1, 3],
  });

  assert.equal(first.structuralSignature, second.structuralSignature);
  assert.equal(first.columnSignature, second.columnSignature);
});

test("P1-B outputs are deeply immutable", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    id: "immutable-columns",
    geometryPattern: uniformGeometry(3),
    demands: [simplexDemand("a"), simplexDemand("b")],
  });
  const column = catalog.columns[0];

  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.coverage), true);
  assert.equal(Object.isFrozen(catalog.columns), true);
  assert.equal(Object.isFrozen(column), true);
  assert.equal(Object.isFrozen(column.allocation), true);
  assert.equal(Object.isFrozen(column.frontCells), true);
  assert.equal(Object.isFrozen(column.blankSlots), true);
  assert.equal(Object.isFrozen(column.metrics), true);
});

test("P1-B validator rejects zero columns, corrupted cells and invented run lengths", () => {
  const geometryPattern = uniformGeometry(4);
  const demands = [simplexDemand("a"), simplexDemand("b")];
  assert.throws(() => createMultiProductSimplexColumn({
    id: "zero-column",
    geometryPattern,
    demands,
    allocationCounts: [0, 0],
  }), /must occupy at least one slot/);

  const valid = createMultiProductSimplexColumn({
    id: "valid-column",
    geometryPattern,
    demands,
    allocationCounts: [2, 1],
  });
  const corruptedCell = {
    ...valid,
    frontCells: valid.frontCells.map((cell, index) => index === 0
      ? { ...cell, page: 99 }
      : cell),
  };
  assert.throws(() => validateMultiProductSimplexColumn(corruptedCell), /frontCells\[0\] mismatch/);
  assert.throws(() => validateMultiProductSimplexColumn({
    ...valid,
    runLength: 100,
  }), /must not own a runLength/);
});

test("P1-B rejects incompatible simplex specifications and oversized exact spaces", () => {
  const geometryPattern = uniformGeometry(4);
  assert.throws(() => generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [simplexDemand("a", 100, { backPage: 2, backColorCount: 4 })],
  }), /must be simplex/);
  assert.throws(() => generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [
      simplexDemand("a", 100, { frontColorCount: 4 }),
      simplexDemand("b", 100, { frontColorCount: 1 }),
    ],
  }), /same frontColorCount/);
  assert.throws(() => generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [simplexDemand("a"), simplexDemand("a")],
  }), /duplicate demandId/);
  assert.throws(() => generateExactMultiProductSimplexColumns({
    geometryPattern: uniformGeometry(16),
    demands: [simplexDemand("a"), simplexDemand("b")],
    maxExactColumnCount: 151,
  }), /exact candidate-column space 152 exceeds/);
});
