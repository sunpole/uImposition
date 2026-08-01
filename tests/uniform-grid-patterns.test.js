import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlacementOptions } from "../src/geometry.js";
import {
  createUniformGridPattern,
  createUniformGridPatternSet,
} from "../src/uniform-grid-patterns.js";

const limits = {
  minProductDimensionMm: 1,
  maxProductDimensionMm: 1000,
  minBleedMm: 0,
  maxBleedMm: 20,
  minGapMm: 0,
  maxGapMm: 100,
};

test("G0 uniform grid returns exact row-major coordinates with gap", () => {
  const pattern = createUniformGridPattern({
    printableArea: { widthMm: 32, heightMm: 21 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    gapMm: 1,
    rotation: 0,
  });

  assert.equal(pattern.columns, 3);
  assert.equal(pattern.rows, 2);
  assert.equal(pattern.capacity, 6);
  assert.deepEqual(pattern.slots.map(({ xMm, yMm }) => [xMm, yMm]), [
    [0, 0],
    [11, 0],
    [22, 0],
    [0, 11],
    [11, 11],
    [22, 11],
  ]);
  assert.deepEqual(pattern.usedBounds, { xMm: 0, yMm: 0, widthMm: 32, heightMm: 21 });
  assert.deepEqual(pattern.unusedEdges, { leftMm: 0, topMm: 0, rightMm: 0, bottomMm: 0 });
});

test("G0 pattern set retains both 0 and 90 degree patterns", () => {
  const result = createUniformGridPatternSet({
    printableArea: { widthMm: 608, heightMm: 431 },
    occupiedProduct: { widthMm: 105, heightMm: 148 },
    gapMm: 0,
  });

  assert.deepEqual(result.patterns.map(({ rotation, columns, rows, capacity }) => ({
    rotation,
    columns,
    rows,
    capacity,
  })), [
    { rotation: 0, columns: 5, rows: 2, capacity: 10 },
    { rotation: 90, columns: 4, rows: 4, capacity: 16 },
  ]);
  assert.equal(result.best.rotation, 90);
  assert.equal(result.best.capacity, 16);
  assert.equal(result.coverage.mixedOrientationsEvaluated, false);
});

test("G0 capacity and best orientation agree with the current placement API", () => {
  const current = calculatePlacementOptions({
    printable: { width: 608, height: 431 },
    product: {
      width: 105,
      height: 148,
      bleed: 0,
      spacingMode: "commonCut",
      gap: 0,
    },
    limits,
  });
  const next = createUniformGridPatternSet({
    printableArea: { widthMm: current.printable.width, heightMm: current.printable.height },
    occupiedProduct: {
      widthMm: current.footprint.occupied.width,
      heightMm: current.footprint.occupied.height,
    },
    gapMm: current.footprint.gap,
  });

  assert.deepEqual(next.patterns.map(({ rotation, columns, rows, capacity }) => ({
    rotation,
    columns,
    rows,
    positions: capacity,
  })), current.candidates.map(({ rotation, columns, rows, positions }) => ({
    rotation,
    columns,
    rows,
    positions,
  })));
  assert.equal(next.best.rotation, current.best.rotation);
  assert.equal(next.best.capacity, current.best.positions);
});

test("G0 separated gap agrees with the current placement API", () => {
  const current = calculatePlacementOptions({
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
  const next = createUniformGridPatternSet({
    printableArea: { widthMm: current.printable.width, heightMm: current.printable.height },
    occupiedProduct: {
      widthMm: current.footprint.occupied.width,
      heightMm: current.footprint.occupied.height,
    },
    gapMm: current.footprint.gap,
  });

  assert.deepEqual(next.patterns.map(({ rotation, capacity }) => ({ rotation, capacity })),
    current.candidates.map(({ rotation, positions }) => ({ rotation, capacity: positions })));
});

test("G0 no-fit patterns remain explicit and valid", () => {
  const result = createUniformGridPatternSet({
    printableArea: { widthMm: 50, heightMm: 50 },
    occupiedProduct: { widthMm: 60, heightMm: 70 },
    gapMm: 0,
  });

  assert.equal(result.fits, false);
  assert.deepEqual(result.patterns.map(({ capacity }) => capacity), [0, 0]);
  assert.deepEqual(result.patterns[0].slots, []);
  assert.deepEqual(result.patterns[1].slots, []);
});

test("G0 structural signatures are stable and distinguish orientations", () => {
  const input = {
    printableArea: { widthMm: 100, heightMm: 80 },
    occupiedProduct: { widthMm: 20, heightMm: 10 },
    gapMm: 2,
  };
  const first = createUniformGridPatternSet(input);
  const second = createUniformGridPatternSet(input);

  assert.deepEqual(first.patterns.map(({ structuralSignature }) => structuralSignature),
    second.patterns.map(({ structuralSignature }) => structuralSignature));
  assert.notEqual(first.patterns[0].structuralSignature, first.patterns[1].structuralSignature);
});

test("G0 larger printable area never lowers capacity", () => {
  for (const rotation of [0, 90]) {
    for (const widthMm of [80, 100, 120]) {
      for (const heightMm of [60, 90]) {
        const smaller = createUniformGridPattern({
          printableArea: { widthMm, heightMm },
          occupiedProduct: { widthMm: 21, heightMm: 13 },
          gapMm: 2,
          rotation,
        });
        const larger = createUniformGridPattern({
          printableArea: { widthMm: widthMm + 10, heightMm: heightMm + 10 },
          occupiedProduct: { widthMm: 21, heightMm: 13 },
          gapMm: 2,
          rotation,
        });
        assert.ok(larger.capacity >= smaller.capacity);
      }
    }
  }
});

test("G0 larger product or gap never increases capacity", () => {
  for (const rotation of [0, 90]) {
    const base = createUniformGridPattern({
      printableArea: { widthMm: 120, heightMm: 90 },
      occupiedProduct: { widthMm: 20, heightMm: 10 },
      gapMm: 1,
      rotation,
    });
    const largerProduct = createUniformGridPattern({
      printableArea: { widthMm: 120, heightMm: 90 },
      occupiedProduct: { widthMm: 21, heightMm: 11 },
      gapMm: 1,
      rotation,
    });
    const largerGap = createUniformGridPattern({
      printableArea: { widthMm: 120, heightMm: 90 },
      occupiedProduct: { widthMm: 20, heightMm: 10 },
      gapMm: 2,
      rotation,
    });

    assert.ok(largerProduct.capacity <= base.capacity);
    assert.ok(largerGap.capacity <= base.capacity);
  }
});

test("G0 rejects invalid rotations, dimensions and rotation lists", () => {
  assert.throws(() => createUniformGridPattern({
    printableArea: { widthMm: 100, heightMm: 80 },
    occupiedProduct: { widthMm: 20, heightMm: 10 },
    gapMm: 0,
    rotation: 180,
  }), /0 or 90/);

  assert.throws(() => createUniformGridPattern({
    printableArea: { widthMm: 0, heightMm: 80 },
    occupiedProduct: { widthMm: 20, heightMm: 10 },
    gapMm: 0,
    rotation: 0,
  }), /greater than 0/);

  assert.throws(() => createUniformGridPatternSet({
    printableArea: { widthMm: 100, heightMm: 80 },
    occupiedProduct: { widthMm: 20, heightMm: 10 },
    rotations: [],
  }), /at least one rotation/);
});
