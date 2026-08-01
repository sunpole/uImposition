import test from "node:test";
import assert from "node:assert/strict";
import {
  compareCurrentPlacementWithPatternSet,
  createCurrentUniformGeometryPatterns,
  createCurrentUniformGeometryPatternsFromSheet,
} from "../src/current-uniform-geometry-adapter.js";
import { calculatePlacementOptions } from "../src/geometry.js";
import { createUniformGridPatternSet } from "../src/uniform-grid-patterns.js";

const limits = {
  minDimensionMm: 1,
  maxDimensionMm: 2000,
  minTrimMm: 0,
  maxTrimMm: 50,
  minPressMarginMm: 0,
  maxPressMarginMm: 100,
  minProductDimensionMm: 1,
  maxProductDimensionMm: 1000,
  minBleedMm: 0,
  maxBleedMm: 20,
  minGapMm: 0,
  maxGapMm: 100,
};

const beforeTrimSheet = {
  width: 620,
  height: 450,
  sizeStage: "beforeTrim",
  trim: {
    enabled: true,
    sides: { left: 2, right: 2, top: 2, bottom: 2 },
  },
  pressMargins: { left: 4, right: 4, top: 2, bottom: 13 },
};

const a6Portrait = {
  width: 105,
  height: 148,
  bleed: 0,
  spacingMode: "commonCut",
  gap: 0,
};

test("G0-B maps current sheet geometry into exact printable coordinates", () => {
  const result = createCurrentUniformGeometryPatternsFromSheet({
    sheet: beforeTrimSheet,
    product: a6Portrait,
    limits,
  });

  assert.deepEqual(result.sheetGeometry.source, { widthMm: 620, heightMm: 450 });
  assert.deepEqual(result.sheetGeometry.trimmed, { widthMm: 616, heightMm: 446 });
  assert.deepEqual(result.sheetGeometry.printable, { widthMm: 608, heightMm: 431 });
  assert.deepEqual(result.sheetGeometry.coordinateSpace, {
    units: "mm",
    slotOrigin: "printableAreaTopLeft",
    printableOffsetOnTrimmedSheet: { xMm: 4, yMm: 2 },
    printableOffsetOnSourceSheet: { xMm: 6, yMm: 4 },
  });
  assert.equal(result.patternSet.best.rotation, 90);
  assert.equal(result.patternSet.best.capacity, 16);
  assert.deepEqual(result.patternSet.best.slots[0], {
    id: "uniform-grid-r90-row1-col1",
    xMm: 0,
    yMm: 0,
    widthMm: 148,
    heightMm: 105,
    rotation: 90,
    row: 0,
    column: 0,
  });
  assert.equal(result.agreement.matched, true);
});

test("G0-B after-trim sheets do not add trim to the source coordinate offset", () => {
  const result = createCurrentUniformGeometryPatternsFromSheet({
    sheet: {
      width: 616,
      height: 446,
      sizeStage: "afterTrim",
      trim: {
        enabled: true,
        sides: { left: 2, right: 2, top: 2, bottom: 2 },
      },
      pressMargins: { left: 4, right: 4, top: 2, bottom: 13 },
    },
    product: a6Portrait,
    limits,
  });

  assert.equal(result.sheetGeometry.trimApplied, false);
  assert.deepEqual(result.sheetGeometry.coordinateSpace.printableOffsetOnSourceSheet, { xMm: 4, yMm: 2 });
});

test("G0-B preserves finished, occupied, bleed, gap and cut-mode semantics", () => {
  const result = createCurrentUniformGeometryPatterns({
    printable: { width: 608, height: 431 },
    product: {
      width: 105,
      height: 148,
      bleed: 2,
      spacingMode: "separated",
      gap: 3,
    },
    limits,
  });

  assert.deepEqual(result.footprint, {
    finished: { widthMm: 105, heightMm: 148 },
    occupied: { widthMm: 109, heightMm: 152 },
    bleedMm: 2,
    gapMm: 3,
    spacingMode: "separated",
  });
  assert.equal(result.agreement.matched, true);
});

test("G0-B generated fixture sweep agrees with the current placement engine", () => {
  let checked = 0;
  for (const width of [100, 157.5, 300, 608]) {
    for (const height of [80, 211.25, 431]) {
      for (const [productWidth, productHeight] of [[10, 20], [33, 17], [105, 148]]) {
        for (const gap of [0, 1.5, 3]) {
          const result = createCurrentUniformGeometryPatterns({
            printable: { width, height },
            product: {
              width: productWidth,
              height: productHeight,
              bleed: 0,
              spacingMode: gap === 0 ? "commonCut" : "separated",
              gap,
            },
            limits,
          });
          assert.equal(result.agreement.matched, true);
          checked += 1;
        }
      }
    }
  }
  assert.equal(checked, 108);
});

test("G0-B comparison reports a structural disagreement instead of hiding it", () => {
  const placement = calculatePlacementOptions({
    printable: { width: 100, height: 80 },
    product: {
      width: 20,
      height: 10,
      bleed: 0,
      spacingMode: "commonCut",
      gap: 0,
    },
    limits,
  });
  const patterns = createUniformGridPatternSet({
    printableArea: { widthMm: 100, heightMm: 80 },
    occupiedProduct: { widthMm: 20, heightMm: 10 },
    gapMm: 0,
  });
  const altered = {
    ...patterns,
    patterns: [
      {
        ...patterns.patterns[0],
        capacity: patterns.patterns[0].capacity - 1,
      },
      patterns.patterns[1],
    ],
  };

  const agreement = compareCurrentPlacementWithPatternSet(placement, altered);
  assert.equal(agreement.matched, false);
  assert.equal(agreement.candidateMismatches.length, 1);
});

test("G0-B output is deeply immutable", () => {
  const result = createCurrentUniformGeometryPatternsFromSheet({
    sheet: beforeTrimSheet,
    product: a6Portrait,
    limits,
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.sheetGeometry), true);
  assert.equal(Object.isFrozen(result.sheetGeometry.coordinateSpace), true);
  assert.equal(Object.isFrozen(result.footprint), true);
  assert.equal(Object.isFrozen(result.patternSet), true);
  assert.equal(Object.isFrozen(result.agreement), true);
});

test("G0-B delegates current validation for invalid sheet and product inputs", () => {
  assert.throws(() => createCurrentUniformGeometryPatternsFromSheet({
    sheet: {
      ...beforeTrimSheet,
      width: 0,
    },
    product: a6Portrait,
    limits,
  }), /sheet.width/);

  assert.throws(() => createCurrentUniformGeometryPatterns({
    printable: { width: 608, height: 431 },
    product: {
      ...a6Portrait,
      bleed: 2,
    },
    limits,
  }), /Common cut requires 0 mm bleed/);
});
