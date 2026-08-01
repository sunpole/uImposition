import test from "node:test";
import assert from "node:assert/strict";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import { generateExactMultiProductSeparateDuplexColumns } from "../src/multi-product-duplex-columns.js";
import { solveExactProductionSmallMaster } from "../src/exact-production-small-master.js";
import { createRestrictedMasterProblem } from "../src/restricted-master-foundation.js";
import { solveRestrictedMaster } from "../src/restricted-master-search.js";
import { createUniformGridPattern } from "../src/uniform-grid-patterns.js";

const OBJECTIVE_KEYS = Object.freeze([
  "physicalSheets",
  "layoutForms",
  "colorPlates",
  "pressPasses",
  "totalOverrun",
  "blankProductPositions",
]);

function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInteger(random, minimum, maximum) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function shuffled(random, values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInteger(random, 0, index);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function rowGeometry(capacity) {
  return createUniformGridPattern({
    printableArea: { widthMm: capacity * 10, heightMm: 10 },
    occupiedProduct: { widthMm: 10, heightMm: 10 },
    rotation: 0,
  });
}

function simplexDemand(id, requiredQuantity, frontColorCount, page) {
  return {
    demandId: id,
    productId: `product-${id}`,
    requiredQuantity,
    frontPage: page,
    backPage: null,
    frontColorCount,
    backColorCount: 0,
  };
}

function duplexDemand(id, requiredQuantity, frontColorCount, backColorCount, frontPage, backPage) {
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

function comparePlans(first, second) {
  for (const key of OBJECTIVE_KEYS) {
    if (first.metrics[key] !== second.metrics[key]) {
      return first.metrics[key] - second.metrics[key];
    }
  }
  return first.planSignature.localeCompare(second.planSignature);
}

function createRandomCase(random, strategy, index) {
  const capacity = randomInteger(random, 2, 3);
  const demandCount = randomInteger(random, 2, 3);
  const maxRunLength = randomInteger(random, 2, 3);
  const maxSelectedColumns = randomInteger(random, 1, 2);
  const frontColorCount = random() < 0.5 ? 1 : 4;
  const backColorCount = random() < 0.5 ? 1 : 4;
  const canonicalDemands = Array.from({ length: demandCount }, (_, demandIndex) => {
    const id = String.fromCharCode(97 + demandIndex);
    const requiredQuantity = randomInteger(random, 1, capacity * maxRunLength + 2);
    if (strategy === "simplex") {
      return simplexDemand(id, requiredQuantity, frontColorCount, demandIndex + 1);
    }
    return duplexDemand(
      id,
      requiredQuantity,
      frontColorCount,
      backColorCount,
      demandIndex * 2 + 1,
      demandIndex * 2 + 2,
    );
  });
  const demands = shuffled(random, canonicalDemands);
  const geometryPattern = rowGeometry(capacity);
  const columnCatalog = strategy === "simplex"
    ? generateExactMultiProductSimplexColumns({
      id: `restricted-random-simplex-columns-${index}`,
      geometryPattern,
      demands,
    })
    : generateExactMultiProductSeparateDuplexColumns({
      id: `restricted-random-duplex-columns-${index}`,
      geometryPattern,
      demands,
    });
  return Object.freeze({
    label: `${strategy}-${index}-c${capacity}-d${demandCount}-k${maxSelectedColumns}-r${maxRunLength}`,
    columnCatalog,
    maxSelectedColumns,
    maxRunLength,
  });
}

function assertRestrictedMatchesExact(caseInput) {
  const exact = solveExactProductionSmallMaster({
    id: `exact-${caseInput.label}`,
    columnCatalog: caseInput.columnCatalog,
    maxSelectedColumns: caseInput.maxSelectedColumns,
    maxRunLength: caseInput.maxRunLength,
    maxExactStateCount: 100000,
  });
  const problem = createRestrictedMasterProblem({
    id: `problem-${caseInput.label}`,
    columnCatalog: caseInput.columnCatalog,
    maxSelectedColumns: caseInput.maxSelectedColumns,
    maxRunLength: caseInput.maxRunLength,
    maxStates: 100000,
    maxMilliseconds: 10000,
    initialMixedColumnLimit: 4,
  });
  const restricted = solveRestrictedMaster({
    id: `restricted-${caseInput.label}`,
    problem,
    candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
    maxStates: 100000,
    maxMilliseconds: 10000,
  });
  const exactBest = [...exact.plans].sort(comparePlans)[0] ?? null;

  if (!exactBest) {
    assert.equal(restricted.bestPlan, null, caseInput.label);
    assert.equal(
      restricted.coverage.provenInfeasibleWithinRestrictedSpace,
      true,
      caseInput.label,
    );
    assert.equal(restricted.coverage.truncated, false, caseInput.label);
    return;
  }

  assert.ok(restricted.bestPlan, caseInput.label);
  assert.equal(restricted.bestPlan.planSignature, exactBest.planSignature, caseInput.label);
  assert.deepEqual(restricted.bestPlan.metrics, exactBest.metrics, caseInput.label);
  assert.equal(restricted.coverage.completeWithinRestrictedColumnSpace, true, caseInput.label);
  assert.equal(restricted.coverage.provenOptimalWithinRestrictedSpace, true, caseInput.label);
  assert.equal(restricted.coverage.truncated, false, caseInput.label);
  assert.equal(restricted.bounds.absoluteGap, 0, caseInput.label);
  assert.ok(
    restricted.bestPlan.demandMetrics.every(({ underproduction }) => underproduction === 0),
    caseInput.label,
  );
}

test("R1-A3 random-small simplex restricted search matches exact master", () => {
  const random = mulberry32(0xA31A5101);
  for (let index = 1; index <= 16; index += 1) {
    assertRestrictedMatchesExact(createRandomCase(random, "simplex", index));
  }
});

test("R1-A3 random-small separate-duplex restricted search matches exact master", () => {
  const random = mulberry32(0xA31D0011);
  for (let index = 1; index <= 16; index += 1) {
    assertRestrictedMatchesExact(createRandomCase(random, "duplex", index));
  }
});

test("R1-A3 input-order permutations preserve the restricted optimum", () => {
  const geometryPattern = rowGeometry(3);
  const firstCatalog = generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [
      simplexDemand("b", 4, 1, 2),
      simplexDemand("a", 5, 1, 1),
      simplexDemand("c", 3, 1, 3),
    ],
  });
  const secondCatalog = generateExactMultiProductSimplexColumns({
    geometryPattern,
    demands: [
      simplexDemand("c", 3, 1, 3),
      simplexDemand("a", 5, 1, 1),
      simplexDemand("b", 4, 1, 2),
    ],
  });
  const solve = (columnCatalog) => {
    const problem = createRestrictedMasterProblem({
      columnCatalog,
      maxSelectedColumns: 2,
      maxRunLength: 3,
      maxStates: 100000,
      maxMilliseconds: 10000,
      initialMixedColumnLimit: 4,
    });
    return solveRestrictedMaster({
      problem,
      candidateColumnSignatures: problem.coefficientMatrix.columnOrder,
      maxStates: 100000,
      maxMilliseconds: 10000,
    });
  };
  const first = solve(firstCatalog);
  const second = solve(secondCatalog);

  assert.equal(first.bestPlan.planSignature, second.bestPlan.planSignature);
  assert.deepEqual(first.bestPlan.metrics, second.bestPlan.metrics);
  assert.deepEqual(first.bounds, second.bounds);
}
