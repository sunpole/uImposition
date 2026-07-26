import {
  DEFAULT_OBJECTIVE_ORDER,
  getOptimizationObjective,
} from "./optimization-objectives.js";
import {
  PARETO_ALTERNATIVES_KIND,
  REQUIRED_EXTREME_OBJECTIVES,
  compareSolutionsLexicographically,
  describeMetricDelta,
  selectExtremeAlternatives,
} from "./pareto-alternatives.js";

export const PARETO_DISPLAY_SET_KIND = "paretoDisplaySet";

export const DISPLAY_ALTERNATIVE_REASON = Object.freeze({
  RECOMMENDED: "recommended",
  EXTREME: "extreme",
  DIVERSE_TRADEOFF: "diverseTradeoff",
});

export const DEFAULT_PARETO_DISPLAY_LIMIT = 5;

const DISTANCE_EPSILON = 1e-12;

function requireParetoAlternatives(paretoAlternatives) {
  if (!paretoAlternatives || paretoAlternatives.kind !== PARETO_ALTERNATIVES_KIND) {
    throw new TypeError("paretoAlternatives must be a Pareto alternatives result");
  }
  if (!Array.isArray(paretoAlternatives.frontier) || paretoAlternatives.frontier.length === 0) {
    throw new TypeError("paretoAlternatives.frontier must be a non-empty array");
  }
  if (!Array.isArray(paretoAlternatives.objectiveIds) || paretoAlternatives.objectiveIds.length === 0) {
    throw new TypeError("paretoAlternatives.objectiveIds must be a non-empty array");
  }
  return paretoAlternatives;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function solutionId(solution, label = "solution") {
  const id = String(solution?.id ?? "").trim();
  if (!id) throw new RangeError(`${label}.id is required`);
  return id;
}

function metricValue(solution, objectiveId) {
  const objective = getOptimizationObjective(objectiveId);
  const value = solution?.metrics?.[objective.metricKey];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${solution?.id ?? "solution"}.${objective.metricKey} must be finite`);
  }
  return value;
}

function normalizeAvailableObjectiveIds(paretoAlternatives) {
  const seen = new Set();
  return Object.freeze(paretoAlternatives.objectiveIds.map((objectiveId, index) => {
    const id = String(objectiveId ?? "").trim();
    getOptimizationObjective(id);
    if (seen.has(id)) {
      throw new RangeError(`Duplicate Pareto objective at index ${index}: ${id}`);
    }
    seen.add(id);
    return id;
  }));
}

function normalizeObjectiveOrder(objectiveOrder, availableObjectiveIds) {
  const available = new Set(availableObjectiveIds);
  const source = objectiveOrder ?? DEFAULT_OBJECTIVE_ORDER;
  if (!Array.isArray(source) || source.length === 0) {
    throw new TypeError("objectiveOrder must be a non-empty array");
  }

  const seen = new Set();
  const filtered = [];
  source.forEach((objectiveId, index) => {
    const id = String(objectiveId ?? "").trim();
    getOptimizationObjective(id);
    if (!available.has(id)) return;
    if (seen.has(id)) {
      throw new RangeError(`Duplicate objectiveOrder entry at index ${index}: ${id}`);
    }
    seen.add(id);
    filtered.push(id);
  });

  for (const objectiveId of availableObjectiveIds) {
    if (!seen.has(objectiveId)) {
      throw new RangeError(`objectiveOrder is missing available objective: ${objectiveId}`);
    }
  }
  return Object.freeze(filtered);
}

function normalizeExtremeObjectiveIds(extremeObjectiveIds, availableObjectiveIds) {
  if (!Array.isArray(extremeObjectiveIds)) {
    throw new TypeError("extremeObjectiveIds must be an array");
  }
  const available = new Set(availableObjectiveIds);
  const seen = new Set();
  const normalized = [];
  extremeObjectiveIds.forEach((objectiveId, index) => {
    const id = String(objectiveId ?? "").trim();
    getOptimizationObjective(id);
    if (!available.has(id)) return;
    if (seen.has(id)) {
      throw new RangeError(`Duplicate extreme objective at index ${index}: ${id}`);
    }
    seen.add(id);
    normalized.push(id);
  });
  return Object.freeze(normalized);
}

function normalizeFrontier(frontier, objectiveIds) {
  const ids = new Set();
  return Object.freeze(frontier.map((solution, index) => {
    const id = solutionId(solution, `frontier[${index}]`);
    if (ids.has(id)) throw new RangeError(`Duplicate frontier solution id: ${id}`);
    ids.add(id);
    objectiveIds.forEach((objectiveId) => metricValue(solution, objectiveId));
    return solution;
  }));
}

function findSolutionById(frontier, id, label) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) throw new RangeError(`${label} is required`);
  const solution = frontier.find((candidate) => candidate.id === normalizedId);
  if (!solution) throw new RangeError(`${label} is not present in the Pareto frontier: ${normalizedId}`);
  return solution;
}

function buildObjectiveRanges(frontier, objectiveIds) {
  return Object.freeze(Object.fromEntries(objectiveIds.map((objectiveId) => {
    const values = frontier.map((solution) => metricValue(solution, objectiveId));
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return [objectiveId, Object.freeze({
      minimum,
      maximum,
      range: maximum - minimum,
    })];
  })));
}

function pairDistance(left, right, objectiveOrder, objectiveRanges) {
  let distance = -1;
  let objectiveId = null;

  for (const candidateObjectiveId of objectiveOrder) {
    const range = objectiveRanges[candidateObjectiveId].range;
    const normalizedDifference = range === 0
      ? 0
      : Math.abs(
        metricValue(left, candidateObjectiveId) - metricValue(right, candidateObjectiveId),
      ) / range;
    if (normalizedDifference > distance + DISTANCE_EPSILON) {
      distance = normalizedDifference;
      objectiveId = candidateObjectiveId;
    }
  }

  return Object.freeze({
    normalizedDistance: Math.max(0, distance),
    objectiveId,
  });
}

function diversityFromSelected(candidate, selectedSolutions, objectiveOrder, objectiveRanges) {
  let nearest = null;

  selectedSolutions.forEach((selectedSolution) => {
    const distance = pairDistance(candidate, selectedSolution, objectiveOrder, objectiveRanges);
    if (
      !nearest
      || distance.normalizedDistance < nearest.normalizedDistance - DISTANCE_EPSILON
    ) {
      nearest = {
        nearestSolutionId: selectedSolution.id,
        objectiveId: distance.objectiveId,
        normalizedDistance: distance.normalizedDistance,
      };
    }
  });

  return Object.freeze(nearest);
}

function selectNextDiverseAlternative(
  candidates,
  selectedSolutions,
  objectiveOrder,
  objectiveRanges,
) {
  let winner = null;

  candidates.forEach((solution) => {
    const diversity = diversityFromSelected(
      solution,
      selectedSolutions,
      objectiveOrder,
      objectiveRanges,
    );
    if (
      !winner
      || diversity.normalizedDistance > winner.diversity.normalizedDistance + DISTANCE_EPSILON
      || (
        Math.abs(diversity.normalizedDistance - winner.diversity.normalizedDistance)
          <= DISTANCE_EPSILON
        && compareSolutionsLexicographically(solution, winner.solution, objectiveOrder) < 0
      )
    ) {
      winner = { solution, diversity };
    }
  });

  return Object.freeze(winner);
}

function comparisonSummary(solution, referenceSolution, objectiveOrder) {
  const deltas = Object.freeze(objectiveOrder.map(
    (objectiveId) => describeMetricDelta(solution, referenceSolution, objectiveId),
  ));
  const advantageObjectiveIds = Object.freeze(
    deltas.filter((delta) => delta.better === "left").map((delta) => delta.objectiveId),
  );
  const tradeoffObjectiveIds = Object.freeze(
    deltas.filter((delta) => delta.better === "right").map((delta) => delta.objectiveId),
  );
  const equalObjectiveIds = Object.freeze(
    deltas.filter((delta) => delta.better === "equal").map((delta) => delta.objectiveId),
  );

  return Object.freeze({
    referenceSolutionId: referenceSolution.id,
    deltas,
    advantageObjectiveIds,
    tradeoffObjectiveIds,
    equalObjectiveIds,
    primaryAdvantageObjectiveId: advantageObjectiveIds[0] ?? null,
    primaryTradeoffObjectiveId: tradeoffObjectiveIds[0] ?? null,
  });
}

function freezeExtremeSolutionIds(extremeSolutionIds) {
  return Object.freeze({ ...extremeSolutionIds });
}

export function buildParetoDisplaySet(paretoAlternatives, {
  objectiveOrder = null,
  extremeObjectiveIds = REQUIRED_EXTREME_OBJECTIVES,
  displayLimit = DEFAULT_PARETO_DISPLAY_LIMIT,
  recommendedSolutionId = null,
  referenceSolutionId = null,
} = {}) {
  const pareto = requireParetoAlternatives(paretoAlternatives);
  const availableObjectiveIds = normalizeAvailableObjectiveIds(pareto);
  const normalizedObjectiveOrder = normalizeObjectiveOrder(
    objectiveOrder,
    availableObjectiveIds,
  );
  const normalizedExtremeObjectiveIds = normalizeExtremeObjectiveIds(
    extremeObjectiveIds,
    availableObjectiveIds,
  );
  const frontier = normalizeFrontier(pareto.frontier, availableObjectiveIds);
  const requestedDisplayLimit = positiveInteger(displayLimit, "displayLimit");
  const objectiveRanges = buildObjectiveRanges(frontier, availableObjectiveIds);

  const recommendedSolution = recommendedSolutionId
    ? findSolutionById(frontier, recommendedSolutionId, "recommendedSolutionId")
    : [...frontier].sort(
      (left, right) => compareSolutionsLexicographically(
        left,
        right,
        normalizedObjectiveOrder,
      ),
    )[0];
  const referenceSolution = referenceSolutionId
    ? findSolutionById(frontier, referenceSolutionId, "referenceSolutionId")
    : recommendedSolution;

  const extremeSolutionIds = normalizedExtremeObjectiveIds.length > 0
    ? selectExtremeAlternatives(frontier, {
      extremeObjectiveIds: normalizedExtremeObjectiveIds,
      tieBreakerOrder: normalizedObjectiveOrder,
    })
    : Object.freeze({});

  const reasonBySolutionId = new Map();
  const mandatorySolutionIds = [];
  const selectedSolutionIds = new Set();

  function reasonRecord(id) {
    if (!reasonBySolutionId.has(id)) {
      reasonBySolutionId.set(id, {
        recommended: false,
        extremeObjectiveIds: [],
        diversity: null,
      });
    }
    return reasonBySolutionId.get(id);
  }

  function selectMandatory(id) {
    if (selectedSolutionIds.has(id)) return;
    selectedSolutionIds.add(id);
    mandatorySolutionIds.push(id);
  }

  reasonRecord(recommendedSolution.id).recommended = true;
  selectMandatory(recommendedSolution.id);

  normalizedExtremeObjectiveIds.forEach((objectiveId) => {
    const id = extremeSolutionIds[objectiveId];
    const reason = reasonRecord(id);
    reason.extremeObjectiveIds.push(objectiveId);
    selectMandatory(id);
  });

  const effectiveDisplayLimit = Math.max(
    requestedDisplayLimit,
    mandatorySolutionIds.length,
  );
  const targetDisplayedCount = Math.min(frontier.length, effectiveDisplayLimit);
  const selectedSolutions = mandatorySolutionIds.map(
    (id) => findSolutionById(frontier, id, "mandatorySolutionId"),
  );

  while (selectedSolutions.length < targetDisplayedCount) {
    const candidates = frontier.filter((solution) => !selectedSolutionIds.has(solution.id));
    const next = selectNextDiverseAlternative(
      candidates,
      selectedSolutions,
      normalizedObjectiveOrder,
      objectiveRanges,
    );
    selectedSolutionIds.add(next.solution.id);
    selectedSolutions.push(next.solution);
    reasonRecord(next.solution.id).diversity = next.diversity;
  }

  const entries = Object.freeze(selectedSolutions.map((solution) => {
    const reason = reasonRecord(solution.id);
    const reasonKinds = [];
    if (reason.recommended) reasonKinds.push(DISPLAY_ALTERNATIVE_REASON.RECOMMENDED);
    if (reason.extremeObjectiveIds.length > 0) {
      reasonKinds.push(DISPLAY_ALTERNATIVE_REASON.EXTREME);
    }
    if (reason.diversity) reasonKinds.push(DISPLAY_ALTERNATIVE_REASON.DIVERSE_TRADEOFF);

    return Object.freeze({
      solutionId: solution.id,
      solution,
      recommended: reason.recommended,
      reasonKinds: Object.freeze(reasonKinds),
      extremeObjectiveIds: Object.freeze([...reason.extremeObjectiveIds]),
      diversity: reason.diversity,
      comparison: comparisonSummary(
        solution,
        referenceSolution,
        normalizedObjectiveOrder,
      ),
    });
  }));

  const omittedSolutionIds = Object.freeze(
    frontier.filter((solution) => !selectedSolutionIds.has(solution.id))
      .map((solution) => solution.id),
  );

  return Object.freeze({
    kind: PARETO_DISPLAY_SET_KIND,
    selectionMethod: "recommended-extrema-maximin-range-distance",
    objectiveIds: availableObjectiveIds,
    objectiveOrder: normalizedObjectiveOrder,
    objectiveRanges,
    requiredExtremeObjectiveIds: normalizedExtremeObjectiveIds,
    extremeSolutionIds: freezeExtremeSolutionIds(extremeSolutionIds),
    recommendedSolutionId: recommendedSolution.id,
    referenceSolutionId: referenceSolution.id,
    pricingComparable: availableObjectiveIds.includes("estimatedTotalCost"),
    requestedDisplayLimit,
    effectiveDisplayLimit,
    limitExpandedBy: Math.max(0, mandatorySolutionIds.length - requestedDisplayLimit),
    mandatorySolutionIds: Object.freeze([...mandatorySolutionIds]),
    frontierCount: frontier.length,
    displayedCount: entries.length,
    hiddenFrontierCount: omittedSolutionIds.length,
    truncated: omittedSolutionIds.length > 0,
    entries,
    omittedSolutionIds,
  });
}
