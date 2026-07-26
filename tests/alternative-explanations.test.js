import test from "node:test";
import assert from "node:assert/strict";

import {
  ALTERNATIVE_EXPLANATION_SET_KIND,
  createAlternativeExplanationSet,
} from "../src/alternative-explanations.js";
import {
  createDecisionProfile,
  moveDecisionObjective,
} from "../src/decision-profile.js";
import {
  PRICING_COMPARISON_STATUS,
  buildProductionAlternativeSet,
} from "../src/production-alternative-set.js";
import {
  calculateProductionCost,
  createPricingProfile,
} from "../src/production-cost.js";
import { createSolutionMetrics } from "../src/solution-metrics.js";

const sourceSheet = Object.freeze({ width: 620, height: 450 });

function pricing({ paperPricePerKg = 4 } = {}) {
  return createPricingProfile({
    currency: "BYN",
    grammageGsm: 130,
    paperPricePerKg,
    colorPlatePrice: 15,
    layoutFormPreparationPrice: 0,
  });
}

function solutionMetrics(id, {
  physicalSheets,
  impositionCount,
  layoutForms,
  colorPlates,
  pressPasses,
  fileOverrun,
  pairOverrun,
  splitOrders,
  layoutCompactness,
  distinctOrdersPerImposition,
  pricingProfile = pricing(),
} = {}) {
  const productionCost = pricingProfile
    ? calculateProductionCost({
      sourceSheet,
      physicalSheets,
      layoutForms,
      colorPlates,
      orderedFinishedQuantity: 29225,
      pricing: pricingProfile,
    })
    : null;

  return createSolutionMetrics({
    id,
    label: id === "manual-compact" ? "Compact manual" : "Paper minimum",
    source: id === "manual-compact" ? "production-report" : "paper-minimizer",
    physicalSheets,
    impositionCount,
    layoutForms,
    colorPlates,
    pressPasses,
    fileOverrun,
    pairOverrun,
    splitOrders,
    fragmentedBlocks: Math.max(0, splitOrders - 1),
    layoutCompactness,
    distinctOrdersPerImposition,
    orderedFinishedQuantity: 29225,
    productionCost,
  });
}

function realAlternatives({
  profile = createDecisionProfile({ id: "paper-first" }),
  manualPricing = pricing(),
  paperPricing = pricing(),
} = {}) {
  const manual = solutionMetrics("manual-compact", {
    physicalSheets: 3395,
    impositionCount: 4,
    layoutForms: 8,
    colorPlates: 32,
    pressPasses: 6790,
    fileOverrun: 930,
    pairOverrun: 1450,
    splitOrders: 2,
    layoutCompactness: 0.95,
    distinctOrdersPerImposition: 7,
    pricingProfile: manualPricing,
  });
  const paper = solutionMetrics("paper-minimum", {
    physicalSheets: 3305,
    impositionCount: 56,
    layoutForms: 112,
    colorPlates: 448,
    pressPasses: 6610,
    fileOverrun: 0,
    pairOverrun: 10,
    splitOrders: 19,
    layoutCompactness: 0.45,
    distinctOrdersPerImposition: 2,
    pricingProfile: paperPricing,
  });

  return buildProductionAlternativeSet({
    solutionMetrics: [manual, paper],
    decisionProfile: profile,
    displayLimit: 5,
  });
}

function explanationEntry(explanations, solutionId) {
  return explanations.entries.find((entry) => entry.solutionId === solutionId);
}

function component(entry, componentId) {
  return entry.monetary.components.find((item) => item.componentId === componentId);
}

test("Russian explanations describe the real paper-first tradeoff and BYN components", () => {
  const alternatives = realAlternatives();
  const explanations = createAlternativeExplanationSet(alternatives, { language: "ru" });
  const manual = explanationEntry(explanations, "manual-compact");
  const paper = explanationEntry(explanations, "paper-minimum");

  assert.equal(explanations.kind, ALTERNATIVE_EXPLANATION_SET_KIND);
  assert.equal(explanations.language, "ru");
  assert.equal(explanations.locale, "ru-RU");
  assert.equal(explanations.recommendedSolutionId, "paper-minimum");
  assert.equal(explanations.referenceSolutionId, "paper-minimum");
  assert.equal(explanations.displayedCount, 2);
  assert.match(explanations.summaryText, /Показано вариантов: 2/);

  assert.equal(paper.recommended, true);
  assert.match(paper.reasonTexts.join(" "), /Рекомендуемый/);
  assert.equal(paper.decidingObjective.objectiveId, "physicalSheets");
  assert.match(paper.decidingText, /Решающая цель: Физическая бумага/);

  assert.equal(manual.comparison.primaryAdvantageObjectiveId, "estimatedTotalCost");
  assert.equal(manual.comparison.primaryTradeoffObjectiveId, "physicalSheets");
  assert.match(manual.advantageText, /Преимущество: Расчётная стоимость/);
  assert.match(manual.tradeoffText, /Цена компромисса: Физическая бумага/);
  assert.match(manual.advantageText, /BYN/);

  assert.equal(manual.monetary.available, true);
  assert.equal(manual.monetary.currency, "BYN");
  assert.equal(component(manual, "paperCost").delta, 13.0572);
  assert.equal(component(manual, "colorPlateCost").delta, -6240);
  assert.equal(component(manual, "layoutFormPreparationCost").delta, 0);
  assert.equal(component(manual, "estimatedTotalCost").delta, -6226.9428);
  assert.match(component(manual, "estimatedTotalCost").formattedDelta, /−?6[\s ]?226,94 BYN/);
});

test("English cost-first explanations identify the deciding objective without regenerating alternatives", () => {
  const costFirst = moveDecisionObjective(
    createDecisionProfile({ id: "cost-first" }),
    "estimatedTotalCost",
    0,
  );
  const alternatives = realAlternatives({ profile: costFirst });
  const explanations = createAlternativeExplanationSet(alternatives, { language: "en" });
  const manual = explanationEntry(explanations, "manual-compact");
  const paper = explanationEntry(explanations, "paper-minimum");

  assert.equal(explanations.locale, "en-US");
  assert.equal(explanations.recommendedSolutionId, "manual-compact");
  assert.equal(manual.recommended, true);
  assert.equal(manual.decidingObjective.objectiveId, "estimatedTotalCost");
  assert.match(manual.decidingText, /Deciding objective: Estimated production cost/);
  assert.equal(paper.comparison.primaryAdvantageObjectiveId, "physicalSheets");
  assert.equal(paper.comparison.primaryTradeoffObjectiveId, "estimatedTotalCost");
  assert.match(paper.advantageText, /Advantage: Physical sheets/);
  assert.match(paper.tradeoffText, /Tradeoff cost: Estimated production cost/);
});

test("reference override recomputes advantages, tradeoffs, and component deltas", () => {
  const alternatives = realAlternatives();
  const explanations = createAlternativeExplanationSet(alternatives, {
    language: "ru",
    referenceSolutionId: "manual-compact",
  });
  const paper = explanationEntry(explanations, "paper-minimum");

  assert.equal(explanations.referenceSolutionId, "manual-compact");
  assert.equal(paper.reference, false);
  assert.equal(paper.comparison.primaryAdvantageObjectiveId, "physicalSheets");
  assert.equal(paper.comparison.primaryTradeoffObjectiveId, "estimatedTotalCost");
  assert.equal(component(paper, "estimatedTotalCost").delta, 6226.9428);
});

test("incomplete pricing suppresses monetary deltas and never formats a fake zero cost", () => {
  const alternatives = realAlternatives({ manualPricing: null, paperPricing: null });
  const explanations = createAlternativeExplanationSet(alternatives, { language: "ru" });

  assert.equal(alternatives.pricingComparison.status, PRICING_COMPARISON_STATUS.INCOMPLETE);
  assert.equal(alternatives.objectiveOrder.includes("estimatedTotalCost"), false);
  explanations.entries.forEach((entry) => {
    assert.equal(entry.monetary.available, false);
    assert.deepEqual(entry.monetary.components, []);
    assert.match(entry.monetary.text, /Денежное сравнение недоступно/);
    assert.doesNotMatch(entry.advantageText, /BYN/);
    assert.doesNotMatch(entry.tradeoffText, /BYN/);
  });
});

test("incompatible pricing suppresses monetary explanations even when both costs are ready", () => {
  const alternatives = realAlternatives({
    manualPricing: pricing({ paperPricePerKg: 4 }),
    paperPricing: pricing({ paperPricePerKg: 4.5 }),
  });
  const explanations = createAlternativeExplanationSet(alternatives, { language: "en" });

  assert.equal(alternatives.pricingComparison.status, PRICING_COMPARISON_STATUS.INCOMPATIBLE);
  assert.equal(alternatives.objectiveOrder.includes("estimatedTotalCost"), false);
  explanations.entries.forEach((entry) => {
    assert.equal(entry.monetary.available, false);
    assert.match(entry.monetary.text, /Monetary comparison is unavailable/);
  });
});

test("explanation model rejects unknown language and unknown reference", () => {
  const alternatives = realAlternatives();
  assert.throws(
    () => createAlternativeExplanationSet(alternatives, { language: "de" }),
    /Unsupported explanation language/,
  );
  assert.throws(
    () => createAlternativeExplanationSet(alternatives, {
      language: "ru",
      referenceSolutionId: "missing",
    }),
    /referenceSolutionId is not present/,
  );
});
