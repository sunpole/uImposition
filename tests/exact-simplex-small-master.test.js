import test from "node:test";
import assert from "node:assert/strict";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import {
  countExactSimplexSmallMasterStates,
  createExactSimplexSmallMasterPlan,
  solveExactSimplexSmallMaster,
  validateExactSimplexSmallMasterPlan,
} from "../src/exact-simplex-small-master.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function simplexDemand(id, requiredQuantity) {
  return {
    demandId: id,
    productId: `product-${id}`,
    requiredQuantity,
    frontPage: 1,
    backPage: null,
    frontColorCount: 4,
    backColorCount: 0,
  };
}

function uniformGeometry(capacity) {
  return createUniformGridPattern({
    printableArea: { widthMm: capacity * 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function columnCatalog(quantityA, quantityB, demandOrder = ["a", "b"]) {
  const quantities = { a: quantityA, b: quantityB };
  return generateExactMultiProductSimplexColumns({
    id: "r0-columns",
    geometryPattern: uniformGeometry(4),
    demands: demandOrder.map((id) => simplexDemand(id, quantities[id])),
  });
}

function allocation(run) {
  return run.column.allocation.map((entry) => entry.positionsPerSheet).join(",");
}

function findRun(plan, expectedAllocation, expectedRunLength) {
  return plan.runs.find((run) => (
    allocation(run) === expectedAllocation && run.runLength === expectedRunLength
  ));
}

test("R0 exact state count covers every unique column set and positive run vector", () => {
  assert.equal(countExactSimplexSmallMasterStates({
    candidateColumnCount: 14,
    maxSelectedColumns: 1,
    maxRunLength: 4,
  }), 56n);
  assert.equal(countExactSimplexSmallMasterStates({
    candidateColumnCount: 14,
    maxSelectedColumns: 2,
    maxRunLength: 4,
  }), 1512n);
});

test("R0 keeps both one mixed form and two dedicated forms for equal demand", () => {
  const result = solveExactSimplexSmallMaster({
    id: "equal-demand-master",
    columnCatalog: columnCatalog(8, 8),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });

  assert.equal(result.coverage.theoreticalStateCount, "1512");
  assert.equal(result.coverage.evaluatedStateCount, 1512);
  assert.equal(result.coverage.completeWithinRequestedSpace, true);
  assert.equal(result.coverage.globalCompletenessClaimed, false);
  const mixed = result.plans.find((plan) => (
    plan.runs.length === 1 && findRun(plan, "2,2", 4)
  ));
  assert.ok(mixed);
  assert.equal(mixed.metrics.physicalSheets, 4);
  assert.equal(mixed.metrics.layoutForms, 1);
  assert.equal(mixed.metrics.colorPlates, 4);
  assert.equal(mixed.metrics.totalOverrun, 0);

  const dedicated = result.plans.find((plan) => (
    plan.runs.length === 2
    && findRun(plan, "4,0", 2)
    && findRun(plan, "0,4", 2)
  ));
  assert.ok(dedicated);
  assert.equal(dedicated.metrics.physicalSheets, 4);
  assert.equal(dedicated.metrics.layoutForms, 2);
  assert.equal(dedicated.metrics.colorPlates, 8);
  assert.equal(dedicated.metrics.totalOverrun, 0);
  assert.equal(result.bestPlanIds.physicalSheets, mixed.id);
  assert.equal(result.bestPlanIds.layoutForms, mixed.id);
  assert.equal(result.paretoPlanIds.includes(mixed.id), true);
  assert.equal(result.plans.includes(dedicated), true);
  assert.equal(validateExactSimplexSmallMasterPlan(mixed), true);
});

test("R0 finds different dedicated run lengths for 8 and 4 copies", () => {
  const result = solveExactSimplexSmallMaster({
    id: "different-runs-master",
    columnCatalog: columnCatalog(8, 4),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });
  const dedicated = result.plans.find((plan) => (
    plan.runs.length === 2
    && findRun(plan, "4,0", 2)
    && findRun(plan, "0,4", 1)
  ));

  assert.ok(dedicated);
  assert.equal(dedicated.metrics.physicalSheets, 3);
  assert.equal(dedicated.metrics.layoutForms, 2);
  assert.equal(dedicated.metrics.totalOverrun, 0);
  assert.equal(dedicated.metrics.totalUnderproduction, 0);
  assert.equal(result.bestPlanIds.physicalSheets, dedicated.id);
});

test("R0 combines two mixed columns with different runs for an exact 7 and 5 plan", () => {
  const result = solveExactSimplexSmallMaster({
    id: "two-mixed-runs-master",
    columnCatalog: columnCatalog(7, 5),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });
  const exact = result.plans.find((plan) => (
    plan.runs.length === 2
    && findRun(plan, "3,1", 2)
    && findRun(plan, "1,3", 1)
  ));

  assert.ok(exact);
  assert.equal(exact.metrics.physicalSheets, 3);
  assert.equal(exact.metrics.layoutForms, 2);
  assert.equal(exact.metrics.totalOverrun, 0);
  assert.deepEqual(exact.demandMetrics.map((metric) => metric.producedQuantity), [7, 5]);
  assert.equal(result.bestPlanIds.physicalSheets, exact.id);
});

test("R0 exact bounds are explicit and can exclude a better larger-column plan", () => {
  const oneForm = solveExactSimplexSmallMaster({
    id: "one-form-bound",
    columnCatalog: columnCatalog(7, 5),
    maxSelectedColumns: 1,
    maxRunLength: 5,
    maxExactStateCount: 100,
  });
  const best = oneForm.plans.find((plan) => plan.id === oneForm.bestPlanIds.physicalSheets);

  assert.ok(best);
  assert.equal(best.metrics.physicalSheets, 4);
  assert.equal(best.metrics.layoutForms, 1);
  assert.equal(oneForm.coverage.maxSelectedColumns, 1);
  assert.equal(oneForm.coverage.largerColumnSetsEvaluated, false);
  assert.equal(oneForm.coverage.globalCompletenessClaimed, false);
});

test("R0 complete bounded search may honestly return no feasible plan", () => {
  const result = solveExactSimplexSmallMaster({
    id: "no-feasible-run",
    columnCatalog: columnCatalog(8, 8),
    maxSelectedColumns: 2,
    maxRunLength: 1,
    maxExactStateCount: 200,
  });

  assert.equal(result.plans.length, 0);
  assert.equal(result.paretoPlanIds.length, 0);
  assert.deepEqual(result.bestPlanIds, {
    physicalSheets: null,
    layoutForms: null,
    overrun: null,
  });
  assert.equal(result.coverage.completeWithinRequestedSpace, true);
  assert.equal(result.coverage.feasiblePlanCount, 0);
});

test("R0 retains every feasible structural plan while Pareto remains an annotation", () => {
  const result = solveExactSimplexSmallMaster({
    id: "lossless-master",
    columnCatalog: columnCatalog(8, 8),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });

  assert.ok(result.plans.length > result.paretoPlanIds.length);
  assert.equal(new Set(result.plans.map((plan) => plan.planSignature)).size, result.plans.length);
  assert.equal(result.plans.every((plan) => plan.metrics.totalUnderproduction === 0), true);
  assert.equal(result.paretoPlanIds.every((planId) => result.plans.some((plan) => plan.id === planId)), true);
  assert.equal(Object.values(result.bestPlanIds).every((planId) => (
    planId === null || result.plans.some((plan) => plan.id === planId)
  )), true);
});

test("R0 output is deterministic regardless of original demand input order", () => {
  const first = solveExactSimplexSmallMaster({
    id: "deterministic-master",
    columnCatalog: columnCatalog(7, 5, ["a", "b"]),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });
  const second = solveExactSimplexSmallMaster({
    id: "deterministic-master",
    columnCatalog: columnCatalog(7, 5, ["b", "a"]),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });

  assert.deepEqual(
    first.plans.map((plan) => plan.planSignature),
    second.plans.map((plan) => plan.planSignature),
  );
  assert.deepEqual(first.paretoPlanIds, second.paretoPlanIds);
  assert.deepEqual(first.bestPlanIds, second.bestPlanIds);
});

test("R0 plan and catalog outputs are deeply immutable", () => {
  const result = solveExactSimplexSmallMaster({
    id: "immutable-master",
    columnCatalog: columnCatalog(4, 4),
    maxSelectedColumns: 2,
    maxRunLength: 2,
    maxExactStateCount: 500,
  });
  const plan = result.plans[0];

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.coverage), true);
  assert.equal(Object.isFrozen(result.plans), true);
  assert.equal(Object.isFrozen(result.paretoPlanIds), true);
  assert.equal(Object.isFrozen(result.bestPlanIds), true);
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.runs), true);
  assert.equal(Object.isFrozen(plan.demandMetrics), true);
  assert.equal(Object.isFrozen(plan.metrics), true);
});

test("R0 validator rejects corrupted metrics, run coverage and duplicate columns", () => {
  const result = solveExactSimplexSmallMaster({
    id: "validator-master",
    columnCatalog: columnCatalog(8, 8),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });
  const valid = result.plans.find((plan) => plan.runs.length === 1 && findRun(plan, "2,2", 4));
  assert.ok(valid);

  assert.throws(() => validateExactSimplexSmallMasterPlan({
    ...valid,
    metrics: { ...valid.metrics, physicalSheets: valid.metrics.physicalSheets + 1 },
  }), /metrics mismatch/);

  assert.throws(() => validateExactSimplexSmallMasterPlan({
    ...valid,
    runs: valid.runs.map((run) => ({ ...run, runLength: 1 })),
  }), /demandMetrics mismatch|underproduction/);

  assert.throws(() => createExactSimplexSmallMasterPlan({
    id: "duplicate-column-plan",
    demands: valid.demands,
    runs: [valid.runs[0], valid.runs[0]],
  }), /may appear only once/);
});

test("R0 rejects incomplete column catalogs and oversized exact state spaces", () => {
  const catalog = columnCatalog(8, 8);
  assert.throws(() => solveExactSimplexSmallMaster({
    columnCatalog: {
      ...catalog,
      coverage: { ...catalog.coverage, completeWithinRequestedSpace: false, truncated: true },
    },
    maxSelectedColumns: 1,
    maxRunLength: 4,
  }), /requires a complete non-truncated column catalog/);

  assert.throws(() => solveExactSimplexSmallMaster({
    columnCatalog: catalog,
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 1500,
  }), /exact small-master space 1512 exceeds/);
});
