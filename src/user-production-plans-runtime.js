import { DEFAULT_OBJECTIVE_ORDER } from "./optimization-objectives.js";
import {
  applyUserObjectivePreset,
  rerankUserProductionPlanSet,
} from "./user-objective-priority.js";
import { USER_UNIFORM_PRODUCTION_PLAN_SET_KIND } from "./user-uniform-production-plans.js";

export const USER_PRODUCTION_PLAN_RUNTIME_KIND = "userProductionPlanRuntime";

let planSet = null;
let selectedPlanId = null;
let objectivePreference = null;
const listeners = new Set();

function planById(id) {
  return planSet?.plans?.find((plan) => plan.id === id) ?? null;
}

function activeObjectiveIds(value = planSet) {
  return value?.catalog?.objectiveIds ?? [];
}

function initializeObjectivePreference(value) {
  const activeOrder = value?.catalog?.objectiveOrder ?? [];
  if (!objectivePreference) {
    objectivePreference = Object.freeze([...activeOrder]);
    return;
  }
  const known = new Set(objectivePreference);
  const additions = activeOrder.filter((objectiveId) => !known.has(objectiveId));
  if (additions.length > 0) {
    objectivePreference = Object.freeze([...objectivePreference, ...additions]);
  }
}

function rememberActiveObjectiveOrder(order) {
  const active = new Set(order);
  if (!objectivePreference) {
    objectivePreference = Object.freeze([...order]);
    return;
  }

  const queued = [...order];
  const next = objectivePreference.map((objectiveId) => (
    active.has(objectiveId) ? queued.shift() : objectiveId
  ));
  queued.forEach((objectiveId) => {
    if (!next.includes(objectiveId)) next.push(objectiveId);
  });
  objectivePreference = Object.freeze(next);
}

function preferredActiveOrder(value) {
  initializeObjectivePreference(value);
  const active = new Set(activeObjectiveIds(value));
  return Object.freeze(objectivePreference.filter((objectiveId) => active.has(objectiveId)));
}

function applyStoredPreference(value) {
  const order = preferredActiveOrder(value);
  const current = value.catalog.objectiveOrder;
  const unchanged = current.length === order.length
    && current.every((objectiveId, index) => objectiveId === order[index]);
  return unchanged ? value : rerankUserProductionPlanSet(value, order);
}

function publicPlanSummary(plan) {
  if (!plan) return null;
  return Object.freeze({
    id: plan.id,
    label: plan.label,
    family: plan.family,
    grid: Object.freeze({
      rotation: plan.grid.rotation,
      rows: plan.grid.rows,
      columns: plan.grid.columns,
      capacity: plan.grid.capacity,
    }),
    metrics: Object.freeze({
      physicalSheets: plan.metrics.physicalSheets,
      layoutForms: plan.metrics.layoutForms,
      colorPlates: plan.metrics.colorPlates,
      pressPasses: plan.metrics.pressPasses,
      pairOverrun: plan.metrics.pairOverrun,
      estimatedTotalCost: plan.metrics.estimatedTotalCost,
      currency: plan.metrics.currency,
      pricingStatus: plan.metrics.pricingStatus,
      zeroUnderproduction: plan.metrics.zeroUnderproduction,
    }),
  });
}

function publicReranking(value) {
  if (!value) return null;
  return Object.freeze({
    reusedGeneratedPlans: value.reusedGeneratedPlans === true,
    regeneratedPlanCount: Number(value.regeneratedPlanCount ?? 0),
    previousRecommendedId: value.previousRecommendedId ?? null,
    recommendedId: value.recommendedId ?? null,
  });
}

function internalSnapshot() {
  const selectedPlan = planById(selectedPlanId);
  return Object.freeze({
    kind: USER_PRODUCTION_PLAN_RUNTIME_KIND,
    ready: Boolean(planSet),
    planSet,
    selectedPlanId: selectedPlan?.id ?? null,
    selectedPlan,
    objectivePreference,
  });
}

function publicSnapshot() {
  const snapshot = internalSnapshot();
  return Object.freeze({
    kind: snapshot.kind,
    ready: snapshot.ready,
    feasibleSolutionCount: snapshot.planSet?.catalog?.summary?.feasibleSolutionCount ?? 0,
    objectiveOrder: Object.freeze([...(snapshot.planSet?.catalog?.objectiveOrder ?? [])]),
    recommendedId: snapshot.planSet?.catalog?.recommendedId ?? null,
    reranking: publicReranking(snapshot.planSet?.reranking),
    selectedPlanId: snapshot.selectedPlanId,
    selectedPlan: publicPlanSummary(snapshot.selectedPlan),
  });
}

function notify() {
  const snapshot = internalSnapshot();
  listeners.forEach((listener) => listener(snapshot));
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("uimposition:user-plan-selection", {
      detail: publicSnapshot(),
    }));
  }
}

function requirePlanSet(value) {
  if (!value || value.kind !== USER_UNIFORM_PRODUCTION_PLAN_SET_KIND) {
    throw new TypeError("A user uniform production plan set is required");
  }
  if (!Array.isArray(value.plans) || value.plans.length === 0) {
    throw new RangeError("User production plan set must contain plans");
  }
  return value;
}

export function setUserProductionPlanSet(nextPlanSet) {
  planSet = applyStoredPreference(requirePlanSet(nextPlanSet));
  if (!planById(selectedPlanId)) selectedPlanId = null;
  notify();
  return internalSnapshot();
}

export function clearUserProductionPlanSet() {
  planSet = null;
  selectedPlanId = null;
  notify();
  return internalSnapshot();
}

export function rerankUserProductionPlans(objectiveOrder) {
  if (!planSet) throw new Error("User production plan set is not ready");
  rememberActiveObjectiveOrder(objectiveOrder);
  planSet = rerankUserProductionPlanSet(planSet, objectiveOrder);
  if (!planById(selectedPlanId)) selectedPlanId = null;
  notify();
  return internalSnapshot();
}

export function applyUserProductionObjectivePreset(presetId) {
  if (!planSet) throw new Error("User production plan set is not ready");
  planSet = applyUserObjectivePreset(
    planSet,
    presetId,
    planSet.catalog.objectiveOrder,
  );
  rememberActiveObjectiveOrder(planSet.catalog.objectiveOrder);
  if (!planById(selectedPlanId)) selectedPlanId = null;
  notify();
  return internalSnapshot();
}

export function resetUserProductionObjectivePreference() {
  objectivePreference = Object.freeze([...DEFAULT_OBJECTIVE_ORDER]);
  if (planSet) {
    const active = new Set(activeObjectiveIds(planSet));
    const order = objectivePreference.filter((objectiveId) => active.has(objectiveId));
    planSet = rerankUserProductionPlanSet(planSet, order);
  }
  if (!planById(selectedPlanId)) selectedPlanId = null;
  notify();
  return internalSnapshot();
}

export function selectUserProductionPlan(planId) {
  if (!planSet) throw new Error("User production plan set is not ready");
  const normalizedId = String(planId ?? "").trim();
  const plan = planById(normalizedId);
  if (!plan) throw new RangeError(`Unknown user production plan: ${normalizedId}`);
  selectedPlanId = plan.id;
  notify();
  return internalSnapshot();
}

export function clearUserProductionPlanSelection() {
  selectedPlanId = null;
  notify();
  return internalSnapshot();
}

export function getUserProductionPlanRuntime() {
  return internalSnapshot();
}

export function subscribeUserProductionPlanRuntime(listener, { emitCurrent = true } = {}) {
  if (typeof listener !== "function") throw new TypeError("Runtime listener must be a function");
  listeners.add(listener);
  if (emitCurrent) listener(internalSnapshot());
  return () => listeners.delete(listener);
}
