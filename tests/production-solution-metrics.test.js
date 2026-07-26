import test from "node:test";
import assert from "node:assert/strict";

import { createPricingProfile } from "../src/production-cost.js";
import {
  calculateColorPlatesForReport,
  createProductionReportSolutionMetrics,
} from "../src/production-solution-metrics.js";
import { PRICING_STATUS } from "../src/solution-metrics.js";

const controlReport = Object.freeze({
  duplexMode: "separateFrontBackForms",
  totals: Object.freeze({
    pairCount: 35,
    fileCount: 20,
    impositionCount: 4,
    requiredPairQuantity: 29225,
    producedPairQuantity: 30675,
    underproduction: 0,
    overrun: 1450,
    requiredFileQuantity: 29225,
    producedCompleteFileQuantity: 30155,
    fileUnderproduction: 0,
    fileOverrun: 930,
    physicalSheets: 3395,
    frontForms: 4,
    backForms: 4,
    forms: 8,
    pressPasses: 6790,
  }),
});

function demoPricing() {
  return createPricingProfile({
    currency: "BYN",
    grammageGsm: 130,
    paperPricePerKg: 4,
    colorPlatePrice: 15,
  });
}

test("production report adapter derives color plates from side-layout forms", () => {
  assert.equal(calculateColorPlatesForReport(controlReport), 32);
});

test("production report can become pricing-ready SolutionMetrics", () => {
  const metrics = createProductionReportSolutionMetrics({
    report: controlReport,
    sourceSheet: { width: 620, height: 450 },
    pricing: demoPricing(),
    label: "Control production report",
  });

  assert.equal(metrics.pricingStatus, PRICING_STATUS.READY);
  assert.equal(metrics.physicalSheets, 3395);
  assert.equal(metrics.impositionCount, 4);
  assert.equal(metrics.layoutForms, 8);
  assert.equal(metrics.colorPlates, 32);
  assert.equal(metrics.pressPasses, 6790);
  assert.equal(metrics.fileOverrun, 930);
  assert.equal(metrics.pairOverrun, 1450);
  assert.equal(metrics.zeroUnderproduction, true);
  assert.equal(metrics.sheetWeightKg, 0.03627);
  assert.equal(metrics.paperCost, 492.5466);
  assert.equal(metrics.colorPlateCost, 480);
  assert.equal(metrics.estimatedTotalCost, 972.5466);
  assert.equal(metrics.orderedFinishedQuantity, 29225);
  assert.equal(metrics.estimatedUnitCost, 0.033277899);
});

test("production report stays pricing-incomplete when no pricing profile is provided", () => {
  const metrics = createProductionReportSolutionMetrics({
    report: controlReport,
    sourceSheet: { width: 620, height: 450 },
    pricing: null,
  });

  assert.equal(metrics.pricingStatus, PRICING_STATUS.INCOMPLETE);
  assert.equal(metrics.estimatedTotalCost, null);
  assert.equal(metrics.colorPlateCost, null);
  assert.equal(metrics.zeroUnderproduction, true);
});
