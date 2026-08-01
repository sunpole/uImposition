export const BOUNDED_MIXED_FORM_SEARCH_REQUEST_KIND = "boundedMixedFormSearchRequest";
export const BOUNDED_MIXED_FORM_SEARCH_COVERAGE_KIND = "boundedMixedFormSearchCoverage";

export const BOUNDED_SEARCH_COVERAGE = Object.freeze({
  COMPLETE_WITHIN_REQUESTED_SPACE: "completeWithinRequestedSpace",
  TRUNCATED: "truncated",
});

export const BOUNDED_SEARCH_TRUNCATION_REASONS = Object.freeze({
  CANDIDATE_IMPOSITION_LIMIT: "candidateImpositionLimit",
  STATE_LIMIT: "stateLimit",
  TIME_BUDGET: "timeBudget",
  CANCELLED: "cancelled",
  MEMORY_BUDGET: "memoryBudget",
});

const allowedTruncationReasons = new Set(Object.values(BOUNDED_SEARCH_TRUNCATION_REASONS));
const supportedRotations = new Set([0, 90]);
const supportedDuplexModes = new Set(["separateFrontBackForms", "workAndTurn"]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function stableStringify(value) {
  return JSON.stringify(value);
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function requireNonEmptyString(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new RangeError(`${label} is required`);
  return text;
}

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function requireNonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function requireNonNegativeNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${label} must be a finite non-negative number`);
  }
  return number;
}

function nullablePositiveInteger(value, label) {
  if (value === null || value === undefined) return null;
  return requirePositiveInteger(value, label);
}

function normalizeDemand(demand) {
  if (!Array.isArray(demand) || demand.length === 0) {
    throw new TypeError("demand must be a non-empty array");
  }
  const ids = new Set();
  const normalized = demand.map((entry, index) => {
    requireObject(entry, `demand[${index}]`);
    const pairId = requireNonEmptyString(entry.pairId ?? entry.id, `demand[${index}].pairId`);
    if (ids.has(pairId)) throw new RangeError(`Duplicate demand pairId: ${pairId}`);
    ids.add(pairId);
    return {
      pairId,
      requiredQuantity: requirePositiveInteger(
        entry.requiredQuantity ?? entry.quantity,
        `demand[${index}].requiredQuantity`,
      ),
    };
  });
  normalized.sort((left, right) => left.pairId.localeCompare(right.pairId, "en"));
  return deepFreeze(normalized);
}

function normalizeGrids(grids) {
  if (!Array.isArray(grids) || grids.length === 0) {
    throw new TypeError("grids must be a non-empty array");
  }
  const signatures = new Set();
  const normalized = grids.map((grid, index) => {
    requireObject(grid, `grids[${index}]`);
    const rows = requirePositiveInteger(grid.rows, `grids[${index}].rows`);
    const columns = requirePositiveInteger(grid.columns, `grids[${index}].columns`);
    const rotation = Number(grid.rotation);
    if (!supportedRotations.has(rotation)) {
      throw new RangeError(`grids[${index}].rotation must be 0 or 90`);
    }
    const result = { rows, columns, rotation, capacity: rows * columns };
    const signature = stableStringify([rotation, rows, columns]);
    if (signatures.has(signature)) throw new RangeError(`Duplicate grid: ${signature}`);
    signatures.add(signature);
    return result;
  });
  normalized.sort((left, right) => (
    left.rotation - right.rotation
    || left.rows - right.rows
    || left.columns - right.columns
  ));
  return deepFreeze(normalized);
}

function normalizeDuplexModes(duplexModes) {
  if (!Array.isArray(duplexModes) || duplexModes.length === 0) {
    throw new TypeError("duplexModes must be a non-empty array");
  }
  const seen = new Set();
  const normalized = duplexModes.map((value, index) => {
    const mode = requireNonEmptyString(value, `duplexModes[${index}]`);
    if (!supportedDuplexModes.has(mode)) {
      throw new RangeError(`Unsupported duplex mode: ${mode}`);
    }
    if (seen.has(mode)) throw new RangeError(`Duplicate duplex mode: ${mode}`);
    seen.add(mode);
    return mode;
  });
  normalized.sort();
  return deepFreeze(normalized);
}

export function createBoundedSearchLimits({
  maxImpositions,
  maxCandidateImpositions,
  maxStates,
  timeBudgetMs,
  maxRunLength = null,
} = {}) {
  return deepFreeze({
    maxImpositions: requirePositiveInteger(maxImpositions, "limits.maxImpositions"),
    maxCandidateImpositions: requirePositiveInteger(
      maxCandidateImpositions,
      "limits.maxCandidateImpositions",
    ),
    maxStates: requirePositiveInteger(maxStates, "limits.maxStates"),
    timeBudgetMs: requirePositiveInteger(timeBudgetMs, "limits.timeBudgetMs"),
    maxRunLength: nullablePositiveInteger(maxRunLength, "limits.maxRunLength"),
  });
}

export function createDemandSignature(demand) {
  return stableStringify(normalizeDemand(demand).map(({ pairId, requiredQuantity }) => (
    [pairId, requiredQuantity]
  )));
}

/**
 * Defines the exact finite search space and the execution budgets used to inspect it.
 * The request signature includes a caller-supplied problem signature so two jobs with
 * different geometry, print, cut, or compatibility inputs cannot collide.
 */
export function createBoundedMixedFormSearchRequest({
  problemSignature,
  demand,
  grids,
  duplexModes = ["separateFrontBackForms"],
  allowPartialForms = true,
  allowPairMixing = true,
  limits,
} = {}) {
  const normalizedProblemSignature = requireNonEmptyString(
    problemSignature,
    "problemSignature",
  );
  const normalizedDemand = normalizeDemand(demand);
  const normalizedGrids = normalizeGrids(grids);
  const normalizedDuplexModes = normalizeDuplexModes(duplexModes);
  if (typeof allowPartialForms !== "boolean") {
    throw new TypeError("allowPartialForms must be boolean");
  }
  if (typeof allowPairMixing !== "boolean") {
    throw new TypeError("allowPairMixing must be boolean");
  }
  const normalizedLimits = createBoundedSearchLimits(limits);
  const requestedSpace = {
    geometryMode: "uniform",
    problemSignature: normalizedProblemSignature,
    demand: normalizedDemand.map(({ pairId, requiredQuantity }) => [pairId, requiredQuantity]),
    grids: normalizedGrids.map(({ rows, columns, rotation }) => [rotation, rows, columns]),
    duplexModes: normalizedDuplexModes,
    allowPartialForms,
    allowPairMixing,
    maxImpositions: normalizedLimits.maxImpositions,
    maxRunLength: normalizedLimits.maxRunLength,
  };
  const requestedSpaceSignature = stableStringify(requestedSpace);

  return deepFreeze({
    kind: BOUNDED_MIXED_FORM_SEARCH_REQUEST_KIND,
    geometryMode: "uniform",
    problemSignature: normalizedProblemSignature,
    demand: normalizedDemand,
    grids: normalizedGrids,
    duplexModes: normalizedDuplexModes,
    allowPartialForms,
    allowPairMixing,
    limits: normalizedLimits,
    requestedSpaceSignature,
    globalCompletenessClaimed: false,
  });
}

function normalizePage(value, label) {
  if (value === null || value === undefined) return null;
  return requirePositiveInteger(value, label);
}

function normalizeCandidateCell(cell, index) {
  if (cell === null || cell === undefined) return null;
  requireObject(cell, `cells[${index}]`);
  return {
    pairId: requireNonEmptyString(cell.pairId ?? cell.id, `cells[${index}].pairId`),
    frontPage: normalizePage(cell.frontPage, `cells[${index}].frontPage`),
    backPage: normalizePage(cell.backPage, `cells[${index}].backPage`),
  };
}

/**
 * Produces a structural signature. Cell order and blanks are intentional: two impositions
 * with equal metrics but different production layouts must remain distinguishable.
 */
export function createCandidateImpositionSignature({
  rows,
  columns,
  rotation,
  duplexMode = "separateFrontBackForms",
  turnMode = null,
  cells,
} = {}) {
  const normalizedRows = requirePositiveInteger(rows, "rows");
  const normalizedColumns = requirePositiveInteger(columns, "columns");
  const normalizedRotation = Number(rotation);
  if (!supportedRotations.has(normalizedRotation)) {
    throw new RangeError("rotation must be 0 or 90");
  }
  const normalizedDuplexMode = requireNonEmptyString(duplexMode, "duplexMode");
  if (!supportedDuplexModes.has(normalizedDuplexMode)) {
    throw new RangeError(`Unsupported duplex mode: ${normalizedDuplexMode}`);
  }
  const normalizedTurnMode = turnMode === null || turnMode === undefined
    ? null
    : requireNonEmptyString(turnMode, "turnMode");
  if (normalizedDuplexMode === "workAndTurn" && normalizedTurnMode === null) {
    throw new RangeError("workAndTurn candidate imposition requires turnMode");
  }
  if (normalizedDuplexMode !== "workAndTurn" && normalizedTurnMode !== null) {
    throw new RangeError("turnMode is only valid for workAndTurn candidate impositions");
  }
  if (!Array.isArray(cells) || cells.length !== normalizedRows * normalizedColumns) {
    throw new RangeError(`cells must contain exactly ${normalizedRows * normalizedColumns} entries`);
  }
  const normalizedCells = cells.map(normalizeCandidateCell);
  normalizedCells.forEach((cell, index) => {
    if (cell !== null && cell.frontPage === null && cell.backPage === null) {
      throw new RangeError(`cells[${index}] must contain frontPage or backPage`);
    }
  });
  if (normalizedCells.every((cell) => cell === null)) {
    throw new RangeError("candidate imposition must contain at least one occupied cell");
  }
  return stableStringify({
    v: 1,
    grid: [normalizedRotation, normalizedRows, normalizedColumns],
    duplexMode: normalizedDuplexMode,
    turnMode: normalizedTurnMode,
    cells: normalizedCells.map((cell) => cell === null
      ? null
      : [cell.pairId, cell.frontPage, cell.backPage]),
  });
}

function normalizeSequenceEntry(entry, index) {
  requireObject(entry, `entries[${index}]`);
  const impositionSignature = entry.impositionSignature
    ? requireNonEmptyString(entry.impositionSignature, `entries[${index}].impositionSignature`)
    : createCandidateImpositionSignature(entry.imposition);
  return {
    impositionSignature,
    runLength: requirePositiveInteger(entry.runLength, `entries[${index}].runLength`),
  };
}

/**
 * Canonicalizes a production sequence as a multiset of structural impositions and integer
 * run lengths. Permuting identical press runs does not create a new production plan.
 */
export function createImpositionSequenceSignature(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new TypeError("entries must be a non-empty array");
  }
  const runLengthByImposition = new Map();
  entries.map(normalizeSequenceEntry).forEach(({ impositionSignature, runLength }) => {
    const total = (runLengthByImposition.get(impositionSignature) ?? 0) + runLength;
    runLengthByImposition.set(impositionSignature, total);
  });
  const canonicalEntries = [...runLengthByImposition]
    .sort(([left], [right]) => left.localeCompare(right, "en"));
  return stableStringify({ v: 1, impositions: canonicalEntries });
}

function requireSearchRequest(request) {
  if (request?.kind !== BOUNDED_MIXED_FORM_SEARCH_REQUEST_KIND) {
    throw new TypeError("request must be a bounded mixed-form search request");
  }
  return request;
}

/**
 * Safe lower bounds only. They can prune branches that cannot beat a known plan, but
 * they never claim that the bounded request covers the global production space.
 */
export function calculateSearchLowerBounds(request, demand = request?.demand) {
  const normalizedRequest = requireSearchRequest(request);
  const normalizedDemand = normalizeDemand(demand);
  const requestPairIds = new Set(normalizedRequest.demand.map(({ pairId }) => pairId));
  normalizedDemand.forEach(({ pairId }) => {
    if (!requestPairIds.has(pairId)) {
      throw new RangeError(`Lower-bound demand contains unknown pairId: ${pairId}`);
    }
  });

  const capacityUpperBound = Math.max(...normalizedRequest.grids.map(({ capacity }) => capacity));
  const totalRequiredPairCopies = normalizedDemand.reduce(
    (sum, { requiredQuantity }) => sum + requiredQuantity,
    0,
  );
  const activePairCount = normalizedDemand.length;
  const minimumPhysicalSheets = Math.ceil(totalRequiredPairCopies / capacityUpperBound);
  const minimumImpositionCount = Math.ceil(activePairCount / capacityUpperBound);
  const minimumFormsPerImposition = normalizedRequest.duplexModes.includes("workAndTurn") ? 1 : 2;

  return deepFreeze({
    capacityUpperBound,
    totalRequiredPairCopies,
    activePairCount,
    minimumPhysicalSheets,
    minimumImpositionCount,
    minimumLayoutForms: minimumImpositionCount * minimumFormsPerImposition,
    globalOptimalityClaimed: false,
  });
}

export function createBoundedSearchCounters({
  candidateImpositionsGenerated = 0,
  candidateImpositionsAccepted = 0,
  statesExpanded = 0,
  statesPrunedByBound = 0,
  statesPrunedByDominance = 0,
  feasiblePlansFound = 0,
  elapsedMs = 0,
} = {}) {
  const counters = {
    candidateImpositionsGenerated: requireNonNegativeInteger(
      candidateImpositionsGenerated,
      "counters.candidateImpositionsGenerated",
    ),
    candidateImpositionsAccepted: requireNonNegativeInteger(
      candidateImpositionsAccepted,
      "counters.candidateImpositionsAccepted",
    ),
    statesExpanded: requireNonNegativeInteger(statesExpanded, "counters.statesExpanded"),
    statesPrunedByBound: requireNonNegativeInteger(
      statesPrunedByBound,
      "counters.statesPrunedByBound",
    ),
    statesPrunedByDominance: requireNonNegativeInteger(
      statesPrunedByDominance,
      "counters.statesPrunedByDominance",
    ),
    feasiblePlansFound: requireNonNegativeInteger(
      feasiblePlansFound,
      "counters.feasiblePlansFound",
    ),
    elapsedMs: requireNonNegativeNumber(elapsedMs, "counters.elapsedMs"),
  };
  if (counters.candidateImpositionsAccepted > counters.candidateImpositionsGenerated) {
    throw new RangeError("candidateImpositionsAccepted cannot exceed candidateImpositionsGenerated");
  }
  return deepFreeze(counters);
}

function normalizeTruncationReasons(reasons) {
  if (!Array.isArray(reasons)) throw new TypeError("truncationReasons must be an array");
  const seen = new Set();
  const normalized = reasons.map((value, index) => {
    const reason = requireNonEmptyString(value, `truncationReasons[${index}]`);
    if (!allowedTruncationReasons.has(reason)) {
      throw new RangeError(`Unsupported truncation reason: ${reason}`);
    }
    if (seen.has(reason)) throw new RangeError(`Duplicate truncation reason: ${reason}`);
    seen.add(reason);
    return reason;
  });
  normalized.sort();
  return deepFreeze(normalized);
}

/**
 * Final coverage contract for one bounded run. Completeness is legal only when every
 * candidate imposition in the declared requested space was generated; global completeness is
 * deliberately impossible to claim through this API.
 */
export function createBoundedSearchCoverage({
  request,
  counters = {},
  enumerationComplete,
  theoreticalCandidateImpositionCount = null,
  truncationReasons = [],
} = {}) {
  const normalizedRequest = requireSearchRequest(request);
  const normalizedCounters = createBoundedSearchCounters(counters);
  if (typeof enumerationComplete !== "boolean") {
    throw new TypeError("enumerationComplete must be boolean");
  }
  const normalizedReasons = normalizeTruncationReasons(truncationReasons);
  const normalizedTheoreticalCount = theoreticalCandidateImpositionCount === null
    || theoreticalCandidateImpositionCount === undefined
    ? null
    : requireNonNegativeInteger(
      theoreticalCandidateImpositionCount,
      "theoreticalCandidateImpositionCount",
    );

  if (
    normalizedCounters.candidateImpositionsGenerated
    > normalizedRequest.limits.maxCandidateImpositions
  ) {
    throw new RangeError(
      "candidateImpositionsGenerated exceeds request.limits.maxCandidateImpositions",
    );
  }
  if (normalizedCounters.statesExpanded > normalizedRequest.limits.maxStates) {
    throw new RangeError("statesExpanded exceeds request.limits.maxStates");
  }
  if (enumerationComplete) {
    if (normalizedReasons.length > 0) {
      throw new RangeError("Complete coverage cannot have truncation reasons");
    }
    if (normalizedTheoreticalCount === null) {
      throw new RangeError("Complete coverage requires theoreticalCandidateImpositionCount");
    }
    if (normalizedTheoreticalCount !== normalizedCounters.candidateImpositionsGenerated) {
      throw new RangeError(
        "Complete coverage requires generated candidates to equal theoreticalCandidateImpositionCount",
      );
    }
  } else if (normalizedReasons.length === 0) {
    throw new RangeError("Truncated coverage requires at least one truncation reason");
  }

  return deepFreeze({
    kind: BOUNDED_MIXED_FORM_SEARCH_COVERAGE_KIND,
    requestSignature: normalizedRequest.requestedSpaceSignature,
    state: enumerationComplete
      ? BOUNDED_SEARCH_COVERAGE.COMPLETE_WITHIN_REQUESTED_SPACE
      : BOUNDED_SEARCH_COVERAGE.TRUNCATED,
    completeWithinRequestedSpace: enumerationComplete,
    globalCompletenessClaimed: false,
    theoreticalCandidateImpositionCount: normalizedTheoreticalCount,
    truncationReasons: normalizedReasons,
    counters: normalizedCounters,
  });
}
