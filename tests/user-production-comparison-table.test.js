import test from "node:test";
import assert from "node:assert/strict";

import { buildFeasibleSolutionCatalog } from "../src/feasible-solution-catalog.js";
import {
  COMPARISON_PROOF_STATUS,
  COMPARISON_SORT_DIRECTION,
  COMPARISON_STATUS_FILTER,
  USER_PRODUCTION_COMPARISON_TABLE_KIND,
  createUserProductionComparisonTable,
} from "../src/user-production-comparison-table.js";

function metrics(overrides = {}) {
  return Object.freeze({
    duplexMode: "separateFrontBackForms",
    physicalSheets: 20,
    paperWeightKg: 1.5,
    layoutForms: 8,
    colorPlates: 20,
    pressPasses: 40,
    pairOverrun: 0,
    fileOverrun: 0,
    splitOrders: 0,
    impositionCount: 4,
    layoutCompactness: 1,
    distinctOrdersPerImposition: 1,
    paperCost: 20,
    colorPlateCost: 300,
    layoutFormPreparationCost: 0,
    estimatedTotalCost: 320,
    estimatedUnitCost: 1.0666666667,
    ...overrides,
  });
}

function plan(id, {
  label = id,
  family = "paperMinimum",
  rotation = 90,
  columns = 5,
  rows = 2,
  proof = { type: "feasible", lowerBoundReached: false },
  metricOverrides = {},
} = {}) {
  return Object.freeze({
    id,
    label,
    family,
    grid: Object.freeze({ rotation, columns, rows }),
    proof: Object.freeze(proof),
    metrics: metrics(metricOverrides),
  });
}

function createPlanSet(plans, {
  objectiveIds,
  objectiveOrder,
} = {}) {
  const catalog = buildFeasibleSolutionCatalog(plans, {
    ...(objectiveIds ? { objectiveIds } : {}),
    ...(objectiveOrder ? { objectiveOrder } : {}),
    searchCoverage: {
      theoreticalCandidateCount: plans.length,
      evaluatedCandidateCount: plans.length,
    },
  });
  return Object.freeze({
    plans: Object.freeze(plans),
    catalog,
  });
}

const paperPlan = plan("uniform-r90-paper-minimum", {
  label: "Paper-focused",
  proof: {
    type: "provenMinimum",
    lowerBoundReached: true,
    paperLowerBound: 20,
  },
});

const dedicatedPlan = plan("uniform-r90-dedicated-pairs", {
  label: "Dedicated pairs",
  family: "dedicatedPairForms",
  proof: {
    type: "constructedFeasible",
    completeWithinFamily: true,
  },
  metricOverrides: {
    physicalSheets: 21,
    layoutForms: 6,
    colorPlates: 15,
    pressPasses: 42,
    pairOverrun: 36,
    fileOverrun: 36,
    impositionCount: 3,
    paperCost: 21,
    colorPlateCost: 219,
    estimatedTotalCost: 240,
    estimatedUnitCost: 0.8,
  },
});

const dominatedPlan = plan("uniform-r0-expensive", {
  label: "Dominated expensive",
  rotation: 0,
  columns: 4,
  rows: 2,
  metricOverrides: {
    physicalSheets: 22,
    paperWeightKg: 1.7,
    layoutForms: 9,
    colorPlates: 25,
    pressPasses: 44,
    pairOverrun: 50,
    fileOverrun: 50,
    splitOrders: 1,
    impositionCount: 5,
    layoutCompactness: 0.8,
    paperCost: 22,
    colorPlateCost: 328,
    layoutFormPreparationCost: 9,
    estimatedTotalCost: 359,
    estimatedUnitCost: 1.1966666667,
  },
});

const pricedPlanSet = createPlanSet([
  dominatedPlan,
  dedicatedPlan,
  paperPlan,
], {
  objectiveOrder: [
    "physicalSheets",
    "estimatedTotalCost",
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

test("comparison table preserves every catalog plan and source object reference", () => {
  const result = createUserProductionComparisonTable(pricedPlanSet, {
    selectedPlanId: dedicatedPlan.id,
  });

  assert.equal(result.kind, USER_PRODUCTION_COMPARISON_TABLE_KIND);
  assert.equal(result.allRows.length, 3);
  assert.equal(result.rows.length, 3);
  assert.equal(result.summary.catalogFeasibleSolutionCount, 3);
  assert.equal(result.summary.catalogHiddenSolutionCount, 0);
  assert.equal(result.summary.hiddenByViewCount, 0);
  assert.equal(result.summary.reusedPlanCount, 3);
  assert.equal(result.summary.regeneratedPlanCount, 0);
  assert.equal(result.referencePlanId, dedicatedPlan.id);

  const paperRow = result.allRows.find(({ id }) => id === paperPlan.id);
  const dedicatedRow = result.allRows.find(({ id }) => id === dedicatedPlan.id);
  assert.equal(paperRow.plan, paperPlan);
  assert.equal(dedicatedRow.plan, dedicatedPlan);
  assert.equal(dedicatedRow.selected, true);
  assert.equal(paperRow.recommended, true);
  assert.equal(paperRow.values.proofStatus, COMPARISON_PROOF_STATUS.PROVEN_PAPER_MINIMUM);
  assert.equal(dedicatedRow.values.proofStatus, COMPARISON_PROOF_STATUS.COMPLETE_WITHIN_FAMILY);
  assert.equal(paperRow.deltas.physicalSheets, -1);
  assert.equal(paperRow.deltas.estimatedTotalCost, 80);
});

test("filters and sorting change only the view, never the lossless rows", () => {
  const result = createUserProductionComparisonTable(pricedPlanSet, {
    statusFilter: COMPARISON_STATUS_FILTER.DOMINATED,
    sortBy: "estimatedTotalCost",
    sortDirection: COMPARISON_SORT_DIRECTION.DESCENDING,
  });

  assert.deepEqual(result.rows.map(({ id }) => id), [dominatedPlan.id]);
  assert.equal(result.allRows.length, 3);
  assert.equal(result.summary.viewRowCount, 1);
  assert.equal(result.summary.hiddenByViewCount, 2);
  assert.equal(result.catalog, pricedPlanSet.catalog);
  assert.equal(result.summary.regeneratedPlanCount, 0);

  const familyView = createUserProductionComparisonTable(pricedPlanSet, {
    planFamily: "dedicatedPairForms",
  });
  assert.deepEqual(familyView.rows.map(({ id }) => id), [dedicatedPlan.id]);
  assert.equal(familyView.allRows.length, 3);
});

test("only differences hides equal optional columns but keeps identity and status", () => {
  const left = plan("left", {
    family: "paperMinimum",
    metricOverrides: {
      physicalSheets: 20,
      pressPasses: 40,
      paperWeightKg: 1.5,
      estimatedTotalCost: 320,
    },
  });
  const right = plan("right", {
    family: "dedicatedPairForms",
    metricOverrides: {
      physicalSheets: 21,
      pressPasses: 40,
      paperWeightKg: 1.5,
      estimatedTotalCost: 240,
    },
  });
  const result = createUserProductionComparisonTable(createPlanSet([left, right]), {
    onlyDifferences: true,
  });
  const visible = result.visibleColumns.map(({ id }) => id);

  assert.ok(visible.includes("label"));
  assert.ok(visible.includes("rank"));
  assert.ok(visible.includes("status"));
  assert.ok(visible.includes("physicalSheets"));
  assert.ok(visible.includes("estimatedTotalCost"));
  assert.ok(visible.includes("family"));
  assert.equal(visible.includes("pressPasses"), false);
  assert.equal(visible.includes("paperWeightKg"), false);
});

test("missing pricing stays null and sorts after actual prices instead of becoming zero", () => {
  const priced = plan("priced", {
    metricOverrides: {
      physicalSheets: 21,
      estimatedTotalCost: 240,
      paperCost: 21,
      colorPlateCost: 219,
      layoutFormPreparationCost: 0,
      estimatedUnitCost: 0.8,
    },
  });
  const unpriced = plan("unpriced", {
    metricOverrides: {
      physicalSheets: 20,
      paperCost: null,
      colorPlateCost: null,
      layoutFormPreparationCost: null,
      estimatedTotalCost: null,
      estimatedUnitCost: null,
    },
  });
  const planSet = createPlanSet([unpriced, priced], {
    objectiveIds: ["physicalSheets", "layoutForms"],
    objectiveOrder: ["physicalSheets", "layoutForms"],
  });
  const result = createUserProductionComparisonTable(planSet, {
    referencePlanId: priced.id,
    sortBy: "estimatedTotalCost",
  });

  assert.deepEqual(result.rows.map(({ id }) => id), [priced.id, unpriced.id]);
  const unpricedRow = result.rows.find(({ id }) => id === unpriced.id);
  assert.equal(unpricedRow.values.estimatedTotalCost, null);
  assert.equal(unpricedRow.values.paperCost, null);
  assert.equal(unpricedRow.deltas.estimatedTotalCost, null);
  assert.equal(result.columns.find(({ id }) => id === "estimatedTotalCost").available, true);
});

test("comparison table rejects a catalog that does not cover every source plan", () => {
  const extraPlan = plan("extra");
  assert.throws(() => createUserProductionComparisonTable({
    plans: Object.freeze([paperPlan, extraPlan]),
    catalog: buildFeasibleSolutionCatalog([paperPlan]),
  }), /one catalog entry per source plan/);
});
