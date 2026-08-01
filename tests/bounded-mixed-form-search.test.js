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
  createCandidateFormSignature,
  createDemandSignature,
  createFormSequenceSignature,
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
      maxForms: 4,
      maxCandidateForms: 500,
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
    maxForms: 4,
    maxCandidateForms: 100,
    maxStates: 1000,
    timeBudgetMs: 5000,
  }), {
    maxForms: 4,
    maxCandidateForms: 100,
    maxStates: 1000,
    timeBudgetMs: 5000,
    maxRunLength: null,
  });
  assert.throws(() => createBoundedSearchLimits({
    maxForms: 0,
    maxCandidateForms: 100,
    maxStates: 1000,
    timeBudgetMs: 5000,
  }), /maxForms/);
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

test("candidate form signature preserves grid, duplex strategy, cell order, pages, and blanks", () => {
  const original = createCandidateFormSignature(form([pairA, pairB, null, pairA]));
  assert.equal(
    original,
    createCandidateFormSignature(form([pairA, pairB, null, pairA])),
  );
  assert.notEqual(
    original,
    createCandidateFormSignature(form([pairB, pairA, null, pairA])),
  );
  assert.notEqual(
    original,
    createCandidateFormSignature(form([pairA, pairB, pairA, null])),
  );
  assert.notEqual(
    original,
    createCandidateFormSignature(form([pairA, pairB, null, pairA], { rotation: 90 })),
  );
  assert.notEqual(
    original,
    createCandidateFormSignature(form([pairA, pairB, null, pairA], {
      duplexMode: "workAndTurn",
      turnMode: "horizontalLeftToRight",
    })),
  );
});

test("candidate form signature rejects empty and incorrectly sized forms", () => {
  assert.throws(() => createCandidateFormSignature(form([pairA])), /exactly 4/);
  assert.throws(() => createCandidateFormSignature(form([null, null, null, null])), /occupied cell/);
});

test("form sequence signature ignores run ordering and combines identical form runs", () => {
  const formA = createCandidateFormSignature(form([pairA, pairA, null, null]));
  const formB = createCandidateFormSignature(form([pairB, null, pairB, null]));
  const left = createFormSequenceSignature([
    { formSignature: formB, runLength: 20 },
    { formSignature: formA, runLength: 10 },
    { formSignature: formA, runLength: 5 },
  ]);
  const right = createFormSequenceSignature([
    { formSignature: formA, runLength: 15 },
    { formSignature: formB, runLength: 20 },
  ]);
  assert.equal(left, right);
  assert.notEqual(left, createFormSequenceSignature([
    { formSignature: formA, runLength: 14 },
    { formSignature: formB, runLength: 20 },
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
    candidateFormsGenerated: 20,
    candidateFormsAccepted: 12,
    statesExpanded: 200,
    statesPrunedByBound: 40,
    statesPrunedByDominance: 30,
    feasiblePlansFound: 5,
    elapsedMs: 12.5,
  });
  assert.equal(Object.isFrozen(counters), true);
  assert.throws(() => createBoundedSearchCounters({
    candidateFormsGenerated: 2,
    candidateFormsAccepted: 3,
  }), /cannot exceed/);
});

test("complete coverage is claimed only for the declared requested space", () => {
  const searchRequest = request();
  const coverage = createBoundedSearchCoverage({
    request: searchRequest,
    counters: {
      candidateFormsGenerated: 120,
      candidateFormsAccepted: 80,
      statesExpanded: 2000,
      statesPrunedByBound: 500,
      statesPrunedByDominance: 300,
      feasiblePlansFound: 12,
      elapsedMs: 750,
    },
    enumerationComplete: true,
    theoreticalCandidateFormCount: 120,
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
      candidateFormsGenerated: 500,
      candidateFormsAccepted: 320,
      statesExpanded: 25000,
      feasiblePlansFound: 7,
      elapsedMs: 5001,
    },
    enumerationComplete: false,
    theoreticalCandidateFormCount: null,
    truncationReasons: [
      BOUNDED_SEARCH_TRUNCATION_REASONS.TIME_BUDGET,
      BOUNDED_SEARCH_TRUNCATION_REASONS.CANDIDATE_FORM_LIMIT,
      BOUNDED_SEARCH_TRUNCATION_REASONS.STATE_LIMIT,
    ],
  });

  assert.equal(coverage.state, BOUNDED_SEARCH_COVERAGE.TRUNCATED);
  assert.equal(coverage.completeWithinRequestedSpace, false);
  assert.equal(coverage.globalCompletenessClaimed, false);
  assert.deepEqual(coverage.truncationReasons, [
    "candidateFormLimit",
    "stateLimit",
    "timeBudget",
  ]);
});

test("coverage rejects contradictory or out-of-budget claims", () => {
  const searchRequest = request();
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateFormsGenerated: 10 },
    enumerationComplete: true,
    theoreticalCandidateFormCount: 10,
    truncationReasons: [BOUNDED_SEARCH_TRUNCATION_REASONS.CANCELLED],
  }), /cannot have truncation/);
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateFormsGenerated: 10 },
    enumerationComplete: false,
  }), /requires at least one/);
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateFormsGenerated: 501 },
    enumerationComplete: false,
    truncationReasons: [BOUNDED_SEARCH_TRUNCATION_REASONS.CANDIDATE_FORM_LIMIT],
  }), /exceeds request/);
  assert.throws(() => createBoundedSearchCoverage({
    request: searchRequest,
    counters: { candidateFormsGenerated: 9 },
    enumerationComplete: true,
    theoreticalCandidateFormCount: 10,
  }), /equal theoretical/);
});
