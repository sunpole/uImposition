import { createGeometryPattern } from "./geometric-pattern.js";

const EPSILON = 1e-9;
const MM_PRECISION = 1000;
const DEFAULT_MAX_STRIP_COUNT = 10;
const DEFAULT_MAX_PATTERN_COUNT = 2000;
const HARD_MAX_STRIP_COUNT = 16;
const HARD_MAX_PATTERN_COUNT = 20000;

function asFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number`);
  return number;
}

function asPositiveInteger(value, label, hardMaximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  if (number > hardMaximum) {
    throw new RangeError(`${label} must be ${hardMaximum} or less`);
  }
  return number;
}

function assertPositive(value, label) {
  if (value <= 0) throw new RangeError(`${label} must be greater than 0`);
}

function assertNonNegative(value, label) {
  if (value < 0) throw new RangeError(`${label} must be 0 or greater`);
}

function roundMm(value) {
  return Math.round((value + Number.EPSILON) * MM_PRECISION) / MM_PRECISION;
}

function normalizeSize(input, label) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(`${label} must be an object`);
  }
  const widthMm = roundMm(asFiniteNumber(input.widthMm, `${label}.widthMm`));
  const heightMm = roundMm(asFiniteNumber(input.heightMm, `${label}.heightMm`));
  assertPositive(widthMm, `${label}.widthMm`);
  assertPositive(heightMm, `${label}.heightMm`);
  return Object.freeze({ widthMm, heightMm });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function countAlong(availableMm, occupiedMm, gapMm) {
  if (availableMm + EPSILON < occupiedMm) return 0;
  return Math.max(0, Math.floor((availableMm + gapMm + EPSILON) / (occupiedMm + gapMm)));
}

function dimensionsForRotation(product, rotation) {
  return rotation === 0
    ? { widthMm: product.widthMm, heightMm: product.heightMm }
    : { widthMm: product.heightMm, heightMm: product.widthMm };
}

function axisGeometry({ axis, printable, product, gapMm }) {
  const zero = dimensionsForRotation(product, 0);
  const ninety = dimensionsForRotation(product, 90);
  if (axis === "horizontal") {
    return {
      axisLengthMm: printable.heightMm,
      crossLengthMm: printable.widthMm,
      thicknessByRotation: { 0: zero.heightMm, 90: ninety.heightMm },
      crossSizeByRotation: { 0: zero.widthMm, 90: ninety.widthMm },
      crossCapacityByRotation: {
        0: countAlong(printable.widthMm, zero.widthMm, gapMm),
        90: countAlong(printable.widthMm, ninety.widthMm, gapMm),
      },
    };
  }
  return {
    axisLengthMm: printable.widthMm,
    crossLengthMm: printable.heightMm,
    thicknessByRotation: { 0: zero.widthMm, 90: ninety.widthMm },
    crossSizeByRotation: { 0: zero.heightMm, 90: ninety.heightMm },
    crossCapacityByRotation: {
      0: countAlong(printable.heightMm, zero.heightMm, gapMm),
      90: countAlong(printable.heightMm, ninety.heightMm, gapMm),
    },
  };
}

function calculatePhysicalMaximumMixedStripCount({ axisLengthMm, thicknessByRotation, gapMm }) {
  const minimumTwoStripLength = thicknessByRotation[0] + gapMm + thicknessByRotation[90];
  if (minimumTwoStripLength > axisLengthMm + EPSILON) return 0;
  const minimumAdditionalLength = Math.min(thicknessByRotation[0], thicknessByRotation[90]) + gapMm;
  const remaining = axisLengthMm - minimumTwoStripLength;
  return 2 + Math.max(0, Math.floor((remaining + EPSILON) / minimumAdditionalLength));
}

function enumerateRotationSequences({
  axis,
  printable,
  product,
  gapMm,
  maxStripCount,
}) {
  const geometry = axisGeometry({ axis, printable, product, gapMm });
  const bothRotationsFitAcross = geometry.crossCapacityByRotation[0] > 0
    && geometry.crossCapacityByRotation[90] > 0;
  const physicalMaximumMixedStripCount = bothRotationsFitAcross
    ? calculatePhysicalMaximumMixedStripCount({
      axisLengthMm: geometry.axisLengthMm,
      thicknessByRotation: geometry.thicknessByRotation,
      gapMm,
    })
    : 0;
  const requestedMaximumStripCount = Math.min(maxStripCount, physicalMaximumMixedStripCount);
  const sequences = [];

  if (physicalMaximumMixedStripCount >= 2) {
    const current = [];
    function walk(usedAxisMm, hasZero, hasNinety) {
      if (current.length >= 2 && hasZero && hasNinety) {
        sequences.push(Object.freeze([...current]));
      }
      if (current.length >= requestedMaximumStripCount) return;
      for (const rotation of [0, 90]) {
        const addedGap = current.length === 0 ? 0 : gapMm;
        const nextUsedAxisMm = usedAxisMm + addedGap + geometry.thicknessByRotation[rotation];
        if (nextUsedAxisMm > geometry.axisLengthMm + EPSILON) continue;
        current.push(rotation);
        walk(
          nextUsedAxisMm,
          hasZero || rotation === 0,
          hasNinety || rotation === 90,
        );
        current.pop();
      }
    }
    walk(0, false, false);
  }

  return deepFreeze({
    axis,
    geometry,
    sequences,
    physicalMaximumMixedStripCount,
    requestedMaximumStripCount,
    truncatedByStripCount: physicalMaximumMixedStripCount > maxStripCount,
  });
}

function compareGlobalSlotOrder(a, b) {
  if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
  if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
  if (a.rotation !== b.rotation) return a.rotation - b.rotation;
  return a.id.localeCompare(b.id);
}

function createPatternFromSequence({
  axis,
  sequence,
  printable,
  product,
  gapMm,
  ordinal,
}) {
  const strips = [];
  const slots = [];
  let stripOffsetMm = 0;

  for (let stripIndex = 0; stripIndex < sequence.length; stripIndex += 1) {
    const rotation = sequence[stripIndex];
    const dimensions = dimensionsForRotation(product, rotation);
    const stripId = `${axis}-strip-${stripIndex + 1}`;
    const slotIds = [];
    const positions = axis === "horizontal"
      ? countAlong(printable.widthMm, dimensions.widthMm, gapMm)
      : countAlong(printable.heightMm, dimensions.heightMm, gapMm);

    for (let position = 0; position < positions; position += 1) {
      const slotId = `${axis}-s${stripIndex + 1}-p${position + 1}`;
      slotIds.push(slotId);
      if (axis === "horizontal") {
        slots.push({
          id: slotId,
          xMm: roundMm(position * (dimensions.widthMm + gapMm)),
          yMm: roundMm(stripOffsetMm),
          widthMm: dimensions.widthMm,
          heightMm: dimensions.heightMm,
          rotation,
          row: stripIndex,
          column: position,
          stripId,
          positionInStrip: position,
        });
      } else {
        slots.push({
          id: slotId,
          xMm: roundMm(stripOffsetMm),
          yMm: roundMm(position * (dimensions.heightMm + gapMm)),
          widthMm: dimensions.widthMm,
          heightMm: dimensions.heightMm,
          rotation,
          row: position,
          column: stripIndex,
          stripId,
          positionInStrip: position,
        });
      }
    }

    if (axis === "horizontal") {
      strips.push({
        id: stripId,
        rotation,
        xMm: 0,
        yMm: roundMm(stripOffsetMm),
        widthMm: printable.widthMm,
        heightMm: dimensions.heightMm,
        slotIds,
      });
      stripOffsetMm += dimensions.heightMm + gapMm;
    } else {
      strips.push({
        id: stripId,
        rotation,
        xMm: roundMm(stripOffsetMm),
        yMm: 0,
        widthMm: dimensions.widthMm,
        heightMm: printable.heightMm,
        slotIds,
      });
      stripOffsetMm += dimensions.widthMm + gapMm;
    }
  }

  slots.sort(compareGlobalSlotOrder);
  const sequenceKey = sequence.map((rotation) => rotation === 0 ? "0" : "9").join("");
  return createGeometryPattern({
    id: `mixed-strips-${axis}-${sequenceKey}-${ordinal}`,
    family: "mixedStrips",
    printableArea: printable,
    occupiedProduct: product,
    gapMm,
    layout: {
      type: "mixedStrips",
      axis,
      strips,
    },
    slots,
    coverage: {
      scope: `mixedStrips:${axis}:orderedBinarySequences`,
      status: "feasible",
    },
  });
}

function comparePatterns(a, b) {
  if (a.capacity !== b.capacity) return b.capacity - a.capacity;
  if (a.layout.strips.length !== b.layout.strips.length) {
    return a.layout.strips.length - b.layout.strips.length;
  }
  const aUnused = a.coverage.printableAreaMm2 - a.coverage.occupiedAreaMm2;
  const bUnused = b.coverage.printableAreaMm2 - b.coverage.occupiedAreaMm2;
  if (aUnused !== bUnused) return aUnused - bUnused;
  if (a.layout.axis !== b.layout.axis) return a.layout.axis.localeCompare(b.layout.axis);
  return a.structuralSignature.localeCompare(b.structuralSignature);
}

export function createMixedStripPatternSet({
  printableArea,
  occupiedProduct,
  gapMm = 0,
  axes = ["horizontal", "vertical"],
  maxStripCount = DEFAULT_MAX_STRIP_COUNT,
  maxPatternCount = DEFAULT_MAX_PATTERN_COUNT,
}) {
  const printable = normalizeSize(printableArea, "printableArea");
  const product = normalizeSize(occupiedProduct, "occupiedProduct");
  const normalizedGapMm = roundMm(asFiniteNumber(gapMm, "gapMm"));
  assertNonNegative(normalizedGapMm, "gapMm");
  const normalizedMaxStripCount = asPositiveInteger(
    maxStripCount,
    "maxStripCount",
    HARD_MAX_STRIP_COUNT,
  );
  const normalizedMaxPatternCount = asPositiveInteger(
    maxPatternCount,
    "maxPatternCount",
    HARD_MAX_PATTERN_COUNT,
  );
  if (!Array.isArray(axes) || axes.length === 0) {
    throw new RangeError("axes must contain at least one axis");
  }
  const normalizedAxes = [...new Set(axes.map((axis) => String(axis)))];
  for (const axis of normalizedAxes) {
    if (!["horizontal", "vertical"].includes(axis)) {
      throw new RangeError("axes may contain only horizontal and vertical");
    }
  }

  const axisCatalogs = normalizedAxes.map((axis) => enumerateRotationSequences({
    axis,
    printable,
    product,
    gapMm: normalizedGapMm,
    maxStripCount: normalizedMaxStripCount,
  }));
  const totalFeasibleSequenceCount = axisCatalogs.reduce(
    (sum, catalog) => sum + catalog.sequences.length,
    0,
  );
  const patterns = [];
  const signatures = new Set();
  let duplicatePatternCount = 0;
  let processedSequenceCount = 0;
  let ordinal = 0;
  const cursors = new Map(axisCatalogs.map((catalog) => [catalog.axis, 0]));

  while (processedSequenceCount < totalFeasibleSequenceCount
    && patterns.length < normalizedMaxPatternCount) {
    let progressed = false;
    for (const catalog of axisCatalogs) {
      const cursor = cursors.get(catalog.axis);
      if (cursor >= catalog.sequences.length) continue;
      const sequence = catalog.sequences[cursor];
      cursors.set(catalog.axis, cursor + 1);
      processedSequenceCount += 1;
      ordinal += 1;
      progressed = true;
      const pattern = createPatternFromSequence({
        axis: catalog.axis,
        sequence,
        printable,
        product,
        gapMm: normalizedGapMm,
        ordinal,
      });
      if (signatures.has(pattern.structuralSignature)) {
        duplicatePatternCount += 1;
      } else {
        signatures.add(pattern.structuralSignature);
        patterns.push(pattern);
      }
      if (patterns.length >= normalizedMaxPatternCount) break;
    }
    if (!progressed) break;
  }

  const truncatedByPatternCount = processedSequenceCount < totalFeasibleSequenceCount;
  const stripCountTruncatedAxes = axisCatalogs
    .filter((catalog) => catalog.truncatedByStripCount)
    .map((catalog) => catalog.axis);
  const truncationReasons = [];
  if (stripCountTruncatedAxes.length > 0) truncationReasons.push("stripCountLimit");
  if (truncatedByPatternCount) truncationReasons.push("patternCountLimit");
  const sortedPatterns = Object.freeze([...patterns].sort(comparePatterns));
  const best = sortedPatterns[0] ?? null;

  return deepFreeze({
    family: "mixedStrips",
    patterns: sortedPatterns,
    best,
    fits: best !== null,
    coverage: {
      scope: "mixedStrips:orderedBinarySequences",
      status: truncationReasons.length === 0 ? "completeWithinRequestedSpace" : "truncated",
      axes: normalizedAxes,
      maxStripCount: normalizedMaxStripCount,
      maxPatternCount: normalizedMaxPatternCount,
      axisCatalogs: axisCatalogs.map((catalog) => ({
        axis: catalog.axis,
        physicalMaximumMixedStripCount: catalog.physicalMaximumMixedStripCount,
        requestedMaximumStripCount: catalog.requestedMaximumStripCount,
        feasibleSequenceCount: catalog.sequences.length,
        truncatedByStripCount: catalog.truncatedByStripCount,
        crossCapacityByRotation: catalog.geometry.crossCapacityByRotation,
      })),
      totalFeasibleSequenceCount,
      processedSequenceCount,
      generatedPatternCount: sortedPatterns.length,
      duplicatePatternCount,
      omittedSequenceCount: totalFeasibleSequenceCount - processedSequenceCount,
      truncationReasons,
      stripCountTruncatedAxes,
      generalRectanglePackingEvaluated: false,
    },
  });
}
