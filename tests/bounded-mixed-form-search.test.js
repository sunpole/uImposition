import test from "node:test";
import assert from "node:assert/strict";
import {
  BOUNDED_MIXED_FORM_SEARCH_COVERAGE_KIND,
  BOUNDED_MIXED_FORM_SEARCH_REQUEST_KIND,
  BOUNDED_SEARCH_COVERAGE,
  BOUNDED_SEARCH_TRUNCATION_REASONS,
  calculateSearchLowerBounds,
  createBoundedMixedFormSearchRequest,
  createBoundedSearchCounters,
  createBoundedSearchCoverage,
  createBoundedSearchLimits,
  createCandidateImpositionSignature,
  createDemandSignature,
  createImpositionSequenceSignature,
} from "../src/bounded-mixed-form-search.js";

function request(overrides = {}) {
  return createBoundedMixedFormSearchRequest({
    problemSignature: "uniform-a6-620x450-1+1",
    demand: [
      { pairId: "file-b:1", requiredQuantity: 35 },
      { pairId: "file-a:1", requiredQuantity: 100 },
      { pairId: "file-c:1", requiredQuantity: 1 },
    ],
    grids: [
      { rows: 4, columns: 4, rotation: 90 },
      { rows: 2, columns: 4, rotation: 0 },
    ],
    duplexModes: ["separateFrontBackForms"],
    limits: {
      maxImpositions: 4,
      maxCandidateImpositions: 500,
      maxStates: 25000,
      timeBudgetMs: 5000,
    },
    ...overrides,
  });
}

function form(cells, overrides = {}) {
  return {
    rows: 2,
    columns: 2,
    rotation: 0,
    duplexMode: "separateFrontBackForms",
    cells,
    ...overrides,
  };
}

const pairA = { pairId: "a:1", frontPage: 1, backPage: 2 };
const pairB = { pairId: "b:1", frontPage: 1, backPage: 2 };

test("search limits require explicit positive bounds", () => {
  assert.deepEqual(createBoundedSearchLimits({
    maxImpositions: 4,
    maxCandidateImpositions: 100,
    maxStates: 1000,
    timeBudgetMs: 5000,
  }), {
    maxImpositions: 4,
    maxCandidateImpositions: 100,
    maxStates: 1000,
    timeBudgetMs: 5000,
    maxRunLength: null,
  });
  assert.throws(() => createBoundedSearchLimits({
    maxImpositions: 0,
    maxCandidateImpositions: 100,
    maxStates: 1000,
    timeBudgetMs: 5000,
  }), /maxImpositions/);
});

test("request canonicalization is independent from demand, grid, and duplex input order", () => {
  const left = request({
    duplexModes: ["workAndTurn", "separateFrontBackForms"],
  });
  const right = createBoundedMixedFormSearchRequest({
    problemSignature: left.problemSignature,
    demand: [...left.demand].reverse(),
    grids: [...left.grids].reverse(),
    duplexModes: [...left.duplexModes].reverse(),
    allowPartialForms: true,
    allowPairMixing: true,
    limits: left.limits,
  });

  assert.equal(left.kind, BOUNDED_MIXED_FORM_SEARCH_REQUEST_KIND);
  assert.equal(left.requestedSpaceSignature, right.requestedSpaceSignature);
  assert.deepEqual(left.demand.map(({ pairId }) => pairId), ["file-a:1", "file-b:1", "file-c:1"]);
  assert.equal(left.globalCompletenessClaimed, false);
  assert.equal(Object.isFrozen(left), true);
  assert.equal(Object.isFrozen(left.demand), true);
});

test("demand signature keeps quantities but ignores input order", () => {
  assert.equal(
    createDemandSignature([
      { pairId: "b", requiredQuantity: 20 },
      { pairId: "a", requiredQuantity: 10 },
    ]),
    createDemandSignature([
      { pairId: "a", requiredQuantity: 10 },
      { pairId: "b", requiredQuantity: 20 },
    ]),
  );
  assert.notEqual(
    createDemandSignature([{ pairId: "a", requiredQuantity: 10 }]),
    createDemandSignature([{ pairId: "a", requiredQuantity: 11 }]),
  );
});

test("candidate imposition signature preserves grid, duplex strategy, cell order, pages, and blanks", () => {
  const original = createCandidateImpositionSignature(form([pairA, pairB, null, pairA]));
  assert.equal(
    original,
    createCandidateImpositionSignature(form([pairA, pairB, null, pairA])),
  );
  assert.notEqual(
    original,
    createCandidateImpositionSignature(form([pairB, pairA, null, pairA])),
  );
  assert.notEqual(
    original,
    createCandidateImpositionSignature(form([pairA, pairB, pairA, null])),
  );
  assert.notEqual(
    original,
    createCandidateImpositionSignature(form([pairA, pairB, null, pairA], { rotation: 90 })),
  );
  assert.notEqual(
    original,
    createCandidateImpositionSignature(form([pairA, pairB, null, pairA], {
      duplexMode: "workAndTurn",
      turnMode: "horizontalLeftToRight",
    })),
  );
});

test("candidate imposition signature rejects empty and incorrectly sized impositions", () => {
  assert.throws(() => createCandidateImpositionSignature(form([pairA])), /exactly 4/);
  assert.throws(() => createCandidateImpositionSignature(form([null, null, null, null])), /occupied cell/);
});

test("candidate imposition signature enforces duplex and page identity", () => {
  assert.throws(() => createCandidateImpositionSignature(form([
    { pairId: "a:1", frontPage: null, backPage: null },
    null,
    null,
    null,
  ])), /frontPage or backPage/);
  assert.throws(() => createCandidateImpositionSignature(form([
    pairA,
    null,
    null,
    null,
  ], {
    duplexMode: "workAndTurn",
  })), /requires turnMode/);
  assert.throws(() => createCandidateImpositionSignature(form([
    pairA,
    null,
    null,
    null,
  ], {
    turnMode: "horizontalLeftToRight",
  })), /only valid for workAndTurn/);
});

test("imposition sequence signature ignores run ordering and combines identical imposition runs", () => {
  const impositionA = createCandidateImpositionSignature(form([pairA, pairA, null, null]));
  const impositionB = createCandidateImpositionSignature(form([pairB, null, pairB, null]));
  const left = createImpositionSequenceSignature([
    { impositionSignature: impositionB, runLength: 20 },
    { impositionSignature: impositionA, runLength: 10 },
    { impositionSignature: impositionA, runLength: 5 },
  ]);
  const right = createImpositionSequenceSignature([
    { impositionSignature: impositionA, runLength: 15 },
    { impositionSignature: impositionB, runLength: 20 },
  ]);
  assert.equal(left, right);
  assert.notEqual(left, createImpositionSequenceSignature([
    { impositionSignature: impositionA, runLength: 14 },
    { impositionSignature: impositionB, runLength: 20 },
  ]));
});

test("lower bounds are safe inside the explicitly requested uniform space", () => {
  const bounds = calculateSearchLowerBounds(request());
  assert.deepEqual(bounds, {
    capacityUpperBound: 16,
    totalRequiredPairCopies: 136,
    activePairCount: 3,
    minimumPhysicalSheets: 9,
    minimumImpositionCount: 1,
    minimumLayoutForms: 2,
    globalOptimalityClaimed: false,
  });

  const twentyPairs = Array.from({ length: 20 }, (_, index) => ({
    pairId: `pair-${index + 1}`,
    requiredQuantity: 1,
  }));
  const twentyRequest = request({ demand: twentyPairs });
  assert.equal(calculateSearchLowerBounds(twentyRequest).minimumImpositionCount, 2);
  assert.equal(calculateSearchLowerBounds(twentyRequest).minimumLayoutForms, 4);
});

test("work-and-turn lowers only the safe layout-form bound", () => {
  const bounds = calculateSearchLowerBounds(request({
    duplexModes: ["separateFrontBackForms", "workAndTurn"],
  }));
  assert.equal(bounds.minimumPhysicalSheets, 9);
  assert.equal(bounds.minimumImpositionCount, 1);
  assert.equal(bounds.minimumLayoutForms, 1);
});

test("search counters are immutable and reject impossible candidate counts", () => {
  const counters = createBoundedSearchCounters({
    candidateImpositionsGenerated: 20,
    candidateImpositionsAccepted: 12,
    statesExpanded: 200,
    statesPrunedByBound: 40,
    statesPrunedByDominance: 30,
    feasiblePlansFound: 5,
    elapsedMs: 12.5,
  });
  assert.equal(Object.isFrozen(counters), true);
  assert.throws(() => createBoundedSearchCounters({
    candidateImpositionsGenerated: 2,
    candidateImpositionsAccepted: 3,
  }), /cannot exceed/);
});

test("complete coverage is claimed only for the declared requested space", () => {
  const searchRequest = request();
  const coverage = createBoundedSearchCoverage({
    request: searchRequest,
    counters: {
      candidateImpositionsGenerated: 120,
      candidateImpositionsAccepted: 80,
      statesExpanded: 2000,
      statesPrunedByBound: 500,
      statesPrunedByDominance: 300,
      feasiblePlansFound: 12,
      elapsedMs: 750,
    },
    enumerationComplete: true,
    theoreticalCandidateImpositionCount: 120,
  });

  assert.equal(coverage.kind, BOUNDED_MIXED_FORM_SEARCH_COVERAGE_KIND);
  assert.equal(coverage.state, BOUNDED_SEARCH_COVERAGE.COMPLETE_WITHIN_REQUESTED_SPACE);
  assert.equal(coverage.completeWithinRequestedSpace, true);
  assert.equal(coverage.globalCompletenessClaimed, false);
  assert.deepEqual(coverage.truncationReasons, []);
  assert.equal(coverage.requestSignature, searchRequest.requestedSpaceSignature);
});

test("truncated coverage records all deterministic stop reasons without claiming completeness", () => {
  const coverage = createBoundedSearchCoverage({
    request: request(),
    counters: {
      candidateImpositionsGenerated: 500,
      candidateImpositionsAccepted: 320,
      statesExpanded: 25000,
      feasiblePlansFound: 7,
      elapsedMs: 5001,
    },
    enumerationComplete: false,
    theoreticalCandidateImpositionCount: null,
    truncationReasons: [
      BOUNDED_SEARCH_TRUNCATION_REASONS.TIME_BUDGET,
      BOUNDED_SEARCH_TRUNCATION_REASONS.CANDIDATE_IMPOSITION_LIMIT,
      BOUNDED_SEARCH_TRUNCATION_REASONS.STATE_LIMIT,
    ],
  });

  assert.equal(coverage.state, BOUNDED_SEARCH_COVERAGE.TRUNCATED);
  assert.equal(coverage.completeWithinRequestedSpace, false);
  assert.equal(coverage.globalCompletenessClaimed, false);
  assert.deepEqual(coverage.truncationReasons, [
    "candidateImpositionLimit",
    "stateLimit",
    "timeBudget",
  ]);
});

test("coverage rejects contradictory or out-of-budget claims", () => {
  const searchRequest = request();
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateImpositionsGenerated: 10 },
    enumerationComplete: true,
    theoreticalCandidateImpositionCount: 10,
    truncationReasons: [BOUNDED_SEARCH_TRUNCATION_REASONS.CANCELLED],
  }), /cannot have truncation/);
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateImpositionsGenerated: 10 },
    enumerationComplete: false,
  }), /requires at least one/);
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateImpositionsGenerated: 501 },
    enumerationComplete: false,
    truncationReasons: [BOUNDED_SEARCH_TRUNCATION_REASONS.CANDIDATE_IMPOSITION_LIMIT],
  }), /exceeds request/);
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateImpositionsGenerated: 9 },
    enumerationComplete: true,
    theoreticalCandidateImpositionCount: 10,
  }), /equal theoretical/);
});
