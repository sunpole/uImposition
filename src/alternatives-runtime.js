import {
  ALTERNATIVE_EXPLANATION_SET_KIND,
  createAlternativeExplanationSet,
} from "./alternative-explanations.js";
import { DECISION_PROFILE_KIND } from "./decision-profile.js";
import { analyzeImpositionOrderDistribution } from "./imposition-distribution.js";
import { expandPagePairs } from "./orders.js";
import { minimizePhysicalPaper } from "./paper-minimizer.js";
import { createPaperSolutionMetrics } from "./paper-solution-metrics.js";
import {
  PRICING_COMPARISON_STATUS,
  PRODUCTION_ALTERNATIVE_SET_KIND,
  buildProductionAlternativeSet,
} from "./production-alternative-set.js";
import { createProductionReportSolutionMetrics } from "./production-solution-metrics.js";

export const ALTERNATIVES_RUNTIME_KIND = "alternativesRuntimeState";
export const PREPARED_ALTERNATIVES_PRODUCTION_KIND = "preparedAlternativesProduction";

export const ALTERNATIVES_RUNTIME_STATUS = Object.freeze({
  WAITING_PRODUCTION: "waiting-production",
  READY: "ready",
  READY_WITHOUT_PRICING: "ready-without-pricing",
  ERROR: "error",
});

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new RangeError(`${label} is required`);
  return text;
}

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
  return Boolean(productionState?.report && productionState?.controlCase);
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
    preparedProductionState: null,
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
    preparedProductionState: null,
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

function distributionRowsFromReport(report) {
  if (!Array.isArray(report?.pairMetrics) || report.pairMetrics.length === 0) {
    throw new TypeError("report.pairMetrics must be a non-empty array");
  }
  const byImposition = new Map();
  report.pairMetrics.forEach((metric, metricIndex) => {
    const file = requiredText(metric?.file, `report.pairMetrics[${metricIndex}].file`);
    if (!Array.isArray(metric?.contributions) || metric.contributions.length === 0) {
      throw new TypeError(
        `report.pairMetrics[${metricIndex}].contributions must be a non-empty array`,
      );
    }
    metric.contributions.forEach((contribution, contributionIndex) => {
      const id = requiredText(
        contribution?.impositionId,
        `report.pairMetrics[${metricIndex}].contributions[${contributionIndex}].impositionId`,
      );
      if (!byImposition.has(id)) byImposition.set(id, []);
      byImposition.get(id).push(file);
    });
  });
  return Object.freeze([...byImposition.entries()].map(([id, files]) => Object.freeze({
    id,
    files: Object.freeze(files),
  })));
}

function paperSolutionFromControlCase(controlCase) {
  const pagePairs = expandPagePairs(controlCase?.orders ?? []);
  const rotation = Number(controlCase?.verifiedM2?.bestRotation);
  const grid = rotation === 90
    ? controlCase?.verifiedM2?.orientation90
    : rotation === 0
      ? controlCase?.verifiedM2?.orientation0
      : null;
  if (!grid) throw new RangeError("Control case does not contain a supported best rotation");
  return minimizePhysicalPaper({
    pagePairs,
    rows: actualPositiveInteger(grid.rows, "verifiedM2.bestGrid.rows"),
    columns: actualPositiveInteger(grid.columns, "verifiedM2.bestGrid.columns"),
    rotation,
    duplexMode: controlCase.duplexMode,
  });
}

export function prepareAlternativesProductionState(productionState) {
  if (!hasCompleteProductionState(productionState)) {
    throw new TypeError("A production report and control case are required");
  }
  const controlCase = productionState.controlCase;
  const report = productionState.report;
  const paperSolution = productionState.paperSolution ?? paperSolutionFromControlCase(controlCase);
  const manualDistribution = analyzeImpositionOrderDistribution(
    distributionRowsFromReport(report),
  );
  return Object.freeze({
    kind: PREPARED_ALTERNATIVES_PRODUCTION_KIND,
    report,
    controlCase,
    paperSolution,
    manualDistribution,
    sourceSheet: sourceSheetFromControlCase(controlCase),
    layoutCompactness: calculateControlLayoutCompactness(controlCase),
  });
}

function requirePreparedProductionState(prepared) {
  if (!prepared || prepared.kind !== PREPARED_ALTERNATIVES_PRODUCTION_KIND) {
    throw new TypeError("A prepared alternatives production state is required");
  }
  return prepared;
}

function buildAlternativeSet({
  prepared,
  pricing,
  decisionProfile,
  displayLimit,
}) {
  const manualMetrics = createProductionReportSolutionMetrics({
    report: prepared.report,
    sourceSheet: prepared.sourceSheet,
    pricing,
    id: "manual-compact",
    label: "Compact manual",
    source: "production-report",
    layoutCompactness: prepared.layoutCompactness,
    distinctOrdersPerImposition: prepared.manualDistribution.distinctOrdersPerImposition,
    splitOrders: prepared.manualDistribution.splitOrders,
    fragmentedBlocks: prepared.manualDistribution.fragmentedBlocks,
  });
  const paperMetrics = createPaperSolutionMetrics({
    solution: prepared.paperSolution,
    sourceSheet: prepared.sourceSheet,
    pricing,
    id: "paper-minimum",
    label: "Paper minimum",
    source: "paper-minimizer",
    layoutCompactness: prepared.layoutCompactness,
  });
  return buildProductionAlternativeSet({
    solutionMetrics: [manualMetrics, paperMetrics],
    decisionProfile,
    displayLimit,
  });
}

export function createAlternativesRuntimeState({
  productionState = null,
  preparedProductionState = null,
  pricingState = null,
  decisionProfile,
  language = "ru",
  referenceSolutionId = null,
  displayLimit = 5,
} = {}) {
  const profile = requireDecisionProfile(decisionProfile);
  if (!preparedProductionState && !hasCompleteProductionState(productionState)) {
    return waitingState(profile, language);
  }

  try {
    const prepared = preparedProductionState
      ? requirePreparedProductionState(preparedProductionState)
      : prepareAlternativesProductionState(productionState);
    const alternativeSet = buildAlternativeSet({
      prepared,
      pricing: pricingState?.pricing ?? null,
      decisionProfile: profile,
      displayLimit,
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
      preparedProductionState: prepared,
      alternativeSet,
      explanations,
      error: null,
    });
  } catch (error) {
    return errorState(profile, language, error);
  }
}
