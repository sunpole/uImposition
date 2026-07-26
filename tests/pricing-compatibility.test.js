import test from "node:test";
import assert from "node:assert/strict";

import {
  PRICING_COMPARISON_STATUS,
  inspectPricingCompatibility,
} from "../src/production-alternative-set.js";
import {
  calculateProductionCost,
  createPricingProfile,
} from "../src/production-cost.js";
import { createSolutionMetrics } from "../src/solution-metrics.js";

const pricing = createPricingProfile({
  currency: "BYN",
  grammageGsm: 130,
  paperPricePerKg: 4.25,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 3,
});

function metrics(id, { physicalSheets, layoutForms, colorPlates }) {
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
    impositionCount: Math.max(1, layoutForms),
    layoutForms,
    colorPlates,
    pressPasses: physicalSheets * 2,
    fileOverrun: 0,
    pairOverrun: 0,
    layoutCompactness: 0.9,
    distinctOrdersPerImposition: 1,
    orderedFinishedQuantity: 1000,
    productionCost,
  });
}

test("SolutionMetrics retains explicit rates for compatibility and future component deltas", () => {
  const normalized = metrics("priced", {
    physicalSheets: 100,
    layoutForms: 2,
    colorPlates: 8,
  });

  assert.equal(normalized.paperPricePerKg, 4.25);
  assert.equal(normalized.colorPlatePrice, 15);
  assert.equal(normalized.layoutFormPreparationPrice, 3);
});

test("zero-count cost components remain compatible through explicit shared rates", () => {
  const zeroComponents = metrics("zero-components", {
    physicalSheets: 100,
    layoutForms: 0,
    colorPlates: 0,
  });
  const normalComponents = metrics("normal-components", {
    physicalSheets: 110,
    layoutForms: 2,
    colorPlates: 8,
  });

  const compatibility = inspectPricingCompatibility([zeroComponents, normalComponents]);
  assert.equal(compatibility.status, PRICING_COMPARISON_STATUS.READY);
  assert.equal(compatibility.comparable, true);
  assert.equal(compatibility.fingerprint.paperPricePerKg, 4.25);
  assert.equal(compatibility.fingerprint.colorPlatePrice, 15);
  assert.equal(compatibility.fingerprint.layoutFormPreparationPrice, 3);
});
