import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createBackLayout } from "../src/back-layout.js";
import { createDecisionProfile, moveDecisionObjective } from "../src/decision-profile.js";
import { createFrontLayout } from "../src/front-layout.js";
import { validateImposition } from "../src/imposition-validation.js";
import { expandPagePairs } from "../src/orders.js";
import { minimizePhysicalPaper } from "../src/paper-minimizer.js";
import {
  PRICING_COMPARISON_STATUS,
  buildManualAndPaperAlternativeSet,
  inspectPricingCompatibility,
} from "../src/production-alternative-set.js";
import {
  calculateProductionCost,
  createPricingProfile,
} from "../src/production-cost.js";
import { buildProductionReport } from "../src/production-report.js";
import { createSolutionMetrics } from "../src/solution-metrics.js";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

function buildRecords(layoutData, pagePairs) {
  return layoutData.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    assert.equal(validation.valid, true, validation.errors.join("; "));
    return Object.freeze({ front, back, validation });
  });
}

function controlPipeline() {
  const controlCase = readJson("../data/control-case.json");
  const layoutData = readJson("../data/control-layout-m3.json");
  const pagePairs = expandPagePairs(controlCase.orders);
  const impositions = buildRecords(layoutData, pagePairs);
  const report = buildProductionReport({
    pagePairs,
    impositions,
    duplexMode: controlCase.duplexMode,
  });
  const rotation = Number(controlCase.verifiedM2.bestRotation);
  const grid = rotation === 90
    ? controlCase.verifiedM2.orientation90
    : controlCase.verifiedM2.orientation0;
  const paperSolution = minimizePhysicalPaper({
    pagePairs,
    rows: grid.rows,
    columns: grid.columns,
    rotation,
    duplexMode: controlCase.duplexMode,
  });
  const layoutCompactness = controlCase.verifiedM2.bestPositions
    * controlCase.product.width
    * controlCase.product.height
    / (controlCase.verifiedM2.printableArea.width * controlCase.verifiedM2.printableArea.height);

  return Object.freeze({
    controlCase,
    impositions,
    report,
    paperSolution,
    layoutCompactness,
  });
}

function byId(alternatives, id) {
  return alternatives.solutionMetrics.find((metrics) => metrics.id === id);
}

const illustrativePricing = createPricingProfile({
  currency: "BYN",
  grammageGsm: 130,
  paperPricePerKg: 4,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 0,
});

test("real control report and paper minimum become normalized Pareto alternatives", () => {
  const pipeline = controlPipeline();
  const alternatives = buildManualAndPaperAlternativeSet({
    report: pipeline.report,
    impositions: pipeline.impositions,
    paperSolution: pipeline.paperSolution,
    sourceSheet: pipeline.controlCase.verifiedM2.sourceSheet,
    pricing: illustrativePricing,
    decisionProfile: createDecisionProfile({ id: "paper-first" }),
    manualLayoutCompactness: pipeline.layoutCompactness,
    paperLayoutCompactness: pipeline.layoutCompactness,
  });

  const manual = byId(alternatives, "manual-compact");
  const paper = byId(alternatives, "paper-minimum");

  assert.equal(alternatives.pricingComparison.status, PRICING_COMPARISON_STATUS.READY);
  assert.equal(alternatives.pricingComparison.comparable, true);
  assert.equal(alternatives.display.recommendedSolutionId, "paper-minimum");
  assert.deepEqual(
    alternatives.pareto.frontier.map(({ id }) => id).sort(),
    ["manual-compact", "paper-minimum"],
  );

  assert.equal(manual.physicalSheets, 3395);
  assert.equal(manual.impositionCount, 4);
  assert.equal(manual.layoutForms, 8);
  assert.equal(manual.colorPlates, 32);
  assert.equal(manual.pressPasses, 6790);
  assert.equal(manual.fileOverrun, 930);
  assert.equal(manual.pairOverrun, 1450);
  assert.equal(manual.splitOrders, 2);
  assert.equal(manual.fragmentedBlocks, 3);
  assert.equal(manual.distinctOrdersPerImposition, 7);
  assert.equal(manual.orderedFinishedQuantity, 29225);
  assert.equal(manual.estimatedTotalCost, 972.5466);

  assert.equal(paper.physicalSheets, 3305);
  assert.equal(paper.impositionCount, 56);
  assert.equal(paper.layoutForms, 112);
  assert.equal(paper.colorPlates, 448);
  assert.equal(paper.pressPasses, 6610);
  assert.equal(paper.fileOverrun, 0);
  assert.equal(paper.pairOverrun, 10);
  assert.equal(paper.splitOrders, 19);
  assert.equal(paper.distinctOrdersPerImposition, 2);
  assert.equal(paper.orderedFinishedQuantity, 29225);
  assert.equal(paper.estimatedTotalCost, 7199.4894);

  assert.equal(manual.zeroUnderproduction, true);
  assert.equal(paper.zeroUnderproduction, true);
  assert.equal(manual.layoutCompactness, pipeline.layoutCompactness);
  assert.equal(paper.layoutCompactness, pipeline.layoutCompactness);
});

test("the same real alternatives rerank instantly when cost becomes first priority", () => {
  const pipeline = controlPipeline();
  const costFirstProfile = moveDecisionObjective(
    createDecisionProfile({ id: "cost-first" }),
    "estimatedTotalCost",
    0,
  );
  const alternatives = buildManualAndPaperAlternativeSet({
    report: pipeline.report,
    impositions: pipeline.impositions,
    paperSolution: pipeline.paperSolution,
    sourceSheet: pipeline.controlCase.verifiedM2.sourceSheet,
    pricing: illustrativePricing,
    decisionProfile: costFirstProfile,
    manualLayoutCompactness: pipeline.layoutCompactness,
    paperLayoutCompactness: pipeline.layoutCompactness,
  });

  assert.equal(alternatives.objectiveOrder[0], "estimatedTotalCost");
  assert.equal(alternatives.display.recommendedSolutionId, "manual-compact");
  assert.equal(alternatives.display.referenceSolutionId, "manual-compact");
});

test("incomplete pricing excludes cost from the real comparison instead of inventing zero", () => {
  const pipeline = controlPipeline();
  const alternatives = buildManualAndPaperAlternativeSet({
    report: pipeline.report,
    impositions: pipeline.impositions,
    paperSolution: pipeline.paperSolution,
    sourceSheet: pipeline.controlCase.verifiedM2.sourceSheet,
    pricing: null,
    decisionProfile: createDecisionProfile({ id: "no-pricing" }),
    manualLayoutCompactness: pipeline.layoutCompactness,
    paperLayoutCompactness: pipeline.layoutCompactness,
  });

  assert.equal(alternatives.pricingComparison.status, PRICING_COMPARISON_STATUS.INCOMPLETE);
  assert.equal(alternatives.pricingComparison.comparable, false);
  assert.equal(alternatives.objectiveOrder.includes("estimatedTotalCost"), false);
  assert.equal(alternatives.display.pricingComparable, false);
  alternatives.solutionMetrics.forEach((metrics) => {
    assert.equal(metrics.estimatedTotalCost, null);
  });
});

function pricedMetrics(id, pricing) {
  const physicalSheets = 100;
  const layoutForms = 2;
  const colorPlates = 8;
  const productionCost = calculateProductionCost({
    sourceSheet: { width: 620, height: 450 },
    physicalSheets,
    layoutForms,
    colorPlates,
    orderedFinishedQuantity: 1000,
    pricing,
  });
  return createSolutionMetrics({
    id,
    physicalSheets,
    impositionCount: 1,
    layoutForms,
    colorPlates,
    pressPasses: 200,
    fileOverrun: 0,
    pairOverrun: 0,
    layoutCompactness: 0.9,
    distinctOrdersPerImposition: 1,
    orderedFinishedQuantity: 1000,
    productionCost,
  });
}

test("different pricing rates are incompatible even when both alternatives have ready costs", () => {
  const first = pricedMetrics("first", illustrativePricing);
  const second = pricedMetrics("second", createPricingProfile({
    currency: "BYN",
    grammageGsm: 130,
    paperPricePerKg: 4.5,
    colorPlatePrice: 15,
    layoutFormPreparationPrice: 0,
  }));

  const compatibility = inspectPricingCompatibility([first, second]);
  assert.equal(compatibility.status, PRICING_COMPARISON_STATUS.INCOMPATIBLE);
  assert.equal(compatibility.comparable, false);
  assert.deepEqual(compatibility.incompatibleSolutionIds, ["second"]);
});
