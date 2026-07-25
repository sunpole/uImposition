import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPagePairs } from "../src/orders.js";
import { createImpositionCandidate } from "../src/imposition-candidate.js";
import {
  candidateProductionSignature,
  countCandidateSpace,
  generateImpositionCandidates,
} from "../src/candidate-generator.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const pagePairs = expandPagePairs(controlCase.orders);

function pairRef(pair) {
  return { file: pair.file, pairIndex: pair.pairIndex };
}

test("the complete one- and two-pair control space contains 8960 candidates", () => {
  assert.equal(countCandidateSpace({
    selectedPairCount: 35,
    capacity: 16,
    minDistinctPairs: 1,
    maxDistinctPairs: 2,
  }), 8960);

  const result = generateImpositionCandidates({
    pagePairs,
    rows: 4,
    columns: 4,
    rotation: 90,
  });

  assert.equal(result.selectedPairCount, 35);
  assert.equal(result.capacity, 16);
  assert.equal(result.theoreticalCandidateCount, 8960);
  assert.equal(result.candidateCount, 8960);
  assert.equal(result.truncatedCandidateCount, 0);
  assert.equal(result.truncated, false);
  assert.equal(result.completeWithinRequestedSpace, true);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.candidates));
  assert.ok(result.candidates.every((candidate) => candidate.capacity === 16));

  assert.equal(result.candidates[0].id, "AUTO-0001");
  assert.deepEqual(result.candidates[0].pairPositions.map((pair) => [pair.file, pair.pairIndex, pair.positionCount]), [
    ["70", 1, 16],
  ]);
  assert.deepEqual(result.candidates[35].pairPositions.map((pair) => [pair.file, pair.pairIndex, pair.positionCount]), [
    ["70", 1, 1],
    ["70", 2, 15],
  ]);

  const signatures = result.candidates.map(candidateProductionSignature);
  assert.equal(new Set(signatures).size, 8960);
});

test("small requested spaces have an exact combinatorial count and deterministic order", () => {
  const selectedPairRefs = pagePairs.slice(0, 4).map(pairRef);
  const result = generateImpositionCandidates({
    pagePairs,
    rows: 2,
    columns: 2,
    rotation: 0,
    selectedPairRefs,
    minDistinctPairs: 1,
    maxDistinctPairs: 2,
    maxCandidates: 100,
    idPrefix: "SMALL",
  });

  assert.equal(result.theoreticalCandidateCount, 22);
  assert.equal(result.candidateCount, 22);
  assert.equal(result.completeWithinRequestedSpace, true);
  assert.equal(result.candidates[0].id, "SMALL-0001");
  assert.deepEqual(result.candidates[0].pairPositions.map((pair) => pair.positionCount), [4]);
  assert.deepEqual(result.candidates[4].pairPositions.map((pair) => pair.positionCount), [1, 3]);
  assert.deepEqual(result.candidates[5].pairPositions.map((pair) => pair.positionCount), [2, 2]);
  assert.deepEqual(result.candidates[6].pairPositions.map((pair) => pair.positionCount), [3, 1]);
});

test("an explicit candidate limit reports truncation instead of pretending completeness", () => {
  const result = generateImpositionCandidates({
    pagePairs,
    rows: 4,
    columns: 4,
    rotation: 90,
    maxCandidates: 100,
  });

  assert.equal(result.theoreticalCandidateCount, 8960);
  assert.equal(result.candidateCount, 100);
  assert.equal(result.truncatedCandidateCount, 8860);
  assert.equal(result.truncated, true);
  assert.equal(result.completeWithinRequestedSpace, false);
  assert.equal(result.candidates.at(-1).id, "AUTO-0100");
});

test("production signatures merge block-order equivalents but preserve position counts", () => {
  const first = pagePairs[0];
  const second = pagePairs[1];
  const candidateA = createImpositionCandidate({
    id: "A",
    rows: 1,
    columns: 4,
    rotation: 0,
    pagePairs,
    blocks: [
      { file: first.file, frontPage: first.frontPage, count: 1 },
      { file: second.file, frontPage: second.frontPage, count: 3 },
    ],
  });
  const candidateB = createImpositionCandidate({
    id: "B",
    rows: 1,
    columns: 4,
    rotation: 0,
    pagePairs,
    blocks: [
      { file: second.file, frontPage: second.frontPage, count: 3 },
      { file: first.file, frontPage: first.frontPage, count: 1 },
    ],
  });
  const candidateC = createImpositionCandidate({
    id: "C",
    rows: 1,
    columns: 4,
    rotation: 0,
    pagePairs,
    blocks: [
      { file: first.file, frontPage: first.frontPage, count: 2 },
      { file: second.file, frontPage: second.frontPage, count: 2 },
    ],
  });

  assert.equal(candidateProductionSignature(candidateA), candidateProductionSignature(candidateB));
  assert.notEqual(candidateProductionSignature(candidateA), candidateProductionSignature(candidateC));
});

test("invalid generation boundaries and pair selections are rejected", () => {
  assert.throws(
    () => generateImpositionCandidates({
      pagePairs,
      rows: 4,
      columns: 4,
      rotation: 90,
      selectedPairRefs: [pairRef(pagePairs[0]), pairRef(pagePairs[0])],
    }),
    /Duplicate selected pair/,
  );

  assert.throws(
    () => generateImpositionCandidates({
      pagePairs,
      rows: 4,
      columns: 4,
      rotation: 90,
      selectedPairRefs: [{ file: "UNKNOWN", pairIndex: 1 }],
    }),
    /Unknown selected pair/,
  );

  assert.throws(
    () => countCandidateSpace({
      selectedPairCount: 1,
      capacity: 16,
      minDistinctPairs: 2,
      maxDistinctPairs: 2,
    }),
    /minDistinctPairs exceeds/,
  );

  assert.throws(
    () => generateImpositionCandidates({
      pagePairs,
      rows: 4,
      columns: 4,
      rotation: 90,
      maxCandidates: 0,
    }),
    /maxCandidates must be a positive integer/,
  );
});
