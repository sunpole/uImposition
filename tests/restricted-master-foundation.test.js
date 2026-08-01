import test from "node:test";
import assert from "node:assert/strict";
import {
  createRestrictedMasterProblem,
  validateRestrictedMasterProblem,
} from "../src/restricted-master-foundation.js";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import { generateExactMultiProductSeparateDuplexColumns } from "../src/multi-product-duplex-columns.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

function rowGeometry(capacity) {
  return createUniformGridPattern({
    printableArea: { widthMm: capacity * 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function simplexDemand(demandId, requiredQuantity, frontColorCount = 1) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: 1,
    backPage: null,
    frontColorCount,
    backColorCount: 0,
  };
}

function duplexDemand(demandId, requiredQuantity, pageOffset = 0, colors = [1, 1]) {
  return {
    demandId,
    productId: `product-${demandId}`,
    requiredQuantity,
    frontPage: pageOffset + 1,
    backPage: pageOffset + 2,
    frontColorCount: colors[0],
    backColorCount: colors[1],
  };
}

function allocationVector(column) {
  return column.allocation.map(({ positionsPerSheet }) => positionsPerSheet);
}

function selectedColumns(problem, signatures) {
  const signatureSet = new Set(signatures);
  return problem.columns.filter(({ columnSignature }) => signatureSet.has(columnSignature));
}

test("R1-A1 builds a canonical coefficient matrix for every supplied simplex column", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("b", 8), simplexDemand("a", 8)],
  });
  const problem = createRestrictedMasterProblem({
    columnCatalog: catalog,
    maxSelectedColumns: 2,
    maxRunLength: 4,
    initialMixedColumnLimit: 2,
  });

  assert.deepEqual(problem.coefficientMatrix.rowOrder, ["a", "b"]);
  assert.equal(problem.coefficientMatrix.columnOrder.length, 14);
  assert.equal(problem.coefficientMatrix.demandRows.length, 2);
  assert.equal(problem.coefficientMatrix.columnVectors.length, 14);
  assert.deepEqual(
    problem.coefficientMatrix.columnVectors.map(({ coefficients }) => coefficients).sort(),
    catalog.columns.map(allocationVector).sort(),
  );
  assert.equal(problem.coverage.searchPerformed, false);
  assert.equal(problem.coverage.pricingPerformed, false);
  assert.equal(problem.coverage.globalCompletenessClaimed, false);
  assert.equal(validateRestrictedMasterProblem(problem), true);
});

test("R1-A1 selects full dedicated columns and the balanced 2+2 mixed column", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
  });
  const problem = createRestrictedMasterProblem({
    columnCatalog: catalog,
    maxSelectedColumns: 2,
    maxRunLength: 4,
    initialMixedColumnLimit: 1,
  });

  const dedicated = selectedColumns(problem, problem.initialColumns.dedicatedColumnSignatures)
    .map(allocationVector)
    .sort();
  const mixed = selectedColumns(problem, problem.initialColumns.mixedColumnSignatures)
    .map(allocationVector);

  assert.deepEqual(dedicated, [[0, 4], [4, 0]].sort());
  assert.deepEqual(mixed, [[2, 2]]);
  assert.equal(problem.initialColumns.initialColumnSignatures.length, 3);
});

test("R1-A1 proportional mixed initialization prefers 2+1 for quantities 8 and 4", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 4)],
  });
  const problem = createRestrictedMasterProblem({
    columnCatalog: catalog,
    maxSelectedColumns: 2,
    maxRunLength: 4,
    initialMixedColumnLimit: 1,
  });
  assert.deepEqual(
    selectedColumns(problem, problem.initialColumns.mixedColumnSignatures).map(allocationVector),
    [[2, 1]],
  );
});

test("R1-A1 physical-sheet lower bound combines aggregate and per-demand bounds", () => {
  const equalProblem = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: rowGeometry(4),
      demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
  });
  assert.equal(equalProblem.lowerBounds.physicalSheets.aggregateDemandBound, 4);
  assert.deepEqual(
    equalProblem.lowerBounds.physicalSheets.perDemand.map(({ physicalSheetsLowerBound }) => physicalSheetsLowerBound),
    [2, 2],
  );
  assert.equal(equalProblem.lowerBounds.physicalSheets.lowerBound, 4);
  assert.equal(equalProblem.lowerBounds.selectedColumnCount.lowerBound, 1);
  assert.equal(equalProblem.lowerBounds.layoutForms.lowerBound, 1);
  assert.equal(equalProblem.lowerBounds.pressPasses.lowerBound, 4);

  const unequalProblem = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: rowGeometry(4),
      demands: [simplexDemand("a", 8), simplexDemand("b", 4)],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
  });
  assert.equal(unequalProblem.lowerBounds.physicalSheets.aggregateDemandBound, 3);
  assert.equal(unequalProblem.lowerBounds.physicalSheets.lowerBound, 3);
});

test("R1-A1 simplex and separate duplex share sheet bounds but preserve family metrics", () => {
  const geometry = rowGeometry(4);
  const simplex = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: geometry,
      demands: [simplexDemand("a", 8, 4), simplexDemand("b", 8, 4)],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
  });
  const duplex = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSeparateDuplexColumns({
      geometryPattern: geometry,
      demands: [duplexDemand("a", 8, 0, [4, 1]), duplexDemand("b", 8, 2, [4, 1])],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
  });

  assert.equal(simplex.lowerBounds.physicalSheets.lowerBound, 4);
  assert.equal(duplex.lowerBounds.physicalSheets.lowerBound, 4);
  assert.equal(simplex.lowerBounds.layoutForms.lowerBound, 1);
  assert.equal(duplex.lowerBounds.layoutForms.lowerBound, 2);
  assert.equal(simplex.lowerBounds.colorPlates.lowerBound, 4);
  assert.equal(duplex.lowerBounds.colorPlates.lowerBound, 5);
  assert.equal(simplex.lowerBounds.pressPasses.lowerBound, 4);
  assert.equal(duplex.lowerBounds.pressPasses.lowerBound, 8);
  assert.equal(simplex.columnFamily, "multiProductSimplexColumn");
  assert.equal(duplex.columnFamily, "multiProductSeparateDuplexColumn");
});

test("R1-A1 proves obvious infeasibility inside restrictive run and column limits", () => {
  const problem = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: rowGeometry(2),
      demands: [simplexDemand("a", 100), simplexDemand("b", 100)],
    }),
    maxSelectedColumns: 1,
    maxRunLength: 1,
  });

  assert.equal(problem.feasibility.feasibleByNecessaryCapacityChecks, false);
  assert.equal(problem.feasibility.proofType, "provenInfeasibleWithinLimits");
  assert.ok(problem.feasibility.reasons.includes("aggregateCapacity"));
  assert.ok(problem.feasibility.reasons.includes("demandCapacity:a"));
  assert.ok(problem.feasibility.reasons.includes("demandCapacity:b"));
});

test("R1-A1 passing necessary checks is not mislabeled as a feasibility proof", () => {
  const problem = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: rowGeometry(4),
      demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
  });

  assert.equal(problem.feasibility.feasibleByNecessaryCapacityChecks, true);
  assert.equal(problem.feasibility.proofType, "necessaryChecksPassedNotSufficient");
  assert.deepEqual(problem.feasibility.reasons, []);
});

test("R1-A1 rejects incomplete catalogs before creating a search problem", () => {
  const catalog = generateExactMultiProductSimplexColumns({
    geometryPattern: rowGeometry(4),
    demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
  });
  const incomplete = {
    ...catalog,
    coverage: {
      ...catalog.coverage,
      completeWithinRequestedSpace: false,
      truncated: true,
    },
  };
  assert.throws(() => createRestrictedMasterProblem({
    columnCatalog: incomplete,
    maxSelectedColumns: 2,
    maxRunLength: 4,
  }), /complete non-truncated/);
});

test("R1-A1 input order normalizes to the same matrix, bounds and initial set", () => {
  const geometry = rowGeometry(4);
  const first = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: geometry,
      demands: [simplexDemand("b", 4), simplexDemand("a", 8)],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    initialMixedColumnLimit: 3,
  });
  const second = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: geometry,
      demands: [simplexDemand("a", 8), simplexDemand("b", 4)],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
    initialMixedColumnLimit: 3,
  });

  assert.deepEqual(first.coefficientMatrix, second.coefficientMatrix);
  assert.deepEqual(first.initialColumns, second.initialColumns);
  assert.deepEqual(first.lowerBounds, second.lowerBounds);
  assert.equal(first.problemSignature, second.problemSignature);
});

test("R1-A1 output is deeply immutable and validator detects corrupted bounds", () => {
  const problem = createRestrictedMasterProblem({
    columnCatalog: generateExactMultiProductSimplexColumns({
      geometryPattern: rowGeometry(4),
      demands: [simplexDemand("a", 8), simplexDemand("b", 8)],
    }),
    maxSelectedColumns: 2,
    maxRunLength: 4,
  });

  assert.equal(Object.isFrozen(problem), true);
  assert.equal(Object.isFrozen(problem.columns), true);
  assert.equal(Object.isFrozen(problem.coefficientMatrix), true);
  assert.equal(Object.isFrozen(problem.lowerBounds), true);
  assert.equal(Object.isFrozen(problem.feasibility), true);
  assert.equal(Object.isFrozen(problem.limits), true);

  const corrupted = {
    ...problem,
    lowerBounds: {
      ...problem.lowerBounds,
      physicalSheets: {
        ...problem.lowerBounds.physicalSheets,
        lowerBound: problem.lowerBounds.physicalSheets.lowerBound + 1,
      },
    },
  };
  assert.throws(() => validateRestrictedMasterProblem(corrupted), /lowerBounds mismatch/);
});
