import { USER_UNIFORM_PRODUCTION_PLAN_SET_KIND } from "./user-uniform-production-plans.js";

export const USER_PRODUCTION_PLAN_RUNTIME_KIND = "userProductionPlanRuntime";

let planSet = null;
let selectedPlanId = null;
const listeners = new Set();

function planById(id) {
  return planSet?.plans?.find((plan) => plan.id === id) ?? null;
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

function internalSnapshot() {
  const selectedPlan = planById(selectedPlanId);
  return Object.freeze({
    kind: USER_PRODUCTION_PLAN_RUNTIME_KIND,
    ready: Boolean(planSet),
    planSet,
    selectedPlanId: selectedPlan?.id ?? null,
    selectedPlan,
  });
}

function publicSnapshot() {
  const snapshot = internalSnapshot();
  return Object.freeze({
    kind: snapshot.kind,
    ready: snapshot.ready,
    feasibleSolutionCount: snapshot.planSet?.catalog?.summary?.feasibleSolutionCount ?? 0,
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
  planSet = requirePlanSet(nextPlanSet);
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
