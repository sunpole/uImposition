import { validateGeometryPattern } from "./geometric-pattern.js";

const EPSILON = 1e-9;
const DEFAULT_MAX_EXACT_COLUMN_COUNT = 100000;

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
  const counts = input.map((value, index) => asNonNegativeInteger(value, `allocationCounts[${index}]`));
  const occupied = counts.reduce((sum, count) => sum + count, 0);
  if (occupied < 1) throw new RangeError("candidate column must occupy at least one slot");
  if (occupied > capacity) throw new RangeError("allocationCounts exceed geometry capacity");
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

export function countNonEmptySimplexCandidateColumns(capacityInput, demandCountInput) {
  const capacity = asPositiveInteger(capacityInput, "capacity");
  const demandCount = asPositiveInteger(demandCountInput, "demandCount");
  return binomialBigInt(capacity + demandCount, demandCount) - 1n;
}

function enumerateNonEmptyAllocations(capacity, demandCount) {
  const allocations = [];
  const current = Array(demandCount).fill(0);
  function visit(index, remainingCapacity, occupied) {
    if (index === demandCount - 1) {
      for (let count = 0; count <= remainingCapacity; count += 1) {
        current[index] = count;
        if (occupied + count > 0) allocations.push(Object.freeze([...current]));
      }
      return;
    }
    for (let count = 0; count <= remainingCapacity; count += 1) {
      current[index] = count;
      visit(index + 1, remainingCapacity - count, occupied + count);
    }
  }
  visit(0, capacity, 0);
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
    active: counts[index] > 0,
  })));
}

function createColumnMetrics(capacity, demands, counts) {
  const occupiedPositionsPerSheet = counts.reduce((sum, count) => sum + count, 0);
  const activeDemandCount = counts.filter((count) => count > 0).length;
  return Object.freeze({
    geometryCapacity: capacity,
    demandCount: demands.length,
    activeDemandCount,
    occupiedPositionsPerSheet,
    blankPositionsPerSheet: capacity - occupiedPositionsPerSheet,
    layoutFormsPerColumn: 1,
    colorPlatesPerColumn: demands[0].frontColorCount,
    pressPassesPerSheet: 1,
  });
}

function createSignatures({ geometryPattern, demands, counts }) {
  const occupied = counts.reduce((sum, count) => sum + count, 0);
  const structuralSignature = [
    "multi-product-simplex-column-v1",
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
  const columnSignature = [
    structuralSignature,
    `allocation=${allocationSignature}`,
    `pages=${demands.map((demand) => `${demand.demandId}:${demand.frontPage}`).join(";")}`,
  ].join("|");
  return Object.freeze({ structuralSignature, allocationSignature, columnSignature });
}

function assertSameJson(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new RangeError(`${label} mismatch`);
  }
}

export function validateMultiProductSimplexColumn(column) {
  if (!column || typeof column !== "object" || Array.isArray(column)) {
    throw new TypeError("column must be an object");
  }
  validateGeometryPattern(column.geometryPattern);
  const demands = normalizeDemands(column.demands);
  assertSameJson(column.demands, demands, "demands canonical order");
  const counts = normalizeAllocationCounts(
    column.allocation?.map((entry) => entry.positionsPerSheet),
    demands.length,
    column.geometryPattern.capacity,
  );
  assertSameJson(column.allocation, createAllocation(demands, counts), "allocation");

  const occupiedPositions = counts.reduce((sum, count) => sum + count, 0);
  if (!Array.isArray(column.frontCells) || column.frontCells.length !== occupiedPositions) {
    throw new RangeError("frontCells length mismatch");
  }
  let slotIndex = 0;
  let cellIndex = 0;
  for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
    for (let position = 0; position < counts[demandIndex]; position += 1) {
      const expectedCell = createFrontCell(column.geometryPattern.slots[slotIndex], demands[demandIndex]);
      assertSameJson(column.frontCells[cellIndex], expectedCell, `frontCells[${cellIndex}]`);
      slotIndex += 1;
      cellIndex += 1;
    }
  }
  assertSameJson(column.frontCells, [...column.frontCells].sort(compareCells), "frontCells physical order");
  const expectedBlankSlots = Object.freeze(column.geometryPattern.slots
    .slice(occupiedPositions)
    .map(createBlankSlot));
  assertSameJson(column.blankSlots, expectedBlankSlots, "blankSlots");

  const expectedMetrics = createColumnMetrics(column.geometryPattern.capacity, demands, counts);
  assertSameJson(column.metrics, expectedMetrics, "metrics");
  const expectedColorModel = Object.freeze({
    type: "sharedEqualFrontColorCount",
    colorPlateCount: demands[0].frontColorCount,
    requiresNamedInkCompatibilityCheck: true,
  });
  assertSameJson(column.sharedFrontColorModel, expectedColorModel, "sharedFrontColorModel");
  const signatures = createSignatures({ geometryPattern: column.geometryPattern, demands, counts });
  if (column.structuralSignature !== signatures.structuralSignature
    || column.allocationSignature !== signatures.allocationSignature
    || column.columnSignature !== signatures.columnSignature) {
    throw new RangeError("column signatures mismatch");
  }
  if (Object.hasOwn(column, "runLength")) {
    throw new RangeError("candidate column must not own a runLength");
  }
  return true;
}

export function createMultiProductSimplexColumn({
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
  const metrics = createColumnMetrics(geometryPattern.capacity, demands, counts);
  const sharedFrontColorModel = Object.freeze({
    type: "sharedEqualFrontColorCount",
    colorPlateCount: demands[0].frontColorCount,
    requiresNamedInkCompatibilityCheck: true,
  });
  const signatures = createSignatures({ geometryPattern, demands, counts });
  const column = Object.freeze({
    id: normalizedId,
    family: "multiProductSimplexColumn",
    strategy: "singleSharedFrontFormCandidate",
    geometryPattern,
    demands,
    allocation,
    frontCells: frozenFrontCells,
    blankSlots,
    metrics,
    sharedFrontColorModel,
    structuralSignature: signatures.structuralSignature,
    allocationSignature: signatures.allocationSignature,
    columnSignature: signatures.columnSignature,
  });
  validateMultiProductSimplexColumn(column);
  return deepFreeze(column);
}

function compareColumns(a, b) {
  if (a.metrics.occupiedPositionsPerSheet !== b.metrics.occupiedPositionsPerSheet) {
    return b.metrics.occupiedPositionsPerSheet - a.metrics.occupiedPositionsPerSheet;
  }
  if (a.metrics.activeDemandCount !== b.metrics.activeDemandCount) {
    return a.metrics.activeDemandCount - b.metrics.activeDemandCount;
  }
  return a.allocationSignature.localeCompare(b.allocationSignature);
}

export function generateExactMultiProductSimplexColumns({
  id = "multi-product-simplex-column-catalog",
  geometryPattern,
  demands: demandInput,
  maxExactColumnCount = DEFAULT_MAX_EXACT_COLUMN_COUNT,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  validateGeometryPattern(geometryPattern);
  const demands = normalizeDemands(demandInput);
  const maximum = asPositiveInteger(maxExactColumnCount, "maxExactColumnCount");
  const theoreticalColumnCount = countNonEmptySimplexCandidateColumns(
    geometryPattern.capacity,
    demands.length,
  );
  if (theoreticalColumnCount > BigInt(maximum)) {
    throw new RangeError(
      `exact candidate-column space ${theoreticalColumnCount} exceeds maxExactColumnCount ${maximum}`,
    );
  }
  const allocations = enumerateNonEmptyAllocations(geometryPattern.capacity, demands.length);
  if (BigInt(allocations.length) !== theoreticalColumnCount) {
    throw new RangeError("exact candidate-column enumeration count mismatch");
  }
  const columns = allocations.map((counts) => createMultiProductSimplexColumn({
    id: `${normalizedId}:${counts.join("-")}`,
    geometryPattern,
    demands,
    allocationCounts: counts,
  })).sort(compareColumns);
  const uniqueSignatures = new Set(columns.map((column) => column.columnSignature));
  if (uniqueSignatures.size !== columns.length) {
    throw new RangeError("duplicate signatures in exact candidate-column catalog");
  }
  return deepFreeze({
    id: normalizedId,
    family: "exactMultiProductSimplexCandidateColumns",
    geometryPattern,
    demands,
    columns: Object.freeze(columns),
    coverage: {
      scope: "all non-empty non-negative simplex allocations on one supplied geometry pattern",
      theoreticalColumnCount: theoreticalColumnCount.toString(),
      generatedColumnCount: columns.length,
      completeWithinRequestedSpace: true,
      truncated: false,
      zeroCountSubsetsIncluded: true,
      blankSlotsAllowed: true,
      runLengthsEvaluated: false,
      multipleColumnPlansEvaluated: false,
      duplexEvaluated: false,
      pricingEvaluated: false,
      generalPackingEvaluated: false,
    },
  });
}
