import {
  BOUNDED_MIXED_FORM_SEARCH_REQUEST_KIND,
  BOUNDED_SEARCH_TRUNCATION_REASONS,
  createBoundedSearchCoverage,
  createCandidateImpositionSignature,
} from "./bounded-mixed-form-search.js";
import {
  candidateProductionSignature,
  countCandidateSpaceBigInt,
  generateImpositionCandidates,
} from "./candidate-generator.js";
import { createInitialDemandState } from "./imposition-candidate.js";

export const BOUNDED_CANDIDATE_IMPOSITION_CATALOG_KIND = "boundedCandidateImpositionCatalog";
export const BOUNDED_CANDIDATE_IMPOSITION_SCOPE_KIND = "boundedCandidateImpositionScope";

const SEPARATE_DUPLEX = "separateFrontBackForms";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function requireRequest(request) {
  if (request?.kind !== BOUNDED_MIXED_FORM_SEARCH_REQUEST_KIND) {
    throw new TypeError("request must be a bounded mixed-form search request");
  }
  return request;
}

function pairSelectionForRequest(request, pagePairs) {
  const state = createInitialDemandState(pagePairs);
  const byKey = new Map(state.rows.map((row) => [row.key, row]));
  return Object.freeze(request.demand.map(({ pairId, requiredQuantity }, index) => {
    const row = byKey.get(pairId);
    if (!row) {
      throw new RangeError(`request.demand[${index}] references an unknown pairId: ${pairId}`);
    }
    if (row.requiredQuantity !== requiredQuantity) {
      throw new RangeError(
        `request demand quantity differs from pagePairs for ${pairId}: ${requiredQuantity} != ${row.requiredQuantity}`,
      );
    }
    return Object.freeze({ file: row.file, pairIndex: row.pairIndex });
  }));
}

function effectiveDistinctRange({ request, minDistinctPairs, maxDistinctPairs }) {
  const minimum = requirePositiveInteger(minDistinctPairs, "minDistinctPairs");
  const requestedMaximum = requirePositiveInteger(maxDistinctPairs, "maxDistinctPairs");
  const maximum = request.allowPairMixing ? requestedMaximum : 1;
  if (minimum > maximum) {
    throw new RangeError("minDistinctPairs cannot exceed maxDistinctPairs");
  }
  return Object.freeze({ minimum, maximum });
}

function countForGrid({ grid, selectedPairCount, distinctRange }) {
  const effectiveMaximum = Math.min(
    distinctRange.maximum,
    selectedPairCount,
    grid.capacity,
  );
  if (distinctRange.minimum > effectiveMaximum) return 0n;
  return countCandidateSpaceBigInt({
    selectedPairCount,
    capacity: grid.capacity,
    minDistinctPairs: distinctRange.minimum,
    maxDistinctPairs: effectiveMaximum,
  });
}

function allocateFairBudgets(counts, totalLimit) {
  const limit = requirePositiveInteger(totalLimit, "request.limits.maxCandidateImpositions");
  const caps = counts.map((count) => Number(count < BigInt(limit) ? count : BigInt(limit)));
  const budgets = caps.map(() => 0);
  let remaining = limit;
  let progressed = true;
  while (remaining > 0 && progressed) {
    progressed = false;
    for (let index = 0; index < caps.length && remaining > 0; index += 1) {
      if (budgets[index] >= caps[index]) continue;
      budgets[index] += 1;
      remaining -= 1;
      progressed = true;
    }
  }
  return Object.freeze(budgets);
}

function cellsFromCandidate(candidate) {
  const cells = [];
  candidate.pairPositions.forEach((position) => {
    for (let index = 0; index < position.positionCount; index += 1) {
      cells.push(Object.freeze({
        pairId: position.key,
        frontPage: position.frontPage,
        backPage: position.backPage,
      }));
    }
  });
  if (cells.length !== candidate.capacity) {
    throw new Error(`Candidate ${candidate.id} does not fill its declared capacity`);
  }
  return Object.freeze(cells);
}

function structuralEntry(candidate, duplexMode) {
  const cells = cellsFromCandidate(candidate);
  return deepFreeze({
    id: candidate.id,
    duplexMode,
    grid: {
      rows: candidate.rows,
      columns: candidate.columns,
      rotation: candidate.rotation,
      capacity: candidate.capacity,
    },
    distinctPairCount: candidate.pairCount,
    productionSignature: candidateProductionSignature(candidate),
    structuralSignature: createCandidateImpositionSignature({
      rows: candidate.rows,
      columns: candidate.columns,
      rotation: candidate.rotation,
      duplexMode,
      cells,
    }),
    cells,
    candidate,
  });
}

function safeCount(value) {
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

function createCatalogScope({ request, distinctRange, theoreticalCounts }) {
  const requestedSpace = {
    parentRequestSignature: request.requestedSpaceSignature,
    geometryMode: request.geometryMode,
    duplexMode: SEPARATE_DUPLEX,
    filledPositions: "fullCapacity",
    allowPairMixing: request.allowPairMixing,
    minDistinctPairs: distinctRange.minimum,
    maxDistinctPairs: distinctRange.maximum,
    grids: request.grids.map(({ rotation, rows, columns }) => [rotation, rows, columns]),
    theoreticalCounts: theoreticalCounts.map((count) => count.toString()),
  };
  return deepFreeze({
    kind: BOUNDED_CANDIDATE_IMPOSITION_SCOPE_KIND,
    parentRequestSignature: request.requestedSpaceSignature,
    requestedSpace,
    requestedSpaceSignature: JSON.stringify(requestedSpace),
    globalCompletenessClaimed: false,
  });
}

export function buildBoundedCandidateImpositionCatalog({
  request,
  pagePairs,
  minDistinctPairs = 1,
  maxDistinctPairs = 2,
  idPrefix = "MIXED",
} = {}) {
  const normalizedRequest = requireRequest(request);
  if (normalizedRequest.allowPartialForms) {
    throw new RangeError(
      "This catalog supports full-capacity impositions only; use allowPartialForms=false",
    );
  }
  if (!normalizedRequest.duplexModes.includes(SEPARATE_DUPLEX)) {
    throw new RangeError("The current catalog requires separateFrontBackForms");
  }
  const prefix = String(idPrefix ?? "").trim();
  if (!prefix) throw new RangeError("idPrefix is required");

  const selectedPairRefs = pairSelectionForRequest(normalizedRequest, pagePairs);
  const distinctRange = effectiveDistinctRange({
    request: normalizedRequest,
    minDistinctPairs,
    maxDistinctPairs,
  });
  const theoreticalCounts = normalizedRequest.grids.map((grid) => countForGrid({
    grid,
    selectedPairCount: selectedPairRefs.length,
    distinctRange,
  }));
  const theoreticalTotal = theoreticalCounts.reduce((sum, count) => sum + count, 0n);
  const budgets = allocateFairBudgets(
    theoreticalCounts,
    normalizedRequest.limits.maxCandidateImpositions,
  );
  const entries = [];
  const structuralSignatures = new Set();
  const gridSummaries = [];

  normalizedRequest.grids.forEach((grid, gridIndex) => {
    const theoreticalCount = theoreticalCounts[gridIndex];
    const budget = budgets[gridIndex];
    const effectiveMaximum = Math.min(
      distinctRange.maximum,
      selectedPairRefs.length,
      grid.capacity,
    );
    if (theoreticalCount === 0n || budget === 0) {
      gridSummaries.push(deepFreeze({
        grid,
        theoreticalCandidateImpositionCount: safeCount(theoreticalCount),
        theoreticalCandidateImpositionCountExact: theoreticalCount.toString(),
        generatedCandidateImpositionCount: 0,
        completeWithinGridSpace: theoreticalCount === 0n,
      }));
      return;
    }

    const generated = generateImpositionCandidates({
      pagePairs,
      rows: grid.rows,
      columns: grid.columns,
      rotation: grid.rotation,
      selectedPairRefs,
      minDistinctPairs: distinctRange.minimum,
      maxDistinctPairs: effectiveMaximum,
      maxCandidates: budget,
      idPrefix: `${prefix}-G${String(gridIndex + 1).padStart(2, "0")}`,
    });
    generated.candidates.forEach((candidate) => {
      const entry = structuralEntry(candidate, SEPARATE_DUPLEX);
      if (structuralSignatures.has(entry.structuralSignature)) {
        throw new Error(`Duplicate structural candidate: ${entry.structuralSignature}`);
      }
      structuralSignatures.add(entry.structuralSignature);
      entries.push(entry);
    });
    gridSummaries.push(deepFreeze({
      grid,
      theoreticalCandidateImpositionCount: safeCount(theoreticalCount),
      theoreticalCandidateImpositionCountExact: theoreticalCount.toString(),
      generatedCandidateImpositionCount: generated.candidateCount,
      completeWithinGridSpace: !generated.truncated,
    }));
  });

  const frozenEntries = Object.freeze(entries);
  const generatedTotal = BigInt(frozenEntries.length);
  const enumerationComplete = generatedTotal === theoreticalTotal;
  const scope = createCatalogScope({
    request: normalizedRequest,
    distinctRange,
    theoreticalCounts,
  });
  const scopedRequest = Object.freeze({
    ...normalizedRequest,
    requestedSpaceSignature: scope.requestedSpaceSignature,
  });
  const coverage = createBoundedSearchCoverage({
    request: scopedRequest,
    counters: {
      candidateImpositionsGenerated: frozenEntries.length,
      candidateImpositionsAccepted: frozenEntries.length,
    },
    enumerationComplete,
    theoreticalCandidateImpositionCount: safeCount(theoreticalTotal),
    truncationReasons: enumerationComplete
      ? []
      : [BOUNDED_SEARCH_TRUNCATION_REASONS.CANDIDATE_IMPOSITION_LIMIT],
  });

  return deepFreeze({
    kind: BOUNDED_CANDIDATE_IMPOSITION_CATALOG_KIND,
    scope,
    parentRequestSignature: normalizedRequest.requestedSpaceSignature,
    duplexMode: SEPARATE_DUPLEX,
    filledPositions: "fullCapacity",
    minDistinctPairs: distinctRange.minimum,
    maxDistinctPairs: distinctRange.maximum,
    selectedPairCount: selectedPairRefs.length,
    theoreticalCandidateImpositionCount: safeCount(theoreticalTotal),
    theoreticalCandidateImpositionCountExact: theoreticalTotal.toString(),
    generatedCandidateImpositionCount: frozenEntries.length,
    completeWithinCatalogSpace: enumerationComplete,
    coverage,
    gridSummaries: Object.freeze(gridSummaries),
    entries: frozenEntries,
  });
}
