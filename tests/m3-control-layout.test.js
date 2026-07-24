import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPagePairs } from "../src/orders.js";
import { createFrontLayout } from "../src/front-layout.js";
import { createBackLayout } from "../src/back-layout.js";
import { DIRECTIONS } from "../src/orientation.js";
import { validateImposition } from "../src/imposition-validation.js";

const controlCase = JSON.parse(readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"));
const controlLayout = JSON.parse(readFileSync(new URL("../data/control-layout-m3.json", import.meta.url), "utf8"));
const pagePairs = expandPagePairs(controlCase.orders);

function buildRecords() {
  return controlLayout.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    return { front, back, validation };
  });
}

test("control data builds four validated front/back pairs", () => {
  const records = buildRecords();
  assert.equal(records.length, 4);
  for (const { front, back, validation } of records) {
    assert.equal(front.cells.length, 16);
    assert.equal(back.cells.length, 16);
    assert.deepEqual(validation, { valid: true, errors: [] });
    assert.ok(front.cells.every((cell) => cell.page !== null && cell.direction === DIRECTIONS.RIGHT));
    assert.ok(back.cells.every((cell) => cell.direction === DIRECTIONS.LEFT));
  }
});

test("control layout preserves all declared row-major blocks", () => {
  for (const layout of controlLayout.layouts) {
    assert.equal(layout.blocks.reduce((sum, block) => sum + block.count, 0), 16);
  }
  const [sheet1] = buildRecords();
  assert.deepEqual(sheet1.front.cells.slice(0, 8).map((cell) => `${cell.file},${cell.frontPage}`), [
    "33,1", "33,1", "33,1", "33,1", "33,1", "33,1", "33,3", "33,3",
  ]);
});

test("four-page file 119 keeps both complete page pairs", () => {
  const sheet3 = buildRecords()[2];
  const front119 = sheet3.front.cells.filter((cell) => cell.file === "119");
  const back119 = sheet3.back.cells.filter((cell) => cell.file === "119");
  assert.deepEqual(front119.map((cell) => [cell.frontPage, cell.backPage]), [[1, 2], [3, 4]]);
  assert.deepEqual(back119.map((cell) => cell.page).sort((a, b) => a - b), [2, 4]);
});

test("dash-only backs originate from null pages and never appear on fronts", () => {
  const records = buildRecords();
  assert.ok(records.flatMap(({ front }) => front.cells).every((cell) => cell.page !== null));
  const nullBacks = records.flatMap(({ back }) => back.cells).filter((cell) => cell.page === null);
  assert.ok(nullBacks.length > 0);
  assert.ok(nullBacks.every((cell) => cell.backPage === null));
});
