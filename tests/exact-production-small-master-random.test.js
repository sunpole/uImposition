import test from "node:test";
import assert from "node:assert/strict";
import { generateExactMultiProductSimplexColumns } from "../src/multi-product-simplex-columns.js";
import { generateExactMultiProductSeparateDuplexColumns } from "../src/multi-product-duplex-columns.js";
import { solveExactProductionSmallMaster } from "../src/exact-production-small-master.js";
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

function duplexDemand(
  id,
  requiredQuantity,
  frontColorCount,
  backColorCount,
  frontPage,
  backPage,
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

function enumerateCombinations(items, count, callback) {
  const selected = [];
  function visit(startIndex) {
    if (selected.length === count) {
      callback([...selected]);
      return;
    }
    const remainingNeeded = count - selected.length;
    for (let index = startIndex; index <= items.length - remainingNeeded; index += 1) {
      selected.push(items[index]);
      visit(index + 1);
      selected.pop();
    }
  }
  visit(0);
}

function enumerateRunLengths(count, maximum, callback) {
  const values = Array(count).fill(1);
  function visit(index) {
    if (index === count) {
      callback([...values]);
      return;
    }
    for (let runLength = 1; runLength <= maximum; runLength += 1) {
      values[index] = runLength;
      visit(index + 1);
    }
  }
  visit(0);
}

function binomial(n, kInput) {
  let k = Math.min(kInput, n - kInput);
  let result = 1;
  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - k + index)) / index;
  }
  return result;
}

function independentStateCount(columnCount, maxSelectedColumns, maxRunLength) {
  let count = 0;
  for (let selectedCount = 1; selectedCount <= Math.min(columnCount, maxSelectedColumns); selectedCount += 1) {
    count += binomial(columnCount, selectedCount) * (maxRunLength ** selectedCount);
  }
  return count;
}

function blankPositionsPerSheet(column) {
  if (column.family === "multiProductSimplexColumn") {
    return column.metrics.blankPositionsPerSheet;
  }
  if (column.family === "multiProductSeparateDuplexColumn") {
    return column.metrics.blankPositionsPerSide;
  }
  throw new RangeError(`unsupported oracle column family: ${column.family}`);
}

function independentMetrics(demands, columns, runLengths) {
  const producedByDemand = demands.map(() => 0);
  const contributingColumns = demands.map(() => 0);
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    const column = columns[columnIndex];
    const runLength = runLengths[columnIndex];
    for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
      const positions = column.allocation[demandIndex].positionsPerSheet;
      producedByDemand[demandIndex] += positions * runLength;
      if (positions > 0) contributingColumns[demandIndex] += 1;
    }
  }
  if (demands.some((demand, index) => producedByDemand[index] < demand.requiredQuantity)) {
    return null;
  }

  const physicalSheets = runLengths.reduce((sum, runLength) => sum + runLength, 0);
  const totalRequiredQuantity = demands.reduce((sum, demand) => sum + demand.requiredQuantity, 0);
  const totalProducedQuantity = producedByDemand.reduce((sum, produced) => sum + produced, 0);
  return Object.freeze({
    physicalSheets,
    selectedColumnCount: columns.length,
    layoutForms: columns.reduce(
      (sum, column) => sum + column.metrics.layoutFormsPerColumn,
      0,
    ),
    colorPlates: columns.reduce(
      (sum, column) => sum + column.metrics.colorPlatesPerColumn,
      0,
    ),
    pressPasses: columns.reduce(
      (sum, column, index) => sum + (column.metrics.pressPassesPerSheet * runLengths[index]),
      0,
    ),
    totalRequiredQuantity,
    totalProducedQuantity,
    totalOverrun: totalProducedQuantity - totalRequiredQuantity,
    totalUnderproduction: 0,
    blankProductPositions: columns.reduce(
      (sum, column, index) => sum + (blankPositionsPerSheet(column) * runLengths[index]),
      0,
    ),
    splitDemandCount: contributingColumns.filter((count) => count > 1).length,
  });
}

function runKey(columns, runLengths) {
  return columns
    .map((column, index) => `${column.columnSignature}@${runLengths[index]}`)
    .sort()
    .join(";");
}

function planFingerprint(plan) {
  return JSON.stringify({
    runKey: plan.runs
      .map((run) => `${run.column.columnSignature}@${run.runLength}`)
      .sort()
      .join(";"),
    metrics: plan.metrics,
  });
}

function oracleFingerprint(plan) {
  return JSON.stringify({ runKey: plan.runKey, metrics: plan.metrics });
}

function dominates(first, second) {
  let strictlyBetter = false;
  for (const key of OBJECTIVE_KEYS) {
    if (first.metrics[key] > second.metrics[key]) return false;
    if (first.metrics[key] < second.metrics[key]) strictlyBetter = true;
  }
  return strictlyBetter;
}

function independentOracle({ columnCatalog, maxSelectedColumns, maxRunLength }) {
  const columns = [...columnCatalog.columns].sort((a, b) => (
    a.columnSignature.localeCompare(b.columnSignature)
  ));
  const plans = [];
  let evaluatedStateCount = 0;
  for (let selectedCount = 1; selectedCount <= Math.min(columns.length, maxSelectedColumns); selectedCount += 1) {
    enumerateCombinations(columns, selectedCount, (selectedColumns) => {
      enumerateRunLengths(selectedCount, maxRunLength, (runLengths) => {
        evaluatedStateCount += 1;
        const metrics = independentMetrics(columnCatalog.demands, selectedColumns, runLengths);
        if (!metrics) return;
        plans.push(Object.freeze({
          runKey: runKey(selectedColumns, runLengths),
          metrics,
        }));
      });
    });
  }

  const frontier = [];
  for (const plan of plans) {
    if (frontier.some((candidate) => dominates(candidate, plan))) continue;
    for (let index = frontier.length - 1; index >= 0; index -= 1) {
      if (dominates(plan, frontier[index])) frontier.splice(index, 1);
    }
    frontier.push(plan);
  }

  const bestMetricByObjective = Object.fromEntries(OBJECTIVE_KEYS.map((key) => [
    key,
    plans.length === 0 ? null : Math.min(...plans.map((plan) => plan.metrics[key])),
  ]));
  return Object.freeze({
    evaluatedStateCount,
    plans: Object.freeze(plans),
    frontier: Object.freeze(frontier),
    bestMetricByObjective: Object.freeze(bestMetricByObjective),
  });
}

function createRandomCase(random, strategy, index) {
  const capacity = randomInteger(random, 2, 3);
  const demandCount = randomInteger(random, 2, 3);
  const maxRunLength = randomInteger(random, 2, 3);
  const maxSelectedColumns = randomInteger(random, 1, 2);
  const frontColorCount = random() < 0.5 ? 1 : 4;
  const backColorCount = random() < 0.5 ? 1 : 4;
  const ids = Array.from({ length: demandCount }, (_, demandIndex) => (
    String.fromCharCode(97 + demandIndex)
  ));
  const canonicalDemands = ids.map((id, demandIndex) => {
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
      id: `random-simplex-columns-${index}`,
      geometryPattern,
      demands,
    })
    : generateExactMultiProductSeparateDuplexColumns({
      id: `random-duplex-columns-${index}`,
      geometryPattern,
      demands,
    });
  return Object.freeze({
    label: `${strategy} random case ${index} capacity=${capacity} demands=${demandCount} selected=${maxSelectedColumns} run=${maxRunLength}`,
    columnCatalog,
    maxSelectedColumns,
    maxRunLength,
  });
}

function assertCaseMatches(caseInput) {
  const oracle = independentOracle(caseInput);
  const solver = solveExactProductionSmallMaster({
    id: `solver-${caseInput.label.replaceAll(" ", "-")}`,
    columnCatalog: caseInput.columnCatalog,
    maxSelectedColumns: caseInput.maxSelectedColumns,
    maxRunLength: caseInput.maxRunLength,
    maxExactStateCount: 10000,
  });
  const expectedStateCount = independentStateCount(
    caseInput.columnCatalog.columns.length,
    caseInput.maxSelectedColumns,
    caseInput.maxRunLength,
  );

  assert.equal(oracle.evaluatedStateCount, expectedStateCount, caseInput.label);
  assert.equal(solver.coverage.evaluatedStateCount, expectedStateCount, caseInput.label);
  assert.equal(solver.coverage.theoreticalStateCount, String(expectedStateCount), caseInput.label);
  assert.deepEqual(
    solver.plans.map(planFingerprint).sort(),
    oracle.plans.map(oracleFingerprint).sort(),
    caseInput.label,
  );
  const solverFrontier = solver.paretoPlanIds.map((planId) => {
    const plan = solver.plans.find((candidate) => candidate.id === planId);
    assert.ok(plan, `${caseInput.label}: missing Pareto plan ${planId}`);
    return planFingerprint(plan);
  }).sort();
  assert.deepEqual(
    solverFrontier,
    oracle.frontier.map(oracleFingerprint).sort(),
    `${caseInput.label}: Pareto mismatch`,
  );
  for (const key of OBJECTIVE_KEYS) {
    const bestPlanId = solver.bestPlanIds[key];
    if (oracle.bestMetricByObjective[key] === null) {
      assert.equal(bestPlanId, null, `${caseInput.label}: ${key}`);
      continue;
    }
    const bestPlan = solver.plans.find((plan) => plan.id === bestPlanId);
    assert.ok(bestPlan, `${caseInput.label}: missing best ${key} plan`);
    assert.equal(
      bestPlan.metrics[key],
      oracle.bestMetricByObjective[key],
      `${caseInput.label}: ${key}`,
    );
  }
}

test("R0 random-small simplex plans match an independent exhaustive oracle", () => {
  const random = mulberry32(0x51A7E001);
  for (let index = 1; index <= 16; index += 1) {
    assertCaseMatches(createRandomCase(random, "simplex", index));
  }
});

test("R0 random-small separate-duplex plans match an independent exhaustive oracle", () => {
  const random = mulberry32(0xD0A1E001);
  for (let index = 1; index <= 16; index += 1) {
    assertCaseMatches(createRandomCase(random, "duplex", index));
  }
});
