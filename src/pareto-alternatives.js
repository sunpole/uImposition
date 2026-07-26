import {
  DEFAULT_OBJECTIVE_ORDER,
  OBJECTIVE_DIRECTION,
  OPTIMIZATION_OBJECTIVE_IDS,
  compareObjectiveValues,
  getOptimizationObjective,
} from "./optimization-objectives.js";

export const PARETO_ALTERNATIVES_KIND = "paretoAlternatives";

export const REQUIRED_EXTREME_OBJECTIVES = Object.freeze([
  "physicalSheets",
  "estimatedTotalCost",
  "layoutForms",
  "colorPlates",
  "fileOverrun",
  "pairOverrun",
  "pressPasses",
]);

function solutionId(solution, index = 0) {
  const id = String(solution?.id ?? "").trim();
  if (!id) throw new RangeError(`solutions[${index}].id is required`);
  return id;
}

function metricValue(solution, objectiveId) {
  const objective = getOptimizationObjective(objectiveId);
  const value = Number(solution?.metrics?.[objective.metricKey]);
  if (!Number.isFinite(value)) {
    throw new TypeError(`${solution?.id ?? "solution"}.${objective.metricKey} must be finite`);
  }
  return value;
}

function normalizeObjectiveIds(objectiveIds = OPTIMIZATION_OBJECTIVE_IDS) {
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

function normalizeSolutions(solutions) {
  if (!Array.isArray(solutions) || solutions.length === 0) {
    throw new TypeError("solutions must be a non-empty array");
  }
  const ids = new Set();
  return Object.freeze(solutions.map((solution, index) => {
    const id = solutionId(solution, index);
    if (ids.has(id)) throw new RangeError(`Duplicate solution id: ${id}`);
    ids.add(id);
    if (!solution?.metrics) throw new TypeError(`${id}.metrics is required`);
    return solution;
  }));
}

export function createMetricsSignature(solution, objectiveIds = OPTIMIZATION_OBJECTIVE_IDS) {
  const ids = normalizeObjectiveIds(objectiveIds);
  return ids.map((objectiveId) => {
    const objective = getOptimizationObjective(objectiveId);
    return `${objective.metricKey}:${metricValue(solution, objectiveId)}`;
  }).join("|");
}

export function dedupeSolutionAlternatives(solutions, {
  objectiveIds = OPTIMIZATION_OBJECTIVE_IDS,
} = {}) {
  const ids = normalizeObjectiveIds(objectiveIds);
  const normalized = normalizeSolutions(solutions);
  const bySignature = new Map();
  const kept = [];
  const duplicates = [];

  normalized.forEach((solution) => {
    const signature = createMetricsSignature(solution, ids);
    const previous = bySignature.get(signature);
    if (previous) {
      duplicates.push(Object.freeze({
        duplicateId: solution.id,
        keptId: previous.id,
        signature,
      }));
      return;
    }
    bySignature.set(signature, solution);
    kept.push(solution);
  });

  return Object.freeze({
    solutions: Object.freeze(kept),
    duplicates: Object.freeze(duplicates),
  });
}

export function compareSolutionsByObjective(left, right, objectiveId) {
  const objective = getOptimizationObjective(objectiveId);
  return compareObjectiveValues(
    metricValue(left, objectiveId),
    metricValue(right, objectiveId),
    objective.direction,
  );
}

export function compareSolutionsLexicographically(left, right, objectiveOrder = DEFAULT_OBJECTIVE_ORDER) {
  const order = normalizeObjectiveIds(objectiveOrder);
  for (const objectiveId of order) {
    const result = compareSolutionsByObjective(left, right, objectiveId);
    if (result !== 0) return result;
  }
  return String(left.id).localeCompare(String(right.id), "en");
}

export function solutionDominates(left, right, {
  objectiveIds = OPTIMIZATION_OBJECTIVE_IDS,
} = {}) {
  const ids = normalizeObjectiveIds(objectiveIds);
  let strictlyBetter = false;

  for (const objectiveId of ids) {
    const comparison = compareSolutionsByObjective(left, right, objectiveId);
    if (comparison > 0) return false;
    if (comparison < 0) strictlyBetter = true;
  }

  return strictlyBetter;
}

export function buildParetoFrontier(solutions, {
  objectiveIds = OPTIMIZATION_OBJECTIVE_IDS,
  objectiveOrder = DEFAULT_OBJECTIVE_ORDER,
  displayLimit = null,
} = {}) {
  const ids = normalizeObjectiveIds(objectiveIds);
  const deduped = dedupeSolutionAlternatives(solutions, { objectiveIds: ids });
  const frontier = [];
  const dominated = [];

  deduped.solutions.forEach((candidate) => {
    const dominator = deduped.solutions.find(
      (other) => other.id !== candidate.id && solutionDominates(other, candidate, { objectiveIds: ids }),
    );
    if (dominator) {
      dominated.push(Object.freeze({ solution: candidate, dominatedBy: dominator.id }));
    } else {
      frontier.push(candidate);
    }
  });

  const sortedFrontier = Object.freeze([...frontier].sort(
    (left, right) => compareSolutionsLexicographically(left, right, objectiveOrder),
  ));
  const limit = displayLimit === null || displayLimit === undefined
    ? sortedFrontier.length
    : Number(displayLimit);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("displayLimit must be a positive integer when provided");
  }

  return Object.freeze({
    kind: PARETO_ALTERNATIVES_KIND,
    objectiveIds: ids,
    candidates: deduped.solutions,
    duplicates: deduped.duplicates,
    dominated: Object.freeze(dominated),
    frontier: sortedFrontier,
    visibleFrontier: Object.freeze(sortedFrontier.slice(0, limit)),
    hiddenFrontierCount: Math.max(0, sortedFrontier.length - limit),
  });
}

export function selectExtremeAlternatives(solutions, {
  extremeObjectiveIds = REQUIRED_EXTREME_OBJECTIVES,
  tieBreakerOrder = DEFAULT_OBJECTIVE_ORDER,
} = {}) {
  const normalized = normalizeSolutions(solutions);
  const objectiveIds = normalizeObjectiveIds(extremeObjectiveIds);
  const tieOrder = normalizeObjectiveIds(tieBreakerOrder);

  return Object.freeze(Object.fromEntries(objectiveIds.map((objectiveId) => {
    const [winner] = [...normalized].sort((left, right) => {
      const primary = compareSolutionsByObjective(left, right, objectiveId);
      if (primary !== 0) return primary;
      return compareSolutionsLexicographically(left, right, tieOrder);
    });
    return [objectiveId, winner.id];
  })));
}

export function describeMetricDelta(left, right, objectiveId) {
  const objective = getOptimizationObjective(objectiveId);
  const leftValue = metricValue(left, objectiveId);
  const rightValue = metricValue(right, objectiveId);
  const delta = leftValue - rightValue;
  const comparison = compareObjectiveValues(leftValue, rightValue, objective.direction);
  return Object.freeze({
    objectiveId,
    metricKey: objective.metricKey,
    leftValue,
    rightValue,
    delta,
    better: comparison < 0 ? "left" : comparison > 0 ? "right" : "equal",
    direction: objective.direction,
    absoluteDelta: Math.abs(delta),
    favorableDelta: objective.direction === OBJECTIVE_DIRECTION.MINIMIZE ? -delta : delta,
  });
}
