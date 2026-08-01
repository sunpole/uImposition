import test from "node:test";
import assert from "node:assert/strict";
import {
  createGeometryPattern,
  validateGeometryPattern,
} from "../src/geometric-pattern.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function createHorizontalMixedPattern(overrides = {}) {
  const slots = overrides.slots ?? [
    { id: "h0-1", xMm: 0, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 0, stripId: "strip-0", positionInStrip: 0 },
    { id: "h0-2", xMm: 30, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 1, stripId: "strip-0", positionInStrip: 1 },
    { id: "h0-3", xMm: 60, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 2, stripId: "strip-0", positionInStrip: 2 },
    { id: "h90-1", xMm: 0, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 0, stripId: "strip-90", positionInStrip: 0 },
    { id: "h90-2", xMm: 20, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 1, stripId: "strip-90", positionInStrip: 1 },
    { id: "h90-3", xMm: 40, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 2, stripId: "strip-90", positionInStrip: 2 },
    { id: "h90-4", xMm: 60, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 3, stripId: "strip-90", positionInStrip: 3 },
    { id: "h90-5", xMm: 80, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 4, stripId: "strip-90", positionInStrip: 4 },
  ];
  const layout = overrides.layout ?? {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      {
        id: "strip-0",
        rotation: 0,
        xMm: 0,
        yMm: 0,
        widthMm: 100,
        heightMm: 20,
        slotIds: ["h0-1", "h0-2", "h0-3"],
      },
      {
        id: "strip-90",
        rotation: 90,
        xMm: 0,
        yMm: 20,
        widthMm: 100,
        heightMm: 30,
        slotIds: ["h90-1", "h90-2", "h90-3", "h90-4", "h90-5"],
      },
    ],
  };
  return createGeometryPattern({
    id: overrides.id ?? "horizontal-mixed",
    family: "mixedStrips",
    printableArea: { widthMm: 100, heightMm: 50 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 0,
    layout,
    slots,
    coverage: overrides.coverage,
  });
}

test("G1 generalized pattern preserves the existing uniform-grid contract", () => {
  const pattern = createUniformGridPattern({
    printableArea: { widthMm: 100, heightMm: 60 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 0,
    rotation: 0,
  });

  assert.deepEqual(pattern.layout, {
    type: "uniformGrid",
    rotation: 0,
    rows: 3,
    columns: 3,
  });
  assert.equal(pattern.rotation, 0);
  assert.equal(pattern.rows, 3);
  assert.equal(pattern.columns, 3);
  assert.equal(pattern.capacity, 9);
  assert.equal(validateGeometryPattern(pattern), true);
});

test("G1 horizontal mixed-strips pattern validates both rotations and strip membership", () => {
  const pattern = createHorizontalMixedPattern({
    coverage: {
      scope: "mixedStrips:horizontal",
      status: "completeWithinPatternFamily",
    },
  });

  assert.equal(pattern.layout.type, "mixedStrips");
  assert.equal(pattern.layout.axis, "horizontal");
  assert.equal(pattern.rotation, "mixed");
  assert.equal(pattern.rows, null);
  assert.equal(pattern.columns, null);
  assert.equal(pattern.capacity, 8);
  assert.deepEqual(pattern.layout.strips.map(({ rotation, slotIds }) => ({ rotation, slotIds })), [
    { rotation: 0, slotIds: ["h0-1", "h0-2", "h0-3"] },
    { rotation: 90, slotIds: ["h90-1", "h90-2", "h90-3", "h90-4", "h90-5"] },
  ]);
  assert.equal(pattern.coverage.scope, "mixedStrips:horizontal");
  assert.equal(validateGeometryPattern(pattern), true);
  assert.match(pattern.structuralSignature, /layout=mixedStrips:horizontal/);
});

test("G1 vertical mixed-strips pattern supports coordinate-order slots across strips", () => {
  const pattern = createGeometryPattern({
    id: "vertical-mixed",
    family: "mixedStrips",
    printableArea: { widthMm: 50, heightMm: 100 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 0,
    layout: {
      type: "mixedStrips",
      axis: "vertical",
      strips: [
        {
          id: "left-90",
          rotation: 90,
          xMm: 0,
          yMm: 0,
          widthMm: 20,
          heightMm: 100,
          slotIds: ["v90-1", "v90-2", "v90-3"],
        },
        {
          id: "right-0",
          rotation: 0,
          xMm: 20,
          yMm: 0,
          widthMm: 30,
          heightMm: 100,
          slotIds: ["v0-1", "v0-2", "v0-3", "v0-4", "v0-5"],
        },
      ],
    },
    slots: [
      { id: "v90-1", xMm: 0, yMm: 0, widthMm: 20, heightMm: 30, rotation: 90, row: 0, column: 0, stripId: "left-90", positionInStrip: 0 },
      { id: "v0-1", xMm: 20, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 1, stripId: "right-0", positionInStrip: 0 },
      { id: "v0-2", xMm: 20, yMm: 20, widthMm: 30, heightMm: 20, rotation: 0, row: 1, column: 1, stripId: "right-0", positionInStrip: 1 },
      { id: "v90-2", xMm: 0, yMm: 30, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 0, stripId: "left-90", positionInStrip: 1 },
      { id: "v0-3", xMm: 20, yMm: 40, widthMm: 30, heightMm: 20, rotation: 0, row: 2, column: 1, stripId: "right-0", positionInStrip: 2 },
      { id: "v90-3", xMm: 0, yMm: 60, widthMm: 20, heightMm: 30, rotation: 90, row: 2, column: 0, stripId: "left-90", positionInStrip: 2 },
      { id: "v0-4", xMm: 20, yMm: 60, widthMm: 30, heightMm: 20, rotation: 0, row: 3, column: 1, stripId: "right-0", positionInStrip: 3 },
      { id: "v0-5", xMm: 20, yMm: 80, widthMm: 30, heightMm: 20, rotation: 0, row: 4, column: 1, stripId: "right-0", positionInStrip: 4 },
    ],
  });

  assert.equal(pattern.layout.axis, "vertical");
  assert.equal(pattern.capacity, 8);
  assert.equal(pattern.coverage.scope, "mixedStrips");
  assert.equal(validateGeometryPattern(pattern), true);
});

test("G1 mixed pattern requires both slot rotations", () => {
  assert.throws(() => createGeometryPattern({
    id: "not-mixed",
    family: "mixedStrips",
    printableArea: { widthMm: 100, heightMm: 40 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 0,
    layout: {
      type: "mixedStrips",
      axis: "horizontal",
      strips: [
        { id: "a", rotation: 0, xMm: 0, yMm: 0, widthMm: 100, heightMm: 20, slotIds: ["a1"] },
        { id: "b", rotation: 0, xMm: 0, yMm: 20, widthMm: 100, heightMm: 20, slotIds: ["b1"] },
      ],
    },
    slots: [
      { id: "a1", xMm: 0, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 0, stripId: "a", positionInStrip: 0 },
      { id: "b1", xMm: 0, yMm: 20, widthMm: 30, heightMm: 20, rotation: 0, row: 1, column: 0, stripId: "b", positionInStrip: 0 },
    ],
  }), /both 0 and 90/);
});

test("G1 mixed pattern rejects empty strips", () => {
  const valid = createHorizontalMixedPattern();
  const layout = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      { ...valid.layout.strips[0], slotIds: [] },
      { ...valid.layout.strips[1] },
    ],
  };
  assert.throws(() => createHorizontalMixedPattern({ id: "empty-strip", layout }), /at least one slot/);
});

test("G1 mixed pattern rejects non-deterministic slot ordering", () => {
  const valid = createHorizontalMixedPattern();
  assert.throws(() => createHorizontalMixedPattern({
    id: "reversed",
    slots: [...valid.slots].reverse(),
  }), /top-left coordinate order/);
});

test("G1 mixed pattern requires strips and strip members in geometric order", () => {
  const valid = createHorizontalMixedPattern();
  const reversedStrips = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      { ...valid.layout.strips[1] },
      { ...valid.layout.strips[0] },
    ],
  };
  assert.throws(() => createHorizontalMixedPattern({
    id: "reversed-strips",
    layout: reversedStrips,
  }), /strip regions must be ordered/);

  const reorderedSlots = valid.slots.map((slot) => {
    if (slot.id === "h0-1") return { ...slot, column: 1, positionInStrip: 1 };
    if (slot.id === "h0-2") return { ...slot, column: 0, positionInStrip: 0 };
    return slot;
  });
  const reorderedMembers = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      { ...valid.layout.strips[0], slotIds: ["h0-2", "h0-1", "h0-3"] },
      { ...valid.layout.strips[1] },
    ],
  };
  assert.throws(() => createHorizontalMixedPattern({
    id: "reordered-members",
    slots: reorderedSlots,
    layout: reorderedMembers,
  }), /slotIds must follow strip coordinates/);
});

test("G1 mixed pattern rejects duplicate or missing strip assignment", () => {
  const valid = createHorizontalMixedPattern();
  const duplicateLayout = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      { ...valid.layout.strips[0] },
      { ...valid.layout.strips[1], slotIds: [...valid.layout.strips[1].slotIds, "h0-1"] },
    ],
  };
  assert.throws(() => createHorizontalMixedPattern({
    id: "duplicate-assignment",
    layout: duplicateLayout,
  }), /more than one strip/);

  const missingLayout = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      { ...valid.layout.strips[0], slotIds: ["h0-1", "h0-2"] },
      { ...valid.layout.strips[1] },
    ],
  };
  assert.throws(() => createHorizontalMixedPattern({
    id: "missing-assignment",
    layout: missingLayout,
  }), /exactly one strip/);
});

test("G1 mixed pattern rejects slot metadata that disagrees with its strip", () => {
  const valid = createHorizontalMixedPattern();
  const brokenSlots = valid.slots.map((slot) => slot.id === "h90-1"
    ? { ...slot, stripId: "strip-0" }
    : slot);
  assert.throws(() => createHorizontalMixedPattern({
    id: "broken-membership",
    slots: brokenSlots,
  }), /strip metadata does not match/);
});

test("G1 mixed strip regions must be guillotine-spanning and non-overlapping", () => {
  const valid = createHorizontalMixedPattern();
  const narrowLayout = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      { ...valid.layout.strips[0], widthMm: 90 },
      { ...valid.layout.strips[1] },
    ],
  };
  assert.throws(() => createHorizontalMixedPattern({
    id: "narrow-strip",
    layout: narrowLayout,
  }), /span the printable width/);

  const overlapLayout = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: [
      { ...valid.layout.strips[0], heightMm: 25 },
      { ...valid.layout.strips[1] },
    ],
  };
  assert.throws(() => createHorizontalMixedPattern({
    id: "overlap-strip",
    layout: overlapLayout,
  }), /strips overlap/);
});

test("G1 structural signatures ignore labels but distinguish geometry", () => {
  const original = createHorizontalMixedPattern();
  const idMap = new Map(original.slots.map((slot, index) => [slot.id, `renamed-${index + 1}`]));
  const renamedSlots = original.slots.map((slot) => ({
    ...slot,
    id: idMap.get(slot.id),
    stripId: slot.stripId === "strip-0" ? "alpha" : "beta",
  }));
  const renamedLayout = {
    type: "mixedStrips",
    axis: "horizontal",
    strips: original.layout.strips.map((strip) => ({
      ...strip,
      id: strip.id === "strip-0" ? "alpha" : "beta",
      slotIds: strip.slotIds.map((slotId) => idMap.get(slotId)),
    })),
  };
  const renamed = createHorizontalMixedPattern({
    id: "renamed",
    slots: renamedSlots,
    layout: renamedLayout,
  });
  assert.equal(original.structuralSignature, renamed.structuralSignature);

  const shiftedSlots = original.slots.map((slot) => {
    if (slot.id === "h0-2") return { ...slot, xMm: 35 };
    if (slot.id === "h0-3") return { ...slot, xMm: 70 };
    return slot;
  });
  const shifted = createHorizontalMixedPattern({
    id: "shifted",
    slots: shiftedSlots,
  });
  assert.notEqual(original.structuralSignature, shifted.structuralSignature);
});
