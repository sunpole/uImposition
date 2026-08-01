import { validateGeometryPattern } from "./geometric-pattern.js";

const EPSILON = 1e-9;
const MM_PRECISION = 1000;

export const SINGLE_PRODUCT_PRINT_STRATEGIES = Object.freeze({
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

function normalizeDemand(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("demand must be an object");
  }
  const demandId = asNonEmptyString(input.demandId, "demand.demandId");
  const productId = asNonEmptyString(input.productId, "demand.productId");
  const requiredQuantity = asPositiveInteger(input.requiredQuantity, "demand.requiredQuantity");
  const frontPage = asPositiveInteger(input.frontPage, "demand.frontPage");
  const backPage = input.backPage === null || input.backPage === undefined
    ? null
    : asPositiveInteger(input.backPage, "demand.backPage");
  if (backPage !== null && backPage === frontPage) {
    throw new RangeError("demand.backPage must differ from demand.frontPage");
  }
  const frontColorCount = asPositiveInteger(input.frontColorCount, "demand.frontColorCount");
  const backColorCount = asNonNegativeInteger(input.backColorCount, "demand.backColorCount");
  if (backPage === null && backColorCount !== 0) {
    throw new RangeError("demand.backColorCount must be 0 when demand.backPage is blank");
  }
  if (backPage !== null && backColorCount === 0) {
    throw new RangeError("demand.backColorCount must be greater than 0 for a printed back page");
  }
  return deepFreeze({
    demandId,
    productId,
    requiredQuantity,
    frontPage,
    backPage,
    frontColorCount,
    backColorCount,
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

function createSignatures({ geometryPattern, demand, strategy, runLength }) {
  const structuralSignature = [
    "single-product-pattern-v1",
    `geometry=${geometryPattern.structuralSignature}`,
    `strategy=${strategy}`,
    `back=${demand.backPage === null ? "blank" : "printed"}`,
    `colors=${demand.frontColorCount}+${demand.backColorCount}`,
  ].join("|");
  const planSignature = [
    structuralSignature,
    `demand=${demand.demandId}`,
    `product=${demand.productId}`,
    `pages=${demand.frontPage}/${demand.backPage ?? "blank"}`,
    `required=${demand.requiredQuantity}`,
    `run=${runLength}`,
  ].join("|");
  return Object.freeze({ structuralSignature, planSignature });
}

function expectedMetrics({ demand, capacity, runLength }) {
  const backPrinted = demand.backPage !== null;
  const activeSideCount = backPrinted ? 2 : 1;
  const producedQuantity = capacity * runLength;
  return Object.freeze({
    physicalSheets: runLength,
    positionsPerSheet: capacity,
    activeSideCount,
    layoutForms: activeSideCount,
    colorPlates: demand.frontColorCount + (backPrinted ? demand.backColorCount : 0),
    pressPasses: runLength * activeSideCount,
    requiredQuantity: demand.requiredQuantity,
    producedQuantity,
    overrun: producedQuantity - demand.requiredQuantity,
    underproduction: Math.max(0, demand.requiredQuantity - producedQuantity),
  });
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

export function validateSingleProductProductionPattern(pattern) {
  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) {
    throw new TypeError("pattern must be an object");
  }
  validateGeometryPattern(pattern.geometryPattern);
  const demand = normalizeDemand(pattern.demand);
  if (!Object.values(SINGLE_PRODUCT_PRINT_STRATEGIES).includes(pattern.strategy)) {
    throw new RangeError(`Unsupported single-product strategy: ${pattern.strategy}`);
  }
  if (pattern.strategy === SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX && demand.backPage !== null) {
    throw new RangeError("simplex strategy requires a blank back page");
  }
  const capacity = pattern.geometryPattern.capacity;
  if (capacity < 1) throw new RangeError("geometry pattern must contain at least one slot");
  const expectedRunLength = Math.ceil(demand.requiredQuantity / capacity);
  if (pattern.runLength !== expectedRunLength) {
    throw new RangeError("runLength does not cover the demand exactly as an integer-sheet run");
  }
  if (!Array.isArray(pattern.frontCells) || pattern.frontCells.length !== capacity) {
    throw new RangeError("frontCells length must equal geometry capacity");
  }
  for (let index = 0; index < capacity; index += 1) {
    validateCellAgainstSlot(
      pattern.frontCells[index],
      pattern.geometryPattern.slots[index],
      demand,
      "front",
      pattern.geometryPattern.printableArea.widthMm,
    );
  }

  const backPrinted = demand.backPage !== null;
  if (!Array.isArray(pattern.backCells)) throw new TypeError("backCells must be an array");
  if (!backPrinted && pattern.backCells.length !== 0) {
    throw new RangeError("blank back demand must not contain back cells");
  }
  if (backPrinted) {
    if (pattern.strategy !== SINGLE_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX) {
      throw new RangeError("printed back page requires separateDuplex strategy");
    }
    if (pattern.backCells.length !== capacity) {
      throw new RangeError("printed backCells length must equal geometry capacity");
    }
    const sourceSlotById = new Map(pattern.geometryPattern.slots.map((slot) => [slot.id, slot]));
    for (const cell of pattern.backCells) {
      const slot = sourceSlotById.get(cell.sourceSlotId);
      if (!slot) throw new RangeError(`back cell references unknown source slot ${cell.sourceSlotId}`);
      validateCellAgainstSlot(
        cell,
        slot,
        demand,
        "back",
        pattern.geometryPattern.printableArea.widthMm,
      );
    }
    const sorted = [...pattern.backCells].sort(compareCells);
    for (let index = 0; index < pattern.backCells.length; index += 1) {
      if (pattern.backCells[index].id !== sorted[index].id) {
        throw new RangeError("backCells must use deterministic top-left order");
      }
    }
  }

  const metrics = expectedMetrics({ demand, capacity, runLength: expectedRunLength });
  if (metrics.underproduction !== 0) throw new RangeError("underproduction is forbidden");
  for (const [key, expected] of Object.entries(metrics)) {
    if (pattern.metrics?.[key] !== expected) {
      throw new RangeError(`metrics.${key} mismatch`);
    }
  }
  const expectedTransform = backPrinted
    ? {
      type: "horizontalReflection",
      printableWidthMm: pattern.geometryPattern.printableArea.widthMm,
    }
    : null;
  if (JSON.stringify(pattern.backTransform) !== JSON.stringify(expectedTransform)) {
    throw new RangeError("backTransform mismatch");
  }
  return true;
}

export function createSingleProductProductionPattern({
  id,
  geometryPattern,
  demand: demandInput,
  strategy,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  validateGeometryPattern(geometryPattern);
  const demand = normalizeDemand(demandInput);
  if (!Object.values(SINGLE_PRODUCT_PRINT_STRATEGIES).includes(strategy)) {
    throw new RangeError(`Unsupported single-product strategy: ${strategy}`);
  }
  if (strategy === SINGLE_PRODUCT_PRINT_STRATEGIES.SIMPLEX && demand.backPage !== null) {
    throw new RangeError("simplex strategy requires a blank back page");
  }
  if (geometryPattern.capacity < 1) {
    throw new RangeError("geometry pattern must contain at least one slot");
  }

  const runLength = Math.ceil(demand.requiredQuantity / geometryPattern.capacity);
  const frontCells = Object.freeze(geometryPattern.slots.map((slot) => createFrontCell(slot, demand)));
  const backPrinted = demand.backPage !== null;
  const backCells = backPrinted
    ? Object.freeze(geometryPattern.slots
      .map((slot) => createBackCell(slot, demand, geometryPattern.printableArea.widthMm))
      .sort(compareCells))
    : Object.freeze([]);
  const backTransform = backPrinted
    ? Object.freeze({
      type: "horizontalReflection",
      printableWidthMm: geometryPattern.printableArea.widthMm,
    })
    : null;
  const metrics = expectedMetrics({
    demand,
    capacity: geometryPattern.capacity,
    runLength,
  });
  const signatures = createSignatures({ geometryPattern, demand, strategy, runLength });
  const pattern = Object.freeze({
    id: normalizedId,
    family: "singleProduct",
    strategy,
    geometryPattern,
    demand,
    runLength,
    frontCells,
    backCells,
    backTransform,
    technicalBlankBack: demand.backPage === null,
    metrics,
    structuralSignature: signatures.structuralSignature,
    planSignature: signatures.planSignature,
  });
  validateSingleProductProductionPattern(pattern);
  return pattern;
}
