import {
  calculatePlacementOptions,
  calculateSheetGeometry,
} from "./geometry.js";
import { createUniformGridPatternSet } from "./uniform-grid-patterns.js";

const MM_PRECISION = 1000;

function roundMm(value) {
  return Math.round((Number(value) + Number.EPSILON) * MM_PRECISION) / MM_PRECISION;
}

function freezeObject(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freezeObject(nested);
  return Object.freeze(value);
}

function toSizeMm(size) {
  return {
    widthMm: roundMm(size.width),
    heightMm: roundMm(size.height),
  };
}

function toSidesMm(sides) {
  return {
    leftMm: roundMm(sides.left),
    rightMm: roundMm(sides.right),
    topMm: roundMm(sides.top),
    bottomMm: roundMm(sides.bottom),
  };
}

function normalizeSheetGeometry(sheetGeometry) {
  const sourceTrimOffset = sheetGeometry.trimApplied
    ? { xMm: sheetGeometry.trimSides.left, yMm: sheetGeometry.trimSides.top }
    : { xMm: 0, yMm: 0 };
  const printableOffsetOnTrimmedSheet = {
    xMm: sheetGeometry.pressMargins.left,
    yMm: sheetGeometry.pressMargins.top,
  };
  return freezeObject({
    source: toSizeMm(sheetGeometry.source),
    trimmed: toSizeMm(sheetGeometry.trimmed),
    printable: toSizeMm(sheetGeometry.printable),
    trimApplied: sheetGeometry.trimApplied,
    trimSides: toSidesMm(sheetGeometry.trimSides),
    pressMargins: toSidesMm(sheetGeometry.pressMargins),
    coordinateSpace: {
      units: "mm",
      slotOrigin: "printableAreaTopLeft",
      printableOffsetOnTrimmedSheet: {
        xMm: roundMm(printableOffsetOnTrimmedSheet.xMm),
        yMm: roundMm(printableOffsetOnTrimmedSheet.yMm),
      },
      printableOffsetOnSourceSheet: {
        xMm: roundMm(sourceTrimOffset.xMm + printableOffsetOnTrimmedSheet.xMm),
        yMm: roundMm(sourceTrimOffset.yMm + printableOffsetOnTrimmedSheet.yMm),
      },
    },
  });
}

function normalizeFootprint(footprint) {
  return freezeObject({
    finished: toSizeMm(footprint.finished),
    occupied: toSizeMm(footprint.occupied),
    bleedMm: roundMm(footprint.bleed),
    gapMm: roundMm(footprint.gap),
    spacingMode: footprint.spacingMode,
  });
}

function normalizeCandidate(candidate, printable) {
  const hasPositions = candidate.positions > 0;
  return {
    rotation: candidate.rotation,
    columns: candidate.columns,
    rows: candidate.rows,
    capacity: candidate.positions,
    used: hasPositions ? toSizeMm(candidate.used) : { widthMm: 0, heightMm: 0 },
    unused: hasPositions ? toSizeMm(candidate.unused) : toSizeMm(printable),
  };
}

export function compareCurrentPlacementWithPatternSet(placementOptions, patternSet) {
  if (!placementOptions || typeof placementOptions !== "object") {
    throw new TypeError("placementOptions must be an object");
  }
  if (!patternSet || typeof patternSet !== "object") {
    throw new TypeError("patternSet must be an object");
  }

  const legacyCandidates = placementOptions.candidates.map((candidate) => normalizeCandidate(
    candidate,
    placementOptions.printable,
  ));
  const currentCandidates = patternSet.patterns.map((pattern) => ({
    rotation: pattern.rotation,
    columns: pattern.columns,
    rows: pattern.rows,
    capacity: pattern.capacity,
    used: {
      widthMm: pattern.usedBounds.widthMm,
      heightMm: pattern.usedBounds.heightMm,
    },
    unused: {
      widthMm: pattern.unusedEdges.rightMm,
      heightMm: pattern.unusedEdges.bottomMm,
    },
  }));

  const candidateMismatches = [];
  const maxCount = Math.max(legacyCandidates.length, currentCandidates.length);
  for (let index = 0; index < maxCount; index += 1) {
    const legacy = legacyCandidates[index] ?? null;
    const current = currentCandidates[index] ?? null;
    if (JSON.stringify(legacy) !== JSON.stringify(current)) {
      candidateMismatches.push({ index, legacy, current });
    }
  }

  const legacyBest = placementOptions.fits && placementOptions.best
    ? {
      rotation: placementOptions.best.rotation,
      capacity: placementOptions.best.positions,
    }
    : null;
  const currentBest = patternSet.best
    ? {
      rotation: patternSet.best.rotation,
      capacity: patternSet.best.capacity,
    }
    : null;
  const bestMatches = JSON.stringify(legacyBest) === JSON.stringify(currentBest);
  const fitsMatches = placementOptions.fits === patternSet.fits;

  return freezeObject({
    matched: candidateMismatches.length === 0 && bestMatches && fitsMatches,
    candidateMismatches,
    bestMatches,
    fitsMatches,
    legacyBest,
    currentBest,
    normalizedLegacyNoFitMetrics: !placementOptions.fits,
  });
}

export function createCurrentUniformGeometryPatterns({ printable, product, limits = {} }) {
  const placementOptions = calculatePlacementOptions({ printable, product, limits });
  const patternSet = createUniformGridPatternSet({
    printableArea: {
      widthMm: placementOptions.printable.width,
      heightMm: placementOptions.printable.height,
    },
    occupiedProduct: {
      widthMm: placementOptions.footprint.occupied.width,
      heightMm: placementOptions.footprint.occupied.height,
    },
    gapMm: placementOptions.footprint.gap,
  });
  const agreement = compareCurrentPlacementWithPatternSet(placementOptions, patternSet);
  if (!agreement.matched) {
    throw new Error(`Current placement and G0 pattern set disagree: ${JSON.stringify(agreement)}`);
  }

  return freezeObject({
    printable: toSizeMm(placementOptions.printable),
    footprint: normalizeFootprint(placementOptions.footprint),
    patternSet,
    agreement,
  });
}

export function createCurrentUniformGeometryPatternsFromSheet({ sheet, product, limits = {} }) {
  if (!sheet || typeof sheet !== "object" || Array.isArray(sheet)) {
    throw new TypeError("sheet must be an object");
  }
  const sheetGeometry = calculateSheetGeometry({ ...sheet, limits });
  const result = createCurrentUniformGeometryPatterns({
    printable: sheetGeometry.printable,
    product,
    limits,
  });

  return freezeObject({
    sheetGeometry: normalizeSheetGeometry(sheetGeometry),
    footprint: result.footprint,
    patternSet: result.patternSet,
    agreement: result.agreement,
  });
}
