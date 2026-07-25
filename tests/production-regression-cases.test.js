import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculatePlacementOptions } from "../src/geometry.js";
import {
  createMixedFormatBack,
  createMixedFormatFront,
  validateMixedFormatDuplex,
} from "../src/mixed-format-layout.js";
import { expandPagePairs } from "../src/orders.js";
import {
  materializePaperSolution,
  minimizePhysicalPaper,
} from "../src/paper-minimizer.js";
import { buildProductionReport } from "../src/production-report.js";

const regression = JSON.parse(
  readFileSync(new URL("../data/production-regression-cases.json", import.meta.url), "utf8"),
);

function placementFor(caseData) {
  return calculatePlacementOptions({
    printable: regression.sheet.printable,
    product: caseData.product,
  });
}

test("32-page A6 landscape 4+4 uses a 4 by 4 grid without rotation", () => {
  const caseData = regression.a6Landscape32Pages;
  const placement = placementFor(caseData);
  const pagePairs = expandPagePairs([caseData]);

  assert.deepEqual(caseData.colors, { front: 4, back: 4 });
  assert.equal(pagePairs.length, caseData.expected.printPairs);
  assert.equal(pagePairs[0].frontPage, 1);
  assert.equal(pagePairs[0].backPage, 2);
  assert.equal(pagePairs.at(-1).frontPage, 31);
  assert.equal(pagePairs.at(-1).backPage, 32);
  assert.equal(placement.best.rotation, caseData.expected.bestRotation);
  assert.equal(placement.best.columns, caseData.expected.columns);
  assert.equal(placement.best.rows, caseData.expected.rows);
  assert.equal(placement.best.positions, caseData.expected.positions);
  assert.deepEqual(placement.best.cell, { width: 148, height: 105 });
  assert.deepEqual(placement.best.used, { width: 592, height: 420 });
});

test("32-page A6 portrait 4+4 rotates to the same 4 by 4 production grid", () => {
  const caseData = regression.a6Portrait32Pages;
  const placement = placementFor(caseData);
  const pagePairs = expandPagePairs([caseData]);

  assert.deepEqual(caseData.colors, { front: 4, back: 4 });
  assert.equal(pagePairs.length, 16);
  assert.equal(placement.best.rotation, caseData.expected.bestRotation);
  assert.equal(placement.best.columns, caseData.expected.columns);
  assert.equal(placement.best.rows, caseData.expected.rows);
  assert.equal(placement.best.positions, caseData.expected.positions);
  assert.deepEqual(placement.best.cell, { width: 148, height: 105 });
  assert.deepEqual(placement.best.used, { width: 592, height: 420 });

  const unrotated = placement.candidates.find((candidate) => candidate.rotation === 0);
  assert.equal(unrotated.columns, 5);
  assert.equal(unrotated.rows, 2);
  assert.equal(unrotated.positions, 10);
});

test("one A4, two A5, and eight A6 fit one 4+4 mixed-format duplex sheet", () => {
  const caseData = regression.mixedFormatsDuplex;
  const front = createMixedFormatFront({
    id: caseData.id,
    printable: regression.sheet.printable,
    placements: caseData.placements,
  });
  const back = createMixedFormatBack(front);
  const validation = validateMixedFormatDuplex({ front, back });

  assert.deepEqual(caseData.colors, { front: 4, back: 4 });
  assert.equal(front.placementCount, caseData.expectedItemCounts.total);
  assert.deepEqual(front.formatCounts, {
    A4: caseData.expectedItemCounts.A4,
    A5: caseData.expectedItemCounts.A5,
    A6: caseData.expectedItemCounts.A6,
  });
  assert.equal(front.usedArea, 248850);
  assert.equal(front.printableArea, 262048);
  assert.equal(front.unusedArea, 13198);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.equal(back.derivedFromFront, true);
  assert.equal(back.mirrorAxis, "horizontal");
  assert.equal(back.placementCount, 11);

  const a4Front = front.placements.find((placement) => placement.id === "A4-1");
  const a4Back = back.placements.find((placement) => placement.id === "A4-1");
  assert.equal(a4Front.x, 0);
  assert.equal(a4Back.x, 311);
  assert.equal(a4Back.page, 2);
  assert.equal(a4Front.direction, "right");
  assert.equal(a4Back.direction, "left");

  const a6RightFront = front.placements.find((placement) => placement.id === "A6-4");
  const a6RightBack = back.placements.find((placement) => placement.id === "A6-4");
  assert.equal(a6RightFront.x, 444);
  assert.equal(a6RightBack.x, 16);
});

test("mixed-format validation rejects overlap and out-of-sheet placement", () => {
  const caseData = regression.mixedFormatsDuplex;
  assert.throws(
    () => createMixedFormatFront({
      id: "OVERLAP",
      printable: regression.sheet.printable,
      placements: [
        caseData.placements[0],
        { ...caseData.placements[1], x: 200 },
      ],
    }),
    /placements overlap/,
  );
  assert.throws(
    () => createMixedFormatFront({
      id: "OUTSIDE",
      printable: regression.sheet.printable,
      placements: [{ ...caseData.placements[0], x: 400 }],
    }),
    /exceeds the printable area/,
  );
});

test("three two-page A5 4+4 orders 400, 700, and 4200 reach the proven 663-sheet minimum", () => {
  const caseData = regression.a5VariableRuns;
  const placement = placementFor(caseData);
  const pagePairs = expandPagePairs(caseData.orders);

  assert.deepEqual(caseData.colors, { front: 4, back: 4 });
  assert.equal(placement.best.rotation, caseData.expected.rotation);
  assert.equal(placement.best.columns, caseData.expected.columns);
  assert.equal(placement.best.rows, caseData.expected.rows);
  assert.equal(placement.best.positions, caseData.expected.positions);
  assert.equal(pagePairs.length, 3);
  assert.deepEqual(pagePairs.map((pair) => pair.quantity), [400, 700, 4200]);

  const solution = minimizePhysicalPaper({
    pagePairs,
    rows: placement.best.rows,
    columns: placement.best.columns,
    rotation: placement.best.rotation,
  });
  const impositions = materializePaperSolution({ solution, pagePairs });
  const report = buildProductionReport({ pagePairs, impositions });

  assert.equal(solution.proof.totalRequiredPairQuantity, caseData.expected.requiredPairQuantity);
  assert.equal(solution.proof.paperLowerBound, caseData.expected.paperLowerBound);
  assert.equal(solution.proof.lowerBoundReached, true);
  assert.equal(solution.metrics.physicalSheets, caseData.expected.physicalSheets);
  assert.equal(solution.metrics.pairOverrun, caseData.expected.pairOverrun);
  assert.equal(solution.metrics.fileOverrun, caseData.expected.fileOverrun);
  assert.equal(solution.metrics.impositionCount, caseData.expected.impositions);
  assert.equal(solution.metrics.forms, caseData.expected.forms);
  assert.equal(solution.metrics.pressPasses, caseData.expected.pressPasses);
  assert.equal(solution.finalDemandState.remainingQuantity, 0);
  assert.deepEqual(solution.plannedRuns.map((run) => run.runLength).sort((a, b) => a - b), [50, 88, 525]);

  assert.equal(report.valid, true);
  assert.equal(report.totals.physicalSheets, 663);
  assert.equal(report.totals.underproduction, 0);
  assert.equal(report.totals.overrun, 4);
  assert.deepEqual(report.fileMetrics.map((metric) => [metric.file, metric.producedQuantity, metric.overrun]), [
    ["A5-400", 400, 0],
    ["A5-700", 704, 4],
    ["A5-4200", 4200, 0],
  ]);
});
