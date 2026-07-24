import test from "node:test";
import assert from "node:assert/strict";
import { createFrontLayout } from "../src/front-layout.js";
import { createBackLayout } from "../src/back-layout.js";
import { DIRECTIONS, directionForRotation, flipDirectionHorizontal } from "../src/orientation.js";
import { validateImposition } from "../src/imposition-validation.js";

const pagePairs = [
  { file: "33", pairIndex: 1, frontPage: 1, backPage: 2 },
  { file: "33", pairIndex: 2, frontPage: 3, backPage: null },
  { file: "70", pairIndex: 1, frontPage: 1, backPage: 2 },
  { file: "70", pairIndex: 2, frontPage: 3, backPage: null },
  { file: "25", pairIndex: 1, frontPage: 1, backPage: 2 },
  { file: "25", pairIndex: 2, frontPage: 3, backPage: null },
];

function createControlFront() {
  return createFrontLayout({
    id: "SHEET-1",
    runLength: 1500,
    rows: 4,
    columns: 4,
    rotation: 90,
    blocks: [
      { file: "33", frontPage: 1, count: 6 },
      { file: "33", frontPage: 3, count: 6 },
      { file: "70", frontPage: 1, count: 1 },
      { file: "70", frontPage: 3, count: 1 },
      { file: "25", frontPage: 1, count: 1 },
      { file: "25", frontPage: 3, count: 1 },
    ],
    pagePairs,
  });
}

test("orientation maps rotations and horizontal sheet turn", () => {
  assert.equal(directionForRotation(0), DIRECTIONS.UP);
  assert.equal(directionForRotation(90), DIRECTIONS.RIGHT);
  assert.equal(flipDirectionHorizontal(DIRECTIONS.RIGHT), DIRECTIONS.LEFT);
  assert.equal(flipDirectionHorizontal(DIRECTIONS.UP), DIRECTIONS.UP);
});

test("six-position block remains contiguous across a row boundary", () => {
  const front = createControlFront();
  assert.deepEqual(front.cells.slice(0, 6).map((cell) => [cell.row, cell.column]), [
    [0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1],
  ]);
  assert.ok(front.cells.slice(0, 6).every((cell) => cell.file === "33" && cell.frontPage === 1));
});

test("front rejects underfilled and overfilled grids", () => {
  const base = {
    id: "X",
    runLength: 100,
    rows: 4,
    columns: 4,
    rotation: 90,
    pagePairs,
  };
  assert.throws(() => createFrontLayout({ ...base, blocks: [{ file: "33", frontPage: 1, count: 15 }] }), /exactly 16/);
  assert.throws(() => createFrontLayout({ ...base, blocks: [{ file: "33", frontPage: 1, count: 17 }] }), /exactly 16/);
});

test("front rejects even pages and dash identifiers", () => {
  const base = { id: "X", runLength: 100, rows: 1, columns: 1, rotation: 0, pagePairs };
  assert.throws(() => createFrontLayout({ ...base, blocks: [{ file: "33", frontPage: 2, count: 1 }] }), /odd/);
  assert.throws(() => createFrontLayout({ ...base, blocks: [{ file: "-", frontPage: 1, count: 1 }] }), /cannot be '-'/);
});

test("back mirrors columns but preserves row order", () => {
  const front = createControlFront();
  const back = createBackLayout(front);

  assert.deepEqual(back.cells.slice(0, 4).map((cell) => [cell.file, cell.frontPage, cell.page]), [
    ["33", 1, 2], ["33", 1, 2], ["33", 1, 2], ["33", 1, 2],
  ]);
  assert.deepEqual(back.cells.slice(4, 8).map((cell) => [cell.file, cell.frontPage, cell.page]), [
    ["33", 3, null], ["33", 3, null], ["33", 1, 2], ["33", 1, 2],
  ]);
  assert.ok(back.cells.every((cell) => cell.direction === DIRECTIONS.LEFT));
});

test("odd final page becomes null only on the back", () => {
  const front = createControlFront();
  const back = createBackLayout(front);
  assert.ok(front.cells.every((cell) => cell.page !== null));
  assert.equal(back.cells[4].page, null);
});

test("full imposition validation accepts the control layout", () => {
  const front = createControlFront();
  const back = createBackLayout(front);
  assert.deepEqual(validateImposition({ front, back, pagePairs }), { valid: true, errors: [] });
});

test("validation detects a non-mirrored back cell", () => {
  const front = createControlFront();
  const back = createBackLayout(front);
  const broken = { ...back, cells: back.cells.map((cell, index) => index === 0 ? { ...cell, file: "WRONG" } : cell) };
  const result = validateImposition({ front, back: broken, pagePairs });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => message.includes("file mismatch")));
});
