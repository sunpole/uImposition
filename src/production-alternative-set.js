import { DECISION_PROFILE_KIND } from "./decision-profile.js";
import { getOptimizationObjective } from "./optimization-objectives.js";
import { buildParetoFrontier } from "./pareto-alternatives.js";
import { buildParetoDisplaySet } from "./pareto-display-set.js";
import {
  PRICING_STATUS,
  SOLUTION_METRICS_KIND,
} from "./solution-metrics.js";
import {
  analyzeImpositionOrderDistribution,
  distributionRowsFromProductionImpositions,
} from "./imposition-distribution.js";
import { createPaperSolutionMetrics } from "./paper-solution-metrics.js";
import { createProductionReportSolutionMetrics } from "./production-solution-metrics.js";

export const PRODUCTION_ALTERNATIVE_SET_KIND = "productionAlternativeSet";

export const PRICING_COMPARISON_STATUS = Object.freeze({
  READY: "ready",
  INCOMPLETE: "incomplete",
  INCOMPATIBLE: "incompatible",
});

const COST_OBJECTIVE_ID = "estimatedTotalCost";
const NUMBER_EPSILON = 1e-9;

function requireDecisionProfile(profile) {
  if (!profile || profile.kind !== DECISION_PROFILE_KIND) {
    throw new TypeError("A decision profile is required");
  }
  return profile;
}

function requireSolutionMetrics(metrics, index) {
  if (!metrics || metrics.kind !== SOLUTION_METRICS_KIND) {
    throw new TypeError(`solutionMetrics[${index}] must be normalized SolutionMetrics`);
  }
  if (!metrics.zeroUnderproduction) {
    throw new RangeError(`solutionMetrics[${index}] must have zero underproduction`);
  }
  if (typeof metrics.layoutCompactness !== "number" || !Number.isFinite(metrics.layoutCompactness)) {
    throw new RangeError(`solutionMetrics[${index}].layoutCompactness must be known`);
  }
  return metrics;
}

function normalizeMetricsList(solutionMetrics) {
  if (!Array.isArray(solutionMetrics) || solutionMetrics.length < 2) {
    throw new TypeError("solutionMetrics must contain at least two alternatives");
  }
  const ids = new Set();
  return Object.freeze(solutionMetrics.map((metrics, index) => {
    const normalized = requireSolutionMetrics(metrics, index);
    if (ids.has(normalized.id)) throw new RangeError(`Duplicate solution metrics id: ${normalized.id}`);
    ids.add(normalized.id);
    return normalized;
  }));
}

function sameNumber(left, right) {
  return typeof left === "number"
    && Number.isFinite(left)
    && typeof right === "number"
    && Number.isFinite(right)
    && Math.abs(left - right) <= NUMBER_EPSILON;
}

function pricingFingerprint(metrics) {
  return Object.freeze({
    currency: metrics.currency,
    sheetBasis: metrics.sheetBasis,
    sheetAreaM2: metrics.sheetAreaM2,
    grammageGsm: metrics.grammageGsm,
    sheetWeightKg: metrics.sheetWeightKg,
    paperPricePerKg: metrics.paperPricePerKg,
    colorPlatePrice: metrics.colorPlatePrice,
    layoutFormPreparationPrice: metrics.layoutFormPreparationPrice,
  });
}

function fingerprintsMatch(left, right) {
  if (left.currency !== right.currency || left.sheetBasis !== right.sheetBasis) return false;
  return [
    "sheetAreaM2",
    "grammageGsm",
    "sheetWeightKg",
    "paperPricePerKg",
    "colorPlatePrice",
    "layoutFormPreparationPrice",
  ].every((key) => sameNumber(left[key], right[key]));
}

export function inspectPricingCompatibility(solutionMetrics) {
  const metricsList = normalizeMetricsList(solutionMetrics);
  const incompleteIds = metricsList
    .filter((metrics) => metrics.pricingStatus !== PRICING_STATUS.READY)
    .map((metrics) => metrics.id);

  if (incompleteIds.length > 0) {
    return Object.freeze({
      status: PRICING_COMPARISON_STATUS.INCOMPLETE,
      comparable: false,
      reason: "pricing-not-ready-for-all-alternatives",
      incompleteSolutionIds: Object.freeze(incompleteIds),
      incompatibleSolutionIds: Object.freeze([]),
      fingerprint: null,
    });
  }

  const reference = pricingFingerprint(metricsList[0]);
  const incompatibleIds = metricsList
    .slice(1)
    .filter((metrics) => !fingerprintsMatch(reference, pricingFingerprint(metrics)))
    .map((metrics) => metrics.id);

  if (incompatibleIds.length > 0) {
    return Object.freeze({
      status: PRICING_COMPARISON_STATUS.INCOMPATIBLE,
      comparable: false,
      reason: "pricing-basis-or-rates-differ",
      incompleteSolutionIds: Object.freeze([]),
      incompatibleSolutionIds: Object.freeze(incompatibleIds),
      fingerprint: reference,
    });
  }

  return Object.freeze({
    status: PRICING_COMPARISON_STATUS.READY,
    comparable: true,
    reason: "shared-pricing-basis-and-rates",
    incompleteSolutionIds: Object.freeze([]),
    incompatibleSolutionIds: Object.freeze([]),
    fingerprint: reference,
  });
}

function decisionSolutionFromMetrics(metrics, objectiveIds) {
  return Object.freeze({
    id: metrics.id,
    label: metrics.label,
    source: metrics.source,
    sourceMetrics: metrics,
    metrics: Object.freeze(Object.fromEntries(objectiveIds.map((objectiveId) => {
      const objective = getOptimizationObjective(objectiveId);
      const value = metrics[objective.metricKey];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${metrics.id}.${objective.metricKey} must be a finite number`);
      }
      return [objective.metricKey, value];
    }))),
  });
}

export function buildProductionAlternativeSet({
  solutionMetrics,
  decisionProfile,
  displayLimit = 5,
  recommendedSolutionId = null,
  referenceSolutionId = null,
} = {}) {
  const profile = requireDecisionProfile(decisionProfile);
  const metricsList = normalizeMetricsList(solutionMetrics);
  const pricingComparison = inspectPricingCompatibility(metricsList);
  const objectiveOrder = Object.freeze(profile.objectiveOrder.filter(
    (objectiveId) => pricingComparison.comparable || objectiveId !== COST_OBJECTIVE_ID,
  ));
  const decisionSolutions = Object.freeze(metricsList.map(
    (metrics) => decisionSolutionFromMetrics(metrics, objectiveOrder),
  ));
  const pareto = buildParetoFrontier(decisionSolutions, {
    objectiveIds: objectiveOrder,
    objectiveOrder,
  });
  const display = buildParetoDisplaySet(pareto, {
    objectiveOrder,
    displayLimit,
    recommendedSolutionId,
    referenceSolutionId,
  });

  return Object.freeze({
    kind: PRODUCTION_ALTERNATIVE_SET_KIND,
    decisionProfileId: profile.id,
    objectiveOrder,
    pricingComparison,
    solutionMetrics: metricsList,
    decisionSolutions,
    pareto,
    display,
  });
}

export function buildManualAndPaperAlternativeSet({
  report,
  impositions,
  paperSolution,
  sourceSheet,
  pricing = null,
  decisionProfile,
  displayLimit = 5,
  manualLayoutCompactness,
  paperLayoutCompactness,
  colorsPerLayoutForm,
  manualId = "manual-compact",
  paperId = "paper-minimum",
} = {}) {
  const manualDistribution = analyzeImpositionOrderDistribution(
    distributionRowsFromProductionImpositions(impositions),
  );
  const manualMetrics = createProductionReportSolutionMetrics({
    report,
    sourceSheet,
    pricing,
    id: manualId,
    label: "Compact manual",
    source: "production-report",
    layoutCompactness: manualLayoutCompactness,
    distinctOrdersPerImposition: manualDistribution.distinctOrdersPerImposition,
    splitOrders: manualDistribution.splitOrders,
    fragmentedBlocks: manualDistribution.fragmentedBlocks,
    colorsPerLayoutForm,
  });
  const paperMetrics = createPaperSolutionMetrics({
    solution: paperSolution,
    sourceSheet,
    pricing,
    id: paperId,
    label: "Paper minimum",
    layoutCompactness: paperLayoutCompactness,
    colorsPerLayoutForm,
  });

  return buildProductionAlternativeSet({
    solutionMetrics: [manualMetrics, paperMetrics],
    decisionProfile,
    displayLimit,
  });
}
