import test from "node:test";
import assert from "node:assert/strict";
import { createGeometryPattern } from "../src/geometric-pattern.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";
import {
  analyzeHorizontalWorkAndTurnOrbits,
  reflectSlotHorizontally,
} from "../src/work-and-turn-slot-orbits.js";

test("P0-B horizontal reflection pairs every slot in an even 4x4 grid", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 40 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const analysis = analyzeHorizontalWorkAndTurnOrbits(geometry);

  assert.equal(analysis.geometryCapacity, 16);
  assert.equal(analysis.pairedOrbitCount, 8);
  assert.equal(analysis.usefulCapacity, 16);
  assert.equal(analysis.fixedSlotCount, 0);
  assert.equal(analysis.unmatchedSlotCount, 0);
  assert.equal(analysis.blankSlotCount, 0);
  assert.equal(analysis.fullySymmetric, true);
  assert.equal(analysis.eligible, true);
  assert.equal(analysis.utilizationPercent, 100);
  assert.equal(
    analysis.transformedSlotIdBySourceSlotId["uniform-grid-r0-row1-col1"],
    "uniform-grid-r0-row1-col4",
  );
  assert.equal(
    analysis.transformedSlotIdBySourceSlotId["uniform-grid-r0-row1-col2"],
    "uniform-grid-r0-row1-col3",
  );
});

test("P0-B horizontal reflection leaves the middle column of a 3x3 grid fixed", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 30, heightMm: 30 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const analysis = analyzeHorizontalWorkAndTurnOrbits(geometry);

  assert.equal(analysis.geometryCapacity, 9);
  assert.equal(analysis.pairedOrbitCount, 3);
  assert.equal(analysis.usefulCapacity, 6);
  assert.equal(analysis.fixedSlotCount, 3);
  assert.equal(analysis.unmatchedSlotCount, 0);
  assert.equal(analysis.blankSlotCount, 3);
  assert.equal(analysis.utilizationPercent, 66.67);
  assert.deepEqual(analysis.fixedSlots.map(({ slotId }) => slotId), [
    "uniform-grid-r0-row1-col2",
    "uniform-grid-r0-row2-col2",
    "uniform-grid-r0-row3-col2",
  ]);
});

test("P0-B a single centered slot is fixed and cannot produce duplex work-and-turn output", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
  const analysis = analyzeHorizontalWorkAndTurnOrbits(geometry);

  assert.equal(analysis.pairedOrbitCount, 0);
  assert.equal(analysis.usefulCapacity, 0);
  assert.equal(analysis.fixedSlotCount, 1);
  assert.equal(analysis.eligible, false);
});

test("P0-B asymmetric mixed geometry exposes paired, fixed and unmatched slots", () => {
  const geometry = createGeometryPattern({
    id: "asymmetric-mixed",
    family: "mixedStrips",
    printableArea: { widthMm: 100, heightMm: 50 },
    occupiedProduct: { widthMm: 30, heightMm: 20 },
    gapMm: 0,
    layout: {
      type: "mixedStrips",
      axis: "horizontal",
      strips: [
        {
          id: "top",
          rotation: 0,
          xMm: 0,
          yMm: 0,
          widthMm: 100,
          heightMm: 20,
          slotIds: ["t1", "t2", "t3"],
        },
        {
          id: "bottom",
          rotation: 90,
          xMm: 0,
          yMm: 20,
          widthMm: 100,
          heightMm: 30,
          slotIds: ["b1", "b2", "b3", "b4", "b5"],
        },
      ],
    },
    slots: [
      { id: "t1", xMm: 0, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 0, stripId: "top", positionInStrip: 0 },
      { id: "t2", xMm: 30, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 1, stripId: "top", positionInStrip: 1 },
      { id: "t3", xMm: 60, yMm: 0, widthMm: 30, heightMm: 20, rotation: 0, row: 0, column: 2, stripId: "top", positionInStrip: 2 },
      { id: "b1", xMm: 0, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 0, stripId: "bottom", positionInStrip: 0 },
      { id: "b2", xMm: 20, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 1, stripId: "bottom", positionInStrip: 1 },
      { id: "b3", xMm: 40, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 2, stripId: "bottom", positionInStrip: 2 },
      { id: "b4", xMm: 60, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 3, stripId: "bottom", positionInStrip: 3 },
      { id: "b5", xMm: 80, yMm: 20, widthMm: 20, heightMm: 30, rotation: 90, row: 1, column: 4, stripId: "bottom", positionInStrip: 4 },
    ],
  });
  const analysis = analyzeHorizontalWorkAndTurnOrbits(geometry);

  assert.equal(analysis.geometryCapacity, 8);
  assert.equal(analysis.pairedOrbitCount, 2);
  assert.equal(analysis.usefulCapacity, 4);
  assert.equal(analysis.fixedSlotCount, 1);
  assert.equal(analysis.unmatchedSlotCount, 3);
  assert.equal(analysis.blankSlotCount, 4);
  assert.equal(analysis.fullySymmetric, false);
  assert.equal(analysis.utilizationPercent, 50);
  assert.deepEqual(analysis.fixedSlots.map(({ slotId }) => slotId), ["b3"]);
  assert.deepEqual(analysis.unmatchedSlots.map(({ slotId }) => slotId), ["t1", "t2", "t3"]);
});

test("P0-B horizontal reflection is an involution for every slot rectangle", () => {
  const geometry = createUniformGridPattern({
    printableArea: { widthMm: 80, heightMm: 40 },
    occupiedProduct: { widthMm: 20, heightMm: 10 },
    gapMm: 0,
    rotation: 90,
  });

  for (const slot of geometry.slots) {
    const reflected = reflectSlotHorizontally(slot, geometry.printableArea.widthMm);
    const restored = reflectSlotHorizontally(reflected, geometry.printableArea.widthMm);
    assert.deepEqual(restored, {
      xMm: slot.xMm,
      yMm: slot.yMm,
      widthMm: slot.widthMm,
      heightMm: slot.heightMm,
      rotation: slot.rotation,
    });
  }
});

test("P0-B orbit analysis is deterministic, label-independent and immutable", () => {
  const firstGeometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
    idPrefix: "first-label",
  });
  const secondGeometry = createUniformGridPattern({
    printableArea: { widthMm: 40, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
    idPrefix: "second-label",
  });
  const first = analyzeHorizontalWorkAndTurnOrbits(firstGeometry);
  const second = analyzeHorizontalWorkAndTurnOrbits(secondGeometry);

  assert.equal(first.structuralSignature, second.structuralSignature);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.pairedOrbits), true);
  assert.equal(Object.isFrozen(first.pairedOrbits[0]), true);
  assert.equal(Object.isFrozen(first.transformedSlotIdBySourceSlotId), true);
});
