import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildM3ControlReference } from "../src/control-reference.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const controlLayout = JSON.parse(
  readFileSync(new URL("../data/control-layout-m3.json", import.meta.url), "utf8"),
);

function buildReference() {
  return buildM3ControlReference({ controlCase, controlLayout });
}

test("historical M3 reference remains four fronts plus four mirrored backs", () => {
  const reference = buildReference();

  assert.equal(reference.records.length, 4);
  assert.equal(reference.report.valid, true);
  assert.equal(reference.report.totals.impositionCount, 4);
  assert.equal(reference.report.totals.frontForms, 4);
  assert.equal(reference.report.totals.backForms, 4);
  assert.equal(reference.report.totals.forms, 8);
  assert.equal(reference.metrics.layoutForms, 8);
  assert.equal(reference.metrics.colorPlates, 8);
  assert.equal(reference.metrics.physicalSheets, 3395);
  assert.equal(reference.metrics.pressPasses, 6790);
  assert.equal(reference.printSpecification.label, "1+1");
});

test("every historical back row is the front row mirrored through the short edge", () => {
  const reference = buildReference();

  reference.records.forEach(({ front, back }) => {
    assert.equal(front.rows, back.rows);
    assert.equal(front.columns, back.columns);
    for (let row = 0; row < front.rows; row += 1) {
      const start = row * front.columns;
      const frontRow = front.cells.slice(start, start + front.columns);
      const backRow = back.cells.slice(start, start + back.columns);
      assert.deepEqual(
        backRow.map(({ file, pairIndex, page }) => ({ file, pairIndex, page })),
        [...frontRow].reverse().map(({ file, pairIndex, backPage }) => ({
          file,
          pairIndex,
          page: backPage,
        })),
      );
    }
  });
});

test("the historical fixture keeps its declared horizontal left-to-right turn mode", () => {
  const reference = buildReference();
  assert.equal(reference.turnMode, "horizontalLeftToRight");
});
