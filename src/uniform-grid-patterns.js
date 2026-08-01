import { createGeometryPattern } from "./geometric-pattern.js";

const EPSILON = 1e-9;
const MM_PRECISION = 1000;

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

function calculateGridCount(available, cell, gap) {
  if (available + EPSILON < cell) return 0;
  return Math.max(0, Math.floor((available + gap + EPSILON) / (cell + gap)));
}

function comparePatterns(a, b) {
  if (a.capacity !== b.capacity) return b.capacity - a.capacity;
  const aUnusedBoundingArea = a.coverage.printableAreaMm2 - a.coverage.usedBoundingAreaMm2;
  const bUnusedBoundingArea = b.coverage.printableAreaMm2 - b.coverage.usedBoundingAreaMm2;
  if (aUnusedBoundingArea !== bUnusedBoundingArea) return aUnusedBoundingArea - bUnusedBoundingArea;
  const aEdgeWaste = a.unusedEdges.rightMm + a.unusedEdges.bottomMm;
  const bEdgeWaste = b.unusedEdges.rightMm + b.unusedEdges.bottomMm;
  if (aEdgeWaste !== bEdgeWaste) return aEdgeWaste - bEdgeWaste;
  return a.rotation - b.rotation;
}

export function createUniformGridPattern({
  printableArea,
  occupiedProduct,
  gapMm = 0,
  rotation,
  idPrefix = "uniform-grid",
}) {
  const printable = normalizeSize(printableArea, "printableArea");
  const product = normalizeSize(occupiedProduct, "occupiedProduct");
  const normalizedGapMm = roundMm(asFiniteNumber(gapMm, "gapMm"));
  assertNonNegative(normalizedGapMm, "gapMm");
  if (![0, 90].includes(rotation)) throw new RangeError("rotation must be 0 or 90");

  const slotWidthMm = rotation === 0 ? product.widthMm : product.heightMm;
  const slotHeightMm = rotation === 0 ? product.heightMm : product.widthMm;
  const columns = calculateGridCount(printable.widthMm, slotWidthMm, normalizedGapMm);
  const rows = calculateGridCount(printable.heightMm, slotHeightMm, normalizedGapMm);
  const slots = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      slots.push({
        id: `${idPrefix}-r${rotation}-row${row + 1}-col${column + 1}`,
        xMm: roundMm(column * (slotWidthMm + normalizedGapMm)),
        yMm: roundMm(row * (slotHeightMm + normalizedGapMm)),
        widthMm: slotWidthMm,
        heightMm: slotHeightMm,
        rotation,
        row,
        column,
      });
    }
  }

  return createGeometryPattern({
    id: `${idPrefix}-r${rotation}-${columns}x${rows}`,
    family: "uniformGrid",
    printableArea: printable,
    occupiedProduct: product,
    gapMm: normalizedGapMm,
    rotation,
    rows,
    columns,
    slots,
    coverage: {
      scope: `uniformGrid:${rotation}`,
      status: "completeWithinPatternFamily",
    },
  });
}

export function createUniformGridPatternSet({
  printableArea,
  occupiedProduct,
  gapMm = 0,
  rotations = [0, 90],
  idPrefix = "uniform-grid",
}) {
  if (!Array.isArray(rotations) || rotations.length === 0) {
    throw new RangeError("rotations must contain at least one rotation");
  }
  const uniqueRotations = [...new Set(rotations.map(Number))];
  for (const rotation of uniqueRotations) {
    if (![0, 90].includes(rotation)) throw new RangeError("rotations may contain only 0 and 90");
  }
  const patterns = Object.freeze(uniqueRotations.map((rotation) => createUniformGridPattern({
    printableArea,
    occupiedProduct,
    gapMm,
    rotation,
    idPrefix,
  })));
  const bestCandidate = [...patterns].sort(comparePatterns)[0];
  const best = bestCandidate.capacity > 0 ? bestCandidate : null;
  return Object.freeze({
    family: "uniformGrid",
    patterns,
    best,
    fits: best !== null,
    coverage: Object.freeze({
      scope: `uniformGrid:${uniqueRotations.join(",")}`,
      status: "completeWithinPatternFamily",
      evaluatedRotations: Object.freeze([...uniqueRotations]),
      mixedOrientationsEvaluated: false,
    }),
  });
}
