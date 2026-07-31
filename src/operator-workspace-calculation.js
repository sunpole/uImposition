import { CONFIG } from "./config.js";
import {
  beginApplicationCalculation,
  completeApplicationCalculation,
  failApplicationCalculation,
  normalizeApplicationState,
} from "./application-state.js";
import {
  expandProductRowsToLegacyOrders,
  normalizeProductRowCollection,
  validateProductRowsForUniformPipeline,
} from "./product-row-collection.js";
import { calculatePlacementOptions, calculateSheetGeometry } from "./geometry.js";
import { expandPagePairs } from "./orders.js";
import { createDuplexPrintSpecification } from "./print-specification.js";
import { createPricingProfile } from "./production-cost.js";
import { createUserUniformProductionPlanSet } from "./user-uniform-production-plans.js";

export const OPERATOR_WORKSPACE_CALCULATION_KIND = "operatorWorkspaceCalculation";
export const OPERATOR_WORKSPACE_REQUEST_KIND = "operatorWorkspaceCalculationRequest";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function issue(code, field, details = {}) {
  return deepFreeze({
    severity: "error",
    code,
    field,
    messageKey: `workspace.${code}`,
    details: { ...details },
    blocking: true,
  });
}

function trimSides(trim) {
  if (trim.mode === "uniform") {
    return {
      left: trim.uniformMm,
      right: trim.uniformMm,
      top: trim.uniformMm,
      bottom: trim.uniformMm,
    };
  }
  return trim.sidesMm;
}

function resolveUniformBleed(row) {
  if (row.bleed.mode === "uniform") return row.bleed.uniformMm;
  const values = Object.values(row.bleed.sidesMm);
  if (values.every((value) => value === values[0])) return values[0];
  return null;
}

function pricingProfile(pricing) {
  if (
    pricing.grammageGsm === null
    || pricing.paperPricePerKg === null
    || pricing.colorPlatePrice === null
  ) {
    return null;
  }
  return createPricingProfile(pricing);
}

function formatPlan(plan, entry) {
  return deepFreeze({
    id: plan.id,
    label: plan.label,
    family: plan.family,
    rank: entry.rank,
    recommended: Boolean(entry.recommended),
    pareto: Boolean(entry.pareto),
    dominated: Boolean(entry.dominated),
    metricEquivalent: Boolean(entry.metricEquivalent),
    grid: plan.grid,
    metrics: plan.metrics,
    proof: plan.proof,
  });
}

function layoutPreview(plan) {
  const descriptor = plan.runDescriptors[0] ?? null;
  if (!descriptor) return null;
  const cells = descriptor.candidate.pairPositions.flatMap((position) => Array.from(
    { length: position.positionCount },
    () => deepFreeze({
      file: position.file,
      pairIndex: position.pairIndex,
      frontPage: position.frontPage,
      backPage: position.backPage,
    }),
  ));
  return deepFreeze({
    planId: plan.id,
    rotation: descriptor.candidate.rotation,
    rows: descriptor.candidate.rows,
    columns: descriptor.candidate.columns,
    capacity: descriptor.candidate.capacity,
    runLength: descriptor.runLength,
    cells,
  });
}

function invalidResult({ state, validation, extraIssues = [] }) {
  return deepFreeze({
    kind: OPERATOR_WORKSPACE_CALCULATION_KIND,
    status: "invalid",
    revision: state.runtime.inputRevision,
    issues: [...validation.issues, ...extraIssues],
    summary: validation.summary,
    geometry: null,
    placementOptions: null,
    pagePairs: [],
    planSet: null,
    plans: [],
    selectedPlanId: null,
    selectedPlan: null,
    layoutPreview: null,
    pricingReady: false,
    scope: null,
  });
}

export function calculateOperatorWorkspace(state, config = CONFIG) {
  const normalizedState = normalizeApplicationState(state, config);
  const collection = normalizeProductRowCollection(normalizedState.input.products, config);
  const validation = validateProductRowsForUniformPipeline(collection, config);
  if (!validation.valid) return invalidResult({ state: normalizedState, validation });

  const enabledRows = collection.rows.filter(({ enabled }) => enabled);
  const sharedRow = enabledRows[0];
  const bleed = resolveUniformBleed(sharedRow);
  if (bleed === null) {
    return invalidResult({
      state: normalizedState,
      validation,
      extraIssues: [issue(
        "uniformCalculationRequiresEqualBleedSides",
        "rows",
        { rowId: sharedRow.id },
      )],
    });
  }

  const orders = expandProductRowsToLegacyOrders(collection, config);
  const pagePairs = expandPagePairs(orders);
  const geometry = calculateSheetGeometry({
    width: normalizedState.input.sheet.width,
    height: normalizedState.input.sheet.height,
    sizeStage: normalizedState.input.sheet.sizeStage,
    trim: {
      enabled: normalizedState.input.sheet.trim.enabled,
      sides: trimSides(normalizedState.input.sheet.trim),
    },
    pressMargins: normalizedState.input.press.marginsMm,
    limits: config.limits,
  });
  const placementOptions = calculatePlacementOptions({
    printable: geometry.printable,
    product: {
      width: sharedRow.finished.widthMm,
      height: sharedRow.finished.heightMm,
      bleed,
      spacingMode: sharedRow.cut.mode,
      gap: sharedRow.cut.gapMm,
    },
    limits: config.limits,
  });
  if (!placementOptions.fits) {
    return invalidResult({
      state: normalizedState,
      validation,
      extraIssues: [issue("productDoesNotFitPrintableArea", "rows", {
        rowId: sharedRow.id,
        printable: geometry.printable,
      })],
    });
  }

  const pricing = pricingProfile(normalizedState.input.pricing);
  const planSet = createUserUniformProductionPlanSet({
    pagePairs,
    placementOptions,
    sourceSheet: geometry.source,
    printSpecification: createDuplexPrintSpecification({
      frontColors: sharedRow.print.frontColors,
      backColors: sharedRow.print.backColors,
    }),
    pricing,
    objectiveOrder: normalizedState.input.objectivePreferences.order,
  });
  const entries = planSet.catalog.entries;
  const plans = entries.map((entry) => formatPlan(
    planSet.plans.find(({ id }) => id === entry.id),
    entry,
  ));
  const selectableIds = new Set(plans.map(({ id }) => id));
  const recommendedId = entries.find(({ recommended }) => recommended)?.id ?? plans[0]?.id ?? null;
  const selectedPlanId = selectableIds.has(normalizedState.runtime.selectedPlanId)
    ? normalizedState.runtime.selectedPlanId
    : recommendedId;
  const selectedPlan = planSet.plans.find(({ id }) => id === selectedPlanId) ?? null;

  return deepFreeze({
    kind: OPERATOR_WORKSPACE_CALCULATION_KIND,
    status: "ready",
    revision: normalizedState.runtime.inputRevision,
    issues: validation.issues,
    summary: validation.summary,
    geometry,
    placementOptions,
    pagePairs,
    planSet,
    plans,
    selectedPlanId,
    selectedPlan: plans.find(({ id }) => id === selectedPlanId) ?? null,
    layoutPreview: selectedPlan ? layoutPreview(selectedPlan) : null,
    pricingReady: Boolean(pricing),
    scope: planSet.scope,
  });
}

export function createOperatorWorkspaceCalculationRequest(state, config = CONFIG) {
  const calculatingState = beginApplicationCalculation(state, config);
  return deepFreeze({
    kind: OPERATOR_WORKSPACE_REQUEST_KIND,
    revision: calculatingState.runtime.calculation.activeRevision,
    inputState: calculatingState,
  });
}

export function resolveOperatorWorkspaceCalculation({
  currentState,
  request,
  previousValidResult = null,
  config = CONFIG,
} = {}) {
  const normalizedCurrent = normalizeApplicationState(currentState, config);
  if (!request || request.kind !== OPERATOR_WORKSPACE_REQUEST_KIND) {
    throw new TypeError("An operator workspace calculation request is required");
  }
  if (normalizedCurrent.runtime.inputRevision !== request.revision) {
    return deepFreeze({
      stale: true,
      state: normalizedCurrent,
      result: previousValidResult,
      lastValidResult: previousValidResult,
    });
  }

  try {
    const calculated = calculateOperatorWorkspace(request.inputState, config);
    if (calculated.status !== "ready") {
      const failedState = failApplicationCalculation(normalizedCurrent, {
        revision: request.revision,
        error: calculated.issues.map(({ code }) => code).join(", ") || "Invalid input",
      }, config);
      return deepFreeze({
        stale: false,
        state: failedState,
        result: previousValidResult,
        attemptedResult: calculated,
        lastValidResult: previousValidResult,
      });
    }

    const completedState = completeApplicationCalculation(normalizedCurrent, {
      revision: request.revision,
      selectedPlanId: calculated.selectedPlanId,
    }, config);
    return deepFreeze({
      stale: false,
      state: completedState,
      result: calculated,
      attemptedResult: calculated,
      lastValidResult: calculated,
    });
  } catch (error) {
    const failedState = failApplicationCalculation(normalizedCurrent, {
      revision: request.revision,
      error: error.message,
    }, config);
    return deepFreeze({
      stale: false,
      state: failedState,
      result: previousValidResult,
      attemptedResult: null,
      lastValidResult: previousValidResult,
      error: error.message,
    });
  }
}
