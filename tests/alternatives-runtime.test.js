import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ALTERNATIVES_RUNTIME_STATUS,
  calculateControlLayoutCompactness,
  createAlternativesRuntimeState,
} from "../src/alternatives-runtime.js";
import { createBackLayout } from "../src/back-layout.js";
import {
  createDecisionProfile,
  moveDecisionObjective,
} from "../src/decision-profile.js";
import { createFrontLayout } from "../src/front-layout.js";
import { validateImposition } from "../src/imposition-validation.js";
import { expandPagePairs } from "../src/orders.js";
import { minimizePhysicalPaper } from "../src/paper-minimizer.js";
import { createPricingProfile } from "../src/production-cost.js";
import { buildProductionReport } from "../src/production-report.js";

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

function controlProductionState() {
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
  return Object.freeze({ report, impositions, paperSolution, controlCase });
}

const pricing = createPricingProfile({
  currency: "BYN",
  grammageGsm: 130,
  paperPricePerKg: 4,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 0,
});

test("runtime waits until report, impositions, paper solution, and control case are all available", () => {
  const state = createAlternativesRuntimeState({
    productionState: { report: null },
    decisionProfile: createDecisionProfile({ id: "waiting" }),
    language: "ru",
  });

  assert.equal(state.status, ALTERNATIVES_RUNTIME_STATUS.WAITING_PRODUCTION);
  assert.equal(state.alternativeSet, null);
  assert.equal(state.explanations, null);
  assert.equal(state.priorityObjectiveId, "physicalSheets");
});

test("runtime builds real alternatives without pricing and keeps cost excluded", () => {
  const state = createAlternativesRuntimeState({
    productionState: controlProductionState(),
    pricingState: { state: "incomplete", pricing: null },
    decisionProfile: createDecisionProfile({ id: "paper-first" }),
    language: "ru",
  });

  assert.equal(state.status, ALTERNATIVES_RUNTIME_STATUS.READY_WITHOUT_PRICING);
  assert.equal(state.alternativeSet.objectiveOrder.includes("estimatedTotalCost"), false);
  assert.equal(state.alternativeSet.display.recommendedSolutionId, "paper-minimum");
  assert.equal(state.explanations.entries.length, 2);
  state.explanations.entries.forEach((entry) => {
    assert.equal(entry.monetary.available, false);
  });
});

test("runtime builds priced real alternatives and paper-first RU explanations", () => {
  const state = createAlternativesRuntimeState({
    productionState: controlProductionState(),
    pricingState: { state: "costReady", pricing },
    decisionProfile: createDecisionProfile({ id: "paper-first" }),
    language: "ru",
  });

  assert.equal(state.status, ALTERNATIVES_RUNTIME_STATUS.READY);
  assert.equal(state.priorityObjectiveId, "physicalSheets");
  assert.equal(state.alternativeSet.display.recommendedSolutionId, "paper-minimum");
  assert.equal(state.explanations.recommendedSolutionId, "paper-minimum");
  assert.equal(state.referenceSolutionId, "paper-minimum");
  assert.equal(state.explanations.entries.every((entry) => entry.monetary.available), true);
});

test("runtime reranks the same production data when cost becomes first priority", () => {
  const costFirst = moveDecisionObjective(
    createDecisionProfile({ id: "cost-first" }),
    "estimatedTotalCost",
    0,
  );
  const state = createAlternativesRuntimeState({
    productionState: controlProductionState(),
    pricingState: { state: "costReady", pricing },
    decisionProfile: costFirst,
    language: "en",
  });

  assert.equal(state.status, ALTERNATIVES_RUNTIME_STATUS.READY);
  assert.equal(state.priorityObjectiveId, "estimatedTotalCost");
  assert.equal(state.alternativeSet.display.recommendedSolutionId, "manual-compact");
  assert.equal(state.explanations.recommendedSolutionId, "manual-compact");
  assert.equal(state.explanations.language, "en");
});

test("runtime changes explanation reference without changing the recommendation", () => {
  const state = createAlternativesRuntimeState({
    productionState: controlProductionState(),
    pricingState: { state: "costReady", pricing },
    decisionProfile: createDecisionProfile({ id: "paper-first" }),
    language: "ru",
    referenceSolutionId: "manual-compact",
  });

  assert.equal(state.alternativeSet.display.recommendedSolutionId, "paper-minimum");
  assert.equal(state.referenceSolutionId, "manual-compact");
  const paper = state.explanations.entries.find((entry) => entry.solutionId === "paper-minimum");
  assert.equal(paper.comparison.primaryAdvantageObjectiveId, "physicalSheets");
  assert.equal(paper.comparison.primaryTradeoffObjectiveId, "estimatedTotalCost");
});

test("control compactness is calculated from verified printable geometry", () => {
  const production = controlProductionState();
  const compactness = calculateControlLayoutCompactness(production.controlCase);
  const expected = 16 * 105 * 148 / (608 * 431);
  assert.equal(compactness, expected);
  assert.ok(compactness > 0 && compactness < 1);
});

test("runtime exposes invalid control geometry as an error state instead of partial alternatives", () => {
  const production = controlProductionState();
  const broken = {
    ...production,
    controlCase: {
      ...production.controlCase,
      verifiedM2: {
        ...production.controlCase.verifiedM2,
        bestPositions: 0,
      },
    },
  };
  const state = createAlternativesRuntimeState({
    productionState: broken,
    pricingState: { state: "costReady", pricing },
    decisionProfile: createDecisionProfile({ id: "broken" }),
    language: "ru",
  });

  assert.equal(state.status, ALTERNATIVES_RUNTIME_STATUS.ERROR);
  assert.match(state.error.message, /bestPositions/);
  assert.equal(state.alternativeSet, null);
});
