import {
  ALTERNATIVE_EXPLANATION_SET_KIND,
  createAlternativeExplanationSet,
} from "./alternative-explanations.js";
import { DECISION_PROFILE_KIND } from "./decision-profile.js";
import {
  PRICING_COMPARISON_STATUS,
  PRODUCTION_ALTERNATIVE_SET_KIND,
  buildManualAndPaperAlternativeSet,
} from "./production-alternative-set.js";

export const ALTERNATIVES_RUNTIME_KIND = "alternativesRuntimeState";

export const ALTERNATIVES_RUNTIME_STATUS = Object.freeze({
  WAITING_PRODUCTION: "waiting-production",
  READY: "ready",
  READY_WITHOUT_PRICING: "ready-without-pricing",
  ERROR: "error",
});

function actualPositiveNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
  return value;
}

function actualPositiveInteger(value, label) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return value;
}

function requireDecisionProfile(profile) {
  if (!profile || profile.kind !== DECISION_PROFILE_KIND) {
    throw new TypeError("A decision profile is required");
  }
  return profile;
}

function hasCompleteProductionState(productionState) {
  return Boolean(
    productionState?.report
    && Array.isArray(productionState?.impositions)
    && productionState.impositions.length > 0
    && productionState?.paperSolution
    && productionState?.controlCase,
  );
}

function waitingState(profile, language) {
  return Object.freeze({
    kind: ALTERNATIVES_RUNTIME_KIND,
    status: ALTERNATIVES_RUNTIME_STATUS.WAITING_PRODUCTION,
    language,
    decisionProfile: profile,
    priorityObjectiveId: profile.objectiveOrder[0],
    referenceSolutionId: null,
    pricingComparison: null,
    alternativeSet: null,
    explanations: null,
    error: null,
  });
}

function errorState(profile, language, error) {
  return Object.freeze({
    kind: ALTERNATIVES_RUNTIME_KIND,
    status: ALTERNATIVES_RUNTIME_STATUS.ERROR,
    language,
    decisionProfile: profile,
    priorityObjectiveId: profile.objectiveOrder[0],
    referenceSolutionId: null,
    pricingComparison: null,
    alternativeSet: null,
    explanations: null,
    error,
  });
}

export function calculateControlLayoutCompactness(controlCase) {
  const product = controlCase?.product;
  const verified = controlCase?.verifiedM2;
  const printable = verified?.printableArea;
  const positions = actualPositiveInteger(verified?.bestPositions, "verifiedM2.bestPositions");
  const width = actualPositiveNumber(product?.width, "product.width");
  const height = actualPositiveNumber(product?.height, "product.height");
  const bleed = Number(product?.bleed ?? 0);
  if (!Number.isFinite(bleed) || bleed < 0) {
    throw new RangeError("product.bleed must be a non-negative finite number");
  }
  const printableWidth = actualPositiveNumber(printable?.width, "verifiedM2.printableArea.width");
  const printableHeight = actualPositiveNumber(printable?.height, "verifiedM2.printableArea.height");
  const occupiedWidth = width + bleed * 2;
  const occupiedHeight = height + bleed * 2;
  const ratio = positions * occupiedWidth * occupiedHeight / (printableWidth * printableHeight);
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 1 + 1e-9) {
    throw new RangeError("Calculated layout compactness must be within (0, 1]");
  }
  return Math.min(1, ratio);
}

function sourceSheetFromControlCase(controlCase) {
  const sourceSheet = controlCase?.verifiedM2?.sourceSheet;
  return Object.freeze({
    width: actualPositiveNumber(sourceSheet?.width, "verifiedM2.sourceSheet.width"),
    height: actualPositiveNumber(sourceSheet?.height, "verifiedM2.sourceSheet.height"),
  });
}

export function createAlternativesRuntimeState({
  productionState = null,
  pricingState = null,
  decisionProfile,
  language = "ru",
  referenceSolutionId = null,
  displayLimit = 5,
} = {}) {
  const profile = requireDecisionProfile(decisionProfile);
  if (!hasCompleteProductionState(productionState)) {
    return waitingState(profile, language);
  }

  try {
    const compactness = calculateControlLayoutCompactness(productionState.controlCase);
    const alternativeSet = buildManualAndPaperAlternativeSet({
      report: productionState.report,
      impositions: productionState.impositions,
      paperSolution: productionState.paperSolution,
      sourceSheet: sourceSheetFromControlCase(productionState.controlCase),
      pricing: pricingState?.pricing ?? null,
      decisionProfile: profile,
      displayLimit,
      manualLayoutCompactness: compactness,
      paperLayoutCompactness: compactness,
    });
    if (alternativeSet.kind !== PRODUCTION_ALTERNATIVE_SET_KIND) {
      throw new TypeError("Production alternative set was not created");
    }

    const explanations = createAlternativeExplanationSet(alternativeSet, {
      language,
      referenceSolutionId,
    });
    if (explanations.kind !== ALTERNATIVE_EXPLANATION_SET_KIND) {
      throw new TypeError("Alternative explanation set was not created");
    }

    const status = alternativeSet.pricingComparison.status === PRICING_COMPARISON_STATUS.READY
      ? ALTERNATIVES_RUNTIME_STATUS.READY
      : ALTERNATIVES_RUNTIME_STATUS.READY_WITHOUT_PRICING;

    return Object.freeze({
      kind: ALTERNATIVES_RUNTIME_KIND,
      status,
      language: explanations.language,
      decisionProfile: profile,
      priorityObjectiveId: profile.objectiveOrder[0],
      referenceSolutionId: explanations.referenceSolutionId,
      pricingComparison: alternativeSet.pricingComparison,
      alternativeSet,
      explanations,
      error: null,
    });
  } catch (error) {
    return errorState(profile, language, error);
  }
}
