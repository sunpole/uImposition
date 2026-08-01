import test from "node:test";
import assert from "node:assert/strict";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import { generateExactMultiProductSeparateDuplexColumns } from "../src/multi-product-duplex-columns.js";
import { solveExactSimplexSmallMaster } from "../src/exact-simplex-small-master.js";
import {
  createExactProductionSmallMasterPlan,
  solveExactProductionSmallMaster,
  validateExactProductionSmallMasterPlan,
} from "../src/exact-production-small-master.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function rowGeometry(capacity) {
  return createUniformGridPattern({
    printableArea: { widthMm: capacity * 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function simplexDemand(id, requiredQuantity, frontColorCount = 4) {
  return {
    demandId: id,
    productId: `product-${id}`,
    requiredQuantity,
    frontPage: 1,
    backPage: null,
    frontColorCount,
    backColorCount: 0,
  };
}

function duplexDemand(
  id,
  requiredQuantity,
  frontPage,
  backPage,
  frontColorCount = 1,
  backColorCount = 1,
) {
  return {
    demandId: id,
    productId: `product-${id}`,
    requiredQuantity,
    frontPage,
    backPage,
    frontColorCount,
    backColorCount,
  };
}

function simplexCatalog(quantityA, quantityB, demandOrder = ["a", "b"]) {
  const quantities = { a: quantityA, b: quantityB };
  return generateExactMultiProductSimplexColumns({
    id: "generic-simplex-columns",
    geometryPattern: rowGeometry(4),
    demands: demandOrder.map((id) => simplexDemand(id, quantities[id])),
  });
}

function duplexCatalog(
  quantityA,
  quantityB,
  demandOrder = ["a", "b"],
  frontColorCount = 1,
  backColorCount = 1,
) {
  const quantities = { a: quantityA, b: quantityB };
  const pages = { a: [1, 2], b: [3, 4] };
  return generateExactMultiProductSeparateDuplexColumns({
    id: "generic-duplex-columns",
    geometryPattern: rowGeometry(4),
    demands: demandOrder.map((id) => duplexDemand(
      id,
      quantities[id],
      pages[id][0],
      pages[id][1],
      frontColorCount,
      backColorCount,
    )),
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

function planFingerprint(plan) {
  return JSON.stringify({
    runs: plan.runs.map((run) => [allocation(run), run.runLength]).sort(),
    physicalSheets: plan.metrics.physicalSheets,
    layoutForms: plan.metrics.layoutForms,
    colorPlates: plan.metrics.colorPlates,
    pressPasses: plan.metrics.pressPasses,
    totalOverrun: plan.metrics.totalOverrun,
    blankPositions: plan.metrics.blankProductPositions ?? plan.metrics.blankSheetPositions,
  });
}

test("R0 production master agrees with the existing simplex oracle", () => {
  const catalog = simplexCatalog(7, 5);
  const simplexResult = solveExactSimplexSmallMaster({
    id: "simplex-oracle",
    columnCatalog: catalog,
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });
  const genericResult = solveExactProductionSmallMaster({
    id: "generic-simplex-oracle",
    columnCatalog: catalog,
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });

  assert.equal(genericResult.columnFamily, "multiProductSimplexColumn");
  assert.equal(genericResult.columnStrategy, "singleSharedFrontFormCandidate");
  assert.equal(genericResult.coverage.theoreticalStateCount, simplexResult.coverage.theoreticalStateCount);
  assert.equal(genericResult.coverage.evaluatedStateCount, simplexResult.coverage.evaluatedStateCount);
  assert.deepEqual(
    genericResult.plans.map(planFingerprint).sort(),
    simplexResult.plans.map(planFingerprint).sort(),
  );
});

test("R0 production master keeps mixed and dedicated duplex plans for equal demand", () => {
  const result = solveExactProductionSmallMaster({
    id: "equal-duplex-master",
    columnCatalog: duplexCatalog(8, 8),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });

  assert.equal(result.columnFamily, "multiProductSeparateDuplexColumn");
  assert.equal(result.columnStrategy, "separateFrontBackFormsCandidate");
  assert.equal(result.coverage.theoreticalStateCount, "1512");
  assert.equal(result.coverage.evaluatedStateCount, 1512);
  assert.equal(result.coverage.completeWithinRequestedSpace, true);
  assert.equal(result.coverage.mixedProductionStrategiesEvaluated, false);

  const mixed = result.plans.find((plan) => (
    plan.runs.length === 1 && findRun(plan, "2,2", 4)
  ));
  assert.ok(mixed);
  assert.deepEqual(mixed.metrics, {
    physicalSheets: 4,
    selectedColumnCount: 1,
    layoutForms: 2,
    colorPlates: 2,
    pressPasses: 8,
    totalRequiredQuantity: 16,
    totalProducedQuantity: 16,
    totalOverrun: 0,
    totalUnderproduction: 0,
    blankProductPositions: 0,
    splitDemandCount: 0,
  });

  const dedicated = result.plans.find((plan) => (
    plan.runs.length === 2
    && findRun(plan, "4,0", 2)
    && findRun(plan, "0,4", 2)
  ));
  assert.ok(dedicated);
  assert.equal(dedicated.metrics.physicalSheets, 4);
  assert.equal(dedicated.metrics.layoutForms, 4);
  assert.equal(dedicated.metrics.colorPlates, 4);
  assert.equal(dedicated.metrics.pressPasses, 8);
  assert.equal(dedicated.metrics.totalOverrun, 0);
  assert.equal(result.bestPlanIds.layoutForms, mixed.id);
  assert.equal(result.bestPlanIds.colorPlates, mixed.id);
  assert.equal(result.paretoPlanIds.includes(mixed.id), true);
  assert.equal(result.plans.includes(dedicated), true);
  assert.equal(validateExactProductionSmallMasterPlan(mixed), true);
});

test("R0 production master finds different dedicated duplex run lengths", () => {
  const result = solveExactProductionSmallMaster({
    id: "different-duplex-runs",
    columnCatalog: duplexCatalog(8, 4),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });
  const dedicated = result.plans.find((plan) => (
    plan.runs.length === 2
    && findRun(plan, "4,0", 2)
    && findRun(plan, "0,4", 1)
  ));
  const mixed = result.plans.find((plan) => (
    plan.runs.length === 1 && findRun(plan, "2,1", 4)
  ));

  assert.ok(dedicated);
  assert.equal(dedicated.metrics.physicalSheets, 3);
  assert.equal(dedicated.metrics.layoutForms, 4);
  assert.equal(dedicated.metrics.colorPlates, 4);
  assert.equal(dedicated.metrics.pressPasses, 6);
  assert.equal(dedicated.metrics.totalOverrun, 0);
  assert.equal(dedicated.metrics.totalUnderproduction, 0);
  assert.equal(result.bestPlanIds.physicalSheets, dedicated.id);
  assert.equal(result.bestPlanIds.pressPasses, dedicated.id);

  assert.ok(mixed);
  assert.equal(mixed.metrics.physicalSheets, 4);
  assert.equal(mixed.metrics.layoutForms, 2);
  assert.equal(mixed.metrics.colorPlates, 2);
  assert.equal(mixed.metrics.pressPasses, 8);
  assert.equal(result.paretoPlanIds.includes(dedicated.id), true);
  assert.equal(result.paretoPlanIds.includes(mixed.id), true);
});

test("R0 production master uses actual asymmetric duplex plate counts", () => {
  const result = solveExactProductionSmallMaster({
    id: "asymmetric-duplex-master",
    columnCatalog: duplexCatalog(8, 8, ["a", "b"], 4, 1),
    maxSelectedColumns: 1,
    maxRunLength: 4,
    maxExactStateCount: 100,
  });
  const mixed = result.plans.find((plan) => findRun(plan, "2,2", 4));

  assert.ok(mixed);
  assert.equal(mixed.metrics.layoutForms, 2);
  assert.equal(mixed.metrics.colorPlates, 5);
  assert.equal(mixed.metrics.pressPasses, 8);
});

test("R0 production master rejects mixed simplex and duplex columns", () => {
  const simplex = simplexCatalog(8, 8);
  const duplex = duplexCatalog(8, 8);
  assert.throws(() => solveExactProductionSmallMaster({
    columnCatalog: {
      ...simplex,
      columns: [simplex.columns[0], duplex.columns[0]],
    },
    maxSelectedColumns: 1,
    maxRunLength: 4,
    maxExactStateCount: 100,
  }), /cannot mix production column families or strategies|family does not match/);
});

test("R0 production master rejects mismatched catalog family and incomplete coverage", () => {
  const catalog = duplexCatalog(8, 8);
  assert.throws(() => solveExactProductionSmallMaster({
    columnCatalog: { ...catalog, family: "wrong" },
    maxSelectedColumns: 1,
    maxRunLength: 4,
    maxExactStateCount: 100,
  }), /columnCatalog.family/);

  assert.throws(() => solveExactProductionSmallMaster({
    columnCatalog: {
      ...catalog,
      coverage: { ...catalog.coverage, completeWithinRequestedSpace: false, truncated: true },
    },
    maxSelectedColumns: 1,
    maxRunLength: 4,
    maxExactStateCount: 100,
  }), /requires a complete non-truncated column catalog/);
});

test("R0 production master complete bounded search may return no feasible plan", () => {
  const result = solveExactProductionSmallMaster({
    id: "no-feasible-duplex",
    columnCatalog: duplexCatalog(8, 8),
    maxSelectedColumns: 2,
    maxRunLength: 1,
    maxExactStateCount: 200,
  });

  assert.equal(result.plans.length, 0);
  assert.equal(result.paretoPlanIds.length, 0);
  assert.equal(Object.values(result.bestPlanIds).every((value) => value === null), true);
  assert.equal(result.coverage.completeWithinRequestedSpace, true);
  assert.equal(result.coverage.feasiblePlanCount, 0);
});

test("R0 production master output is deterministic across demand input order", () => {
  const first = solveExactProductionSmallMaster({
    id: "deterministic-production-master",
    columnCatalog: duplexCatalog(7, 5, ["a", "b"]),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 2000,
  });
  const second = solveExactProductionSmallMaster({
    id: "deterministic-production-master",
    columnCatalog: duplexCatalog(7, 5, ["b", "a"]),
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

test("R0 production master plan and catalog are deeply immutable", () => {
  const result = solveExactProductionSmallMaster({
    id: "immutable-production-master",
    columnCatalog: duplexCatalog(4, 4),
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

test("R0 production master validator rejects corrupted metrics and duplicate runs", () => {
  const result = solveExactProductionSmallMaster({
    id: "validator-production-master",
    columnCatalog: duplexCatalog(8, 8),
    maxSelectedColumns: 1,
    maxRunLength: 4,
    maxExactStateCount: 100,
  });
  const valid = result.plans.find((plan) => findRun(plan, "2,2", 4));
  assert.ok(valid);

  assert.throws(() => validateExactProductionSmallMasterPlan({
    ...valid,
    metrics: { ...valid.metrics, pressPasses: valid.metrics.pressPasses + 1 },
  }), /metrics mismatch/);

  assert.throws(() => createExactProductionSmallMasterPlan({
    id: "duplicate-production-column",
    demands: valid.demands,
    columnFamily: valid.columnFamily,
    columnStrategy: valid.columnStrategy,
    runs: [valid.runs[0], valid.runs[0]],
  }), /may appear only once/);
});

test("R0 production master rejects oversized exact state spaces", () => {
  assert.throws(() => solveExactProductionSmallMaster({
    columnCatalog: duplexCatalog(8, 8),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    maxExactStateCount: 1500,
  }), /exact production-master space 1512 exceeds/);
});
