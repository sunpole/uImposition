import test from "node:test";
import assert from "node:assert/strict";

import { createDecisionProfile, rankSolutions } from "../src/decision-profile.js";
import { createPricingProfile, calculateProductionCost } from "../src/production-cost.js";
import {
  PRICING_STATUS,
  createDecisionSolution,
  createSolutionMetrics,
} from "../src/solution-metrics.js";

const compactBaseMetrics = Object.freeze({
  id: "compact",
  label: "Компактный",
  source: "manual",
  physicalSheets: 3395,
  impositionCount: 4,
  layoutForms: 8,
  colorPlates: 32,
  pressPasses: 6790,
  fileOverrun: 0,
  pairOverrun: 1450,
  splitOrders: 0,
  fragmentedBlocks: 0,
  distinctOrdersPerImposition: 2,
  layoutCompactness: 1,
  orderedFinishedQuantity: 4200,
});

const paperMinimumBaseMetrics = Object.freeze({
  id: "paper-minimum",
  label: "Минимум бумаги",
  source: "paper-minimizer",
  physicalSheets: 3305,
  impositionCount: 56,
  layoutForms: 112,
  colorPlates: 448,
  pressPasses: 6610,
  fileOverrun: 0,
  pairOverrun: 10,
  splitOrders: 0,
  fragmentedBlocks: 0,
  distinctOrdersPerImposition: 1,
  layoutCompactness: 0.5,
  orderedFinishedQuantity: 4200,
});

test("SolutionMetrics keeps pricing incomplete without invented costs", () => {
  const metrics = createSolutionMetrics(compactBaseMetrics);

  assert.equal(metrics.kind, "solutionMetrics");
  assert.equal(metrics.pricingStatus, PRICING_STATUS.INCOMPLETE);
  assert.equal(metrics.estimatedTotalCost, null);
  assert.equal(metrics.paperCost, null);
  assert.equal(metrics.colorPlateCost, null);
  assert.equal(metrics.currency, null);
  assert.equal(metrics.zeroUnderproduction, true);
});

test("SolutionMetrics imports real BYN production cost when pricing is ready", () => {
  const pricing = createPricingProfile({
    currency: "BYN",
    grammageGsm: 130,
    paperPricePerKg: 4,
    colorPlatePrice: 15,
  });
  const productionCost = calculateProductionCost({
    sourceSheet: { width: 620, height: 450 },
    physicalSheets: compactBaseMetrics.physicalSheets,
    colorPlates: compactBaseMetrics.colorPlates,
    layoutForms: compactBaseMetrics.layoutForms,
    orderedFinishedQuantity: compactBaseMetrics.orderedFinishedQuantity,
    pricing,
  });
  const metrics = createSolutionMetrics({
    ...compactBaseMetrics,
    productionCost,
  });

  assert.equal(metrics.pricingStatus, PRICING_STATUS.READY);
  assert.equal(metrics.currency, "BYN");
  assert.equal(metrics.sheetBasis, "source");
  assert.equal(metrics.paperCost, 492.5466);
  assert.equal(metrics.colorPlateCost, 480);
  assert.equal(metrics.estimatedTotalCost, 972.5466);
  assert.equal(metrics.estimatedUnitCost, 0.231558714);
});

test("Decision solution refuses estimatedTotalCost when pricing is incomplete", () => {
  const metrics = createSolutionMetrics(compactBaseMetrics);

  assert.throws(
    () => createDecisionSolution({ metrics }),
    /pricing must be ready/,
  );
});

test("Ready normalized metrics can feed existing lexicographic decision ranking", () => {
  const pricing = createPricingProfile({
    currency: "BYN",
    grammageGsm: 130,
    paperPricePerKg: 4,
    colorPlatePrice: 15,
  });
  const compact = createSolutionMetrics({
    ...compactBaseMetrics,
    productionCost: calculateProductionCost({
      sourceSheet: { width: 620, height: 450 },
      physicalSheets: compactBaseMetrics.physicalSheets,
      colorPlates: compactBaseMetrics.colorPlates,
      layoutForms: compactBaseMetrics.layoutForms,
      orderedFinishedQuantity: compactBaseMetrics.orderedFinishedQuantity,
      pricing,
    }),
  });
  const paperMinimum = createSolutionMetrics({
    ...paperMinimumBaseMetrics,
    productionCost: calculateProductionCost({
      sourceSheet: { width: 620, height: 450 },
      physicalSheets: paperMinimumBaseMetrics.physicalSheets,
      colorPlates: paperMinimumBaseMetrics.colorPlates,
      layoutForms: paperMinimumBaseMetrics.layoutForms,
      orderedFinishedQuantity: paperMinimumBaseMetrics.orderedFinishedQuantity,
      pricing,
    }),
  });

  const costFirstProfile = createDecisionProfile({
    id: "cost-first",
    objectiveOrder: [
      "estimatedTotalCost",
      "physicalSheets",
      "layoutForms",
      "colorPlates",
      "fileOverrun",
      "pairOverrun",
      "pressPasses",
      "splitOrders",
      "impositionCount",
      "layoutCompactness",
      "distinctOrdersPerImposition",
    ],
  });
  const ranked = rankSolutions([
    createDecisionSolution({ metrics: paperMinimum }),
    createDecisionSolution({ metrics: compact }),
  ], costFirstProfile);

  assert.equal(ranked[0].solution.id, "compact");
  assert.equal(ranked[0].solution.metrics.estimatedTotalCost, 972.5466);
  assert.equal(ranked[1].solution.metrics.estimatedTotalCost, 7199.4894);
});
