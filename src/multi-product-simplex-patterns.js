import { validateGeometryPattern } from "./geometric-pattern.js";

const EPSILON = 1e-9;
const DEFAULT_MAX_EXACT_ALLOCATION_COUNT = 100000;

function asPositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function asNonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function asNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function compareDemands(a, b) {
  const byDemand = a.demandId.localeCompare(b.demandId);
  if (byDemand !== 0) return byDemand;
  return a.productId.localeCompare(b.productId);
}

function compareCells(a, b) {
  if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
  if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
  return a.sourceSlotId.localeCompare(b.sourceSlotId);
}

function normalizeSimplexDemand(input, index) {
  const label = `demands[${index}]`;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(`${label} must be an object`);
  }
  const demandId = asNonEmptyString(input.demandId, `${label}.demandId`);
  const productId = asNonEmptyString(input.productId, `${label}.productId`);
  const requiredQuantity = asPositiveInteger(input.requiredQuantity, `${label}.requiredQuantity`);
  const frontPage = asPositiveInteger(input.frontPage, `${label}.frontPage`);
  const frontColorCount = asPositiveInteger(input.frontColorCount, `${label}.frontColorCount`);
  const backPage = input.backPage ?? null;
  const backColorCount = asNonNegativeInteger(input.backColorCount ?? 0, `${label}.backColorCount`);
  if (backPage !== null || backColorCount !== 0) {
    throw new RangeError(`${label} must be simplex with a blank back`);
  }
  return Object.freeze({
    demandId,
    productId,
    requiredQuantity,
    frontPage,
    backPage: null,
    frontColorCount,
    backColorCount: 0,
  });
}

function normalizeDemands(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new RangeError("demands must be a non-empty array");
  }
  const demands = input.map((demand, index) => normalizeSimplexDemand(demand, index)).sort(compareDemands);
  const seenDemandIds = new Set();
  for (const demand of demands) {
    if (seenDemandIds.has(demand.demandId)) {
      throw new RangeError(`duplicate demandId: ${demand.demandId}`);
    }
    seenDemandIds.add(demand.demandId);
  }
  const colorCounts = new Set(demands.map((demand) => demand.frontColorCount));
  if (colorCounts.size !== 1) {
    throw new RangeError("all simplex demands must use the same frontColorCount in P1");
  }
  return deepFreeze(demands);
}

function normalizeAllocationCounts(input, demandCount, capacity) {
  if (!Array.isArray(input) || input.length !== demandCount) {
    throw new RangeError("allocationCounts length must equal demand count");
  }
  const counts = input.map((value, index) => asPositiveInteger(value, `allocationCounts[${index}]`));
  const occupied = counts.reduce((sum, count) => sum + count, 0);
  if (occupied > capacity) {
    throw new RangeError("allocationCounts exceed geometry capacity");
  }
  return Object.freeze(counts);
}

function binomialBigInt(nInput, kInput) {
  const n = BigInt(nInput);
  let k = BigInt(kInput);
  if (k < 0n || k > n) return 0n;
  if (k > n - k) k = n - k;
  let result = 1n;
  for (let index = 1n; index <= k; index += 1n) {
    result = (result * (n - k + index)) / index;
  }
  return result;
}

export function countPositiveSingleFormAllocations(capacityInput, demandCountInput) {
  const capacity = asPositiveInteger(capacityInput, "capacity");
  const demandCount = asPositiveInteger(demandCountInput, "demandCount");
  if (demandCount > capacity) return 0n;
  return binomialBigInt(capacity, demandCount);
}

function enumeratePositiveAllocations(capacity, demandCount) {
  const allocations = [];
  const current = Array(demandCount).fill(1);
  function visit(index, remainingCapacity) {
    if (index === demandCount - 1) {
      for (let count = 1; count <= remainingCapacity; count += 1) {
        current[index] = count;
        allocations.push(Object.freeze([...current]));
      }
      return;
    }
    const minimumForRest = demandCount - index - 1;
    const maximumHere = remainingCapacity - minimumForRest;
    for (let count = 1; count <= maximumHere; count += 1) {
      current[index] = count;
      visit(index + 1, remainingCapacity - count);
    }
  }
  visit(0, capacity);
  return Object.freeze(allocations);
}

function createFrontCell(slot, demand) {
  const cell = {
    id: `front:${slot.id}:${demand.demandId}`,
    side: "front",
    demandId: demand.demandId,
    productId: demand.productId,
    page: demand.frontPage,
    sourceSlotId: slot.id,
    xMm: slot.xMm,
    yMm: slot.yMm,
    widthMm: slot.widthMm,
    heightMm: slot.heightMm,
    rotation: slot.rotation,
    sourceRow: slot.row,
    sourceColumn: slot.column,
  };
  if (slot.stripId !== undefined) {
    cell.sourceStripId = slot.stripId;
    cell.sourcePositionInStrip = slot.positionInStrip;
  }
  return Object.freeze(cell);
}

function createBlankSlot(slot) {
  const blank = {
    slotId: slot.id,
    xMm: slot.xMm,
    yMm: slot.yMm,
    widthMm: slot.widthMm,
    heightMm: slot.heightMm,
    rotation: slot.rotation,
    row: slot.row,
    column: slot.column,
  };
  if (slot.stripId !== undefined) {
    blank.stripId = slot.stripId;
    blank.positionInStrip = slot.positionInStrip;
  }
  return Object.freeze(blank);
}

function createAllocation(demands, counts) {
  return Object.freeze(demands.map((demand, index) => Object.freeze({
    demandId: demand.demandId,
    productId: demand.productId,
    positionsPerSheet: counts[index],
  })));
}

function createDemandMetrics(demands, counts, runLength) {
  return Object.freeze(demands.map((demand, index) => {
    const positionsPerSheet = counts[index];
    const producedQuantity = positionsPerSheet * runLength;
    return Object.freeze({
      demandId: demand.demandId,
      productId: demand.productId,
      requiredQuantity: demand.requiredQuantity,
      positionsPerSheet,
      producedQuantity,
      overrun: producedQuantity - demand.requiredQuantity,
      underproduction: Math.max(0, demand.requiredQuantity - producedQuantity),
    });
  }));
}

function createMetrics({ capacity, counts, demands, runLength, demandMetrics }) {
  const occupiedPositionsPerSheet = counts.reduce((sum, count) => sum + count, 0);
  const requiredQuantity = demands.reduce((sum, demand) => sum + demand.requiredQuantity, 0);
  const producedQuantity = demandMetrics.reduce((sum, metric) => sum + metric.producedQuantity, 0);
  const overrun = demandMetrics.reduce((sum, metric) => sum + metric.overrun, 0);
  const underproduction = demandMetrics.reduce((sum, metric) => sum + metric.underproduction, 0);
  return Object.freeze({
    physicalSheets: runLength,
    geometryCapacity: capacity,
    demandCount: demands.length,
    occupiedPositionsPerSheet,
    blankPositionsPerSheet: capacity - occupiedPositionsPerSheet,
    layoutForms: 1,
    colorPlates: demands[0].frontColorCount,
    pressPasses: runLength,
    requiredQuantity,
    producedQuantity,
    overrun,
    underproduction,
  });
}

function createSignatures({ geometryPattern, demands, counts, runLength }) {
  const occupied = counts.reduce((sum, count) => sum + count, 0);
  const structuralSignature = [
    "multi-product-simplex-pattern-v1",
    `geometry=${geometryPattern.structuralSignature}`,
    `counts=${counts.join(",")}`,
    `blank=${geometryPattern.capacity - occupied}`,
    `colors=${demands[0].frontColorCount}`,
  ].join("|");
  const allocationSignature = demands.map((demand, index) => [
    demand.demandId,
    demand.productId,
    counts[index],
  ].join(":")).join(";");
  const planSignature = [
    structuralSignature,
    `allocation=${allocationSignature}`,
    `demands=${demands.map((demand) => [
      demand.demandId,
      demand.productId,
      demand.frontPage,
      demand.requiredQuantity,
    ].join(":")).join(";")}`,
    `run=${runLength}`,
  ].join("|");
  return Object.freeze({ structuralSignature, allocationSignature, planSignature });
}

function expectedRunLength(demands, counts) {
  return Math.max(...demands.map((demand, index) => Math.ceil(
    demand.requiredQuantity / counts[index],
  )));
}

function assertSameJson(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new RangeError(`${label} mismatch`);
  }
}

export function validateMultiProductSimplexPattern(pattern) {
  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) {
    throw new TypeError("pattern must be an object");
  }
  validateGeometryPattern(pattern.geometryPattern);
  const demands = normalizeDemands(pattern.demands);
  assertSameJson(pattern.demands, demands, "demands canonical order");
  const counts = normalizeAllocationCounts(
    pattern.allocation?.map((entry) => entry.positionsPerSheet),
    demands.length,
    pattern.geometryPattern.capacity,
  );
  const expectedAllocation = createAllocation(demands, counts);
  assertSameJson(pattern.allocation, expectedAllocation, "allocation");
  const runLength = expectedRunLength(demands, counts);
  if (pattern.runLength !== runLength) throw new RangeError("runLength mismatch");

  const occupiedPositions = counts.reduce((sum, count) => sum + count, 0);
  if (!Array.isArray(pattern.frontCells) || pattern.frontCells.length !== occupiedPositions) {
    throw new RangeError("frontCells length mismatch");
  }
  let slotIndex = 0;
  let cellIndex = 0;
  for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
    const demand = demands[demandIndex];
    for (let position = 0; position < counts[demandIndex]; position += 1) {
      const slot = pattern.geometryPattern.slots[slotIndex];
      const expectedCell = createFrontCell(slot, demand);
      assertSameJson(pattern.frontCells[cellIndex], expectedCell, `frontCells[${cellIndex}]`);
      slotIndex += 1;
      cellIndex += 1;
    }
  }
  const sortedCells = [...pattern.frontCells].sort(compareCells);
  assertSameJson(pattern.frontCells, sortedCells, "frontCells physical order");
  const expectedBlankSlots = Object.freeze(pattern.geometryPattern.slots
    .slice(occupiedPositions)
    .map(createBlankSlot));
  assertSameJson(pattern.blankSlots, expectedBlankSlots, "blankSlots");

  const demandMetrics = createDemandMetrics(demands, counts, runLength);
  assertSameJson(pattern.demandMetrics, demandMetrics, "demandMetrics");
  const metrics = createMetrics({
    capacity: pattern.geometryPattern.capacity,
    counts,
    demands,
    runLength,
    demandMetrics,
  });
  if (metrics.underproduction !== 0) throw new RangeError("underproduction is forbidden");
  assertSameJson(pattern.metrics, metrics, "metrics");
  const colorModel = Object.freeze({
    type: "sharedEqualFrontColorCount",
    colorPlateCount: demands[0].frontColorCount,
    requiresNamedInkCompatibilityCheck: true,
  });
  assertSameJson(pattern.sharedFrontColorModel, colorModel, "sharedFrontColorModel");
  const signatures = createSignatures({
    geometryPattern: pattern.geometryPattern,
    demands,
    counts,
    runLength,
  });
  if (pattern.structuralSignature !== signatures.structuralSignature
    || pattern.allocationSignature !== signatures.allocationSignature
    || pattern.planSignature !== signatures.planSignature) {
    throw new RangeError("pattern signatures mismatch");
  }
  return true;
}

export function createMultiProductSimplexPattern({
  id,
  geometryPattern,
  demands: demandInput,
  allocationCounts,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  validateGeometryPattern(geometryPattern);
  if (geometryPattern.capacity < 1) {
    throw new RangeError("geometry pattern must contain at least one slot");
  }
  const demands = normalizeDemands(demandInput);
  if (demands.length > geometryPattern.capacity) {
    throw new RangeError("demand count exceeds geometry capacity");
  }
  const counts = normalizeAllocationCounts(allocationCounts, demands.length, geometryPattern.capacity);
  const allocation = createAllocation(demands, counts);
  const frontCells = [];
  let slotIndex = 0;
  for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
    for (let position = 0; position < counts[demandIndex]; position += 1) {
      frontCells.push(createFrontCell(geometryPattern.slots[slotIndex], demands[demandIndex]));
      slotIndex += 1;
    }
  }
  const frozenFrontCells = Object.freeze(frontCells.sort(compareCells));
  const blankSlots = Object.freeze(geometryPattern.slots.slice(slotIndex).map(createBlankSlot));
  const runLength = expectedRunLength(demands, counts);
  const demandMetrics = createDemandMetrics(demands, counts, runLength);
  const metrics = createMetrics({
    capacity: geometryPattern.capacity,
    counts,
    demands,
    runLength,
    demandMetrics,
  });
  const sharedFrontColorModel = Object.freeze({
    type: "sharedEqualFrontColorCount",
    colorPlateCount: demands[0].frontColorCount,
    requiresNamedInkCompatibilityCheck: true,
  });
  const signatures = createSignatures({ geometryPattern, demands, counts, runLength });
  const pattern = Object.freeze({
    id: normalizedId,
    family: "multiProductSimplex",
    strategy: "singleSharedFrontForm",
    geometryPattern,
    demands,
    allocation,
    runLength,
    frontCells: frozenFrontCells,
    blankSlots,
    demandMetrics,
    metrics,
    sharedFrontColorModel,
    structuralSignature: signatures.structuralSignature,
    allocationSignature: signatures.allocationSignature,
    planSignature: signatures.planSignature,
  });
  validateMultiProductSimplexPattern(pattern);
  return deepFreeze(pattern);
}

function comparePatterns(a, b) {
  if (a.metrics.physicalSheets !== b.metrics.physicalSheets) {
    return a.metrics.physicalSheets - b.metrics.physicalSheets;
  }
  if (a.metrics.overrun !== b.metrics.overrun) return a.metrics.overrun - b.metrics.overrun;
  if (a.metrics.blankPositionsPerSheet !== b.metrics.blankPositionsPerSheet) {
    return a.metrics.blankPositionsPerSheet - b.metrics.blankPositionsPerSheet;
  }
  return a.allocationSignature.localeCompare(b.allocationSignature);
}

export function generateExactMultiProductSimplexPatterns({
  id = "multi-product-simplex-catalog",
  geometryPattern,
  demands: demandInput,
  maxExactAllocationCount = DEFAULT_MAX_EXACT_ALLOCATION_COUNT,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  validateGeometryPattern(geometryPattern);
  const demands = normalizeDemands(demandInput);
  if (demands.length > geometryPattern.capacity) {
    throw new RangeError("demand count exceeds geometry capacity");
  }
  const maximum = asPositiveInteger(maxExactAllocationCount, "maxExactAllocationCount");
  const theoreticalAllocationCount = countPositiveSingleFormAllocations(
    geometryPattern.capacity,
    demands.length,
  );
  if (theoreticalAllocationCount > BigInt(maximum)) {
    throw new RangeError(
      `exact allocation space ${theoreticalAllocationCount} exceeds maxExactAllocationCount ${maximum}`,
    );
  }
  const allocations = enumeratePositiveAllocations(geometryPattern.capacity, demands.length);
  if (BigInt(allocations.length) !== theoreticalAllocationCount) {
    throw new RangeError("exact allocation enumeration count mismatch");
  }
  const patterns = allocations.map((counts) => createMultiProductSimplexPattern({
    id: `${normalizedId}:${counts.join("-")}`,
    geometryPattern,
    demands,
    allocationCounts: counts,
  })).sort(comparePatterns);
  const uniquePlanSignatures = new Set(patterns.map((pattern) => pattern.planSignature));
  if (uniquePlanSignatures.size !== patterns.length) {
    throw new RangeError("duplicate plan signatures in exact allocation catalog");
  }
  const catalog = {
    id: normalizedId,
    family: "exactMultiProductSimplexAllocations",
    geometryPattern,
    demands,
    patterns: Object.freeze(patterns),
    bestPhysicalSheetsPatternId: patterns[0]?.id ?? null,
    coverage: {
      scope: "all positive allocations of every simplex demand on one supplied geometry pattern",
      theoreticalAllocationCount: theoreticalAllocationCount.toString(),
      generatedAllocationCount: patterns.length,
      completeWithinRequestedSpace: true,
      truncated: false,
      blankSlotsAllowed: true,
      multipleFormsEvaluated: false,
      duplexEvaluated: false,
      pricingEvaluated: false,
      generalPackingEvaluated: false,
    },
  };
  return deepFreeze(catalog);
}
