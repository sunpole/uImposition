import {
  DEFAULT_OBJECTIVE_ORDER,
  HARD_CONSTRAINT_IDS,
  compareObjectiveValues,
  getOptimizationObjective,
  normalizeObjectiveOrder,
} from "./optimization-objectives.js";

export const DECISION_PROFILE_KIND = "decisionProfile";

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new RangeError(`${label} is required`);
  return text;
}

function requireProfile(profile) {
  if (!profile || profile.kind !== DECISION_PROFILE_KIND) {
    throw new TypeError("A decision profile is required");
  }
  return profile;
}

function requireSolution(solution, label) {
  if (!solution || typeof solution !== "object") {
    throw new TypeError(`${label} must be an object`);
  }
  const id = requiredText(solution.id, `${label}.id`);
  if (!solution.metrics || typeof solution.metrics !== "object") {
    throw new TypeError(`${label}.metrics must be an object`);
  }
  return Object.freeze({
    ...solution,
    id,
    metrics: Object.freeze({ ...solution.metrics }),
  });
}

function metricValue(solution, objectiveId) {
  const objective = getOptimizationObjective(objectiveId);
  const value = Number(solution.metrics[objective.metricKey]);
  if (!Number.isFinite(value)) {
    throw new TypeError(
      `Solution ${solution.id} has no finite metric for ${objective.metricKey}`,
    );
  }
  return { objective, value };
}

export function createDecisionProfile({
  id = "default",
  objectiveOrder = DEFAULT_OBJECTIVE_ORDER,
} = {}) {
  return Object.freeze({
    kind: DECISION_PROFILE_KIND,
    id: requiredText(id, "id"),
    objectiveOrder: normalizeObjectiveOrder(objectiveOrder),
    hardConstraints: Object.freeze([...HARD_CONSTRAINT_IDS]),
  });
}

export function moveDecisionObjective(profile, objectiveId, targetIndex) {
  const normalizedProfile = requireProfile(profile);
  const id = requiredText(objectiveId, "objectiveId");
  const currentIndex = normalizedProfile.objectiveOrder.indexOf(id);
  if (currentIndex < 0) throw new RangeError(`Objective is not present in profile: ${id}`);

  const index = Number(targetIndex);
  if (!Number.isInteger(index) || index < 0 || index >= normalizedProfile.objectiveOrder.length) {
    throw new RangeError("targetIndex is outside the objective order");
  }
  if (index === currentIndex) return normalizedProfile;

  const objectiveOrder = [...normalizedProfile.objectiveOrder];
  objectiveOrder.splice(currentIndex, 1);
  objectiveOrder.splice(index, 0, id);
  return createDecisionProfile({
    id: normalizedProfile.id,
    objectiveOrder,
  });
}

export function moveDecisionObjectiveBy(profile, objectiveId, offset) {
  const normalizedProfile = requireProfile(profile);
  const id = requiredText(objectiveId, "objectiveId");
  const currentIndex = normalizedProfile.objectiveOrder.indexOf(id);
  if (currentIndex < 0) throw new RangeError(`Objective is not present in profile: ${id}`);

  const movement = Number(offset);
  if (!Number.isInteger(movement)) throw new RangeError("offset must be an integer");
  const targetIndex = Math.max(
    0,
    Math.min(normalizedProfile.objectiveOrder.length - 1, currentIndex + movement),
  );
  return moveDecisionObjective(normalizedProfile, id, targetIndex);
}

export function compareSolutions(leftSolution, rightSolution, profile) {
  const normalizedProfile = requireProfile(profile);
  const left = requireSolution(leftSolution, "leftSolution");
  const right = requireSolution(rightSolution, "rightSolution");

  for (const objectiveId of normalizedProfile.objectiveOrder) {
    const leftMetric = metricValue(left, objectiveId);
    const rightMetric = metricValue(right, objectiveId);
    const result = compareObjectiveValues(
      leftMetric.value,
      rightMetric.value,
      leftMetric.objective.direction,
    );
    if (result !== 0) return result;
  }
  return 0;
}

export function explainSolutionPreference(leftSolution, rightSolution, profile) {
  const normalizedProfile = requireProfile(profile);
  const left = requireSolution(leftSolution, "leftSolution");
  const right = requireSolution(rightSolution, "rightSolution");

  for (let index = 0; index < normalizedProfile.objectiveOrder.length; index += 1) {
    const objectiveId = normalizedProfile.objectiveOrder[index];
    const leftMetric = metricValue(left, objectiveId);
    const rightMetric = metricValue(right, objectiveId);
    const comparison = compareObjectiveValues(
      leftMetric.value,
      rightMetric.value,
      leftMetric.objective.direction,
    );
    if (comparison !== 0) {
      return Object.freeze({
        tied: false,
        priorityIndex: index,
        objectiveId,
        metricKey: leftMetric.objective.metricKey,
        direction: leftMetric.objective.direction,
        leftValue: leftMetric.value,
        rightValue: rightMetric.value,
        preferredSolutionId: comparison < 0 ? left.id : right.id,
      });
    }
  }

  return Object.freeze({
    tied: true,
    priorityIndex: null,
    objectiveId: null,
    metricKey: null,
    direction: null,
    leftValue: null,
    rightValue: null,
    preferredSolutionId: null,
  });
}

export function rankSolutions(solutions, profile) {
  const normalizedProfile = requireProfile(profile);
  if (!Array.isArray(solutions) || solutions.length === 0) {
    throw new TypeError("solutions must be a non-empty array");
  }

  const normalized = solutions.map((solution, sourceIndex) => Object.freeze({
    sourceIndex,
    solution: requireSolution(solution, `solutions[${sourceIndex}]`),
  }));
  const ids = new Set();
  normalized.forEach(({ solution }) => {
    if (ids.has(solution.id)) throw new RangeError(`Duplicate solution id: ${solution.id}`);
    ids.add(solution.id);
  });

  const sorted = [...normalized].sort((left, right) => {
    const comparison = compareSolutions(left.solution, right.solution, normalizedProfile);
    return comparison || left.sourceIndex - right.sourceIndex;
  });

  let previous = null;
  let currentRank = 0;
  const ranked = sorted.map(({ solution }, index) => {
    const tiedWithPrevious = previous
      ? compareSolutions(previous, solution, normalizedProfile) === 0
      : false;
    if (!tiedWithPrevious) currentRank = index + 1;
    const entry = Object.freeze({
      rank: currentRank,
      tiedWithPrevious,
      solution,
    });
    previous = solution;
    return entry;
  });

  return Object.freeze(ranked);
}
