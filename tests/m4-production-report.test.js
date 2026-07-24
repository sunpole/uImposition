import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPagePairs } from "../src/orders.js";
import { createFrontLayout } from "../src/front-layout.js";
import { createBackLayout } from "../src/back-layout.js";
import { buildProductionReport, assertProductionReady } from "../src/production-report.js";
import { DUPLEX_MODES } from "../src/production-metrics.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const controlLayout = JSON.parse(
  readFileSync(new URL("../data/control-layout-m3.json", import.meta.url), "utf8"),
);
const pagePairs = expandPagePairs(controlCase.orders);

function buildControlImpositions() {
  return controlLayout.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    return { front, back };
  });
}

function buildControlReport() {
  return buildProductionReport({
    pagePairs,
    impositions: buildControlImpositions(),
    duplexMode: controlCase.duplexMode,
  });
}

test("M4 control report matches every manual reference total", () => {
  const report = buildControlReport();
  const expected = controlCase.manualReference;

  assert.equal(report.valid, true);
  assert.equal(report.status, "ready");
  assert.deepEqual(report.errors, []);
  assert.equal(report.totals.pairCount, expected.printPairs);
  assert.equal(report.totals.fileCount, controlCase.orders.length);
  assert.equal(report.totals.impositionCount, expected.impositions);
  assert.equal(report.totals.physicalSheets, expected.physicalSheets);
  assert.equal(report.totals.forms, expected.plates);
  assert.equal(report.totals.frontForms, 4);
  assert.equal(report.totals.backForms, 4);
  assert.equal(report.totals.pressPasses, expected.pressPasses);
  assert.equal(report.totals.underproduction, expected.underproduction);
  assert.equal(report.totals.overrun, expected.totalOverrun);
  assert.equal(report.totals.requiredPairQuantity, 52870);
  assert.equal(report.totals.producedPairQuantity, 54320);
  assert.equal(report.totals.requiredFileQuantity, 29225);
  assert.equal(report.totals.producedCompleteFileQuantity, 30155);
  assert.equal(report.totals.fileOverrun, 930);
  assertProductionReady(report);
});

test("pair metrics explain production by imposition positions and run length", () => {
  const report = buildControlReport();
  const pair33 = report.pairMetrics.find((metric) => metric.file === "33" && metric.frontPage === 1);
  const pair8 = report.pairMetrics.find((metric) => metric.file === "8" && metric.frontPage === 1);
  const pair25 = report.pairMetrics.find((metric) => metric.file === "25" && metric.frontPage === 1);

  assert.deepEqual(pair33.contributions, [
    { impositionId: "1", positionCount: 6, runLength: 1500, producedQuantity: 9000 },
    { impositionId: "4", positionCount: 2, runLength: 345, producedQuantity: 690 },
  ]);
  assert.equal(pair33.requiredQuantity, 9650);
  assert.equal(pair33.producedQuantity, 9690);
  assert.equal(pair33.overrun, 40);
  assert.equal(pair8.producedQuantity, 450);
  assert.equal(pair8.overrun, 55);
  assert.equal(pair25.producedQuantity, 1500);
  assert.equal(pair25.overrun, 0);
});

test("file metrics separate complete-file overrun from summed pair overrun", () => {
  const report = buildControlReport();
  const file33 = report.fileMetrics.find((metric) => metric.file === "33");
  const file119 = report.fileMetrics.find((metric) => metric.file === "119");

  assert.deepEqual(file33, {
    file: "33",
    pairCount: 2,
    requiredQuantity: 9650,
    producedQuantity: 9690,
    maximumPairQuantity: 9690,
    unevenPairProduction: 0,
    underproduction: 0,
    overrun: 40,
    pairUnderproduction: 0,
    pairOverrun: 80,
  });
  assert.equal(file119.requiredQuantity, 350);
  assert.equal(file119.producedQuantity, 450);
  assert.equal(file119.overrun, 100);
  assert.equal(file119.pairOverrun, 200);
});

test("any underproduction makes the report invalid and blocks production readiness", () => {
  const impositions = buildControlImpositions();
  const first = impositions[0];
  const reducedFront = { ...first.front, runLength: 100 };
  const reducedBack = { ...first.back, runLength: 100 };
  const report = buildProductionReport({
    pagePairs,
    impositions: [{ front: reducedFront, back: reducedBack }, ...impositions.slice(1)],
    duplexMode: DUPLEX_MODES.SEPARATE_FRONT_BACK_FORMS,
  });

  assert.equal(report.valid, false);
  assert.equal(report.status, "invalid");
  assert.ok(report.totals.underproduction > 0);
  assert.ok(report.errors.some((message) => message.includes("Underproduction is forbidden")));
  assert.throws(() => assertProductionReady(report), /not ready/);
});

test("a damaged front/back pair is rejected before production arithmetic", () => {
  const impositions = buildControlImpositions();
  const first = impositions[0];
  const brokenCells = first.front.cells.map((cell, index) => (
    index === 0 ? { ...cell, file: "UNKNOWN" } : cell
  ));
  const brokenFront = { ...first.front, cells: brokenCells };

  assert.throws(
    () => buildProductionReport({
      pagePairs,
      impositions: [{ front: brokenFront, back: first.back }, ...impositions.slice(1)],
      duplexMode: controlCase.duplexMode,
    }),
    /Imposition 1 is invalid/,
  );
});

test("duplicate pair definitions and unsupported duplex modes are rejected", () => {
  const impositions = buildControlImpositions();
  assert.throws(
    () => buildProductionReport({
      pagePairs: [...pagePairs, pagePairs[0]],
      impositions,
      duplexMode: controlCase.duplexMode,
    }),
    /Duplicate page pair/,
  );
  assert.throws(
    () => buildProductionReport({
      pagePairs,
      impositions,
      duplexMode: "workAndTurn",
    }),
    /Unsupported duplex mode/,
  );
});
