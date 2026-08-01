import test from "node:test";
import assert from "node:assert/strict";
import {
  createBoundedMixedFormSearchRequest,
} from "../src/bounded-mixed-form-search.js";
import {
  BOUNDED_CANDIDATE_IMPOSITION_CATALOG_KIND,
  buildBoundedCandidateImpositionCatalog,
} from "../src/bounded-candidate-imposition-catalog.js";
import {
  countCandidateSpace,
  countCandidateSpaceBigInt,
} from "../src/candidate-generator.js";
import { createInitialDemandState } from "../src/imposition-candidate.js";

const pagePairs = Object.freeze([
  Object.freeze({ file: "A", pairIndex: 1, quantity: 100, frontPage: 1, backPage: 2 }),
  Object.freeze({ file: "B", pairIndex: 1, quantity: 80, frontPage: 1, backPage: 2 }),
  Object.freeze({ file: "C", pairIndex: 1, quantity: 60, frontPage: 1, backPage: 2 }),
  Object.freeze({ file: "D", pairIndex: 1, quantity: 40, frontPage: 1, backPage: 2 }),
]);

function demandFor(pairs = pagePairs) {
  return createInitialDemandState(pairs).rows.map(({ key, requiredQuantity }) => ({
    pairId: key,
    requiredQuantity,
  }));
}

function request(overrides = {}) {
  return createBoundedMixedFormSearchRequest({
    problemSignature: "test-uniform-1+1",
    demand: demandFor(),
    grids: [{ rows: 2, columns: 2, rotation: 0 }],
    duplexModes: ["separateFrontBackForms"],
    allowPartialForms: false,
    allowPairMixing: true,
    limits: {
      maxImpositions: 4,
      maxCandidateImpositions: 100,
      maxStates: 10000,
      timeBudgetMs: 5000,
    },
    ...overrides,
  });
}

test("candidate-space BigInt counting remains exact beyond Number.MAX_SAFE_INTEGER", () => {
  const exact = countCandidateSpaceBigInt({
    selectedPairCount: 100,
    capacity: 16,
    minDistinctPairs: 1,
    maxDistinctPairs: 16,
  });
  assert.ok(exact > BigInt(Number.MAX_SAFE_INTEGER));
  assert.throws(() => countCandidateSpace({
    selectedPairCount: 100,
    capacity: 16,
    minDistinctPairs: 1,
    maxDistinctPairs: 16,
  }), /Number.MAX_SAFE_INTEGER/);
});

test("one small grid produces the exact lossless one- and two-pair catalog", () => {
  const catalog = buildBoundedCandidateImpositionCatalog({
    request: request(),
    pagePairs,
    minDistinctPairs: 1,
    maxDistinctPairs: 2,
    idPrefix: "SMALL",
  });

  assert.equal(catalog.kind, BOUNDED_CANDIDATE_IMPOSITION_CATALOG_KIND);
  assert.equal(catalog.theoreticalCandidateImpositionCount, 22);
  assert.equal(catalog.theoreticalCandidateImpositionCountExact, "22");
  assert.equal(catalog.generatedCandidateImpositionCount, 22);
  assert.equal(catalog.completeWithinCatalogSpace, true);
  assert.equal(catalog.coverage.completeWithinRequestedSpace, true);
  assert.equal(catalog.coverage.globalCompletenessClaimed, false);
  assert.equal(new Set(catalog.entries.map(({ structuralSignature }) => structuralSignature)).size, 22);
  assert.ok(catalog.entries.every(({ cells, candidate }) => cells.length === candidate.capacity));
  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.entries), true);
});

test("a global candidate limit is distributed across grids instead of starving later grids", () => {
  const catalog = buildBoundedCandidateImpositionCatalog({
    request: request({
      grids: [
        { rows: 1, columns: 2, rotation: 0 },
        { rows: 2, columns: 2, rotation: 90 },
      ],
      limits: {
        maxImpositions: 4,
        maxCandidateImpositions: 5,
        maxStates: 10000,
        timeBudgetMs: 5000,
      },
    }),
    pagePairs,
    minDistinctPairs: 1,
    maxDistinctPairs: 2,
  });

  assert.equal(catalog.theoreticalCandidateImpositionCount, 32);
  assert.equal(catalog.generatedCandidateImpositionCount, 5);
  assert.equal(catalog.completeWithinCatalogSpace, false);
  assert.equal(catalog.coverage.state, "truncated");
  assert.deepEqual(
    catalog.gridSummaries.map(({ generatedCandidateImpositionCount }) => generatedCandidateImpositionCount),
    [3, 2],
  );
  assert.ok(catalog.gridSummaries.every(({ generatedCandidateImpositionCount }) => (
    generatedCandidateImpositionCount > 0
  )));
});

test("catalog signatures and order are independent from pagePairs input order", () => {
  const direct = buildBoundedCandidateImpositionCatalog({
    request: request(),
    pagePairs,
    minDistinctPairs: 1,
    maxDistinctPairs: 2,
  });
  const reversed = buildBoundedCandidateImpositionCatalog({
    request: request(),
    pagePairs: [...pagePairs].reverse(),
    minDistinctPairs: 1,
    maxDistinctPairs: 2,
  });

  assert.deepEqual(
    direct.entries.map(({ structuralSignature }) => structuralSignature),
    reversed.entries.map(({ structuralSignature }) => structuralSignature),
  );
});

test("pair mixing can be disabled by the parent request", () => {
  const catalog = buildBoundedCandidateImpositionCatalog({
    request: request({ allowPairMixing: false }),
    pagePairs,
    minDistinctPairs: 1,
    maxDistinctPairs: 4,
  });
  assert.equal(catalog.maxDistinctPairs, 1);
  assert.equal(catalog.generatedCandidateImpositionCount, 4);
  assert.ok(catalog.entries.every(({ distinctPairCount }) => distinctPairCount === 1));
});

test("unsupported partial and duplex spaces are rejected instead of receiving false completeness", () => {
  assert.throws(() => buildBoundedCandidateImpositionCatalog({
    request: request({ allowPartialForms: true }),
    pagePairs,
  }), /full-capacity/);

  assert.throws(() => buildBoundedCandidateImpositionCatalog({
    request: request({ duplexModes: ["workAndTurn"] }),
    pagePairs,
  }), /requires separateFrontBackForms/);
});

test("request demand must refer to the same page-pair quantities", () => {
  const mismatchedDemand = demandFor();
  mismatchedDemand[0] = {
    ...mismatchedDemand[0],
    requiredQuantity: mismatchedDemand[0].requiredQuantity + 1,
  };
  assert.throws(() => buildBoundedCandidateImpositionCatalog({
    request: request({ demand: mismatchedDemand }),
    pagePairs,
  }), /quantity differs/);

  assert.throws(() => buildBoundedCandidateImpositionCatalog({
    request: request({ demand: [{ pairId: "unknown", requiredQuantity: 1 }] }),
    pagePairs,
  }), /unknown pairId/);
});
