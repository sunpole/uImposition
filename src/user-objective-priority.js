import { buildFeasibleSolutionCatalog } from "./feasible-solution-catalog.js";
import { getOptimizationObjective } from "./optimization-objectives.js";
import { USER_UNIFORM_PRODUCTION_PLAN_SET_KIND } from "./user-uniform-production-plans.js";

export const USER_OBJECTIVE_PRESETS = Object.freeze({
  PAPER_FIRST: "paperFirst",
  COST_FIRST: "costFirst",
  FORMS_FIRST: "formsFirst",
  PASSES_FIRST: "passesFirst",
  OVERRUN_FIRST: "overrunFirst",
});

const PRESET_PREFIXES = Object.freeze({
  [USER_OBJECTIVE_PRESETS.PAPER_FIRST]: Object.freeze(["physicalSheets"]),
  [USER_OBJECTIVE_PRESETS.COST_FIRST]: Object.freeze(["estimatedTotalCost"]),
  [USER_OBJECTIVE_PRESETS.FORMS_FIRST]: Object.freeze([
    "layoutForms",
    "colorPlates",
    "impositionCount",
  ]),
  [USER_OBJECTIVE_PRESETS.PASSES_FIRST]: Object.freeze([
    "pressPasses",
    "physicalSheets",
  ]),
  [USER_OBJECTIVE_PRESETS.OVERRUN_FIRST]: Object.freeze([
    "fileOverrun",
    "pairOverrun",
  ]),
});

function requirePlanSet(planSet) {
  if (!planSet || planSet.kind !== USER_UNIFORM_PRODUCTION_PLAN_SET_KIND) {
    throw new TypeError("A user uniform production plan set is required");
  }
  if (!Array.isArray(planSet.plans) || planSet.plans.length === 0) {
    throw new RangeError("User production plan set must contain plans");
  }
  if (!planSet.catalog || !Array.isArray(planSet.catalog.objectiveIds)) {
    throw new TypeError("User production plan set must contain a feasible catalog");
  }
  return planSet;
}

function activeObjectiveIds(planSet) {
  return Object.freeze([...requirePlanSet(planSet).catalog.objectiveIds]);
}

export function normalizeUserObjectiveOrder(planSet, objectiveOrder) {
  const active = activeObjectiveIds(planSet);
  if (!Array.isArray(objectiveOrder)) {
    throw new TypeError("objectiveOrder must be an array");
  }
  if (objectiveOrder.length !== active.length) {
    throw new RangeError(
      `objectiveOrder must contain exactly ${active.length} active objectives`,
    );
  }

  const activeSet = new Set(active);
  const seen = new Set();
  const normalized = objectiveOrder.map((objectiveId, index) => {
    const id = String(objectiveId ?? "").trim();
    getOptimizationObjective(id);
    if (!activeSet.has(id)) {
      throw new RangeError(`Inactive objective at index ${index}: ${id}`);
    }
    if (seen.has(id)) {
      throw new RangeError(`Duplicate objective at index ${index}: ${id}`);
    }
    seen.add(id);
    return id;
  });

  for (const objectiveId of active) {
    if (!seen.has(objectiveId)) {
      throw new RangeError(`Missing active objective: ${objectiveId}`);
    }
  }
  return Object.freeze(normalized);
}

export function moveUserObjectiveBy(planSet, objectiveOrder, objectiveId, offset) {
  const normalized = normalizeUserObjectiveOrder(planSet, objectiveOrder);
  const id = String(objectiveId ?? "").trim();
  const currentIndex = normalized.indexOf(id);
  if (currentIndex < 0) throw new RangeError(`Objective is not active: ${id}`);

  const movement = Number(offset);
  if (!Number.isInteger(movement)) throw new RangeError("offset must be an integer");
  const targetIndex = Math.max(0, Math.min(normalized.length - 1, currentIndex + movement));
  if (targetIndex === currentIndex) return normalized;

  const next = [...normalized];
  next.splice(currentIndex, 1);
  next.splice(targetIndex, 0, id);
  return Object.freeze(next);
}

export function createUserObjectivePresetOrder(planSet, presetId, currentOrder = null) {
  const normalizedPlanSet = requirePlanSet(planSet);
  const active = activeObjectiveIds(normalizedPlanSet);
  const order = normalizeUserObjectiveOrder(
    normalizedPlanSet,
    currentOrder ?? normalizedPlanSet.catalog.objectiveOrder,
  );
  const prefix = PRESET_PREFIXES[String(presetId ?? "")];
  if (!prefix) throw new RangeError(`Unknown user objective preset: ${presetId}`);

  const unavailable = prefix.filter((objectiveId) => !active.includes(objectiveId));
  if (unavailable.length > 0) {
    throw new RangeError(`Preset requires inactive objective: ${unavailable.join(", ")}`);
  }

  const prefixSet = new Set(prefix);
  return Object.freeze([...prefix, ...order.filter((objectiveId) => !prefixSet.has(objectiveId))]);
}

function searchCoverage(catalog) {
  const theoreticalCandidateCount = Number(catalog?.coverage?.theoreticalCandidateCount);
  const evaluatedCandidateCount = Number(catalog?.coverage?.evaluatedCandidateCount);
  if (
    !Number.isInteger(theoreticalCandidateCount)
    || theoreticalCandidateCount < 0
    || !Number.isInteger(evaluatedCandidateCount)
    || evaluatedCandidateCount < 0
  ) {
    return null;
  }
  return Object.freeze({ theoreticalCandidateCount, evaluatedCandidateCount });
}

function catalogSolutions(plans) {
  return plans.map((plan) => Object.freeze({
    id: plan.id,
    label: plan.label,
    family: plan.family,
    grid: plan.grid,
    metrics: plan.metrics,
  }));
}

/**
 * Rebuilds only ranking/Pareto annotations around the exact same generated plans.
 * Geometry, layouts, production reports, pricing metrics, and plan object identity
 * are preserved. This is the core guarantee behind instant operator priority edits.
 */
export function rerankUserProductionPlanSet(planSet, objectiveOrder) {
  const normalizedPlanSet = requirePlanSet(planSet);
  const normalizedOrder = normalizeUserObjectiveOrder(normalizedPlanSet, objectiveOrder);
  const catalog = buildFeasibleSolutionCatalog(
    catalogSolutions(normalizedPlanSet.plans),
    {
      objectiveIds: normalizedPlanSet.catalog.objectiveIds,
      objectiveOrder: normalizedOrder,
      searchCoverage: searchCoverage(normalizedPlanSet.catalog),
    },
  );

  return Object.freeze({
    ...normalizedPlanSet,
    plans: normalizedPlanSet.plans,
    catalog,
    reranking: Object.freeze({
      reusedGeneratedPlans: true,
      regeneratedPlanCount: 0,
      objectiveOrder: normalizedOrder,
      previousRecommendedId: normalizedPlanSet.catalog.recommendedId,
      recommendedId: catalog.recommendedId,
    }),
  });
}

export function applyUserObjectivePreset(planSet, presetId, currentOrder = null) {
  const order = createUserObjectivePresetOrder(planSet, presetId, currentOrder);
  return rerankUserProductionPlanSet(planSet, order);
}
