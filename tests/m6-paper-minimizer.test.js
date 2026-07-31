import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPagePairs } from "../src/orders.js";
import { buildProductionReport } from "../src/production-report.js";
import {
  PAPER_OPTIMALITY,
  materializePaperSolution,
  minimizePhysicalPaper,
  packResidualPairDemand,
} from "../src/paper-minimizer.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const pagePairs = expandPagePairs(controlCase.orders);

function controlSolution() {
  return minimizePhysicalPaper({
    pagePairs,
    rows: 4,
    columns: 4,
    rotation: 90,
    duplexMode: controlCase.duplexMode,
  });
}

test("the control solution reaches and proves the universal 3305-sheet lower bound", () => {
  const solution = controlSolution();

  assert.equal(solution.valid, true);
  assert.equal(solution.optimality, PAPER_OPTIMALITY.PROVEN_GLOBAL_MINIMUM);
  assert.equal(solution.proof.totalRequiredPairQuantity, 52870);
  assert.equal(solution.proof.outputPerPhysicalSheet, 16);
  assert.equal(solution.proof.paperLowerBound, 3305);
  assert.equal(solution.proof.lowerBoundReached, true);
  assert.equal(solution.proof.unavoidablePairOverrun, 10);

  assert.equal(solution.metrics.physicalSheets, 3305);
  assert.equal(solution.metrics.impositionCount, 56);
  assert.equal(solution.metrics.frontForms, 56);
  assert.equal(solution.metrics.backForms, 56);
  assert.equal(solution.metrics.forms, 112);
  assert.equal(solution.metrics.pressPasses, 6610);
  assert.equal(solution.metrics.requiredPairQuantity, 52870);
  assert.equal(solution.metrics.producedPairQuantity, 52880);
  assert.equal(solution.metrics.remainingPairQuantity, 0);
  assert.equal(solution.metrics.pairOverrun, 10);
  assert.equal(solution.metrics.fileOverrun, 0);

  assert.equal(controlCase.manualReference.physicalSheets - solution.metrics.physicalSheets, 90);
  assert.equal(solution.finalDemandState.allSatisfied, true);
  assert.equal(solution.plannedRuns.length, 56);
  assert.ok(solution.plannedRuns.every((run) => run.candidate.capacity === 16));
  assert.ok(solution.plannedRuns.every((run) => run.candidate.pairCount <= 2));
  assert.equal(new Set(solution.plannedRuns.map((run) => run.candidate.id)).size, 56);
  assert.ok(Object.isFrozen(solution));
  assert.ok(Object.isFrozen(solution.plannedRuns));
});

test("residual packing uses 22 full bins and only the unavoidable 10 pair impressions", () => {
  const solution = controlSolution();
  const packing = solution.residualPacking;

  assert.equal(packing.residualPairCount, 34);
  assert.equal(packing.binCount, 22);
  assert.equal(packing.requiredQuantity, 342);
  assert.equal(packing.producedQuantity, 352);
  assert.equal(packing.overrun, 10);
  assert.ok(packing.bins.every((bin) => bin.allocations.length <= 2));
  assert.ok(packing.bins.every((bin) => (
    bin.allocations.reduce((sum, allocation) => sum + allocation.positionCount, 0) === 16
  )));
});

test("the constructed candidates materialize into independently validated production totals", () => {
  const solution = controlSolution();
  const impositions = materializePaperSolution({ solution, pagePairs });
  const report = buildProductionReport({
    pagePairs,
    impositions,
    duplexMode: controlCase.duplexMode,
  });
  const expectedPressPasses = report.runMetrics.impositions.reduce(
    (sum, metric) => sum + metric.runLength * (metric.backPrinted ? 2 : 1),
    0,
  );

  assert.equal(impositions.length, 56);
  assert.ok(impositions.every((record) => record.validation.valid));
  assert.equal(report.valid, true);
  assert.equal(report.status, "ready");
  assert.equal(report.totals.physicalSheets, 3305);
  assert.equal(report.totals.frontForms, 56);
  assert.equal(report.totals.backForms, 40);
  assert.equal(report.totals.forms, 96);
  assert.equal(report.totals.pressPasses, expectedPressPasses);
  assert.equal(report.totals.requiredPairQuantity, 52870);
  assert.equal(report.totals.producedPairQuantity, 52880);
  assert.equal(report.totals.underproduction, 0);
  assert.equal(report.totals.overrun, 10);
  assert.equal(report.totals.fileOverrun, 0);
});

test("production-equivalent single-pair runs are merged without changing paper", () => {
  const solution = controlSolution();
  const mergedRun = solution.plannedRuns.find((run) => (
    run.candidate.pairCount === 1
    && run.candidate.pairPositions[0].file === "8"
    && run.candidate.pairPositions[0].pairIndex === 1
  ));

  assert.ok(mergedRun);
  assert.equal(mergedRun.runLength, 25);
  assert.equal(mergedRun.mergedSourceCount, 2);
  assert.equal(solution.metrics.physicalSheets, 3305);
});

test("a feasible construction that misses the capacity lower bound is not called optimal", () => {
  const smallPairs = ["A", "B", "C", "D", "E"].map((file) => ({
    file,
    pairIndex: 1,
    quantity: 1,
    frontPage: 1,
    backPage: 2,
  }));
  const solution = minimizePhysicalPaper({
    pagePairs: smallPairs,
    rows: 2,
    columns: 2,
    rotation: 0,
  });

  assert.equal(solution.valid, true);
  assert.equal(solution.proof.paperLowerBound, 2);
  assert.equal(solution.metrics.physicalSheets, 3);
  assert.equal(solution.proof.lowerBoundReached, false);
  assert.equal(solution.optimality, PAPER_OPTIMALITY.FEASIBLE_NOT_PROVEN);
  assert.equal(solution.metrics.remainingPairQuantity, 0);
});

test("residual packer rejects invalid capacity and unsupported duplex modes", () => {
  const demandState = controlSolution().finalDemandState;
  assert.throws(
    () => packResidualPairDemand({ demandState, capacity: 0 }),
    /capacity must be a positive integer/,
  );
  assert.throws(
    () => minimizePhysicalPaper({
      pagePairs,
      rows: 4,
      columns: 4,
      rotation: 90,
      duplexMode: "workAndTurn",
    }),
    /Unsupported duplex mode/,
  );
});
