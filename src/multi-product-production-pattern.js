import { validateGeometryPattern } from "./geometric-pattern.js";

const EPSILON = 1e-9;
const MM_PRECISION = 1000;
const DEFAULT_MAX_ALLOCATION_COUNT = 10000;
const HARD_MAX_ALLOCATION_COUNT = 100000;

export const MULTI_PRODUCT_PRINT_STRATEGIES = Object.freeze({
  SIMPLEX: "simplex",
  SEPARATE_DUPLEX: "separateDuplex",
});

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

function normalizeDemand(input, index) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(`demands[${index}] must be an object`);
  }
  const demandId = asNonEmptyString(input.demandId, `demands[${index}].demandId`);
  const productId = asNonEmptyString(input.productId, `demands[${index}].productId`);
  const requiredQuantity = asPositiveInteger(
    input.requiredQuantity,
    `demands[${index}].requiredQuantity`,
  );
  const frontPage = asPositiveInteger(input.frontPage, `demands[${index}].frontPage`);
  const backPage = input.backPage === null || input.backPage === undefined
    ? null
    : asPositiveInteger(input.backPage, `demands[${index}].backPage`);
  if (backPage !== null && backPage === frontPage) {
    throw new RangeError(`demands[${index}].backPage must differ from frontPage`);
  }
  const frontColorCount = asPositiveInteger(
    input.frontColorCount,
    `demands[${index}].frontColorCount`,
  );
  const backColorCount = asNonNegativeInteger(
    input.backColorCount,
    `demands[${index}].backColorCount`,
  );
  if (backPage === null && backColorCount !== 0) {
    throw new RangeError(`demands[${index}].backColorCount must be 0 for a blank back`);
  }
  if (backPage !== null && backColorCount === 0) {
    throw new RangeError(`demands[${index}].backColorCount must be positive for a printed back`);
  }
  return {
    demandId,
    productId,
    requiredQuantity,
    frontPage,
    backPage,
    frontColorCount,
    backColorCount,
  };
}

function normalizeDemands(demandsInput, strategy) {
  if (!Array.isArray(demandsInput) || demandsInput.length < 2) {
    throw new RangeError("demands must contain at least two demand units");
  }
  if (!Object.values(MULTI_PRODUCT_PRINT_STRATEGIES).includes(strategy)) {
    throw new RangeError(`Unsupported multi-product strategy: ${strategy}`);
  }
  const demands = demandsInput
    .map((demand, index) => normalizeDemand(demand, index))
    .sort((a, b) => a.demandId.localeCompare(b.demandId));
  const demandIds = new Set();
  for (const demand of demands) {
    if (demandIds.has(demand.demandId)) {
      throw new RangeError(`duplicate demandId: ${demand.demandId}`);
    }
    demandIds.add(demand.demandId);
  }

  const first = demands[0];
  for (const demand of demands) {
    if (strategy === MULTI_PRODUCT_PRINT_STRATEGIES.SIMPLEX) {
      if (demand.backPage !== null || demand.backColorCount !== 0) {
        throw new RangeError("simplex multi-product patterns require every back page to be blank");
      }
      if (demand.frontColorCount !== first.frontColorCount) {
        throw new RangeError("simplex demands must use the same front color count");
      }
    } else {
      if (demand.backPage === null) {
        throw new RangeError("separateDuplex multi-product patterns require every back page to print");
      }
      if (demand.frontColorCount !== first.frontColorCount
        || demand.backColorCount !== first.backColorCount) {
        throw new RangeError("separateDuplex demands must use the same front and back color counts");
      }
    }
  }
  return deepFreeze(demands);
}

function normalizeAllocation(allocationInput, demands, capacity) {
  if (!allocationInput || typeof allocationInput !== "object" || Array.isArray(allocationInput)) {
    throw new TypeError("allocation must be an object keyed by demandId");
  }
  const knownIds = new Set(demands.map(({ demandId }) => demandId));
  for (const key of Object.keys(allocationInput)) {
    if (!knownIds.has(key)) throw new RangeError(`allocation contains unknown demandId: ${key}`);
  }
  const entries = demands.map((demand) => Object.freeze({
    demandId: demand.demandId,
    positionCount: asPositiveInteger(
      allocationInput[demand.demandId],
      `allocation.${demand.demandId}`,
    ),
  }));
  const usedPositionCount = entries.reduce((sum, entry) => sum + entry.positionCount, 0);
  if (usedPositionCount > capacity) {
    throw new RangeError("allocation uses more positions than the geometry capacity");
  }
  const positionCountByDemand = Object.freeze(Object.fromEntries(
    entries.map(({ demandId, positionCount }) => [demandId, positionCount]),
  ));
  return deepFreeze({
    entries,
    positionCountByDemand,
    usedPositionCount,
    blankPositionCount: capacity - usedPositionCount,
  });
}

function compareCells(a, b) {
  if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
  if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
  return a.sourceSlotId.localeCompare(b.sourceSlotId);
}

function createFrontCell(slot, demand) {
  const cell = {
    id: `front:${slot.id}`,
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
    id: `back:${slot.id}`,
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

function createAssignments({ geometryPattern, demands, allocation }) {
  const demandById = new Map(demands.map((demand) => [demand.demandId, demand]));
  const slotAssignments = [];
  const frontCells = [];
  let slotIndex = 0;
  for (const entry of allocation.entries) {
    const demand = demandById.get(entry.demandId);
    for (let position = 0; position < entry.positionCount; position += 1) {
      const slot = geometryPattern.slots[slotIndex];
      slotAssignments.push(Object.freeze({
        slotId: slot.id,
        demandId: demand.demandId,
        positionInDemandBlock: position,
      }));
      frontCells.push(createFrontCell(slot, demand));
      slotIndex += 1;
    }
  }
  const blankSlots = geometryPattern.slots.slice(slotIndex);
  for (const slot of blankSlots) {
    slotAssignments.push(Object.freeze({ slotId: slot.id, demandId: null }));
  }
  return deepFreeze({ slotAssignments, frontCells, blankSlots });
}

function createDemandMetrics(demands, allocation, runLength) {
  return Object.freeze(demands.map((demand) => {
    const positionsPerSheet = allocation.positionCountByDemand[demand.demandId];
    const producedQuantity = positionsPerSheet * runLength;
    return Object.freeze({
      demandId: demand.demandId,
      productId: demand.productId,
      positionsPerSheet,
      requiredQuantity: demand.requiredQuantity,
      producedQuantity,
      overrun: producedQuantity - demand.requiredQuantity,
      underproduction: Math.max(0, demand.requiredQuantity - producedQuantity),
    });
  }));
}

function createMetrics({ demands, allocation, strategy, runLength }) {
  const duplex = strategy === MULTI_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX;
  const demandMetrics = createDemandMetrics(demands, allocation, runLength);
  const totalRequiredQuantity = demandMetrics.reduce((sum, item) => sum + item.requiredQuantity, 0);
  const totalProducedQuantity = demandMetrics.reduce((sum, item) => sum + item.producedQuantity, 0);
  const totalOverrun = demandMetrics.reduce((sum, item) => sum + item.overrun, 0);
  const totalUnderproduction = demandMetrics.reduce((sum, item) => sum + item.underproduction, 0);
  return deepFreeze({
    physicalSheets: runLength,
    capacity: allocation.usedPositionCount + allocation.blankPositionCount,
    usedPositionsPerSheet: allocation.usedPositionCount,
    blankPositionsPerSheet: allocation.blankPositionCount,
    activeSideCount: duplex ? 2 : 1,
    layoutForms: duplex ? 2 : 1,
    colorPlates: demands[0].frontColorCount + (duplex ? demands[0].backColorCount : 0),
    pressPasses: runLength * (duplex ? 2 : 1),
    totalRequiredQuantity,
    totalProducedQuantity,
    totalOverrun,
    totalUnderproduction,
    demandMetrics,
  });
}

function createSignatures({ geometryPattern, demands, allocation, strategy, runLength }) {
  const structuralProfiles = demands.map((demand) => [
    allocation.positionCountByDemand[demand.demandId],
    demand.frontColorCount,
    demand.backColorCount,
    demand.backPage === null ? "blank" : "printed",
  ].join(":"));
  const structuralSignature = [
    "multi-product-pattern-v1",
    `geometry=${geometryPattern.structuralSignature}`,
    `strategy=${strategy}`,
    "assignment=canonicalDemandBlocks",
    `profiles=${structuralProfiles.join(";")}`,
    `blank=${allocation.blankPositionCount}`,
  ].join("|");
  const demandSignature = demands.map((demand) => [
    demand.demandId,
    demand.productId,
    demand.frontPage,
    demand.backPage ?? "blank",
    demand.requiredQuantity,
    allocation.positionCountByDemand[demand.demandId],
  ].join(":"));
  return Object.freeze({
    structuralSignature,
    planSignature: `${structuralSignature}|demands=${demandSignature.join(";")}|run=${runLength}`,
  });
}

function expectedDemandForSlotIndex(demands, allocation, slotIndex) {
  let cursor = 0;
  for (const demand of demands) {
    cursor += allocation.positionCountByDemand[demand.demandId];
    if (slotIndex < cursor) return demand;
  }
  return null;
}

function validateCellAgainstSlot(cell, slot, demand, side, printableWidthMm) {
  if (cell.side !== side) throw new RangeError(`${side} cell has the wrong side`);
  if (cell.demandId !== demand.demandId || cell.productId !== demand.productId) {
    throw new RangeError(`${side} cell demand identity mismatch`);
  }
  const expectedPage = side === "front" ? demand.frontPage : demand.backPage;
  if (cell.page !== expectedPage) throw new RangeError(`${side} cell page mismatch`);
  if (cell.sourceSlotId !== slot.id) throw new RangeError(`${side} cell source slot mismatch`);
  const expectedX = side === "front"
    ? slot.xMm
    : roundMm(printableWidthMm - slot.xMm - slot.widthMm);
  if (Math.abs(cell.xMm - expectedX) > EPSILON
    || Math.abs(cell.yMm - slot.yMm) > EPSILON
    || Math.abs(cell.widthMm - slot.widthMm) > EPSILON
    || Math.abs(cell.heightMm - slot.heightMm) > EPSILON
    || cell.rotation !== slot.rotation) {
    throw new RangeError(`${side} cell geometry mismatch for slot ${slot.id}`);
  }
}

export function validateMultiProductProductionPattern(pattern) {
  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) {
    throw new TypeError("pattern must be an object");
  }
  if (pattern.family !== "multiProductSinglePattern") {
    throw new RangeError("pattern.family must be multiProductSinglePattern");
  }
  validateGeometryPattern(pattern.geometryPattern);
  const demands = normalizeDemands(pattern.demands, pattern.strategy);
  const allocation = normalizeAllocation(pattern.allocation.positionCountByDemand, demands, pattern.geometryPattern.capacity);
  if (pattern.assignmentPolicy !== "canonicalDemandBlocks") {
    throw new RangeError("assignmentPolicy must be canonicalDemandBlocks");
  }
  const expectedRunLength = Math.max(...demands.map((demand) => Math.ceil(
    demand.requiredQuantity / allocation.positionCountByDemand[demand.demandId],
  )));
  if (pattern.runLength !== expectedRunLength) {
    throw new RangeError("runLength must be the maximum integer run required by every demand");
  }
  if (!Array.isArray(pattern.slotAssignments)
    || pattern.slotAssignments.length !== pattern.geometryPattern.capacity) {
    throw new RangeError("slotAssignments length must equal geometry capacity");
  }
  if (!Array.isArray(pattern.frontCells)
    || pattern.frontCells.length !== allocation.usedPositionCount) {
    throw new RangeError("frontCells length must equal used allocation positions");
  }
  if (!Array.isArray(pattern.blankSlots)
    || pattern.blankSlots.length !== allocation.blankPositionCount) {
    throw new RangeError("blankSlots length must equal unused geometry positions");
  }

  let frontCellIndex = 0;
  for (let slotIndex = 0; slotIndex < pattern.geometryPattern.slots.length; slotIndex += 1) {
    const slot = pattern.geometryPattern.slots[slotIndex];
    const expectedDemand = expectedDemandForSlotIndex(demands, allocation, slotIndex);
    const assignment = pattern.slotAssignments[slotIndex];
    if (assignment.slotId !== slot.id || assignment.demandId !== (expectedDemand?.demandId ?? null)) {
      throw new RangeError("slotAssignments do not match canonical demand blocks");
    }
    if (expectedDemand) {
      validateCellAgainstSlot(
        pattern.frontCells[frontCellIndex],
        slot,
        expectedDemand,
        "front",
        pattern.geometryPattern.printableArea.widthMm,
      );
      frontCellIndex += 1;
    } else {
      const blankIndex = slotIndex - allocation.usedPositionCount;
      if (pattern.blankSlots[blankIndex]?.id !== slot.id) {
        throw new RangeError("blankSlots must preserve the unused geometry slot order");
      }
    }
  }

  const duplex = pattern.strategy === MULTI_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX;
  if (!Array.isArray(pattern.backCells)) throw new TypeError("backCells must be an array");
  if (!duplex && pattern.backCells.length !== 0) {
    throw new RangeError("simplex patterns must not contain back cells");
  }
  if (duplex) {
    if (pattern.backCells.length !== allocation.usedPositionCount) {
      throw new RangeError("duplex backCells length must equal used allocation positions");
    }
    const sourceSlotById = new Map(pattern.geometryPattern.slots.map((slot) => [slot.id, slot]));
    const demandById = new Map(demands.map((demand) => [demand.demandId, demand]));
    for (const cell of pattern.backCells) {
      const slot = sourceSlotById.get(cell.sourceSlotId);
      const demand = demandById.get(cell.demandId);
      if (!slot || !demand) throw new RangeError("back cell references unknown source data");
      validateCellAgainstSlot(
        cell,
        slot,
        demand,
        "back",
        pattern.geometryPattern.printableArea.widthMm,
      );
    }
    const sortedBackCells = [...pattern.backCells].sort(compareCells);
    for (let index = 0; index < sortedBackCells.length; index += 1) {
      if (pattern.backCells[index].id !== sortedBackCells[index].id) {
        throw new RangeError("backCells must use deterministic top-left order");
      }
    }
  }

  const expectedMetrics = createMetrics({
    demands,
    allocation,
    strategy: pattern.strategy,
    runLength: expectedRunLength,
  });
  if (expectedMetrics.totalUnderproduction !== 0) throw new RangeError("underproduction is forbidden");
  if (JSON.stringify(pattern.metrics) !== JSON.stringify(expectedMetrics)) {
    throw new RangeError("multi-product metrics mismatch");
  }
  const expectedTransform = duplex
    ? { type: "horizontalReflection", printableWidthMm: pattern.geometryPattern.printableArea.widthMm }
    : null;
  if (JSON.stringify(pattern.backTransform) !== JSON.stringify(expectedTransform)) {
    throw new RangeError("backTransform mismatch");
  }
  return true;
}

export function createMultiProductProductionPattern({
  id,
  geometryPattern,
  demands: demandInputs,
  allocation: allocationInput,
  strategy,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  validateGeometryPattern(geometryPattern);
  const demands = normalizeDemands(demandInputs, strategy);
  const allocation = normalizeAllocation(allocationInput, demands, geometryPattern.capacity);
  const runLength = Math.max(...demands.map((demand) => Math.ceil(
    demand.requiredQuantity / allocation.positionCountByDemand[demand.demandId],
  )));
  const assignments = createAssignments({ geometryPattern, demands, allocation });
  const demandById = new Map(demands.map((demand) => [demand.demandId, demand]));
  const duplex = strategy === MULTI_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX;
  const backCells = duplex
    ? Object.freeze(assignments.frontCells
      .map((frontCell) => createBackCell(
        geometryPattern.slots.find((slot) => slot.id === frontCell.sourceSlotId),
        demandById.get(frontCell.demandId),
        geometryPattern.printableArea.widthMm,
      ))
      .sort(compareCells))
    : Object.freeze([]);
  const backTransform = duplex
    ? Object.freeze({
      type: "horizontalReflection",
      printableWidthMm: geometryPattern.printableArea.widthMm,
    })
    : null;
  const metrics = createMetrics({ demands, allocation, strategy, runLength });
  const signatures = createSignatures({
    geometryPattern,
    demands,
    allocation,
    strategy,
    runLength,
  });
  const compatibility = deepFreeze({
    type: "exactColorCount",
    frontColorCount: demands[0].frontColorCount,
    backColorCount: duplex ? demands[0].backColorCount : 0,
    requiresNamedInkCompatibilityCheck: true,
  });
  const pattern = deepFreeze({
    id: normalizedId,
    family: "multiProductSinglePattern",
    strategy,
    assignmentPolicy: "canonicalDemandBlocks",
    geometryPattern,
    demands,
    allocation,
    runLength,
    slotAssignments: assignments.slotAssignments,
    frontCells: assignments.frontCells,
    backCells,
    blankSlots: assignments.blankSlots,
    backTransform,
    compatibility,
    metrics,
    structuralSignature: signatures.structuralSignature,
    planSignature: signatures.planSignature,
  });
  validateMultiProductProductionPattern(pattern);
  return pattern;
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

export function countMultiProductAllocations({
  capacity,
  demandCount,
  allowUnusedPositions = true,
}) {
  const normalizedCapacity = asNonNegativeInteger(capacity, "capacity");
  const normalizedDemandCount = asPositiveInteger(demandCount, "demandCount");
  if (normalizedDemandCount > normalizedCapacity) return 0n;
  return allowUnusedPositions
    ? binomialBigInt(normalizedCapacity, normalizedDemandCount)
    : binomialBigInt(normalizedCapacity - 1, normalizedDemandCount - 1);
}

function enumerateAllocationObjects({
  demandIds,
  capacity,
  allowUnusedPositions,
  maxAllocationCount,
}) {
  const results = [];
  const counts = new Array(demandIds.length).fill(1);

  function visit(index, remaining) {
    if (results.length >= maxAllocationCount) return;
    const remainingDemandCount = demandIds.length - index - 1;
    if (index === demandIds.length - 1) {
      const minimum = 1;
      const maximum = allowUnusedPositions ? remaining : remaining;
      if (allowUnusedPositions) {
        for (let count = minimum; count <= maximum; count += 1) {
          if (results.length >= maxAllocationCount) return;
          counts[index] = count;
          results.push(Object.freeze(Object.fromEntries(
            demandIds.map((demandId, demandIndex) => [demandId, counts[demandIndex]]),
          )));
        }
      } else if (remaining >= minimum) {
        counts[index] = remaining;
        results.push(Object.freeze(Object.fromEntries(
          demandIds.map((demandId, demandIndex) => [demandId, counts[demandIndex]]),
        )));
      }
      return;
    }
    const maximum = remaining - remainingDemandCount;
    for (let count = 1; count <= maximum; count += 1) {
      if (results.length >= maxAllocationCount) return;
      counts[index] = count;
      visit(index + 1, remaining - count);
    }
  }

  visit(0, capacity);
  return Object.freeze(results);
}

function comparePatterns(a, b) {
  if (a.metrics.physicalSheets !== b.metrics.physicalSheets) {
    return a.metrics.physicalSheets - b.metrics.physicalSheets;
  }
  if (a.metrics.totalOverrun !== b.metrics.totalOverrun) {
    return a.metrics.totalOverrun - b.metrics.totalOverrun;
  }
  if (a.metrics.blankPositionsPerSheet !== b.metrics.blankPositionsPerSheet) {
    return a.metrics.blankPositionsPerSheet - b.metrics.blankPositionsPerSheet;
  }
  return a.planSignature.localeCompare(b.planSignature);
}

export function enumerateMultiProductProductionPatterns({
  idPrefix = "multi-product",
  geometryPattern,
  demands: demandInputs,
  strategy,
  allowUnusedPositions = true,
  maxAllocationCount = DEFAULT_MAX_ALLOCATION_COUNT,
}) {
  const normalizedPrefix = asNonEmptyString(idPrefix, "idPrefix");
  validateGeometryPattern(geometryPattern);
  const demands = normalizeDemands(demandInputs, strategy);
  const normalizedLimit = asPositiveInteger(maxAllocationCount, "maxAllocationCount");
  if (normalizedLimit > HARD_MAX_ALLOCATION_COUNT) {
    throw new RangeError(`maxAllocationCount must not exceed ${HARD_MAX_ALLOCATION_COUNT}`);
  }
  const theoreticalCount = countMultiProductAllocations({
    capacity: geometryPattern.capacity,
    demandCount: demands.length,
    allowUnusedPositions,
  });
  const demandIds = demands.map(({ demandId }) => demandId);
  const allocationObjects = enumerateAllocationObjects({
    demandIds,
    capacity: geometryPattern.capacity,
    allowUnusedPositions: Boolean(allowUnusedPositions),
    maxAllocationCount: normalizedLimit,
  });
  const patterns = allocationObjects
    .map((allocation, index) => createMultiProductProductionPattern({
      id: `${normalizedPrefix}-${index + 1}`,
      geometryPattern,
      demands,
      allocation,
      strategy,
    }))
    .sort(comparePatterns);
  const generatedCount = BigInt(patterns.length);
  const completeWithinRequestedSpace = generatedCount === theoreticalCount;
  const coverage = deepFreeze({
    family: "positiveDemandAllocations",
    allowUnusedPositions: Boolean(allowUnusedPositions),
    theoreticalAllocationCount: theoreticalCount <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(theoreticalCount)
      : null,
    theoreticalAllocationCountExact: theoreticalCount.toString(),
    generatedAllocationCount: patterns.length,
    maxAllocationCount: normalizedLimit,
    completeWithinRequestedSpace,
    truncated: !completeWithinRequestedSpace,
    truncationReasons: completeWithinRequestedSpace ? [] : ["allocationLimit"],
    physicalPlacementScope: "canonicalDemandBlocksOnly",
    generalPlacementCompletenessClaimed: false,
  });
  return deepFreeze({
    family: "multiProductSinglePatternCatalog",
    geometryPattern,
    demands,
    strategy,
    patterns,
    bestKnownPattern: patterns[0] ?? null,
    provenBestPattern: completeWithinRequestedSpace ? (patterns[0] ?? null) : null,
    coverage,
  });
}
