import {
  DEFAULT_OBJECTIVE_ORDER,
  OPTIMIZATION_OBJECTIVE_IDS,
  getOptimizationObjective,
} from "./optimization-objectives.js";
import {
  compareSolutionsLexicographically,
  createMetricsSignature,
  solutionDominates,
} from "./pareto-alternatives.js";

export const FEASIBLE_SOLUTION_CATALOG_KIND = "feasibleSolutionCatalog";

export const CATALOG_COVERAGE = Object.freeze({
  UNKNOWN: "unknown",
  COMPLETE_WITHIN_REQUESTED_SPACE: "completeWithinRequestedSpace",
  TRUNCATED: "truncated",
});

function solutionId(solution, index) {
  const id = String(solution?.id ?? "").trim();
  if (!id) throw new RangeError(`solutions[${index}].id is required`);
  return id;
}

function normalizeSolutions(solutions) {
  if (!Array.isArray(solutions) || solutions.length === 0) {
    throw new TypeError("solutions must be a non-empty array");
  }

  const ids = new Set();
  return Object.freeze(solutions.map((solution, index) => {
    const id = solutionId(solution, index);
    if (ids.has(id)) throw new RangeError(`Duplicate solution id: ${id}`);
    if (!solution?.metrics || typeof solution.metrics !== "object") {
      throw new TypeError(`${id}.metrics is required`);
    }
    ids.add(id);
    return solution;
  }));
}

function normalizeObjectiveIds(objectiveIds) {
  if (!Array.isArray(objectiveIds) || objectiveIds.length === 0) {
    throw new TypeError("objectiveIds must be a non-empty array");
  }

  const seen = new Set();
  return Object.freeze(objectiveIds.map((objectiveId, index) => {
    const id = String(objectiveId ?? "").trim();
    getOptimizationObjective(id);
    if (seen.has(id)) throw new RangeError(`Duplicate objective at index ${index}: ${id}`);
    seen.add(id);
    return id;
  }));
}

function requireNonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function normalizeCoverage(searchCoverage, evaluatedSolutionCount) {
  if (searchCoverage === null || searchCoverage === undefined) {
    return Object.freeze({
      state: CATALOG_COVERAGE.UNKNOWN,
      theoreticalCandidateCount: null,
      evaluatedCandidateCount: null,
      truncatedCandidateCount: null,
      completeWithinRequestedSpace: false,
      globalCompletenessClaimed: false,
    });
  }

  if (!searchCoverage || typeof searchCoverage !== "object") {
    throw new TypeError("searchCoverage must be an object when provided");
  }

  const theoreticalCandidateCount = requireNonNegativeInteger(
    searchCoverage.theoreticalCandidateCount,
    "searchCoverage.theoreticalCandidateCount",
  );
  const evaluatedCandidateCount = requireNonNegativeInteger(
    searchCoverage.evaluatedCandidateCount,
    "searchCoverage.evaluatedCandidateCount",
  );
  if (evaluatedCandidateCount < evaluatedSolutionCount) {
    throw new RangeError("evaluatedCandidateCount cannot be smaller than the solution count");
  }
  if (evaluatedCandidateCount > theoreticalCandidateCount) {
    throw new RangeError("evaluatedCandidateCount cannot exceed theoreticalCandidateCount");
  }

  const truncatedCandidateCount = theoreticalCandidateCount - evaluatedCandidateCount;
  const completeWithinRequestedSpace = truncatedCandidateCount === 0;
  return Object.freeze({
    state: completeWithinRequestedSpace
      ? CATALOG_COVERAGE.COMPLETE_WITHIN_REQUESTED_SPACE
      : CATALOG_COVERAGE.TRUNCATED,
    theoreticalCandidateCount,
    evaluatedCandidateCount,
    truncatedCandidateCount,
    completeWithinRequestedSpace,
    globalCompletenessClaimed: false,
  });
}

function buildEquivalenceMap(solutions, objectiveIds) {
  const groups = new Map();
  solutions.forEach((solution) => {
    const signature = createMetricsSignature(solution, objectiveIds);
    const group = groups.get(signature) ?? [];
    group.push(solution.id);
    groups.set(signature, group);
  });
  return groups;
}

/**
 * Builds a lossless catalog of every feasible solution supplied by the search.
 *
 * Pareto status and recommendation are annotations only. Dominated solutions and
 * metric-equivalent solutions remain in the catalog because they can represent
 * different layouts, cutting plans, duplex strategies, or operator preferences.
 *
 * Completeness is claimed only inside an explicitly declared requested search
 * space. This function never claims that a bounded search is globally exhaustive.
 */
export function buildFeasibleSolutionCatalog(solutions, {
  objectiveIds = OPTIMIZATION_OBJECTIVE_IDS,
  objectiveOrder = DEFAULT_OBJECTIVE_ORDER,
  searchCoverage = null,
} = {}) {
  const normalizedSolutions = normalizeSolutions(solutions);
  const normalizedObjectiveIds = normalizeObjectiveIds(objectiveIds);
  const normalizedObjectiveOrder = normalizeObjectiveIds(objectiveOrder);

  normalizedObjectiveOrder.forEach((objectiveId) => {
    if (!normalizedObjectiveIds.includes(objectiveId)) {
      throw new RangeError(`objectiveOrder contains inactive objective: ${objectiveId}`);
    }
  });

  const rankedSolutions = Object.freeze([...normalizedSolutions].sort(
    (left, right) => compareSolutionsLexicographically(left, right, normalizedObjectiveOrder),
  ));
  const rankById = new Map(rankedSolutions.map((solution, index) => [solution.id, index + 1]));
  const equivalenceGroups = buildEquivalenceMap(normalizedSolutions, normalizedObjectiveIds);

  const dominatorsById = new Map();
  normalizedSolutions.forEach((candidate) => {
    const dominators = normalizedSolutions
      .filter((other) => other.id !== candidate.id && solutionDominates(
        other,
        candidate,
        { objectiveIds: normalizedObjectiveIds },
      ))
      .sort((left, right) => compareSolutionsLexicographically(
        left,
        right,
        normalizedObjectiveOrder,
      ))
      .map(({ id }) => id);
    dominatorsById.set(candidate.id, Object.freeze(dominators));
  });

  const entries = Object.freeze(rankedSolutions.map((solution) => {
    const signature = createMetricsSignature(solution, normalizedObjectiveIds);
    const equivalentSolutionIds = Object.freeze(
      (equivalenceGroups.get(signature) ?? []).filter((id) => id !== solution.id),
    );
    const dominatedBy = dominatorsById.get(solution.id) ?? Object.freeze([]);
    return Object.freeze({
      id: solution.id,
      solution,
      rank: rankById.get(solution.id),
      recommended: rankById.get(solution.id) === 1,
      pareto: dominatedBy.length === 0,
      dominated: dominatedBy.length > 0,
      dominatedBy,
      metricsSignature: signature,
      metricEquivalent: equivalentSolutionIds.length > 0,
      equivalentSolutionIds,
    });
  }));

  const paretoEntries = Object.freeze(entries.filter(({ pareto }) => pareto));
  const dominatedEntries = Object.freeze(entries.filter(({ dominated }) => dominated));
  const equivalentGroupCount = [...equivalenceGroups.values()]
    .filter((ids) => ids.length > 1)
    .length;
  const coverage = normalizeCoverage(searchCoverage, normalizedSolutions.length);

  return Object.freeze({
    kind: FEASIBLE_SOLUTION_CATALOG_KIND,
    objectiveIds: normalizedObjectiveIds,
    objectiveOrder: normalizedObjectiveOrder,
    recommendedId: rankedSolutions[0].id,
    solutions: normalizedSolutions,
    rankedSolutions,
    entries,
    paretoEntries,
    dominatedEntries,
    coverage,
    summary: Object.freeze({
      feasibleSolutionCount: normalizedSolutions.length,
      paretoSolutionCount: paretoEntries.length,
      dominatedSolutionCount: dominatedEntries.length,
      metricEquivalentGroupCount: equivalentGroupCount,
      hiddenSolutionCount: 0,
    }),
  });
}
