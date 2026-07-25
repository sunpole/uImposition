import {
  directionForRotation,
  flipDirectionHorizontal,
} from "./orientation.js";

export const MIXED_LAYOUT_KIND = "mixedFormatLayout";

const EPSILON = 1e-9;

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
  return number;
}

function positiveNumber(value, label) {
  const number = finiteNumber(value, label);
  if (number <= 0) throw new RangeError(`${label} must be positive`);
  return number;
}

function nonNegativeNumber(value, label) {
  const number = finiteNumber(value, label);
  if (number < 0) throw new RangeError(`${label} must be non-negative`);
  return number;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text || text === "-") throw new RangeError(`${label} is required`);
  return text;
}

function roundMm(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function rectanglesOverlap(left, right) {
  return (
    left.x < right.x + right.width - EPSILON
    && left.x + left.width > right.x + EPSILON
    && left.y < right.y + right.height - EPSILON
    && left.y + left.height > right.y + EPSILON
  );
}

function normalizePrintable(printable) {
  return Object.freeze({
    width: positiveNumber(printable?.width, "printable.width"),
    height: positiveNumber(printable?.height, "printable.height"),
  });
}

function normalizePlacement(placement, index, printable) {
  const id = requiredText(placement?.id, `placements[${index}].id`);
  const format = requiredText(placement?.format, `placements[${index}].format`);
  const file = requiredText(placement?.file, `placements[${index}].file`);
  const frontPage = positiveInteger(placement?.frontPage, `placements[${index}].frontPage`);
  if (frontPage % 2 === 0) {
    throw new RangeError(`placements[${index}].frontPage must be odd`);
  }
  const backPage = placement?.backPage === null
    ? null
    : positiveInteger(placement?.backPage, `placements[${index}].backPage`);
  if (backPage !== null && backPage !== frontPage + 1) {
    throw new RangeError(`placements[${index}].backPage must equal frontPage + 1 or null`);
  }
  const x = nonNegativeNumber(placement?.x, `placements[${index}].x`);
  const y = nonNegativeNumber(placement?.y, `placements[${index}].y`);
  const width = positiveNumber(placement?.width, `placements[${index}].width`);
  const height = positiveNumber(placement?.height, `placements[${index}].height`);
  const rotation = Number(placement?.rotation);
  const direction = directionForRotation(rotation);

  if (x + width > printable.width + EPSILON || y + height > printable.height + EPSILON) {
    throw new RangeError(`placements[${index}] exceeds the printable area`);
  }

  return Object.freeze({
    id,
    format,
    file,
    frontPage,
    backPage,
    x: roundMm(x),
    y: roundMm(y),
    width: roundMm(width),
    height: roundMm(height),
    rotation,
    direction,
  });
}

function validateNoOverlap(placements) {
  for (let leftIndex = 0; leftIndex < placements.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < placements.length; rightIndex += 1) {
      if (rectanglesOverlap(placements[leftIndex], placements[rightIndex])) {
        throw new RangeError(
          `Mixed-format placements overlap: ${placements[leftIndex].id} and ${placements[rightIndex].id}`,
        );
      }
    }
  }
}

function formatCounts(placements) {
  const counts = new Map();
  placements.forEach((placement) => {
    counts.set(placement.format, (counts.get(placement.format) ?? 0) + 1);
  });
  return Object.freeze(Object.fromEntries([...counts.entries()].sort(([left], [right]) => (
    left.localeCompare(right, "en", { numeric: true })
  ))));
}

export function createMixedFormatFront({ id, printable, placements }) {
  const layoutId = requiredText(id, "id");
  const normalizedPrintable = normalizePrintable(printable);
  if (!Array.isArray(placements) || placements.length === 0) {
    throw new TypeError("placements must be a non-empty array");
  }

  const normalizedPlacements = placements.map((placement, index) => (
    normalizePlacement(placement, index, normalizedPrintable)
  ));
  const ids = new Set();
  normalizedPlacements.forEach((placement) => {
    if (ids.has(placement.id)) throw new RangeError(`Duplicate placement id: ${placement.id}`);
    ids.add(placement.id);
  });
  validateNoOverlap(normalizedPlacements);

  const usedArea = normalizedPlacements.reduce(
    (sum, placement) => sum + placement.width * placement.height,
    0,
  );
  const printableArea = normalizedPrintable.width * normalizedPrintable.height;

  return Object.freeze({
    kind: MIXED_LAYOUT_KIND,
    id: layoutId,
    side: "front",
    printable: normalizedPrintable,
    placementCount: normalizedPlacements.length,
    formatCounts: formatCounts(normalizedPlacements),
    usedArea: roundMm(usedArea),
    printableArea: roundMm(printableArea),
    unusedArea: roundMm(printableArea - usedArea),
    placements: Object.freeze(normalizedPlacements),
  });
}

export function createMixedFormatBack(front) {
  if (!front || front.kind !== MIXED_LAYOUT_KIND || front.side !== "front") {
    throw new TypeError("A mixed-format front layout is required");
  }
  const placements = front.placements.map((placement) => Object.freeze({
    ...placement,
    x: roundMm(front.printable.width - placement.x - placement.width),
    page: placement.backPage,
    direction: flipDirectionHorizontal(placement.direction),
  }));
  validateNoOverlap(placements);

  return Object.freeze({
    kind: MIXED_LAYOUT_KIND,
    id: front.id,
    side: "back",
    printable: front.printable,
    placementCount: placements.length,
    formatCounts: front.formatCounts,
    usedArea: front.usedArea,
    printableArea: front.printableArea,
    unusedArea: front.unusedArea,
    placements: Object.freeze(placements),
    derivedFromFront: true,
    mirrorAxis: "horizontal",
  });
}

export function validateMixedFormatDuplex({ front, back }) {
  const errors = [];
  if (!front || front.kind !== MIXED_LAYOUT_KIND || front.side !== "front") {
    errors.push("front must be a mixed-format front layout");
  }
  if (!back || back.kind !== MIXED_LAYOUT_KIND || back.side !== "back") {
    errors.push("back must be a mixed-format back layout");
  }
  if (errors.length > 0) {
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }
  if (front.id !== back.id) errors.push("front/back ids differ");
  if (front.placementCount !== back.placementCount) errors.push("front/back placement counts differ");

  const backById = new Map(back.placements.map((placement) => [placement.id, placement]));
  front.placements.forEach((placement) => {
    const mirrored = backById.get(placement.id);
    if (!mirrored) {
      errors.push(`missing back placement ${placement.id}`);
      return;
    }
    const expectedX = roundMm(front.printable.width - placement.x - placement.width);
    if (Math.abs(mirrored.x - expectedX) > EPSILON) {
      errors.push(`invalid mirrored x for ${placement.id}`);
    }
    if (mirrored.y !== placement.y || mirrored.width !== placement.width || mirrored.height !== placement.height) {
      errors.push(`geometry mismatch for ${placement.id}`);
    }
    if (mirrored.page !== placement.backPage) errors.push(`back page mismatch for ${placement.id}`);
    if (mirrored.direction !== flipDirectionHorizontal(placement.direction)) {
      errors.push(`direction mismatch for ${placement.id}`);
    }
  });

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  });
}
