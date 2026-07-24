const EPSILON = 1e-9;

function asFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return number;
}

function assertRange(value, label, min, max) {
  if (value < min || value > max) {
    throw new RangeError(`${label} must be between ${min} and ${max}`);
  }
}

function roundMm(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function roundPercent(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function normalizeSides(input, label, min = 0, max = Number.POSITIVE_INFINITY) {
  const sides = {
    left: asFiniteNumber(input.left, `${label}.left`),
    right: asFiniteNumber(input.right, `${label}.right`),
    top: asFiniteNumber(input.top, `${label}.top`),
    bottom: asFiniteNumber(input.bottom, `${label}.bottom`),
  };

  for (const [side, value] of Object.entries(sides)) {
    assertRange(value, `${label}.${side}`, min, max);
  }

  return sides;
}

export function calculateTrimmedSheet({ width, height, sizeStage, trim, limits = {} }) {
  const sourceWidth = asFiniteNumber(width, "sheet.width");
  const sourceHeight = asFiniteNumber(height, "sheet.height");
  const minDimension = limits.minDimensionMm ?? 1;
  const maxDimension = limits.maxDimensionMm ?? Number.POSITIVE_INFINITY;

  assertRange(sourceWidth, "sheet.width", minDimension, maxDimension);
  assertRange(sourceHeight, "sheet.height", minDimension, maxDimension);

  if (!["beforeTrim", "afterTrim"].includes(sizeStage)) {
    throw new RangeError("sizeStage must be beforeTrim or afterTrim");
  }

  const trimSides = normalizeSides(
    trim.sides,
    "trim",
    limits.minTrimMm ?? 0,
    limits.maxTrimMm ?? Number.POSITIVE_INFINITY,
  );

  const shouldApplyTrim = Boolean(trim.enabled) && sizeStage === "beforeTrim";
  const widthReduction = shouldApplyTrim ? trimSides.left + trimSides.right : 0;
  const heightReduction = shouldApplyTrim ? trimSides.top + trimSides.bottom : 0;
  const trimmedWidth = roundMm(sourceWidth - widthReduction);
  const trimmedHeight = roundMm(sourceHeight - heightReduction);

  if (trimmedWidth <= EPSILON || trimmedHeight <= EPSILON) {
    throw new RangeError("Sheet trim leaves no positive sheet area");
  }

  return {
    source: { width: roundMm(sourceWidth), height: roundMm(sourceHeight) },
    trimApplied: shouldApplyTrim,
    trimSides,
    result: { width: trimmedWidth, height: trimmedHeight },
  };
}

export function calculatePrintableArea({ sheet, margins, limits = {} }) {
  const width = asFiniteNumber(sheet.width, "trimmedSheet.width");
  const height = asFiniteNumber(sheet.height, "trimmedSheet.height");
  const marginSides = normalizeSides(
    margins,
    "pressMargins",
    limits.minPressMarginMm ?? 0,
    limits.maxPressMarginMm ?? Number.POSITIVE_INFINITY,
  );

  const printableWidth = roundMm(width - marginSides.left - marginSides.right);
  const printableHeight = roundMm(height - marginSides.top - marginSides.bottom);

  if (printableWidth <= EPSILON || printableHeight <= EPSILON) {
    throw new RangeError("Press margins leave no positive printable area");
  }

  return {
    margins: marginSides,
    result: { width: printableWidth, height: printableHeight },
  };
}

export function calculateSheetGeometry(input) {
  const trimmed = calculateTrimmedSheet(input);
  const printable = calculatePrintableArea({
    sheet: trimmed.result,
    margins: input.pressMargins,
    limits: input.limits,
  });

  return {
    source: trimmed.source,
    trimApplied: trimmed.trimApplied,
    trimSides: trimmed.trimSides,
    trimmed: trimmed.result,
    pressMargins: printable.margins,
    printable: printable.result,
  };
}

export function calculateProductFootprint({
  width,
  height,
  bleed = 0,
  spacingMode = "commonCut",
  gap = 0,
  limits = {},
}) {
  const finishedWidth = asFiniteNumber(width, "product.width");
  const finishedHeight = asFiniteNumber(height, "product.height");
  const bleedMm = asFiniteNumber(bleed, "product.bleed");
  const gapMm = asFiniteNumber(gap, "product.gap");

  assertRange(finishedWidth, "product.width", limits.minProductDimensionMm ?? 1, limits.maxProductDimensionMm ?? Number.POSITIVE_INFINITY);
  assertRange(finishedHeight, "product.height", limits.minProductDimensionMm ?? 1, limits.maxProductDimensionMm ?? Number.POSITIVE_INFINITY);
  assertRange(bleedMm, "product.bleed", limits.minBleedMm ?? 0, limits.maxBleedMm ?? Number.POSITIVE_INFINITY);
  assertRange(gapMm, "product.gap", limits.minGapMm ?? 0, limits.maxGapMm ?? Number.POSITIVE_INFINITY);

  if (!["commonCut", "separated"].includes(spacingMode)) {
    throw new RangeError("spacingMode must be commonCut or separated");
  }
  if (spacingMode === "commonCut" && bleedMm > EPSILON) {
    throw new RangeError("Common cut requires 0 mm bleed");
  }

  return {
    finished: { width: roundMm(finishedWidth), height: roundMm(finishedHeight) },
    bleed: roundMm(bleedMm),
    spacingMode,
    gap: spacingMode === "commonCut" ? 0 : roundMm(gapMm),
    occupied: {
      width: roundMm(finishedWidth + bleedMm * 2),
      height: roundMm(finishedHeight + bleedMm * 2),
    },
  };
}

function calculateGridCount(available, cell, gap) {
  if (available + EPSILON < cell) return 0;
  return Math.max(0, Math.floor((available + gap + EPSILON) / (cell + gap)));
}

export function calculateUniformGrid({ printable, footprint, rotation }) {
  if (![0, 90].includes(rotation)) {
    throw new RangeError("rotation must be 0 or 90");
  }

  const printableWidth = asFiniteNumber(printable.width, "printable.width");
  const printableHeight = asFiniteNumber(printable.height, "printable.height");
  const cellWidth = rotation === 0 ? footprint.occupied.width : footprint.occupied.height;
  const cellHeight = rotation === 0 ? footprint.occupied.height : footprint.occupied.width;
  const gap = footprint.gap;
  const columns = calculateGridCount(printableWidth, cellWidth, gap);
  const rows = calculateGridCount(printableHeight, cellHeight, gap);
  const positions = columns * rows;
  const usedWidth = columns === 0 ? 0 : roundMm(columns * cellWidth + (columns - 1) * gap);
  const usedHeight = rows === 0 ? 0 : roundMm(rows * cellHeight + (rows - 1) * gap);
  const unusedWidth = roundMm(printableWidth - usedWidth);
  const unusedHeight = roundMm(printableHeight - usedHeight);
  const printableArea = printableWidth * printableHeight;
  const usedBoundingArea = usedWidth * usedHeight;

  return {
    rotation,
    direction: rotation === 0 ? "up" : "right",
    columns,
    rows,
    positions,
    cell: { width: roundMm(cellWidth), height: roundMm(cellHeight) },
    used: { width: usedWidth, height: usedHeight },
    unused: { width: unusedWidth, height: unusedHeight },
    unusedBoundingArea: roundMm(printableArea - usedBoundingArea),
    coveragePercent: printableArea > 0 ? roundPercent((usedBoundingArea / printableArea) * 100) : 0,
  };
}

function compareGridCandidates(a, b) {
  if (a.positions !== b.positions) return b.positions - a.positions;
  if (a.unusedBoundingArea !== b.unusedBoundingArea) return a.unusedBoundingArea - b.unusedBoundingArea;
  const aEdgeWaste = a.unused.width + a.unused.height;
  const bEdgeWaste = b.unused.width + b.unused.height;
  if (aEdgeWaste !== bEdgeWaste) return aEdgeWaste - bEdgeWaste;
  return a.rotation - b.rotation;
}

export function calculatePlacementOptions({ printable, product, limits = {} }) {
  const footprint = calculateProductFootprint({ ...product, limits });
  const candidates = [0, 90].map((rotation) => calculateUniformGrid({ printable, footprint, rotation }));
  const best = [...candidates].sort(compareGridCandidates)[0];

  return {
    printable: {
      width: roundMm(asFiniteNumber(printable.width, "printable.width")),
      height: roundMm(asFiniteNumber(printable.height, "printable.height")),
    },
    footprint,
    candidates,
    best,
    fits: best.positions > 0,
    mixedOrientationsEvaluated: false,
  };
}
