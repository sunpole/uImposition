import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  compareSolutions,
  createDecisionProfile,
  explainSolutionPreference,
  moveDecisionObjective,
  moveDecisionObjectiveBy,
  rankSolutions,
} from "../src/decision-profile.js";
import {
  DEFAULT_OBJECTIVE_ORDER,
  HARD_CONSTRAINT_IDS,
  OPTIMIZATION_OBJECTIVE_IDS,
  normalizeObjectiveOrder,
} from "../src/optimization-objectives.js";

const decisionCases = JSON.parse(
  readFileSync(new URL("../data/m7-decision-cases.json", import.meta.url), "utf8"),
);

function solution(id, overrides = {}) {
  return {
    id,
    metrics: {
      physicalSheets: 3395,
      estimatedTotalCost: 972.5466,
      layoutForms: 8,
      colorPlates: 32,
      fileOverrun: 930,
      pairOverrun: 1450,
      pressPasses: 6790,
      splitOrders: 0,
      impositionCount: 4,
      layoutCompactness: 0.95,
      distinctOrdersPerImposition: 8,
      ...overrides,
    },
  };
}

const manualCompact = solution("manual-compact");
const paperMinimum = solution("paper-minimum", {
  physicalSheets: 3305,
  estimatedTotalCost: 7199.4894,
  layoutForms: 112,
  colorPlates: 448,
  fileOverrun: 0,
  pairOverrun: 10,
  pressPasses: 6610,
  splitOrders: 20,
  impositionCount: 56,
  layoutCompactness: 0.45,
  distinctOrdersPerImposition: 2,
});

test("the default profile follows the approved M7 objective hierarchy", () => {
  const profile = createDecisionProfile();

  assert.deepEqual(profile.objectiveOrder, decisionCases.defaultObjectiveOrder);
  assert.deepEqual(profile.objectiveOrder, DEFAULT_OBJECTIVE_ORDER);
  assert.deepEqual(profile.hardConstraints, decisionCases.hardConstraints);
  assert.deepEqual(profile.hardConstraints, HARD_CONSTRAINT_IDS);
  assert.equal(profile.objectiveOrder.length, OPTIMIZATION_OBJECTIVE_IDS.length);
  assert.equal(profile.objectiveOrder.length, 11);
  assert.ok(Object.isFrozen(profile));
  assert.ok(Object.isFrozen(profile.objectiveOrder));
  assert.ok(Object.isFrozen(profile.hardConstraints));
});

test("paper-first, forms-first, and cost-first profiles can choose different priorities", () => {
  const paperFirst = createDecisionProfile({ id: "paper-first" });
  const formsFirst = moveDecisionObjective(paperFirst, "layoutForms", 0);
  const costFirst = moveDecisionObjective(paperFirst, "estimatedTotalCost", 0);

  assert.equal(compareSolutions(paperMinimum, manualCompact, paperFirst), -1);
  assert.equal(rankSolutions([manualCompact, paperMinimum], paperFirst)[0].solution.id, "paper-minimum");

  assert.equal(formsFirst.objectiveOrder[0], "layoutForms");
  assert.equal(compareSolutions(paperMinimum, manualCompact, formsFirst), 1);
  assert.equal(rankSolutions([manualCompact, paperMinimum], formsFirst)[0].solution.id, "manual-compact");

  assert.equal(costFirst.objectiveOrder[0], "estimatedTotalCost");
  assert.equal(compareSolutions(paperMinimum, manualCompact, costFirst), 1);
  assert.equal(rankSolutions([manualCompact, paperMinimum], costFirst)[0].solution.id, "manual-compact");

  assert.equal(
    decisionCases.illustrativePricing.expectedDecision.paperFirst,
    "paperMinimum",
  );
  assert.equal(
    decisionCases.illustrativePricing.expectedDecision.formsFirst,
    "manualCompact",
  );
  assert.equal(
    decisionCases.illustrativePricing.expectedDecision.costFirst,
    "manualCompact",
  );

  const paperExplanation = explainSolutionPreference(paperMinimum, manualCompact, paperFirst);
  assert.deepEqual(paperExplanation, {
    tied: false,
    priorityIndex: 0,
    objectiveId: "physicalSheets",
    metricKey: "physicalSheets",
    direction: "minimize",
    leftValue: 3305,
    rightValue: 3395,
    preferredSolutionId: "paper-minimum",
  });

  const costExplanation = explainSolutionPreference(paperMinimum, manualCompact, costFirst);
  assert.equal(costExplanation.priorityIndex, 0);
  assert.equal(costExplanation.objectiveId, "estimatedTotalCost");
  assert.equal(costExplanation.leftValue, 7199.4894);
  assert.equal(costExplanation.rightValue, 972.5466);
  assert.equal(costExplanation.preferredSolutionId, "manual-compact");
});

test("moving objectives is immutable, bounded, and deterministic", () => {
  const original = createDecisionProfile();
  const movedUp = moveDecisionObjectiveBy(original, "layoutForms", -100);
  const movedDown = moveDecisionObjectiveBy(original, "physicalSheets", 100);

  assert.equal(original.objectiveOrder[0], "physicalSheets");
  assert.equal(original.objectiveOrder[1], "estimatedTotalCost");
  assert.equal(original.objectiveOrder[2], "layoutForms");
  assert.equal(movedUp.objectiveOrder[0], "layoutForms");
  assert.equal(movedDown.objectiveOrder.at(-1), "physicalSheets");
  assert.notEqual(original, movedUp);
  assert.equal(moveDecisionObjective(original, "physicalSheets", 0), original);
});

test("lexicographic comparison advances only while higher priorities are tied", () => {
  const profile = createDecisionProfile();
  const lowerOverrun = solution("lower-overrun", {
    physicalSheets: 3305,
    estimatedTotalCost: 1000,
    layoutForms: 112,
    colorPlates: 448,
    fileOverrun: 0,
    pairOverrun: 10,
  });
  const higherOverrun = solution("higher-overrun", {
    physicalSheets: 3305,
    estimatedTotalCost: 1000,
    layoutForms: 112,
    colorPlates: 448,
    fileOverrun: 5,
    pairOverrun: 0,
  });

  const explanation = explainSolutionPreference(lowerOverrun, higherOverrun, profile);
  assert.equal(explanation.priorityIndex, 4);
  assert.equal(explanation.objectiveId, "fileOverrun");
  assert.equal(explanation.preferredSolutionId, "lower-overrun");
});

test("maximize objectives prefer the larger value when earlier metrics tie", () => {
  const compactnessFirst = moveDecisionObjective(
    createDecisionProfile(),
    "layoutCompactness",
    0,
  );
  const compact = solution("compact", { layoutCompactness: 0.9 });
  const fragmented = solution("fragmented", { layoutCompactness: 0.4 });

  assert.equal(compareSolutions(compact, fragmented, compactnessFirst), -1);
  assert.equal(
    explainSolutionPreference(compact, fragmented, compactnessFirst).preferredSolutionId,
    "compact",
  );
});

test("equal solutions keep stable input order and share a rank", () => {
  const profile = createDecisionProfile();
  const first = solution("first");
  const second = solution("second");
  const ranked = rankSolutions([second, first], profile);

  assert.deepEqual(ranked.map((entry) => entry.solution.id), ["second", "first"]);
  assert.deepEqual(ranked.map((entry) => entry.rank), [1, 1]);
  assert.deepEqual(ranked.map((entry) => entry.tiedWithPrevious), [false, true]);
  assert.equal(explainSolutionPreference(first, second, profile).tied, true);
  assert.ok(Object.isFrozen(ranked));
  assert.ok(ranked.every(Object.isFrozen));
  assert.ok(ranked.every((entry) => Object.isFrozen(entry.solution.metrics)));
});

test("invalid profiles and incomplete solution metrics fail explicitly", () => {
  assert.throws(
    () => normalizeObjectiveOrder(DEFAULT_OBJECTIVE_ORDER.slice(1)),
    /exactly 11 objectives/,
  );
  assert.throws(
    () => normalizeObjectiveOrder([
      ...DEFAULT_OBJECTIVE_ORDER.slice(0, -1),
      DEFAULT_OBJECTIVE_ORDER[0],
    ]),
    /Duplicate optimization objective/,
  );
  assert.throws(
    () => normalizeObjectiveOrder([
      ...DEFAULT_OBJECTIVE_ORDER.slice(0, -1),
      "zeroUnderproduction",
    ]),
    /Hard constraint cannot enter objective order/,
  );
  assert.throws(
    () => moveDecisionObjective(createDecisionProfile(), "unknown", 0),
    /Objective is not present/,
  );
  assert.throws(
    () => moveDecisionObjective(
      createDecisionProfile(),
      "physicalSheets",
      DEFAULT_OBJECTIVE_ORDER.length,
    ),
    /outside the objective order/,
  );
  assert.throws(
    () => compareSolutions(
      { id: "missing", metrics: { physicalSheets: 1 } },
      manualCompact,
      createDecisionProfile(),
    ),
    /has no finite metric/,
  );
  assert.throws(
    () => rankSolutions([manualCompact, { ...manualCompact }], createDecisionProfile()),
    /Duplicate solution id/,
  );
});
