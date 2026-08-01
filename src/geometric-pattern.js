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

function freezeRecursively(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freezeRecursively(nested);
  return Object.freeze(value);
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

function normalizeOptionalString(value, label) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string when provided`);
  }
  return value.trim();
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
  stripId = null,
  positionInStrip = null,
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
  const normalizedStripId = normalizeOptionalString(stripId, "slot.stripId");
  let normalizedPositionInStrip = null;
  if (positionInStrip !== undefined && positionInStrip !== null) {
    normalizedPositionInStrip = Number(positionInStrip);
    assertNonNegativeInteger(normalizedPositionInStrip, "slot.positionInStrip");
  }
  if ((normalizedStripId === null) !== (normalizedPositionInStrip === null)) {
    throw new RangeError("slot.stripId and slot.positionInStrip must be provided together");
  }
  const rectangle = normalizeRectangle({ xMm, yMm, widthMm, heightMm }, "slot");
  const slot = {
    id: id.trim(),
    ...rectangle,
    rotation: normalizedRotation,
    row: normalizedRow,
    column: normalizedColumn,
  };
  if (normalizedStripId !== null) {
    slot.stripId = normalizedStripId;
    slot.positionInStrip = normalizedPositionInStrip;
  }
  return Object.freeze(slot);
}

export function geometrySlotsOverlap(a, b, epsilon = EPSILON) {
  return a.xMm < b.xMm + b.widthMm - epsilon
    && a.xMm + a.widthMm > b.xMm + epsilon
    && a.yMm < b.yMm + b.heightMm - epsilon
    && a.yMm + a.heightMm > b.yMm + epsilon;
}

function rectangleContains(outer, inner) {
  return inner.xMm + EPSILON >= outer.xMm
    && inner.yMm + EPSILON >= outer.yMm
    && inner.xMm + inner.widthMm <= outer.xMm + outer.widthMm + EPSILON
    && inner.yMm + inner.heightMm <= outer.yMm + outer.heightMm + EPSILON;
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

function normalizeStrip(strip, index, printableArea, axis) {
  if (!strip || typeof strip !== "object" || Array.isArray(strip)) {
    throw new TypeError(`layout.strips[${index}] must be an object`);
  }
  if (typeof strip.id !== "string" || strip.id.trim() === "") {
    throw new TypeError(`layout.strips[${index}].id must be a non-empty string`);
  }
  const rotation = Number(strip.rotation);
  if (![0, 90].includes(rotation)) {
    throw new RangeError(`layout.strips[${index}].rotation must be 0 or 90`);
  }
  const rectangle = normalizeRectangle(strip, `layout.strips[${index}]`);
  if (!rectangleContains(printableArea, rectangle)) {
    throw new RangeError(`layout strip ${strip.id} exceeds printable area`);
  }
  if (axis === "horizontal") {
    if (Math.abs(rectangle.xMm) > EPSILON
      || Math.abs(rectangle.widthMm - printableArea.widthMm) > EPSILON) {
      throw new RangeError("horizontal strip regions must span the printable width");
    }
  } else if (Math.abs(rectangle.yMm) > EPSILON
    || Math.abs(rectangle.heightMm - printableArea.heightMm) > EPSILON) {
    throw new RangeError("vertical strip regions must span the printable height");
  }
  if (!Array.isArray(strip.slotIds)) {
    throw new TypeError(`layout.strips[${index}].slotIds must be an array`);
  }
  const slotIds = strip.slotIds.map((slotId, slotIndex) => {
    if (typeof slotId !== "string" || slotId.trim() === "") {
      throw new TypeError(`layout.strips[${index}].slotIds[${slotIndex}] must be a non-empty string`);
    }
    return slotId.trim();
  });
  if (slotIds.length === 0) {
    throw new RangeError(`layout strip ${strip.id} must contain at least one slot`);
  }
  return freezeRecursively({
    id: strip.id.trim(),
    index,
    rotation,
    ...rectangle,
    slotIds,
  });
}

function normalizeLayout({ layout, rotation, rows, columns, slots, printableArea }) {
  if (layout === undefined || layout === null) {
    if (![0, 90].includes(rotation)) {
      throw new RangeError("uniform pattern rotation must be 0 or 90");
    }
    assertNonNegativeInteger(rows, "rows");
    assertNonNegativeInteger(columns, "columns");
    return freezeRecursively({
      type: "uniformGrid",
      rotation,
      rows,
      columns,
    });
  }
  if (!layout || typeof layout !== "object" || Array.isArray(layout)) {
    throw new TypeError("layout must be an object");
  }
  if (layout.type === "uniformGrid") {
    const layoutRotation = Number(layout.rotation ?? rotation);
    const layoutRows = Number(layout.rows ?? rows);
    const layoutColumns = Number(layout.columns ?? columns);
    if (![0, 90].includes(layoutRotation)) {
      throw new RangeError("uniform layout rotation must be 0 or 90");
    }
    assertNonNegativeInteger(layoutRows, "layout.rows");
    assertNonNegativeInteger(layoutColumns, "layout.columns");
    return freezeRecursively({
      type: "uniformGrid",
      rotation: layoutRotation,
      rows: layoutRows,
      columns: layoutColumns,
    });
  }
  if (layout.type !== "mixedStrips") {
    throw new RangeError("layout.type must be uniformGrid or mixedStrips");
  }
  if (!["horizontal", "vertical"].includes(layout.axis)) {
    throw new RangeError("mixedStrips layout.axis must be horizontal or vertical");
  }
  if (!Array.isArray(layout.strips) || layout.strips.length < 2) {
    throw new RangeError("mixedStrips layout requires at least two strips");
  }
  const strips = layout.strips.map((strip, index) => normalizeStrip(
    strip,
    index,
    printableArea,
    layout.axis,
  ));
  const stripIds = new Set();
  for (const strip of strips) {
    if (stripIds.has(strip.id)) throw new RangeError(`duplicate strip id: ${strip.id}`);
    stripIds.add(strip.id);
  }
  for (let index = 1; index < strips.length; index += 1) {
    const previousCoordinate = layout.axis === "horizontal" ? strips[index - 1].yMm : strips[index - 1].xMm;
    const currentCoordinate = layout.axis === "horizontal" ? strips[index].yMm : strips[index].xMm;
    if (currentCoordinate + EPSILON < previousCoordinate) {
      throw new RangeError("mixedStrips strip regions must be ordered by their physical coordinate");
    }
  }
  const rotations = new Set(slots.map((slot) => slot.rotation));
  if (!rotations.has(0) || !rotations.has(90)) {
    throw new RangeError("mixedStrips pattern must contain both 0 and 90 degree slots");
  }
  return freezeRecursively({
    type: "mixedStrips",
    axis: layout.axis,
    strips,
  });
}

function createLayoutSignature(layout) {
  if (layout.type === "uniformGrid") {
    return `uniformGrid:${layout.rotation}:${layout.columns}x${layout.rows}`;
  }
  const strips = layout.strips.map((strip) => [
    strip.index,
    strip.rotation,
    formatNumber(strip.xMm),
    formatNumber(strip.yMm),
    formatNumber(strip.widthMm),
    formatNumber(strip.heightMm),
    strip.slotIds.length,
  ].join(":"));
  return `mixedStrips:${layout.axis}:${strips.join(";")}`;
}

function createStructuralSignature({
  family,
  printableArea,
  occupiedProduct,
  gapMm,
  layout,
  slots,
}) {
  const stripIndexById = layout.type === "mixedStrips"
    ? new Map(layout.strips.map((strip) => [strip.id, strip.index]))
    : new Map();
  const slotSignature = slots.map((slot) => [
    slot.row,
    slot.column,
    formatNumber(slot.xMm),
    formatNumber(slot.yMm),
    formatNumber(slot.widthMm),
    formatNumber(slot.heightMm),
    slot.rotation,
    slot.stripId ? stripIndexById.get(slot.stripId) : "-",
    slot.positionInStrip ?? "-",
  ].join(":"));
  return [
    "geometry-pattern-v2",
    `family=${family}`,
    `printable=${formatNumber(printableArea.widthMm)}x${formatNumber(printableArea.heightMm)}`,
    `product=${formatNumber(occupiedProduct.widthMm)}x${formatNumber(occupiedProduct.heightMm)}`,
    `gap=${formatNumber(gapMm)}`,
    `layout=${createLayoutSignature(layout)}`,
    `slots=${slotSignature.join(";")}`,
  ].join("|");
}

function compareSlotOrder(a, b) {
  if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
  if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
  if (a.rotation !== b.rotation) return a.rotation - b.rotation;
  return a.id.localeCompare(b.id);
}

function compareSlotsInsideStrip(axis, a, b) {
  const primaryA = axis === "horizontal" ? a.xMm : a.yMm;
  const primaryB = axis === "horizontal" ? b.xMm : b.yMm;
  if (Math.abs(primaryA - primaryB) > EPSILON) return primaryA - primaryB;
  const secondaryA = axis === "horizontal" ? a.yMm : a.xMm;
  const secondaryB = axis === "horizontal" ? b.yMm : b.xMm;
  if (Math.abs(secondaryA - secondaryB) > EPSILON) return secondaryA - secondaryB;
  return a.id.localeCompare(b.id);
}

function validateUniformLayout(pattern) {
  if (![0, 90].includes(pattern.rotation)) {
    throw new RangeError("uniform pattern rotation must be 0 or 90");
  }
  assertNonNegativeInteger(pattern.rows, "pattern.rows");
  assertNonNegativeInteger(pattern.columns, "pattern.columns");
  if (pattern.layout.rotation !== pattern.rotation
    || pattern.layout.rows !== pattern.rows
    || pattern.layout.columns !== pattern.columns) {
    throw new RangeError("uniform pattern layout metadata does not match top-level grid fields");
  }
  if (pattern.capacity !== pattern.rows * pattern.columns) {
    throw new RangeError("uniform pattern.capacity must equal rows × columns");
  }
  for (let index = 0; index < pattern.slots.length; index += 1) {
    const slot = pattern.slots[index];
    const expectedRow = Math.floor(index / pattern.columns);
    const expectedColumn = index % pattern.columns;
    if (slot.row !== expectedRow || slot.column !== expectedColumn) {
      throw new RangeError("uniform pattern slots must use deterministic row-major order");
    }
    if (slot.rotation !== pattern.rotation) {
      throw new RangeError("uniform pattern slot rotation must match pattern.rotation");
    }
    if (slot.stripId !== undefined || slot.positionInStrip !== undefined) {
      throw new RangeError("uniform pattern slots must not contain strip metadata");
    }
  }
}

function validateMixedStripLayout(pattern, printableArea) {
  if (pattern.rotation !== "mixed") {
    throw new RangeError("mixedStrips pattern.rotation must be mixed");
  }
  if (pattern.rows !== null || pattern.columns !== null) {
    throw new RangeError("mixedStrips pattern rows and columns must be null");
  }
  if (pattern.capacity !== pattern.slots.length) {
    throw new RangeError("mixedStrips pattern.capacity must equal slots length");
  }

  const sortedSlots = [...pattern.slots].sort(compareSlotOrder);
  for (let index = 0; index < pattern.slots.length; index += 1) {
    if (pattern.slots[index].id !== sortedSlots[index].id) {
      throw new RangeError("mixedStrips slots must use deterministic top-left coordinate order");
    }
  }

  for (let left = 0; left < pattern.layout.strips.length; left += 1) {
    for (let right = left + 1; right < pattern.layout.strips.length; right += 1) {
      if (geometrySlotsOverlap(pattern.layout.strips[left], pattern.layout.strips[right])) {
        throw new RangeError(`layout strips overlap: ${pattern.layout.strips[left].id} and ${pattern.layout.strips[right].id}`);
      }
    }
  }

  const slotById = new Map(pattern.slots.map((slot) => [slot.id, slot]));
  const assignedSlotIds = new Set();
  for (const strip of pattern.layout.strips) {
    for (const slotId of strip.slotIds) {
      if (assignedSlotIds.has(slotId)) {
        throw new RangeError(`slot ${slotId} is assigned to more than one strip`);
      }
      if (!slotById.has(slotId)) throw new RangeError(`strip ${strip.id} references unknown slot ${slotId}`);
      assignedSlotIds.add(slotId);
    }
  }

  for (const strip of pattern.layout.strips) {
    const stripSlots = strip.slotIds.map((slotId) => slotById.get(slotId));
    const sortedStripSlots = [...stripSlots].sort((a, b) => compareSlotsInsideStrip(pattern.layout.axis, a, b));
    for (let index = 0; index < stripSlots.length; index += 1) {
      if (stripSlots[index].id !== sortedStripSlots[index].id) {
        throw new RangeError(`strip ${strip.id} slotIds must follow strip coordinates`);
      }
      const slot = stripSlots[index];
      if (slot.stripId !== strip.id || slot.positionInStrip !== index) {
        throw new RangeError(`slot ${slot.id} strip metadata does not match layout`);
      }
      if (slot.rotation !== strip.rotation) {
        throw new RangeError(`slot ${slot.id} rotation does not match strip ${strip.id}`);
      }
      if (!rectangleContains(strip, slot)) {
        throw new RangeError(`slot ${slot.id} exceeds strip ${strip.id}`);
      }
      if (pattern.layout.axis === "horizontal") {
        if (slot.row !== strip.index || slot.column !== index) {
          throw new RangeError(`horizontal strip slot ${slot.id} has invalid row/column metadata`);
        }
      } else if (slot.column !== strip.index || slot.row !== index) {
        throw new RangeError(`vertical strip slot ${slot.id} has invalid row/column metadata`);
      }
    }
  }
  if (assignedSlotIds.size !== pattern.slots.length) {
    throw new RangeError("every mixedStrips slot must belong to exactly one strip");
  }

  for (const strip of pattern.layout.strips) {
    if (!rectangleContains(printableArea, strip)) {
      throw new RangeError(`strip ${strip.id} exceeds printable area`);
    }
  }
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
  assertNonNegativeInteger(pattern.capacity, "pattern.capacity");
  if (!pattern.layout || typeof pattern.layout !== "object") {
    throw new TypeError("pattern.layout must be an object");
  }
  if (!Array.isArray(pattern.slots) || pattern.slots.length !== pattern.capacity) {
    throw new RangeError("pattern.slots length must equal pattern.capacity");
  }

  const ids = new Set();
  for (const sourceSlot of pattern.slots) {
    const slot = createGeometrySlot(sourceSlot);
    if (ids.has(slot.id)) throw new RangeError(`duplicate slot id: ${slot.id}`);
    ids.add(slot.id);
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

  if (pattern.layout.type === "uniformGrid") {
    validateUniformLayout(pattern);
  } else if (pattern.layout.type === "mixedStrips") {
    validateMixedStripLayout(pattern, printableArea);
  } else {
    throw new RangeError("pattern.layout.type must be uniformGrid or mixedStrips");
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
  layout = null,
  slots,
  coverage = {},
}) {
  const normalizedPrintableArea = normalizeRectangle(printableArea, "printableArea");
  const normalizedOccupiedProduct = normalizeRectangle(occupiedProduct, "occupiedProduct");
  const normalizedGapMm = roundMm(asFiniteNumber(gapMm, "gapMm"));
  assertNonNegative(normalizedGapMm, "gapMm");
  if (!Array.isArray(slots)) throw new TypeError("slots must be an array");
  const normalizedSlots = Object.freeze(slots.map((slot) => createGeometrySlot(slot)));
  const normalizedLayout = normalizeLayout({
    layout,
    rotation,
    rows,
    columns,
    slots: normalizedSlots,
    printableArea: normalizedPrintableArea,
  });
  const isUniform = normalizedLayout.type === "uniformGrid";
  const normalizedRotation = isUniform ? normalizedLayout.rotation : "mixed";
  const normalizedRows = isUniform ? normalizedLayout.rows : null;
  const normalizedColumns = isUniform ? normalizedLayout.columns : null;
  const capacity = isUniform ? normalizedRows * normalizedColumns : normalizedSlots.length;
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
  const normalizedCoverage = freezeRecursively({
    scope: coverage.scope ?? (isUniform ? "uniformGrid" : "mixedStrips"),
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
    layout: normalizedLayout,
    slots: normalizedSlots,
  });
  const pattern = Object.freeze({
    id,
    family,
    printableArea: normalizedPrintableArea,
    occupiedProduct: normalizedOccupiedProduct,
    gapMm: normalizedGapMm,
    rotation: normalizedRotation,
    rows: normalizedRows,
    columns: normalizedColumns,
    capacity,
    layout: normalizedLayout,
    slots: normalizedSlots,
    usedBounds,
    unusedEdges,
    coverage: normalizedCoverage,
    structuralSignature,
  });
  validateGeometryPattern(pattern);
  return pattern;
}
