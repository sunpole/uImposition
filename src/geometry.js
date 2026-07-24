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

export function calculateTrimmedSheet({
  width,
  height,
  sizeStage,
  trim,
  limits = {},
}) {
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

export function calculatePrintableArea({
  sheet,
  margins,
  limits = {},
}) {
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
