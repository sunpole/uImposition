import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPagePairs } from "../src/orders.js";
import { createFrontLayout } from "../src/front-layout.js";
import {
  calculateCandidateRunBounds,
  createFrontLayoutInputFromCandidate,
  createImpositionCandidate,
  createInitialDemandState,
  evaluateCandidateRun,
} from "../src/imposition-candidate.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const controlLayout = JSON.parse(
  readFileSync(new URL("../data/control-layout-m3.json", import.meta.url), "utf8"),
);
const pagePairs = expandPagePairs(controlCase.orders);

function candidateFromLayout(layout) {
  return createImpositionCandidate({ ...layout, pagePairs });
}

test("a control layout becomes a full immutable candidate", () => {
  const candidate = candidateFromLayout(controlLayout.layouts[0]);

  assert.equal(candidate.id, "1");
  assert.equal(candidate.rows, 4);
  assert.equal(candidate.columns, 4);
  assert.equal(candidate.rotation, 90);
  assert.equal(candidate.direction, "right");
  assert.equal(candidate.capacity, 16);
  assert.equal(candidate.filledPositions, 16);
  assert.equal(candidate.pairCount, 6);
  assert.deepEqual(candidate.pairPositions.map((pair) => [pair.file, pair.frontPage, pair.positionCount]), [
    ["33", 1, 6],
    ["33", 3, 6],
    ["70", 1, 1],
    ["70", 3, 1],
    ["25", 1, 1],
    ["25", 3, 1],
  ]);
  assert.ok(Object.isFrozen(candidate));
  assert.ok(Object.isFrozen(candidate.blocks));
  assert.ok(Object.isFrozen(candidate.pairPositions));
  assert.ok(candidate.blocks.every(Object.isFrozen));
});

test("first saturation and candidate completion are distinct run lengths", () => {
  const candidate = candidateFromLayout(controlLayout.layouts[0]);
  const demandState = createInitialDemandState(pagePairs);
  const bounds = calculateCandidateRunBounds({ candidate, demandState });

  assert.equal(bounds.needed, true);
  assert.equal(bounds.activePairCount, 6);
  assert.equal(bounds.firstSaturationRunLength, 1500);
  assert.equal(bounds.completionRunLength, 3500);
  assert.deepEqual(bounds.firstSatisfiedPairs.map((pair) => [pair.file, pair.pairIndex]), [
    ["25", 1],
    ["25", 2],
  ]);
  assert.deepEqual(bounds.completionPairs.map((pair) => [pair.file, pair.pairIndex]), [
    ["70", 1],
    ["70", 2],
  ]);
  assert.ok(Object.isFrozen(bounds));
  assert.ok(Object.isFrozen(bounds.activePairs));
});

test("the manual 1500 run closes file 25 but not every pair on candidate 1", () => {
  const candidate = candidateFromLayout(controlLayout.layouts[0]);
  const initialDemand = createInitialDemandState(pagePairs);
  const result = evaluateCandidateRun({ candidate, demandState: initialDemand, runLength: 1500 });

  assert.equal(result.physicalSheets, 1500);
  assert.equal(result.producedIncrement, 24000);
  assert.equal(result.overrunIncrement, 0);
  assert.equal(result.newlySatisfiedPairCount, 2);
  assert.equal(result.candidatePairsSatisfied, false);
  assert.equal(result.allDemandSatisfied, false);
  assert.equal(initialDemand.producedQuantity, 0);

  const file25 = result.pairResults.filter((pair) => pair.file === "25");
  const file33 = result.pairResults.filter((pair) => pair.file === "33");
  const file70 = result.pairResults.filter((pair) => pair.file === "70");
  assert.ok(file25.every((pair) => pair.remainingAfter === 0));
  assert.ok(file33.every((pair) => pair.remainingAfter === 650));
  assert.ok(file70.every((pair) => pair.remainingAfter === 2000));

  const frontInput = createFrontLayoutInputFromCandidate(candidate, 1500);
  const front = createFrontLayout({ ...frontInput, pagePairs });
  assert.equal(front.runLength, 1500);
  assert.equal(front.cells.length, 16);
  assert.equal(front.cells[0].file, "33");
  assert.equal(front.cells.at(-1).file, "25");
});

test("the four manual runs close all demand and reproduce the M4 totals", () => {
  const candidates = controlLayout.layouts.map(candidateFromLayout);
  let demandState = createInitialDemandState(pagePairs);
  let physicalSheets = 0;

  controlLayout.layouts.forEach((layout, index) => {
    const result = evaluateCandidateRun({
      candidate: candidates[index],
      demandState,
      runLength: layout.runLength,
    });
    physicalSheets += result.physicalSheets;
    demandState = result.nextDemandState;
  });

  assert.equal(physicalSheets, 3395);
  assert.equal(demandState.requiredQuantity, 52870);
  assert.equal(demandState.producedQuantity, 54320);
  assert.equal(demandState.remainingQuantity, 0);
  assert.equal(demandState.overrunQuantity, 1450);
  assert.equal(demandState.satisfiedPairCount, 35);
  assert.equal(demandState.allSatisfied, true);
  assert.ok(Object.isFrozen(demandState));
  assert.ok(Object.isFrozen(demandState.rows));

  const noLongerNeeded = calculateCandidateRunBounds({
    candidate: candidates[0],
    demandState,
  });
  assert.equal(noLongerNeeded.needed, false);
  assert.equal(noLongerNeeded.firstSaturationRunLength, 0);
  assert.equal(noLongerNeeded.completionRunLength, 0);
});

test("completion run independently closes every active pair present on a candidate", () => {
  const candidate = candidateFromLayout(controlLayout.layouts[0]);
  const initialDemand = createInitialDemandState(pagePairs);
  const bounds = calculateCandidateRunBounds({ candidate, demandState: initialDemand });
  const result = evaluateCandidateRun({
    candidate,
    demandState: initialDemand,
    runLength: bounds.completionRunLength,
  });

  assert.equal(result.candidatePairsSatisfied, true);
  assert.equal(result.allDemandSatisfied, false);
  assert.equal(result.pairResults.find((pair) => pair.file === "70").remainingAfter, 0);
  assert.ok(result.overrunIncrement > 0);
});

test("invalid candidates and run inputs are rejected", () => {
  const layout = controlLayout.layouts[0];

  assert.throws(
    () => createImpositionCandidate({
      ...layout,
      blocks: layout.blocks.slice(0, -1),
      pagePairs,
    }),
    /requires exactly 16 positions/,
  );

  assert.throws(
    () => createImpositionCandidate({
      ...layout,
      blocks: [
        layout.blocks[0],
        { ...layout.blocks[0], count: 10 },
      ],
      pagePairs,
    }),
    /Duplicate candidate block/,
  );

  assert.throws(
    () => createImpositionCandidate({
      ...layout,
      blocks: [{ file: "UNKNOWN", frontPage: 1, count: 16 }],
      pagePairs,
    }),
    /Unknown page pair/,
  );

  const candidate = candidateFromLayout(layout);
  const demandState = createInitialDemandState(pagePairs);
  assert.throws(
    () => evaluateCandidateRun({ candidate, demandState, runLength: 0 }),
    /runLength must be a positive integer/,
  );
  assert.throws(
    () => calculateCandidateRunBounds({
      candidate,
      demandState: createInitialDemandState(pagePairs.slice(2)),
    }),
    /missing from demand state/,
  );
});
