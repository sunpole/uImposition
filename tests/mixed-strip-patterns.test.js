import test from "node:test";
import assert from "node:assert/strict";
import { validateGeometryPattern } from "../src/geometric-pattern.js";
import { createMixedStripPatternSet } from "../src/mixed-strip-patterns.js";
import { createUniformGridPatternSet } from "../src/uniform-grid-patterns.js";

test("G1 mixed strips can beat both pure grids", () => {
  const printableArea = { widthMm: 105, heightMm: 100 };
  const occupiedProduct = { widthMm: 55, heightMm: 10 };
  const uniform = createUniformGridPatternSet({
    printableArea,
    occupiedProduct,
    gapMm: 0,
  });
  const mixed = createMixedStripPatternSet({
    printableArea,
    occupiedProduct,
    gapMm: 0,
    maxStripCount: 6,
    maxPatternCount: 2000,
  });

  assert.equal(uniform.patterns[0].capacity, 10);
  assert.equal(uniform.patterns[1].capacity, 10);
  assert.equal(mixed.best.capacity, 15);
  assert.equal(mixed.best.layout.axis, "vertical");
  assert.deepEqual(
    mixed.best.layout.strips.map(({ rotation }) => rotation).sort((a, b) => a - b),
    [0, 90, 90, 90, 90, 90],
  );
  assert.equal(mixed.coverage.status, "completeWithinRequestedSpace");
  assert.equal(mixed.coverage.generalRectanglePackingEvaluated, false);
});

test("G1 enumerates every ordered two-strip sequence in a small exact space", () => {
  const result = createMixedStripPatternSet({
    printableArea: { widthMm: 50, heightMm: 50 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 0,
    maxStripCount: 4,
    maxPatternCount: 100,
  });

  assert.equal(result.coverage.status, "completeWithinRequestedSpace");
  assert.equal(result.coverage.totalFeasibleSequenceCount, 4);
  assert.equal(result.coverage.processedSequenceCount, 4);
  assert.equal(result.coverage.generatedPatternCount, 4);
  assert.equal(result.coverage.duplicatePatternCount, 0);
  assert.equal(result.patterns.length, 4);
  assert.deepEqual(
    result.patterns.map((pattern) => pattern.layout.axis).sort(),
    ["horizontal", "horizontal", "vertical", "vertical"],
  );
  assert.ok(result.patterns.every((pattern) => pattern.capacity === 3));
});

test("G1 gap can make the mixed family empty while keeping complete coverage", () => {
  const result = createMixedStripPatternSet({
    printableArea: { widthMm: 50, heightMm: 50 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 1,
    maxStripCount: 4,
    maxPatternCount: 100,
  });

  assert.equal(result.fits, false);
  assert.equal(result.best, null);
  assert.deepEqual(result.patterns, []);
  assert.equal(result.coverage.totalFeasibleSequenceCount, 0);
  assert.equal(result.coverage.status, "completeWithinRequestedSpace");
});

test("G1 every generated pattern independently validates and contains both rotations", () => {
  const result = createMixedStripPatternSet({
    printableArea: { widthMm: 105, heightMm: 100 },
    occupiedProduct: { widthMm: 55, heightMm: 10 },
    gapMm: 0,
    maxStripCount: 6,
    maxPatternCount: 2000,
  });

  assert.ok(result.patterns.length > 0);
  for (const pattern of result.patterns) {
    assert.equal(validateGeometryPattern(pattern), true);
    const rotations = new Set(pattern.slots.map(({ rotation }) => rotation));
    assert.deepEqual([...rotations].sort((a, b) => a - b), [0, 90]);
    assert.equal(pattern.capacity, pattern.slots.length);
    assert.equal(pattern.layout.type, "mixedStrips");
  }
});

test("G1 strip count limit is visible and never presented as complete", () => {
  const result = createMixedStripPatternSet({
    printableArea: { widthMm: 105, heightMm: 100 },
    occupiedProduct: { widthMm: 55, heightMm: 10 },
    gapMm: 0,
    maxStripCount: 4,
    maxPatternCount: 2000,
  });

  assert.equal(result.coverage.status, "truncated");
  assert.ok(result.coverage.truncationReasons.includes("stripCountLimit"));
  assert.deepEqual(result.coverage.stripCountTruncatedAxes.sort(), ["horizontal", "vertical"]);
  assert.ok(result.coverage.axisCatalogs.every(({ truncatedByStripCount }) => truncatedByStripCount));
  assert.ok(result.best.capacity < 15);
});

test("G1 global pattern limit is shared fairly across axes and reported", () => {
  const result = createMixedStripPatternSet({
    printableArea: { widthMm: 50, heightMm: 50 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 0,
    maxStripCount: 4,
    maxPatternCount: 2,
  });

  assert.equal(result.patterns.length, 2);
  assert.deepEqual(result.patterns.map((pattern) => pattern.layout.axis).sort(), ["horizontal", "vertical"]);
  assert.equal(result.coverage.status, "truncated");
  assert.ok(result.coverage.truncationReasons.includes("patternCountLimit"));
  assert.equal(result.coverage.processedSequenceCount, 2);
  assert.equal(result.coverage.omittedSequenceCount, 2);
});

test("G1 axis selection is explicit and exact inside the selected axes", () => {
  const horizontal = createMixedStripPatternSet({
    printableArea: { widthMm: 50, heightMm: 50 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    axes: ["horizontal"],
    maxStripCount: 4,
    maxPatternCount: 100,
  });

  assert.equal(horizontal.coverage.status, "completeWithinRequestedSpace");
  assert.deepEqual(horizontal.coverage.axes, ["horizontal"]);
  assert.equal(horizontal.patterns.length, 2);
  assert.ok(horizontal.patterns.every((pattern) => pattern.layout.axis === "horizontal"));
});

test("G1 generation is deterministic and signatures are unique", () => {
  const input = {
    printableArea: { widthMm: 105, heightMm: 100 },
    occupiedProduct: { widthMm: 55, heightMm: 10 },
    gapMm: 0,
    maxStripCount: 6,
    maxPatternCount: 2000,
  };
  const first = createMixedStripPatternSet(input);
  const second = createMixedStripPatternSet(input);
  const firstSignatures = first.patterns.map(({ structuralSignature }) => structuralSignature);
  const secondSignatures = second.patterns.map(({ structuralSignature }) => structuralSignature);

  assert.deepEqual(firstSignatures, secondSignatures);
  assert.equal(new Set(firstSignatures).size, firstSignatures.length);
  assert.equal(first.coverage.duplicatePatternCount, 0);
});

test("G1 pattern ordering prefers capacity and then fewer strips", () => {
  const result = createMixedStripPatternSet({
    printableArea: { widthMm: 105, heightMm: 100 },
    occupiedProduct: { widthMm: 55, heightMm: 10 },
    gapMm: 0,
    maxStripCount: 6,
    maxPatternCount: 2000,
  });

  for (let index = 1; index < result.patterns.length; index += 1) {
    const previous = result.patterns[index - 1];
    const current = result.patterns[index];
    assert.ok(previous.capacity >= current.capacity);
    if (previous.capacity === current.capacity) {
      assert.ok(previous.layout.strips.length <= current.layout.strips.length
        || previous.structuralSignature.localeCompare(current.structuralSignature) <= 0);
    }
  }
});

test("G1 output and coverage are deeply immutable", () => {
  const result = createMixedStripPatternSet({
    printableArea: { widthMm: 50, heightMm: 50 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    maxStripCount: 4,
    maxPatternCount: 100,
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.patterns), true);
  assert.equal(Object.isFrozen(result.coverage), true);
  assert.equal(Object.isFrozen(result.coverage.axisCatalogs), true);
  assert.equal(Object.isFrozen(result.coverage.axisCatalogs[0]), true);
});

test("G1 rejects unsupported axes and unsafe search limits", () => {
  const base = {
    printableArea: { widthMm: 100, heightMm: 80 },
    occupiedProduct: { widthMm: 20, heightMm: 10 },
  };

  assert.throws(() => createMixedStripPatternSet({ ...base, axes: [] }), /at least one axis/);
  assert.throws(() => createMixedStripPatternSet({ ...base, axes: ["diagonal"] }), /horizontal and vertical/);
  assert.throws(() => createMixedStripPatternSet({ ...base, maxStripCount: 17 }), /16 or less/);
  assert.throws(() => createMixedStripPatternSet({ ...base, maxPatternCount: 20001 }), /20000 or less/);
  assert.throws(() => createMixedStripPatternSet({ ...base, gapMm: -1 }), /0 or greater/);
});
