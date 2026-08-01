import test from "node:test";
import assert from "node:assert/strict";
import {
  createGeometryPattern,
  createGeometrySlot,
  geometrySlotsOverlap,
  validateGeometryPattern,
} from "../src/geometric-pattern.js";

test("G0 geometry slots treat touching edges as non-overlap", () => {
  const left = createGeometrySlot({
    id: "left",
    xMm: 0,
    yMm: 0,
    widthMm: 10,
    heightMm: 10,
    rotation: 0,
    row: 0,
    column: 0,
  });
  const right = createGeometrySlot({
    id: "right",
    xMm: 10,
    yMm: 0,
    widthMm: 10,
    heightMm: 10,
    rotation: 0,
    row: 0,
    column: 1,
  });
  assert.equal(geometrySlotsOverlap(left, right), false);
});

test("G0 geometry pattern rejects overlapping slots", () => {
  assert.throws(() => createGeometryPattern({
    id: "overlap",
    family: "uniformGrid",
    printableArea: { widthMm: 30, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    gapMm: 0,
    rotation: 0,
    rows: 1,
    columns: 2,
    slots: [
      {
        id: "a",
        xMm: 0,
        yMm: 0,
        widthMm: 10,
        heightMm: 10,
        rotation: 0,
        row: 0,
        column: 0,
      },
      {
        id: "b",
        xMm: 5,
        yMm: 0,
        widthMm: 10,
        heightMm: 10,
        rotation: 0,
        row: 0,
        column: 1,
      },
    ],
  }), /overlap/);
});

test("G0 geometry pattern rejects a slot outside printable bounds", () => {
  assert.throws(() => createGeometryPattern({
    id: "outside",
    family: "uniformGrid",
    printableArea: { widthMm: 20, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    gapMm: 0,
    rotation: 0,
    rows: 1,
    columns: 1,
    slots: [{
      id: "outside-slot",
      xMm: 15,
      yMm: 0,
      widthMm: 10,
      heightMm: 10,
      rotation: 0,
      row: 0,
      column: 0,
    }],
  }), /exceeds printable area/);
});

test("G0 geometry pattern enforces deterministic row-major order", () => {
  assert.throws(() => createGeometryPattern({
    id: "wrong-order",
    family: "uniformGrid",
    printableArea: { widthMm: 20, heightMm: 20 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    gapMm: 0,
    rotation: 0,
    rows: 1,
    columns: 2,
    slots: [
      {
        id: "second",
        xMm: 10,
        yMm: 0,
        widthMm: 10,
        heightMm: 10,
        rotation: 0,
        row: 0,
        column: 1,
      },
      {
        id: "first",
        xMm: 0,
        yMm: 0,
        widthMm: 10,
        heightMm: 10,
        rotation: 0,
        row: 0,
        column: 0,
      },
    ],
  }), /row-major order/);
});

test("G0 geometry pattern is immutable and independently validatable", () => {
  const pattern = createGeometryPattern({
    id: "immutable",
    family: "uniformGrid",
    printableArea: { widthMm: 20, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    gapMm: 0,
    rotation: 0,
    rows: 1,
    columns: 2,
    slots: [
      {
        id: "slot-1",
        xMm: 0,
        yMm: 0,
        widthMm: 10,
        heightMm: 10,
        rotation: 0,
        row: 0,
        column: 0,
      },
      {
        id: "slot-2",
        xMm: 10,
        yMm: 0,
        widthMm: 10,
        heightMm: 10,
        rotation: 0,
        row: 0,
        column: 1,
      },
    ],
  });

  assert.equal(validateGeometryPattern(pattern), true);
  assert.equal(Object.isFrozen(pattern), true);
  assert.equal(Object.isFrozen(pattern.printableArea), true);
  assert.equal(Object.isFrozen(pattern.occupiedProduct), true);
  assert.equal(Object.isFrozen(pattern.slots), true);
  assert.equal(Object.isFrozen(pattern.slots[0]), true);
  assert.equal(Object.isFrozen(pattern.coverage), true);
});

test("G0 geometry model rejects invalid dimensions and rotations", () => {
  assert.throws(() => createGeometrySlot({
    id: "bad-size",
    xMm: 0,
    yMm: 0,
    widthMm: 0,
    heightMm: 10,
    rotation: 0,
    row: 0,
    column: 0,
  }), /greater than 0/);

  assert.throws(() => createGeometrySlot({
    id: "bad-rotation",
    xMm: 0,
    yMm: 0,
    widthMm: 10,
    heightMm: 10,
    rotation: 180,
    row: 0,
    column: 0,
  }), /0 or 90/);
});
