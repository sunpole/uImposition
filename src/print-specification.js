export const PRINT_SPECIFICATION_KIND = "printSpecification";

function requireNonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

export function createDuplexPrintSpecification({ frontColors, backColors }) {
  const normalizedFrontColors = requireNonNegativeInteger(frontColors, "frontColors");
  const normalizedBackColors = requireNonNegativeInteger(backColors, "backColors");
  if (normalizedFrontColors === 0 && normalizedBackColors === 0) {
    throw new RangeError("At least one printed side must contain a color separation");
  }

  const printedSideCount = Number(normalizedFrontColors > 0) + Number(normalizedBackColors > 0);
  return Object.freeze({
    kind: PRINT_SPECIFICATION_KIND,
    frontColors: normalizedFrontColors,
    backColors: normalizedBackColors,
    label: `${normalizedFrontColors}+${normalizedBackColors}`,
    printedSideCount,
    layoutFormCountPerImposition: printedSideCount,
    colorPlateCountPerImposition: normalizedFrontColors + normalizedBackColors,
    duplex: normalizedFrontColors > 0 && normalizedBackColors > 0,
  });
}

export function calculatePrintPlateMetrics({ impositionCount, specification }) {
  const normalizedImpositionCount = requirePositiveInteger(impositionCount, "impositionCount");
  if (!specification || specification.kind !== PRINT_SPECIFICATION_KIND) {
    throw new TypeError("A print specification is required");
  }

  return Object.freeze({
    impositionCount: normalizedImpositionCount,
    colorMode: specification.label,
    printedSideCount: specification.printedSideCount,
    layoutForms: normalizedImpositionCount * specification.layoutFormCountPerImposition,
    frontColorPlates: normalizedImpositionCount * specification.frontColors,
    backColorPlates: normalizedImpositionCount * specification.backColors,
    colorPlates: normalizedImpositionCount * specification.colorPlateCountPerImposition,
  });
}
