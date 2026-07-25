import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createBackLayout } from "../src/back-layout.js";
import { createFrontLayout } from "../src/front-layout.js";
import { validateImposition } from "../src/imposition-validation.js";
import { expandPagePairs } from "../src/orders.js";
import { minimizePhysicalPaper } from "../src/paper-minimizer.js";
import { buildPaperSolutionViewModel, formatCandidatePairSummary } from "../src/paper-solution-view.js";
import { buildProductionReport } from "../src/production-report.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const controlLayout = JSON.parse(
  readFileSync(new URL("../data/control-layout-m3.json", import.meta.url), "utf8"),
);
const pagePairs = expandPagePairs(controlCase.orders);

function buildManualReport() {
  const impositions = controlLayout.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    return { front, back, validation };
  });
  return buildProductionReport({
    pagePairs,
    impositions,
    duplexMode: controlCase.duplexMode,
  });
}

function buildSolution() {
  return minimizePhysicalPaper({
    pagePairs,
    rows: 4,
    columns: 4,
    rotation: 90,
    duplexMode: controlCase.duplexMode,
  });
}

test("the view model exposes the exact paper/form production trade-off", () => {
  const view = buildPaperSolutionViewModel({
    solution: buildSolution(),
    manualReport: buildManualReport(),
  });

  assert.equal(view.provenMinimum, true);
  assert.equal(view.paperSavings, 90);
  assert.ok(Math.abs(view.paperSavingsPercent - 90 / 3395 * 100) < 1e-12);
  assert.deepEqual(view.manual, {
    physicalSheets: 3395,
    impositionCount: 4,
    forms: 8,
    pressPasses: 6790,
    pairOverrun: 1450,
    fileOverrun: 930,
  });
  assert.equal(view.automatic.physicalSheets, 3305);
  assert.equal(view.automatic.impositionCount, 56);
  assert.equal(view.automatic.forms, 112);
  assert.equal(view.automatic.pressPasses, 6610);
  assert.equal(view.automatic.pairOverrun, 10);
  assert.equal(view.automatic.fileOverrun, 0);
  assert.equal(view.proof.paperLowerBound, 3305);
  assert.equal(view.plannedRuns.length, 56);

  assert.deepEqual(view.comparisonRows.map((row) => [row.key, row.delta]), [
    ["physicalSheets", -90],
    ["impositions", 52],
    ["forms", 104],
    ["pressPasses", -180],
    ["pairOverrun", -1440],
    ["fileOverrun", -930],
  ]);
  assert.ok(view.plannedRuns.every((run) => run.pairCount <= 2));
  assert.ok(view.plannedRuns.every((run) => run.pairSummary.length > 0));
  assert.ok(Object.isFrozen(view));
  assert.ok(Object.isFrozen(view.comparisonRows));
  assert.ok(Object.isFrozen(view.plannedRuns));
});

test("candidate summaries remain stable and production-oriented", () => {
  const solution = buildSolution();
  const first = solution.plannedRuns[0].candidate;
  const summary = formatCandidatePairSummary(first);

  assert.match(summary, /^\d+:\d+×\d+( \+ \d+:\d+×\d+)?$/);
  assert.equal(summary, solution.plannedRuns[0].candidate.pairPositions
    .map((pair) => `${pair.file}:${pair.pairIndex}×${pair.positionCount}`)
    .join(" + "));
});

test("invalid solution and report inputs cannot enter the comparison", () => {
  const solution = buildSolution();
  const report = buildManualReport();

  assert.throws(
    () => buildPaperSolutionViewModel({ solution: { ...solution, valid: false }, manualReport: report }),
    /valid paper minimum solution/,
  );
  assert.throws(
    () => buildPaperSolutionViewModel({ solution, manualReport: { ...report, status: "invalid" } }),
    /production-ready manual report/,
  );
  assert.throws(
    () => formatCandidatePairSummary({ pairPositions: null }),
    /candidate with pair positions/,
  );
});
