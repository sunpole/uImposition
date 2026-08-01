import test from "node:test";
import assert from "node:assert/strict";
import {
  createSingleProductWorkAndTurnPattern,
  validateSingleProductWorkAndTurnPattern,
} from "../src/single-product-work-and-turn-pattern.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function duplexDemand(overrides = {}) {
  return {
    demandId: "duplex-a",
    productId: "product-a",
    requiredQuantity: 1000,
    frontPage: 1,
    backPage: 2,
    frontColorCount: 4,
    backColorCount: 4,
    ...overrides,
  };
}

test("P0-B 4x4 work-and-turn keeps all 16 positions and halves forms and plates", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 40 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const pattern = createSingleProductWorkAndTurnPattern({
    id: "wat-4x4",
    geometryPattern: geometry,
    demand: duplexDemand(),
  });

  assert.equal(pattern.orbitAnalysis.pairedOrbitCount, 8);
  assert.equal(pattern.metrics.usefulPositionsPerSheet, 16);
  assert.equal(pattern.metrics.physicalSheets, 63);
  assert.equal(pattern.metrics.producedQuantity, 1008);
  assert.equal(pattern.metrics.overrun, 8);
  assert.equal(pattern.metrics.underproduction, 0);
  assert.equal(pattern.metrics.layoutForms, 1);
  assert.equal(pattern.metrics.colorPlates, 4);
  assert.equal(pattern.metrics.pressPasses, 126);
  assert.equal(pattern.separateReferenceMetrics.layoutForms, 2);
  assert.equal(pattern.separateReferenceMetrics.colorPlates, 8);
  assert.equal(pattern.separateReferenceMetrics.pressPasses, 126);
  assert.equal(pattern.metrics.paperDeltaVsSeparate, 0);
  assert.equal(pattern.metrics.layoutFormDeltaVsSeparate, -1);
  assert.equal(pattern.metrics.colorPlateDeltaVsSeparate, -4);
  assert.equal(pattern.metrics.pressPassDeltaVsSeparate, 0);
  assert.equal(pattern.commonFormCells.length, 16);
  assert.equal(pattern.finishedPositions.length, 16);
  assert.equal(validateSingleProductWorkAndTurnPattern(pattern), true);
});

test("P0-B every paired orbit places one front and one back image on the shared form", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const pattern = createSingleProductWorkAndTurnPattern({
    id: "wat-row",
    geometryPattern: geometry,
    demand: duplexDemand({ frontColorCount: 1, backColorCount: 1 }),
  });

  assert.deepEqual(pattern.commonFormCells.map(({ imageSide, sourceSlotId }) => ({
    imageSide,
    sourceSlotId,
  })), [
    { imageSide: "front", sourceSlotId: "uniform-grid-r0-row1-col1" },
    { imageSide: "front", sourceSlotId: "uniform-grid-r0-row1-col2" },
    { imageSide: "back", sourceSlotId: "uniform-grid-r0-row1-col3" },
    { imageSide: "back", sourceSlotId: "uniform-grid-r0-row1-col4" },
  ]);
  assert.deepEqual(pattern.passTwoCells.map(({ page, physicalSlotId }) => ({ page, physicalSlotId })), [
    { page: 2, physicalSlotId: "uniform-grid-r0-row1-col1" },
    { page: 2, physicalSlotId: "uniform-grid-r0-row1-col2" },
    { page: 1, physicalSlotId: "uniform-grid-r0-row1-col3" },
    { page: 1, physicalSlotId: "uniform-grid-r0-row1-col4" },
  ]);
  for (const position of pattern.finishedPositions) {
    assert.deepEqual([...position.pages].sort((a, b) => a - b), [1, 2]);
  }
});

test("P0-B asymmetric 4+1 and 1+4 shared forms use the maximum color count", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 40 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  for (const [frontColorCount, backColorCount] of [[4, 1], [1, 4]]) {
    const pattern = createSingleProductWorkAndTurnPattern({
      id: `wat-${frontColorCount}-${backColorCount}`,
      geometryPattern: geometry,
      demand: duplexDemand({ frontColorCount, backColorCount }),
    });

    assert.equal(pattern.metrics.colorPlates, 4);
    assert.equal(pattern.sharedPlateColorModel.colorPlateCount, 4);
    assert.equal(pattern.sharedPlateColorModel.type, "countOnlyMaximum");
    assert.equal(pattern.sharedPlateColorModel.requiresNamedInkCompatibilityCheck, true);
    assert.equal(pattern.separateReferenceMetrics.colorPlates, 5);
    assert.equal(pattern.metrics.colorPlateDeltaVsSeparate, -1);
  }
});

test("P0-B 3x3 horizontal turn uses 6 positions and leaves the middle column blank", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 30, heightMm: 30 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const pattern = createSingleProductWorkAndTurnPattern({
    id: "wat-3x3",
    geometryPattern: geometry,
    demand: duplexDemand(),
  });

  assert.equal(pattern.metrics.usefulPositionsPerSheet, 6);
  assert.equal(pattern.metrics.blankPositionCount, 3);
  assert.equal(pattern.metrics.fixedBlankPositionCount, 3);
  assert.equal(pattern.metrics.unmatchedBlankPositionCount, 0);
  assert.equal(pattern.runLength, 167);
  assert.equal(pattern.metrics.physicalSheets, 167);
  assert.equal(pattern.metrics.producedQuantity, 1002);
  assert.equal(pattern.metrics.overrun, 2);
  assert.equal(pattern.separateReferenceMetrics.physicalSheets, 112);
  assert.equal(pattern.metrics.paperDeltaVsSeparate, 55);
  assert.equal(pattern.metrics.layoutForms, 1);
  assert.equal(pattern.metrics.colorPlates, 4);
  assert.equal(pattern.blankSlots.length, 3);
  assert.deepEqual(pattern.blankSlots.map(({ slotId }) => slotId), [
    "uniform-grid-r0-row1-col2",
    "uniform-grid-r0-row2-col2",
    "uniform-grid-r0-row3-col2",
  ]);
});

test("P0-B structural signature is reusable while plan signature preserves quantity", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const first = createSingleProductWorkAndTurnPattern({
    id: "first",
    geometryPattern: geometry,
    demand: duplexDemand({ requiredQuantity: 1000 }),
  });
  const second = createSingleProductWorkAndTurnPattern({
    id: "second",
    geometryPattern: geometry,
    demand: duplexDemand({
      demandId: "duplex-b",
      productId: "product-b",
      requiredQuantity: 2000,
    }),
  });

  assert.equal(first.structuralSignature, second.structuralSignature);
  assert.notEqual(first.planSignature, second.planSignature);
});

test("P0-B output is deeply immutable", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const pattern = createSingleProductWorkAndTurnPattern({
    id: "immutable-wat",
    geometryPattern: geometry,
    demand: duplexDemand(),
  });

  assert.equal(Object.isFrozen(pattern), true);
  assert.equal(Object.isFrozen(pattern.orbitAnalysis), true);
  assert.equal(Object.isFrozen(pattern.commonFormCells), true);
  assert.equal(Object.isFrozen(pattern.passTwoCells), true);
  assert.equal(Object.isFrozen(pattern.finishedPositions), true);
  assert.equal(Object.isFrozen(pattern.metrics), true);
  assert.equal(Object.isFrozen(pattern.sharedPlateColorModel), true);
});

test("P0-B validator rejects corrupted shared-form and pass-two geometry", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const valid = createSingleProductWorkAndTurnPattern({
    id: "valid-wat",
    geometryPattern: geometry,
    demand: duplexDemand(),
  });
  const corruptedCommon = {
    ...valid,
    commonFormCells: valid.commonFormCells.map((cell, index) => index === 0
      ? { ...cell, page: 99 }
      : cell),
  };
  assert.throws(() => validateSingleProductWorkAndTurnPattern(corruptedCommon), /front image/);

  const corruptedPassTwo = {
    ...valid,
    passTwoCells: valid.passTwoCells.map((cell, index) => index === 0
      ? { ...cell, xMm: cell.xMm + 1 }
      : cell),
  };
  assert.throws(() => validateSingleProductWorkAndTurnPattern(corruptedPassTwo), /pass-two transform mismatch/);
});

test("P0-B rejects blank backs and geometry without paired orbits", () => {
  const pairedGeometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  assert.throws(() => createSingleProductWorkAndTurnPattern({
    id: "blank-back",
    geometryPattern: pairedGeometry,
    demand: duplexDemand({ backPage: null, backColorCount: 0 }),
  }), /printed back page/);

  const fixedOnlyGeometry = createUniformGridPattern({
    printableArea: { widthMm: 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  assert.throws(() => createSingleProductWorkAndTurnPattern({
    id: "fixed-only",
    geometryPattern: fixedOnlyGeometry,
    demand: duplexDemand(),
  }), /no usable horizontal reflection orbit/);
});