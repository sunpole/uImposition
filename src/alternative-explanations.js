import {
  OBJECTIVE_DIRECTION,
  getOptimizationObjective,
} from "./optimization-objectives.js";
import {
  compareSolutionsLexicographically,
  describeMetricDelta,
} from "./pareto-alternatives.js";
import {
  DISPLAY_ALTERNATIVE_REASON,
} from "./pareto-display-set.js";
import {
  PRICING_COMPARISON_STATUS,
  PRODUCTION_ALTERNATIVE_SET_KIND,
} from "./production-alternative-set.js";

export const ALTERNATIVE_EXPLANATION_SET_KIND = "alternativeExplanationSet";

export const EXPLANATION_LANGUAGE = Object.freeze({
  RU: "ru",
  EN: "en",
});

export const COST_COMPONENT_IDS = Object.freeze([
  "paperCost",
  "colorPlateCost",
  "layoutFormPreparationCost",
  "estimatedTotalCost",
]);

const COST_COMPONENT_LABELS = Object.freeze({
  paperCost: Object.freeze({ ru: "Бумага", en: "Paper" }),
  colorPlateCost: Object.freeze({ ru: "Цветовые пластины", en: "Color plates" }),
  layoutFormPreparationCost: Object.freeze({
    ru: "Подготовка layout-форм",
    en: "Side-layout preparation",
  }),
  estimatedTotalCost: Object.freeze({ ru: "Итог", en: "Total" }),
});

const TEXT = Object.freeze({
  ru: Object.freeze({
    recommended: "Рекомендуемый по текущей иерархии",
    extreme: "Крайний вариант",
    diverse: "Отдельный существенно отличающийся компромисс",
    advantage: "Преимущество",
    tradeoff: "Цена компромисса",
    deciding: "Решающая цель",
    versus: "против",
    betterBy: "лучше на",
    worseBy: "хуже на",
    equal: "равно",
    noAdvantage: "Нет преимущества относительно выбранной базы сравнения.",
    noTradeoff: "Нет ухудшения относительно выбранной базы сравнения.",
    pricingUnavailable: "Денежное сравнение недоступно",
    shown: "Показано вариантов",
    hidden: "Скрыто Pareto-вариантов",
  }),
  en: Object.freeze({
    recommended: "Recommended by the current hierarchy",
    extreme: "Extreme alternative",
    diverse: "Separate materially different tradeoff",
    advantage: "Advantage",
    tradeoff: "Tradeoff cost",
    deciding: "Deciding objective",
    versus: "versus",
    betterBy: "better by",
    worseBy: "worse by",
    equal: "equal",
    noAdvantage: "No advantage over the selected reference.",
    noTradeoff: "No downside relative to the selected reference.",
    pricingUnavailable: "Monetary comparison is unavailable",
    shown: "Alternatives shown",
    hidden: "Hidden Pareto alternatives",
  }),
});

function normalizeLanguage(language) {
  const normalized = String(language ?? "").trim().toLowerCase();
  if (normalized === EXPLANATION_LANGUAGE.RU || normalized === EXPLANATION_LANGUAGE.EN) {
    return normalized;
  }
  throw new RangeError(`Unsupported explanation language: ${language}`);
}

function locale(language) {
  return language === EXPLANATION_LANGUAGE.RU ? "ru-RU" : "en-US";
}

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new RangeError(`${label} is required`);
  return text;
}

function actualFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return value;
}

function round(value, digits = 9) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function requireAlternativeSet(alternativeSet) {
  if (!alternativeSet || alternativeSet.kind !== PRODUCTION_ALTERNATIVE_SET_KIND) {
    throw new TypeError("A production alternative set is required");
  }
  if (!Array.isArray(alternativeSet.objectiveOrder) || alternativeSet.objectiveOrder.length === 0) {
    throw new TypeError("alternativeSet.objectiveOrder must be non-empty");
  }
  if (!Array.isArray(alternativeSet.solutionMetrics) || alternativeSet.solutionMetrics.length < 2) {
    throw new TypeError("alternativeSet.solutionMetrics must contain at least two alternatives");
  }
  if (!Array.isArray(alternativeSet.decisionSolutions) || alternativeSet.decisionSolutions.length < 2) {
    throw new TypeError("alternativeSet.decisionSolutions must contain at least two alternatives");
  }
  if (!Array.isArray(alternativeSet.display?.entries) || alternativeSet.display.entries.length === 0) {
    throw new TypeError("alternativeSet.display.entries must be non-empty");
  }
  return alternativeSet;
}

function formatNumber(value, language, maximumFractionDigits = 6) {
  return actualFiniteNumber(value, "value").toLocaleString(locale(language), {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatCurrency(value, currency, language) {
  return `${formatNumber(value, language, 2)} ${requiredText(currency, "currency")}`;
}

function formatMetricValue(objectiveId, value, language, currency) {
  if (objectiveId === "estimatedTotalCost") {
    return formatCurrency(value, currency, language);
  }
  if (objectiveId === "layoutCompactness") {
    return `${formatNumber(value * 100, language, 2)}%`;
  }
  return formatNumber(value, language, 6);
}

function solutionById(solutions, solutionId, label) {
  const id = requiredText(solutionId, label);
  const solution = solutions.find((candidate) => candidate.id === id);
  if (!solution) throw new RangeError(`${label} is not present: ${id}`);
  return solution;
}

function metricsById(metricsList) {
  return new Map(metricsList.map((metrics) => [metrics.id, metrics]));
}

function buildComparison(solution, reference, objectiveOrder) {
  const deltas = Object.freeze(objectiveOrder.map(
    (objectiveId) => describeMetricDelta(solution, reference, objectiveId),
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
    referenceSolutionId: reference.id,
    deltas,
    advantageObjectiveIds,
    tradeoffObjectiveIds,
    equalObjectiveIds,
    primaryAdvantageObjectiveId: advantageObjectiveIds[0] ?? null,
    primaryTradeoffObjectiveId: tradeoffObjectiveIds[0] ?? null,
  });
}

function formattedDelta(delta, language, currency) {
  const objective = getOptimizationObjective(delta.objectiveId);
  return Object.freeze({
    ...delta,
    label: objective.label[language],
    formattedLeftValue: formatMetricValue(delta.objectiveId, delta.leftValue, language, currency),
    formattedRightValue: formatMetricValue(delta.objectiveId, delta.rightValue, language, currency),
    formattedAbsoluteDelta: formatMetricValue(
      delta.objectiveId,
      delta.absoluteDelta,
      language,
      currency,
    ),
  });
}

function comparisonText(kind, delta, language, currency) {
  const text = TEXT[language];
  if (!delta) return kind === "advantage" ? text.noAdvantage : text.noTradeoff;
  const formatted = formattedDelta(delta, language, currency);
  const prefix = kind === "advantage" ? text.advantage : text.tradeoff;
  const relation = kind === "advantage" ? text.betterBy : text.worseBy;
  return `${prefix}: ${formatted.label} — ${formatted.formattedLeftValue} ${text.versus} ${formatted.formattedRightValue} (${relation} ${formatted.formattedAbsoluteDelta}).`;
}

function firstDifferentDelta(solution, reference, objectiveOrder) {
  for (const objectiveId of objectiveOrder) {
    const delta = describeMetricDelta(solution, reference, objectiveId);
    if (delta.better !== "equal") return delta;
  }
  return null;
}

function decidingEvidenceForEntry({
  solution,
  reference,
  recommendedSolutionId,
  decisionSolutions,
  objectiveOrder,
}) {
  if (solution.id !== reference.id) {
    return firstDifferentDelta(solution, reference, objectiveOrder);
  }

  if (solution.id !== recommendedSolutionId) return null;
  const ranked = [...decisionSolutions].sort((left, right) => (
    compareSolutionsLexicographically(left, right, objectiveOrder)
  ));
  const challenger = ranked.find((candidate) => candidate.id !== solution.id);
  return challenger ? firstDifferentDelta(solution, challenger, objectiveOrder) : null;
}

function decidingText(delta, language, currency) {
  if (!delta) return null;
  const text = TEXT[language];
  const formatted = formattedDelta(delta, language, currency);
  return `${text.deciding}: ${formatted.label} — ${formatted.formattedLeftValue} ${text.versus} ${formatted.formattedRightValue}.`;
}

function reasonTexts(entry, language) {
  const text = TEXT[language];
  const reasons = [];
  if (entry.reasonKinds.includes(DISPLAY_ALTERNATIVE_REASON.RECOMMENDED)) {
    reasons.push(text.recommended);
  }
  if (entry.reasonKinds.includes(DISPLAY_ALTERNATIVE_REASON.EXTREME)) {
    const labels = entry.extremeObjectiveIds.map(
      (objectiveId) => getOptimizationObjective(objectiveId).label[language],
    );
    reasons.push(`${text.extreme}: ${labels.join(", ")}`);
  }
  if (entry.reasonKinds.includes(DISPLAY_ALTERNATIVE_REASON.DIVERSE_TRADEOFF)) {
    reasons.push(text.diverse);
  }
  return Object.freeze(reasons);
}

function componentDeltas({
  pricingComparison,
  solutionMetrics,
  referenceMetrics,
  language,
}) {
  if (
    pricingComparison?.status !== PRICING_COMPARISON_STATUS.READY
    || pricingComparison.comparable !== true
  ) {
    return Object.freeze({
      available: false,
      reason: pricingComparison?.reason ?? "pricing-comparison-unavailable",
      currency: null,
      components: Object.freeze([]),
      text: `${TEXT[language].pricingUnavailable}: ${pricingComparison?.reason ?? "pricing-comparison-unavailable"}.`,
    });
  }

  const currency = requiredText(solutionMetrics.currency, "solutionMetrics.currency");
  if (referenceMetrics.currency !== currency) {
    throw new RangeError("Reference and solution currencies must match");
  }

  const components = Object.freeze(COST_COMPONENT_IDS.map((componentId) => {
    const solutionValue = actualFiniteNumber(
      solutionMetrics[componentId],
      `${solutionMetrics.id}.${componentId}`,
    );
    const referenceValue = actualFiniteNumber(
      referenceMetrics[componentId],
      `${referenceMetrics.id}.${componentId}`,
    );
    const delta = round(solutionValue - referenceValue);
    return Object.freeze({
      componentId,
      label: COST_COMPONENT_LABELS[componentId][language],
      solutionValue,
      referenceValue,
      delta,
      absoluteDelta: Math.abs(delta),
      better: delta < 0 ? "solution" : delta > 0 ? "reference" : "equal",
      formattedSolutionValue: formatCurrency(solutionValue, currency, language),
      formattedReferenceValue: formatCurrency(referenceValue, currency, language),
      formattedDelta: formatCurrency(delta, currency, language),
      formattedAbsoluteDelta: formatCurrency(Math.abs(delta), currency, language),
    });
  }));

  return Object.freeze({
    available: true,
    reason: "shared-compatible-pricing",
    currency,
    components,
    text: components.map((component) => (
      `${component.label}: ${component.formattedSolutionValue} ${TEXT[language].versus} ${component.formattedReferenceValue}`
    )).join("; "),
  });
}

export function createAlternativeExplanationSet(alternativeSetInput, {
  language = EXPLANATION_LANGUAGE.RU,
  referenceSolutionId = null,
} = {}) {
  const alternativeSet = requireAlternativeSet(alternativeSetInput);
  const normalizedLanguage = normalizeLanguage(language);
  const currency = alternativeSet.pricingComparison?.comparable
    ? alternativeSet.pricingComparison.fingerprint?.currency
    : null;
  const referenceId = referenceSolutionId ?? alternativeSet.display.referenceSolutionId;
  const referenceSolution = solutionById(
    alternativeSet.decisionSolutions,
    referenceId,
    "referenceSolutionId",
  );
  const sourceMetrics = metricsById(alternativeSet.solutionMetrics);
  const referenceMetrics = sourceMetrics.get(referenceSolution.id);
  if (!referenceMetrics) throw new RangeError(`Missing source metrics: ${referenceSolution.id}`);

  const entries = Object.freeze(alternativeSet.display.entries.map((displayEntry) => {
    const solution = solutionById(
      alternativeSet.decisionSolutions,
      displayEntry.solutionId,
      "displayEntry.solutionId",
    );
    const metrics = sourceMetrics.get(solution.id);
    if (!metrics) throw new RangeError(`Missing source metrics: ${solution.id}`);
    const comparison = buildComparison(
      solution,
      referenceSolution,
      alternativeSet.objectiveOrder,
    );
    const advantageDelta = comparison.deltas.find(
      (delta) => delta.objectiveId === comparison.primaryAdvantageObjectiveId,
    ) ?? null;
    const tradeoffDelta = comparison.deltas.find(
      (delta) => delta.objectiveId === comparison.primaryTradeoffObjectiveId,
    ) ?? null;
    const decidingDelta = decidingEvidenceForEntry({
      solution,
      reference: referenceSolution,
      recommendedSolutionId: alternativeSet.display.recommendedSolutionId,
      decisionSolutions: alternativeSet.decisionSolutions,
      objectiveOrder: alternativeSet.objectiveOrder,
    });

    return Object.freeze({
      solutionId: solution.id,
      label: solution.label,
      recommended: displayEntry.recommended,
      reference: solution.id === referenceSolution.id,
      reasonKinds: displayEntry.reasonKinds,
      reasonTexts: reasonTexts(displayEntry, normalizedLanguage),
      comparison,
      advantage: advantageDelta ? formattedDelta(advantageDelta, normalizedLanguage, currency) : null,
      tradeoff: tradeoffDelta ? formattedDelta(tradeoffDelta, normalizedLanguage, currency) : null,
      advantageText: comparisonText("advantage", advantageDelta, normalizedLanguage, currency),
      tradeoffText: comparisonText("tradeoff", tradeoffDelta, normalizedLanguage, currency),
      decidingObjective: decidingDelta
        ? formattedDelta(decidingDelta, normalizedLanguage, currency)
        : null,
      decidingText: decidingText(decidingDelta, normalizedLanguage, currency),
      monetary: componentDeltas({
        pricingComparison: alternativeSet.pricingComparison,
        solutionMetrics: metrics,
        referenceMetrics,
        language: normalizedLanguage,
      }),
    });
  }));

  return Object.freeze({
    kind: ALTERNATIVE_EXPLANATION_SET_KIND,
    language: normalizedLanguage,
    locale: locale(normalizedLanguage),
    referenceSolutionId: referenceSolution.id,
    recommendedSolutionId: alternativeSet.display.recommendedSolutionId,
    pricingComparison: alternativeSet.pricingComparison,
    displayedCount: entries.length,
    hiddenFrontierCount: alternativeSet.display.hiddenFrontierCount,
    truncated: alternativeSet.display.truncated,
    summaryText: `${TEXT[normalizedLanguage].shown}: ${entries.length}. ${TEXT[normalizedLanguage].hidden}: ${alternativeSet.display.hiddenFrontierCount}.`,
    entries,
  });
}
