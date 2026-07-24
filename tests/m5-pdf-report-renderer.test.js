import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPagePairs } from "../src/orders.js";
import { createFrontLayout } from "../src/front-layout.js";
import { createBackLayout } from "../src/back-layout.js";
import { validateImposition } from "../src/imposition-validation.js";
import { buildProductionReport } from "../src/production-report.js";
import { createProductionReportPdfDocument } from "../src/pdf-document-model.js";
import {
  buildReportRenderPages,
  paginateReportRows,
} from "../src/pdf-report-renderer.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const controlLayout = JSON.parse(
  readFileSync(new URL("../data/control-layout-m3.json", import.meta.url), "utf8"),
);
const pagePairs = expandPagePairs(controlCase.orders);

function buildReportDocument() {
  const records = controlLayout.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    return { front, back, validation };
  });
  const report = buildProductionReport({
    pagePairs,
    impositions: records,
    duplexMode: controlCase.duplexMode,
  });
  return createProductionReportPdfDocument({ report, language: "ru" });
}

test("row pagination is deterministic and immutable", () => {
  const pages = paginateReportRows([1, 2, 3, 4, 5], 2);
  assert.deepEqual(pages, [[1, 2], [3, 4], [5]]);
  assert.ok(Object.isFrozen(pages));
  assert.ok(pages.every(Object.isFrozen));
  assert.throws(() => paginateReportRows([], 0), /positive integer/);
});

test("control production report becomes six rendered pages", () => {
  const pages = buildReportRenderPages(buildReportDocument());

  assert.equal(pages.length, 6);
  assert.deepEqual(pages.map((page) => page.kind), [
    "summary",
    "files",
    "files",
    "pairs",
    "pairs",
    "pairs",
  ]);
  assert.deepEqual(pages.map((page) => page.pageNumber), [1, 2, 3, 4, 5, 6]);
  assert.equal(pages[1].rows.length, 16);
  assert.equal(pages[2].rows.length, 4);
  assert.equal(pages[3].rows.length, 12);
  assert.equal(pages[4].rows.length, 12);
  assert.equal(pages[5].rows.length, 11);
  assert.equal(pages[0].totals.physicalSheets, 3395);
  assert.equal(pages[0].totals.forms, 8);
  assert.equal(pages[0].totals.pressPasses, 6790);
});

test("incomplete report document sections are rejected", () => {
  assert.throws(
    () => buildReportRenderPages({ kind: "productionReport", sections: [] }),
    /sections are incomplete/,
  );
});
