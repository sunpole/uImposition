import test from "node:test";
import assert from "node:assert/strict";
import {
  createMultiProductSeparateDuplexColumn,
  generateExactMultiProductSeparateDuplexColumns,
  validateMultiProductSeparateDuplexColumn,
} from "../src/multi-product-duplex-columns.js";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function rowGeometry(capacity) {
  return createUniformGridPattern({
    printableArea: { widthMm: capacity * 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function duplexDemand(demandId, requiredQuantity, frontPage, backPage, overrides = {}) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage,
    backPage,
    frontColorCount: 1,
    backColorCount: 1,
    ...overrides,
  };
}

function simplexDemandFromDuplex(demand) {
  return {
    demandId: demand.demandId,
    productId: demand.productId,
    requiredQuantity: demand.requiredQuantity,
    frontPage: demand.frontPage,
    backPage: null,
    frontColorCount: demand.frontColorCount,
    backColorCount: 0,
  };
}

test("P1-C separate duplex derives the back row as 4 3 2 1", () => {
  const column = createMultiProductSeparateDuplexColumn({
    id: "duplex-2-2",
    geometryPattern: rowGeometry(4),
    demands: [
      duplexDemand("b", 1000, 3, 4),
      duplexDemand("a", 1000, 1, 2),
    ],
    allocationCounts: [2, 2],
  });

  assert.deepEqual(column.demands.map(({ demandId }) => demandId), ["a", "b"]);
  assert.deepEqual(column.frontCells.map(({ demandId, page }) => ({ demandId, page })), [
    { demandId: "a", page: 1 },
    { demandId: "a", page: 1 },
    { demandId: "b", page: 3 },
    { demandId: "b", page: 3 },
  ]);
  assert.deepEqual(column.backCells.map(({ demandId, page, xMm }) => ({ demandId, page, xMm })), [
    { demandId: "b", page: 4, xMm: 0 },
    { demandId: "b", page: 4, xMm: 10 },
    { demandId: "a", page: 2, xMm: 20 },
    { demandId: "a", page: 2, xMm: 30 },
  ]);
  assert.deepEqual(column.backTransform, {
    type: "horizontalReflection",
    printableWidthMm: 40,
  });
  assert.equal(validateMultiProductSeparateDuplexColumn(column), true);
});

test("P1-C metrics describe two forms and two passes without inventing a run length", () => {
  const column = createMultiProductSeparateDuplexColumn({
    id: "duplex-metrics",
    geometryPattern: rowGeometry(8),
    demands: [
      duplexDemand("a", 1000, 1, 2, { frontColorCount: 4, backColorCount: 1 }),
      duplexDemand("b", 500, 3, 4, { frontColorCount: 4, backColorCount: 1 }),
    ],
    allocationCounts: [5, 2],
  });

  assert.deepEqual(column.metrics, {
    geometryCapacity: 8,
    demandCount: 2,
    activeDemandCount: 2,
    occupiedPositionsPerSheet: 7,
    blankPositionsPerSide: 1,
    layoutFormsPerColumn: 2,
    colorPlatesPerColumn: 5,
    pressPassesPerSheet: 2,
  });
  assert.deepEqual(column.sharedDuplexColorModel, {
    type: "sharedEqualSeparateDuplexColorCounts",
    frontColorCount: 4,
    backColorCount: 1,
    colorPlateCount: 5,
    requiresNamedInkCompatibilityCheck: true,
  });
  assert.equal(Object.hasOwn(column, "runLength"), false);
  assert.equal(Object.hasOwn(column, "producedQuantity"), false);
  assert.equal(Object.hasOwn(column, "underproduction"), false);
});

test("P1-C dedicated, mixed and partial duplex columns remain distinct", () => {
  const geometry = rowGeometry(4);
  const demands = [
    duplexDemand("a", 1000, 1, 2),
    duplexDemand("b", 500, 3, 4),
  ];
  const dedicatedA = createMultiProductSeparateDuplexColumn({
    id: "dedicated-a",
    geometryPattern: geometry,
    demands,
    allocationCounts: [4, 0],
  });
  const dedicatedB = createMultiProductSeparateDuplexColumn({
    id: "dedicated-b",
    geometryPattern: geometry,
    demands,
    allocationCounts: [0, 4],
  });
  const mixed = createMultiProductSeparateDuplexColumn({
    id: "mixed",
    geometryPattern: geometry,
    demands,
    allocationCounts: [2, 2],
  });
  const partial = createMultiProductSeparateDuplexColumn({
    id: "partial",
    geometryPattern: geometry,
    demands,
    allocationCounts: [1, 0],
  });

  assert.equal(dedicatedA.metrics.activeDemandCount, 1);
  assert.equal(dedicatedB.metrics.activeDemandCount, 1);
  assert.equal(mixed.metrics.activeDemandCount, 2);
  assert.equal(partial.metrics.occupiedPositionsPerSheet, 1);
  assert.equal(partial.metrics.blankPositionsPerSide, 3);
  assert.equal(partial.frontBlankSlots.length, 3);
  assert.equal(partial.backBlankSlots.length, 3);
  assert.notEqual(dedicatedA.columnSignature, dedicatedB.columnSignature);
  assert.notEqual(dedicatedA.columnSignature, mixed.columnSignature);
  assert.notEqual(mixed.columnSignature, partial.columnSignature);
});

test("P1-C exact capacity 4 / two-demand catalog contains 14 columns", () => {
  const catalog = generateExactMultiProductSeparateDuplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [
      duplexDemand("a", 1000, 1, 2),
      duplexDemand("b", 500, 3, 4),
    ],
  });

  assert.equal(catalog.coverage.theoreticalColumnCount, "14");
  assert.equal(catalog.coverage.generatedColumnCount, 14);
  assert.equal(catalog.coverage.completeWithinRequestedSpace, true);
  assert.equal(catalog.coverage.truncated, false);
  assert.equal(catalog.coverage.runLengthsEvaluated, false);
  assert.equal(catalog.coverage.workAndTurnEvaluated, false);
  assert.equal(new Set(catalog.columns.map(({ columnSignature }) => columnSignature)).size, 14);
});

test("P1-C duplex and simplex candidate catalogs share the same allocation space", () => {
  const geometry = rowGeometry(4);
  const duplexDemands = [
    duplexDemand("a", 1000, 1, 2),
    duplexDemand("b", 500, 3, 4),
  ];
  const duplexCatalog = generateExactMultiProductSeparateDuplexColumns({
    geometryPattern: geometry,
    demands: duplexDemands,
  });
  const simplexCatalog = generateExactMultiProductSimplexColumns({
    geometryPattern: geometry,
    demands: duplexDemands.map(simplexDemandFromDuplex),
  });

  assert.deepEqual(
    duplexCatalog.columns.map(({ allocationSignature }) => allocationSignature).sort(),
    simplexCatalog.columns.map(({ allocationSignature }) => allocationSignature).sort(),
  );
});

test("P1-C a column may cover a subset when demand count exceeds capacity", () => {
  const catalog = generateExactMultiProductSeparateDuplexColumns({
    geometryPattern: rowGeometry(3),
    demands: [
      duplexDemand("a", 100, 1, 2),
      duplexDemand("b", 100, 3, 4),
      duplexDemand("c", 100, 5, 6),
      duplexDemand("d", 100, 7, 8),
      duplexDemand("e", 100, 9, 10),
    ],
  });

  assert.equal(catalog.coverage.theoreticalColumnCount, "55");
  assert.equal(catalog.columns.length, 55);
  assert.ok(catalog.columns.some((column) => column.metrics.activeDemandCount === 1));
  assert.ok(catalog.columns.some((column) => column.metrics.activeDemandCount === 3));
});

test("P1-C canonical identity is independent of input order and quantities", () => {
  const geometry = rowGeometry(4);
  const first = createMultiProductSeparateDuplexColumn({
    id: "first",
    geometryPattern: geometry,
    demands: [
      duplexDemand("b", 500, 3, 4),
      duplexDemand("a", 1000, 1, 2),
    ],
    allocationCounts: [2, 1],
  });
  const second = createMultiProductSeparateDuplexColumn({
    id: "second",
    geometryPattern: geometry,
    demands: [
      duplexDemand("a", 2000, 1, 2),
      duplexDemand("b", 1000, 3, 4),
    ],
    allocationCounts: [2, 1],
  });

  assert.equal(first.structuralSignature, second.structuralSignature);
  assert.equal(first.columnSignature, second.columnSignature);
  assert.deepEqual(first.frontCells, second.frontCells);
  assert.deepEqual(first.backCells, second.backCells);
});

test("P1-C rejects blank backs and incompatible color specifications", () => {
  const geometry = rowGeometry(4);
  assert.throws(() => createMultiProductSeparateDuplexColumn({
    id: "blank-back",
    geometryPattern: geometry,
    demands: [
      duplexDemand("a", 100, 1, 2),
      {
        demandId: "b",
        productId: "product-b",
        requiredQuantity: 100,
        frontPage: 3,
        backPage: null,
        frontColorCount: 1,
        backColorCount: 0,
      },
    ],
    allocationCounts: [2, 2],
  }), /backPage must be a positive integer/);

  assert.throws(() => createMultiProductSeparateDuplexColumn({
    id: "front-colors",
    geometryPattern: geometry,
    demands: [
      duplexDemand("a", 100, 1, 2, { frontColorCount: 1 }),
      duplexDemand("b", 100, 3, 4, { frontColorCount: 4 }),
    ],
    allocationCounts: [2, 2],
  }), /same frontColorCount and backColorCount/);

  assert.throws(() => createMultiProductSeparateDuplexColumn({
    id: "back-colors",
    geometryPattern: geometry,
    demands: [
      duplexDemand("a", 100, 1, 2, { backColorCount: 1 }),
      duplexDemand("b", 100, 3, 4, { backColorCount: 4 }),
    ],
    allocationCounts: [2, 2],
  }), /same frontColorCount and backColorCount/);
});

test("P1-C validator rejects a corrupted mirrored back cell", () => {
  const valid = createMultiProductSeparateDuplexColumn({
    id: "valid",
    geometryPattern: rowGeometry(4),
    demands: [
      duplexDemand("a", 100, 1, 2),
      duplexDemand("b", 100, 3, 4),
    ],
    allocationCounts: [2, 2],
  });
  const corrupted = {
    ...valid,
    backCells: valid.backCells.map((cell, index) => index === 0
      ? { ...cell, xMm: cell.xMm + 1 }
      : cell),
  };

  assert.throws(() => validateMultiProductSeparateDuplexColumn(corrupted), /backCells mismatch/);
});

test("P1-C output is deeply immutable and oversized exact spaces fail before enumeration", () => {
  const column = createMultiProductSeparateDuplexColumn({
    id: "immutable",
    geometryPattern: rowGeometry(4),
    demands: [
      duplexDemand("a", 100, 1, 2),
      duplexDemand("b", 100, 3, 4),
    ],
    allocationCounts: [2, 1],
  });

  assert.equal(Object.isFrozen(column), true);
  assert.equal(Object.isFrozen(column.demands), true);
  assert.equal(Object.isFrozen(column.allocation), true);
  assert.equal(Object.isFrozen(column.frontCells), true);
  assert.equal(Object.isFrozen(column.backCells), true);
  assert.equal(Object.isFrozen(column.metrics), true);

  assert.throws(() => generateExactMultiProductSeparateDuplexColumns({
    geometryPattern: rowGeometry(16),
    demands: Array.from({ length: 16 }, (_, index) => duplexDemand(
      `d${String(index + 1).padStart(2, "0")}`,
      100,
      index * 2 + 1,
      index * 2 + 2,
    )),
    maxExactColumnCount: 100,
  }), /exceeds maxExactColumnCount/);
});
