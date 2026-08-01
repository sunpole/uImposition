const EPSILON = 1e-9;
const MM_PRECISION = 1000;
const PERCENT_PRECISION = 100;

function asFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number`);
  return number;
}

function assertPositive(value, label) {
  if (value <= 0) throw new RangeError(`${label} must be greater than 0`);
}

function assertNonNegative(value, label) {
  if (value < 0) throw new RangeError(`${label} must be 0 or greater`);
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
}

function roundMm(value) {
  return Math.round((value + Number.EPSILON) * MM_PRECISION) / MM_PRECISION;
}

function roundPercent(value) {
  return Math.round((value + Number.EPSILON) * PERCENT_PRECISION) / PERCENT_PRECISION;
}

function formatNumber(value) {
  return String(roundMm(value));
}

function normalizeRectangle(input, label) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(`${label} must be an object`);
  }
  const widthMm = roundMm(asFiniteNumber(input.widthMm, `${label}.widthMm`));
  const heightMm = roundMm(asFiniteNumber(input.heightMm, `${label}.heightMm`));
  const xMm = roundMm(asFiniteNumber(input.xMm ?? 0, `${label}.xMm`));
  const yMm = roundMm(asFiniteNumber(input.yMm ?? 0, `${label}.yMm`));
  assertPositive(widthMm, `${label}.widthMm`);
  assertPositive(heightMm, `${label}.heightMm`);
  assertNonNegative(xMm, `${label}.xMm`);
  assertNonNegative(yMm, `${label}.yMm`);
  return Object.freeze({ xMm, yMm, widthMm, heightMm });
}

export function createGeometrySlot({
  id,
  xMm,
  yMm,
  widthMm,
  heightMm,
  rotation,
  row,
  column,
}) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new TypeError("slot.id must be a non-empty string");
  }
  const normalizedRotation = Number(rotation);
  if (![0, 90].includes(normalizedRotation)) {
    throw new RangeError("slot.rotation must be 0 or 90");
  }
  const normalizedRow = Number(row);
  const normalizedColumn = Number(column);
  assertNonNegativeInteger(normalizedRow, "slot.row");
  assertNonNegativeInteger(normalizedColumn, "slot.column");
  const rectangle = normalizeRectangle({ xMm, yMm, widthMm, heightMm }, "slot");
  return Object.freeze({
    id: id.trim(),
    ...rectangle,
    rotation: normalizedRotation,
    row: normalizedRow,
    column: normalizedColumn,
  });
}

export function geometrySlotsOverlap(a, b, epsilon = EPSILON) {
  return a.xMm < b.xMm + b.widthMm - epsilon
    && a.xMm + a.widthMm > b.xMm + epsilon
    && a.yMm < b.yMm + b.heightMm - epsilon
    && a.yMm + a.heightMm > b.yMm + epsilon;
}

function calculateUsedBounds(slots) {
  if (slots.length === 0) {
    return Object.freeze({ xMm: 0, yMm: 0, widthMm: 0, heightMm: 0 });
  }
  const minX = Math.min(...slots.map((slot) => slot.xMm));
  const minY = Math.min(...slots.map((slot) => slot.yMm));
  const maxX = Math.max(...slots.map((slot) => slot.xMm + slot.widthMm));
  const maxY = Math.max(...slots.map((slot) => slot.yMm + slot.heightMm));
  return Object.freeze({
    xMm: roundMm(minX),
    yMm: roundMm(minY),
    widthMm: roundMm(maxX - minX),
    heightMm: roundMm(maxY - minY),
  });
}

function createStructuralSignature({
  family,
  printableArea,
  occupiedProduct,
  gapMm,
  rotation,
  rows,
  columns,
  slots,
}) {
  const slotSignature = slots.map((slot) => [
    slot.row,
    slot.column,
    formatNumber(slot.xMm),
    formatNumber(slot.yMm),
    formatNumber(slot.widthMm),
    formatNumber(slot.heightMm),
    slot.rotation,
  ].join(":"));
  return [
    "geometry-pattern-v1",
    `family=${family}`,
    `printable=${formatNumber(printableArea.widthMm)}x${formatNumber(printableArea.heightMm)}`,
    `product=${formatNumber(occupiedProduct.widthMm)}x${formatNumber(occupiedProduct.heightMm)}`,
    `gap=${formatNumber(gapMm)}`,
    `rotation=${rotation}`,
    `grid=${columns}x${rows}`,
    `slots=${slotSignature.join(";")}`,
  ].join("|");
}

export function validateGeometryPattern(pattern) {
  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) {
    throw new TypeError("pattern must be an object");
  }
  if (typeof pattern.id !== "string" || pattern.id.trim() === "") {
    throw new TypeError("pattern.id must be a non-empty string");
  }
  if (typeof pattern.family !== "string" || pattern.family.trim() === "") {
    throw new TypeError("pattern.family must be a non-empty string");
  }
  const printableArea = normalizeRectangle(pattern.printableArea, "pattern.printableArea");
  normalizeRectangle(pattern.occupiedProduct, "pattern.occupiedProduct");
  const gapMm = roundMm(asFiniteNumber(pattern.gapMm, "pattern.gapMm"));
  assertNonNegative(gapMm, "pattern.gapMm");
  if (![0, 90].includes(pattern.rotation)) {
    throw new RangeError("pattern.rotation must be 0 or 90");
  }
  assertNonNegativeInteger(pattern.rows, "pattern.rows");
  assertNonNegativeInteger(pattern.columns, "pattern.columns");
  assertNonNegativeInteger(pattern.capacity, "pattern.capacity");
  if (pattern.capacity !== pattern.rows * pattern.columns) {
    throw new RangeError("pattern.capacity must equal rows × columns");
  }
  if (!Array.isArray(pattern.slots) || pattern.slots.length !== pattern.capacity) {
    throw new RangeError("pattern.slots length must equal pattern.capacity");
  }

  const ids = new Set();
  for (let index = 0; index < pattern.slots.length; index += 1) {
    const slot = createGeometrySlot(pattern.slots[index]);
    if (ids.has(slot.id)) throw new RangeError(`duplicate slot id: ${slot.id}`);
    ids.add(slot.id);
    const expectedRow = Math.floor(index / pattern.columns);
    const expectedColumn = index % pattern.columns;
    if (slot.row !== expectedRow || slot.column !== expectedColumn) {
      throw new RangeError("pattern.slots must use deterministic row-major order");
    }
    if (slot.rotation !== pattern.rotation) {
      throw new RangeError("uniform pattern slot rotation must match pattern.rotation");
    }
    if (slot.xMm + slot.widthMm > printableArea.widthMm + EPSILON
      || slot.yMm + slot.heightMm > printableArea.heightMm + EPSILON) {
      throw new RangeError(`slot ${slot.id} exceeds printable area`);
    }
  }

  for (let left = 0; left < pattern.slots.length; left += 1) {
    for (let right = left + 1; right < pattern.slots.length; right += 1) {
      if (geometrySlotsOverlap(pattern.slots[left], pattern.slots[right])) {
        throw new RangeError(`slots overlap: ${pattern.slots[left].id} and ${pattern.slots[right].id}`);
      }
    }
  }

  return true;
}

export function createGeometryPattern({
  id,
  family = "uniformGrid",
  printableArea,
  occupiedProduct,
  gapMm = 0,
  rotation,
  rows,
  columns,
  slots,
  coverage = { scope: "uniformGrid", status: "completeWithinPatternFamily" },
}) {
  const normalizedPrintableArea = normalizeRectangle(printableArea, "printableArea");
  const normalizedOccupiedProduct = normalizeRectangle(occupiedProduct, "occupiedProduct");
  const normalizedGapMm = roundMm(asFiniteNumber(gapMm, "gapMm"));
  assertNonNegative(normalizedGapMm, "gapMm");
  if (!Array.isArray(slots)) throw new TypeError("slots must be an array");
  assertNonNegativeInteger(rows, "rows");
  assertNonNegativeInteger(columns, "columns");
  const normalizedSlots = Object.freeze(slots.map((slot) => createGeometrySlot(slot)));
  const usedBounds = calculateUsedBounds(normalizedSlots);
  const maxRight = usedBounds.xMm + usedBounds.widthMm;
  const maxBottom = usedBounds.yMm + usedBounds.heightMm;
  const unusedEdges = Object.freeze({
    leftMm: usedBounds.xMm,
    topMm: usedBounds.yMm,
    rightMm: roundMm(normalizedPrintableArea.widthMm - maxRight),
    bottomMm: roundMm(normalizedPrintableArea.heightMm - maxBottom),
  });
  const printableAreaMm2 = normalizedPrintableArea.widthMm * normalizedPrintableArea.heightMm;
  const occupiedAreaMm2 = normalizedSlots.reduce((sum, slot) => sum + slot.widthMm * slot.heightMm, 0);
  const usedBoundingAreaMm2 = usedBounds.widthMm * usedBounds.heightMm;
  const capacity = rows * columns;
  const normalizedCoverage = Object.freeze({
    scope: coverage.scope ?? "uniformGrid",
    status: coverage.status ?? "completeWithinPatternFamily",
    printableAreaMm2: roundMm(printableAreaMm2),
    occupiedAreaMm2: roundMm(occupiedAreaMm2),
    usedBoundingAreaMm2: roundMm(usedBoundingAreaMm2),
    occupiedAreaPercent: printableAreaMm2 > 0 ? roundPercent((occupiedAreaMm2 / printableAreaMm2) * 100) : 0,
    boundingAreaPercent: printableAreaMm2 > 0 ? roundPercent((usedBoundingAreaMm2 / printableAreaMm2) * 100) : 0,
  });
  const structuralSignature = createStructuralSignature({
    family,
    printableArea: normalizedPrintableArea,
    occupiedProduct: normalizedOccupiedProduct,
    gapMm: normalizedGapMm,
    rotation,
    rows,
    columns,
    slots: normalizedSlots,
  });
  const pattern = Object.freeze({
    id,
    family,
    printableArea: normalizedPrintableArea,
    occupiedProduct: normalizedOccupiedProduct,
    gapMm: normalizedGapMm,
    rotation,
    rows,
    columns,
    capacity,
    slots: normalizedSlots,
    usedBounds,
    unusedEdges,
    coverage: normalizedCoverage,
    structuralSignature,
  });
  validateGeometryPattern(pattern);
  return pattern;
}
