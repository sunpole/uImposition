import test from "node:test";
import assert from "node:assert/strict";
import { createMixedStripPatternSet } from "../src/mixed-strip-patterns.js";
import {
  createSingleProductProductionPattern,
  SINGLE_PRODUCT_PRINT_STRATEGIES,
  validateSingleProductProductionPattern,
} from "../src/single-product-production-pattern.js";
import {
  createUniformGridPattern,
  createUniformGridPatternSet,
} from "../src/uniform-grid-patterns.js";

function demand(overrides = {}) {
  return {
    demandId: "job-a-pair-1",
    productId: "job-a",
    requiredQuantity: 1000,
    frontPage: 1,
    backPage: null,
    frontColorCount: 1,
    backColorCount: 0,
    ...overrides,
  };
}

test("P0 simplex uses ceil(quantity / capacity) and forbids underproduction", () => {
  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 40 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    gapMm: 0,
    rotation: 0,
  });
  const pattern = createSingleProductProductionPattern({
    id: "simplex-1000",
    geometryPattern,
    demand: demand(),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(pattern.runLength, 63);
  assert.equal(pattern.metrics.physicalSheets, 63);
  assert.equal(pattern.metrics.positionsPerSheet, 16);
  assert.equal(pattern.metrics.requiredQuantity, 1000);
  assert.equal(pattern.metrics.producedQuantity, 1008);
  assert.equal(pattern.metrics.overrun, 8);
  assert.equal(pattern.metrics.underproduction, 0);
  assert.equal(pattern.metrics.layoutForms, 1);
  assert.equal(pattern.metrics.colorPlates, 1);
  assert.equal(pattern.metrics.pressPasses, 63);
  assert.equal(pattern.frontCells.length, 16);
  assert.equal(pattern.backCells.length, 0);
  assert.equal(pattern.backTransform, null);
  assert.equal(validateSingleProductProductionPattern(pattern), true);
});

test("P0 separate duplex mirrors source slots right-to-left", () => {
  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    gapMm: 0,
    rotation: 0,
  });
  const pattern = createSingleProductProductionPattern({
    id: "duplex-row",
    geometryPattern,
    demand: demand({
      frontPage: 1,
      backPage: 2,
      frontColorCount: 1,
      backColorCount: 1,
    }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  });

  assert.deepEqual(pattern.frontCells.map(({ sourceSlotId }) => sourceSlotId), [
    "uniform-grid-r0-row1-col1",
    "uniform-grid-r0-row1-col2",
    "uniform-grid-r0-row1-col3",
    "uniform-grid-r0-row1-col4",
  ]);
  assert.deepEqual(pattern.backCells.map(({ sourceSlotId }) => sourceSlotId), [
    "uniform-grid-r0-row1-col4",
    "uniform-grid-r0-row1-col3",
    "uniform-grid-r0-row1-col2",
    "uniform-grid-r0-row1-col1",
  ]);
  assert.deepEqual(pattern.backCells.map(({ xMm }) => xMm), [0, 10, 20, 30]);
  assert.ok(pattern.backCells.every(({ page }) => page === 2));
  assert.deepEqual(pattern.backTransform, {
    type: "horizontalReflection",
    printableWidthMm: 40,
  });
  assert.equal(pattern.metrics.physicalSheets, 250);
  assert.equal(pattern.metrics.layoutForms, 2);
  assert.equal(pattern.metrics.colorPlates, 2);
  assert.equal(pattern.metrics.pressPasses, 500);
});

test("P0 4+4 separate duplex counts forms, plates and passes independently", () => {
  const geometryPattern = createUniformGridPatternSet({
    printableArea: { widthMm: 608, heightMm: 431 },
    occupiedProduct: { widthMm: 105, heightMm: 148 },
  }).best;
  const pattern = createSingleProductProductionPattern({
    id: "a6-4-plus-4",
    geometryPattern,
    demand: demand({
      frontPage: 1,
      backPage: 2,
      frontColorCount: 4,
      backColorCount: 4,
    }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  });

  assert.equal(pattern.geometryPattern.capacity, 16);
  assert.equal(pattern.runLength, 63);
  assert.equal(pattern.metrics.layoutForms, 2);
  assert.equal(pattern.metrics.colorPlates, 8);
  assert.equal(pattern.metrics.pressPasses, 126);
  assert.equal(pattern.metrics.physicalSheets, 63);
});

test("P0 technical blank back produces 4+0 without a fake back form", () => {
  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 40 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const pattern = createSingleProductProductionPattern({
    id: "odd-final-pair",
    geometryPattern,
    demand: demand({
      frontPage: 3,
      backPage: null,
      frontColorCount: 4,
      backColorCount: 0,
    }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  });

  assert.equal(pattern.technicalBlankBack, true);
  assert.equal(pattern.backCells.length, 0);
  assert.equal(pattern.metrics.activeSideCount, 1);
  assert.equal(pattern.metrics.layoutForms, 1);
  assert.equal(pattern.metrics.colorPlates, 4);
  assert.equal(pattern.metrics.pressPasses, 63);
});

test("P0 mixed geometry capacity directly reduces integer sheet count", () => {
  const mixed = createMixedStripPatternSet({
    printableArea: { widthMm: 105, heightMm: 100 },
    occupiedProduct: { widthMm: 55, heightMm: 10 },
    maxStripCount: 6,
    maxPatternCount: 2000,
  });
  const pattern = createSingleProductProductionPattern({
    id: "mixed-simplex",
    geometryPattern: mixed.best,
    demand: demand(),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(mixed.best.capacity, 15);
  assert.equal(pattern.runLength, 67);
  assert.equal(pattern.metrics.producedQuantity, 1005);
  assert.equal(pattern.metrics.overrun, 5);
  assert.equal(pattern.metrics.underproduction, 0);
  assert.equal(pattern.frontCells.length, 15);
  assert.equal(validateSingleProductProductionPattern(pattern), true);
});

test("P0 structural signature is reusable while plan signature preserves demand", () => {
  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 40 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const first = createSingleProductProductionPattern({
    id: "first",
    geometryPattern,
    demand: demand({ requiredQuantity: 1000 }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });
  const second = createSingleProductProductionPattern({
    id: "second",
    geometryPattern,
    demand: demand({
      demandId: "job-b-pair-1",
      productId: "job-b",
      requiredQuantity: 2000,
    }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(first.structuralSignature, second.structuralSignature);
  assert.notEqual(first.planSignature, second.planSignature);
});

test("P0 output is deeply immutable", () => {
  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 20, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const pattern = createSingleProductProductionPattern({
    id: "immutable",
    geometryPattern,
    demand: demand(),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  });

  assert.equal(Object.isFrozen(pattern), true);
  assert.equal(Object.isFrozen(pattern.demand), true);
  assert.equal(Object.isFrozen(pattern.frontCells), true);
  assert.equal(Object.isFrozen(pattern.frontCells[0]), true);
  assert.equal(Object.isFrozen(pattern.metrics), true);
});

test("P0 validator catches corrupted mirror geometry", () => {
  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const valid = createSingleProductProductionPattern({
    id: "valid-duplex",
    geometryPattern,
    demand: demand({ backPage: 2, backColorCount: 1 }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  });
  const corrupted = {
    ...valid,
    backCells: valid.backCells.map((cell, index) => index === 0
      ? { ...cell, xMm: cell.xMm + 1 }
      : cell),
  };

  assert.throws(() => validateSingleProductProductionPattern(corrupted), /back cell geometry mismatch/);
});

test("P0 rejects zero-capacity geometry, invalid strategy and invalid demand", () => {
  const noFitGeometry = createUniformGridPatternSet({
    printableArea: { widthMm: 50, heightMm: 50 },
    occupiedProduct: { widthMm: 60, heightMm: 70 },
  }).patterns[0];

  assert.throws(() => createSingleProductProductionPattern({
    id: "no-fit",
    geometryPattern: noFitGeometry,
    demand: demand(),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  }), /at least one slot/);

  const geometryPattern = createUniformGridPattern({
    printableArea: { widthMm: 20, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  assert.throws(() => createSingleProductProductionPattern({
    id: "bad-strategy",
    geometryPattern,
    demand: demand(),
    strategy: "perfecting",
  }), /Unsupported/);
  assert.throws(() => createSingleProductProductionPattern({
    id: "bad-simplex",
    geometryPattern,
    demand: demand({ backPage: 2, backColorCount: 1 }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  }), /blank back page/);
  assert.throws(() => createSingleProductProductionPattern({
    id: "bad-colors",
    geometryPattern,
    demand: demand({ backPage: null, backColorCount: 1 }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  }), /must be 0/);
  assert.throws(() => createSingleProductProductionPattern({
    id: "bad-quantity",
    geometryPattern,
    demand: demand({ requiredQuantity: 0 }),
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX,
  }), /positive integer/);
});
