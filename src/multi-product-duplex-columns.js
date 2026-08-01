import { validateGeometryPattern } from "./geometric-pattern.js";
import { countNonEmptySimplexCandidateColumns } from "./multi-product-simplex-columns.js";

const EPSILON = 1e-9;
const MM_PRECISION = 1000;
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

function roundMm(value) {
  return Math.round((Number(value) + Number.EPSILON) * MM_PRECISION) / MM_PRECISION;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function compareDemands(a, b) {
  const byDemandId = a.demandId.localeCompare(b.demandId);
  if (byDemandId !== 0) return byDemandId;
  return a.productId.localeCompare(b.productId);
}

function compareCells(a, b) {
  if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
  if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
  return a.sourceSlotId.localeCompare(b.sourceSlotId);
}

function normalizeDuplexDemand(input, index) {
  const label = `demands[${index}]`;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(`${label} must be an object`);
  }
  const demandId = asNonEmptyString(input.demandId, `${label}.demandId`);
  const productId = asNonEmptyString(input.productId, `${label}.productId`);
  const requiredQuantity = asPositiveInteger(input.requiredQuantity, `${label}.requiredQuantity`);
  const frontPage = asPositiveInteger(input.frontPage, `${label}.frontPage`);
  const backPage = asPositiveInteger(input.backPage, `${label}.backPage`);
  if (frontPage === backPage) {
    throw new RangeError(`${label}.backPage must differ from frontPage`);
  }
  const frontColorCount = asPositiveInteger(input.frontColorCount, `${label}.frontColorCount`);
  const backColorCount = asPositiveInteger(input.backColorCount, `${label}.backColorCount`);
  return Object.freeze({
    demandId,
    productId,
    requiredQuantity,
    frontPage,
    backPage,
    frontColorCount,
    backColorCount,
  });
}

function normalizeDemands(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new RangeError("demands must be a non-empty array");
  }
  const demands = input.map((demand, index) => normalizeDuplexDemand(demand, index)).sort(compareDemands);
  const seenDemandIds = new Set();
  for (const demand of demands) {
    if (seenDemandIds.has(demand.demandId)) {
      throw new RangeError(`duplicate demandId: ${demand.demandId}`);
    }
    seenDemandIds.add(demand.demandId);
  }
  const frontColorCounts = new Set(demands.map((demand) => demand.frontColorCount));
  const backColorCounts = new Set(demands.map((demand) => demand.backColorCount));
  if (frontColorCounts.size !== 1 || backColorCounts.size !== 1) {
    throw new RangeError(
      "all separate-duplex demands must use the same frontColorCount and backColorCount in P1",
    );
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

function createBackCell(slot, demand, printableWidthMm) {
  const cell = {
    id: `back:${slot.id}:${demand.demandId}`,
    side: "back",
    demandId: demand.demandId,
    productId: demand.productId,
    page: demand.backPage,
    sourceSlotId: slot.id,
    xMm: roundMm(printableWidthMm - slot.xMm - slot.widthMm),
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

function createFrontBlankSlot(slot) {
  const blank = {
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
    blank.sourceStripId = slot.stripId;
    blank.sourcePositionInStrip = slot.positionInStrip;
  }
  return Object.freeze(blank);
}

function createBackBlankSlot(slot, printableWidthMm) {
  const blank = {
    sourceSlotId: slot.id,
    xMm: roundMm(printableWidthMm - slot.xMm - slot.widthMm),
    yMm: slot.yMm,
    widthMm: slot.widthMm,
    heightMm: slot.heightMm,
    rotation: slot.rotation,
    sourceRow: slot.row,
    sourceColumn: slot.column,
  };
  if (slot.stripId !== undefined) {
    blank.sourceStripId = slot.stripId;
    blank.sourcePositionInStrip = slot.positionInStrip;
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
    blankPositionsPerSide: capacity - occupiedPositionsPerSheet,
    layoutFormsPerColumn: 2,
    colorPlatesPerColumn: demands[0].frontColorCount + demands[0].backColorCount,
    pressPassesPerSheet: 2,
  });
}

function createSignatures({ geometryPattern, demands, counts }) {
  const occupied = counts.reduce((sum, count) => sum + count, 0);
  const structuralSignature = [
    "multi-product-separate-duplex-column-v1",
    `geometry=${geometryPattern.structuralSignature}`,
    `counts=${counts.join(",")}`,
    `blank=${geometryPattern.capacity - occupied}`,
    `colors=${demands[0].frontColorCount}+${demands[0].backColorCount}`,
    "transform=horizontalReflection",
  ].join("|");
  const allocationSignature = demands.map((demand, index) => [
    demand.demandId,
    demand.productId,
    counts[index],
  ].join(":")).join(";");
  const columnSignature = [
    structuralSignature,
    `allocation=${allocationSignature}`,
    `pages=${demands.map((demand) => [
      demand.demandId,
      demand.frontPage,
      demand.backPage,
    ].join(":")).join(";")}`,
  ].join("|");
  return Object.freeze({ structuralSignature, allocationSignature, columnSignature });
}

function assertSameJson(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new RangeError(`${label} mismatch`);
  }
}

function materializeCells(geometryPattern, demands, counts) {
  const frontCells = [];
  const backCells = [];
  let slotIndex = 0;
  for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
    for (let position = 0; position < counts[demandIndex]; position += 1) {
      const slot = geometryPattern.slots[slotIndex];
      const demand = demands[demandIndex];
      frontCells.push(createFrontCell(slot, demand));
      backCells.push(createBackCell(slot, demand, geometryPattern.printableArea.widthMm));
      slotIndex += 1;
    }
  }
  const unusedSlots = geometryPattern.slots.slice(slotIndex);
  return deepFreeze({
    frontCells: Object.freeze(frontCells.sort(compareCells)),
    backCells: Object.freeze(backCells.sort(compareCells)),
    frontBlankSlots: Object.freeze(unusedSlots.map(createFrontBlankSlot).sort(compareCells)),
    backBlankSlots: Object.freeze(unusedSlots
      .map((slot) => createBackBlankSlot(slot, geometryPattern.printableArea.widthMm))
      .sort(compareCells)),
  });
}

export function validateMultiProductSeparateDuplexColumn(column) {
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

  const expectedCells = materializeCells(column.geometryPattern, demands, counts);
  assertSameJson(column.frontCells, expectedCells.frontCells, "frontCells");
  assertSameJson(column.backCells, expectedCells.backCells, "backCells");
  assertSameJson(column.frontBlankSlots, expectedCells.frontBlankSlots, "frontBlankSlots");
  assertSameJson(column.backBlankSlots, expectedCells.backBlankSlots, "backBlankSlots");

  const expectedMetrics = createColumnMetrics(column.geometryPattern.capacity, demands, counts);
  assertSameJson(column.metrics, expectedMetrics, "metrics");
  const expectedColorModel = Object.freeze({
    type: "sharedEqualSeparateDuplexColorCounts",
    frontColorCount: demands[0].frontColorCount,
    backColorCount: demands[0].backColorCount,
    colorPlateCount: demands[0].frontColorCount + demands[0].backColorCount,
    requiresNamedInkCompatibilityCheck: true,
  });
  assertSameJson(column.sharedDuplexColorModel, expectedColorModel, "sharedDuplexColorModel");
  const expectedTransform = Object.freeze({
    type: "horizontalReflection",
    printableWidthMm: column.geometryPattern.printableArea.widthMm,
  });
  assertSameJson(column.backTransform, expectedTransform, "backTransform");

  const signatures = createSignatures({ geometryPattern: column.geometryPattern, demands, counts });
  if (column.structuralSignature !== signatures.structuralSignature
    || column.allocationSignature !== signatures.allocationSignature
    || column.columnSignature !== signatures.columnSignature) {
    throw new RangeError("column signatures mismatch");
  }
  for (const forbiddenKey of ["runLength", "demandMetrics", "producedQuantity", "underproduction"]) {
    if (Object.hasOwn(column, forbiddenKey)) {
      throw new RangeError(`candidate column must not own ${forbiddenKey}`);
    }
  }
  return true;
}

export function createMultiProductSeparateDuplexColumn({
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
  const cells = materializeCells(geometryPattern, demands, counts);
  const metrics = createColumnMetrics(geometryPattern.capacity, demands, counts);
  const sharedDuplexColorModel = Object.freeze({
    type: "sharedEqualSeparateDuplexColorCounts",
    frontColorCount: demands[0].frontColorCount,
    backColorCount: demands[0].backColorCount,
    colorPlateCount: demands[0].frontColorCount + demands[0].backColorCount,
    requiresNamedInkCompatibilityCheck: true,
  });
  const backTransform = Object.freeze({
    type: "horizontalReflection",
    printableWidthMm: geometryPattern.printableArea.widthMm,
  });
  const signatures = createSignatures({ geometryPattern, demands, counts });
  const column = deepFreeze({
    id: normalizedId,
    family: "multiProductSeparateDuplexColumn",
    strategy: "separateFrontBackFormsCandidate",
    geometryPattern,
    demands,
    allocation,
    frontCells: cells.frontCells,
    backCells: cells.backCells,
    frontBlankSlots: cells.frontBlankSlots,
    backBlankSlots: cells.backBlankSlots,
    metrics,
    sharedDuplexColorModel,
    backTransform,
    structuralSignature: signatures.structuralSignature,
    allocationSignature: signatures.allocationSignature,
    columnSignature: signatures.columnSignature,
  });
  validateMultiProductSeparateDuplexColumn(column);
  return column;
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

export function generateExactMultiProductSeparateDuplexColumns({
  id = "multi-product-separate-duplex-column-catalog",
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
      `exact separate-duplex candidate-column space ${theoreticalColumnCount} exceeds maxExactColumnCount ${maximum}`,
    );
  }
  const allocations = enumerateNonEmptyAllocations(geometryPattern.capacity, demands.length);
  if (BigInt(allocations.length) !== theoreticalColumnCount) {
    throw new RangeError("exact separate-duplex candidate-column enumeration count mismatch");
  }
  const columns = allocations.map((counts) => createMultiProductSeparateDuplexColumn({
    id: `${normalizedId}:${counts.join("-")}`,
    geometryPattern,
    demands,
    allocationCounts: counts,
  })).sort(compareColumns);
  const uniqueSignatures = new Set(columns.map((column) => column.columnSignature));
  if (uniqueSignatures.size !== columns.length) {
    throw new RangeError("duplicate signatures in exact separate-duplex candidate-column catalog");
  }
  return deepFreeze({
    id: normalizedId,
    family: "exactMultiProductSeparateDuplexCandidateColumns",
    geometryPattern,
    demands,
    columns: Object.freeze(columns),
    coverage: {
      scope: "all non-empty non-negative separate-duplex allocations on one supplied geometry pattern",
      theoreticalColumnCount: theoreticalColumnCount.toString(),
      generatedColumnCount: columns.length,
      completeWithinRequestedSpace: true,
      truncated: false,
      blankSlotsAllowed: true,
      multipleFormsEvaluated: false,
      runLengthsEvaluated: false,
      workAndTurnEvaluated: false,
      pricingEvaluated: false,
      generalPackingEvaluated: false,
    },
  });
}
