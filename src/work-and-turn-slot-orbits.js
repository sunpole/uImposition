import { validateGeometryPattern } from "./geometric-pattern.js";

const EPSILON = 1e-9;
const MM_PRECISION = 1000;

function roundMm(value) {
  return Math.round((Number(value) + Number.EPSILON) * MM_PRECISION) / MM_PRECISION;
}

function formatMm(value) {
  return String(roundMm(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function compareSlots(a, b) {
  if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
  if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
  if (a.rotation !== b.rotation) return a.rotation - b.rotation;
  return a.id.localeCompare(b.id);
}

function geometryKey({ xMm, yMm, widthMm, heightMm, rotation }) {
  return [
    formatMm(xMm),
    formatMm(yMm),
    formatMm(widthMm),
    formatMm(heightMm),
    rotation,
  ].join(":");
}

export function reflectSlotHorizontally(slot, printableWidthMm) {
  return Object.freeze({
    xMm: roundMm(printableWidthMm - slot.xMm - slot.widthMm),
    yMm: slot.yMm,
    widthMm: slot.widthMm,
    heightMm: slot.heightMm,
    rotation: slot.rotation,
  });
}

function createSlotReference(slot) {
  return Object.freeze({
    slotId: slot.id,
    xMm: slot.xMm,
    yMm: slot.yMm,
    widthMm: slot.widthMm,
    heightMm: slot.heightMm,
    rotation: slot.rotation,
    row: slot.row,
    column: slot.column,
    stripId: slot.stripId ?? null,
    positionInStrip: slot.positionInStrip ?? null,
  });
}

function createAnalysisSignature({ geometryPattern, pairedOrbits, fixedSlots, unmatchedSlots }) {
  const paired = pairedOrbits.map((orbit) => [
    formatMm(orbit.first.xMm),
    formatMm(orbit.first.yMm),
    formatMm(orbit.first.widthMm),
    formatMm(orbit.first.heightMm),
    orbit.first.rotation,
    formatMm(orbit.second.xMm),
    formatMm(orbit.second.yMm),
  ].join(":"));
  const fixed = fixedSlots.map((slot) => geometryKey(slot));
  const unmatched = unmatchedSlots.map((slot) => geometryKey(slot));
  return [
    "horizontal-work-and-turn-orbits-v1",
    `geometry=${geometryPattern.structuralSignature}`,
    `paired=${paired.join(";")}`,
    `fixed=${fixed.join(";")}`,
    `unmatched=${unmatched.join(";")}`,
  ].join("|");
}

export function analyzeHorizontalWorkAndTurnOrbits(geometryPattern) {
  validateGeometryPattern(geometryPattern);
  const printableWidthMm = geometryPattern.printableArea.widthMm;
  const slotByGeometry = new Map();
  for (const slot of geometryPattern.slots) {
    const key = geometryKey(slot);
    if (slotByGeometry.has(key)) {
      throw new RangeError(`duplicate slot geometry is not allowed: ${slot.id}`);
    }
    slotByGeometry.set(key, slot);
  }

  const visited = new Set();
  const pairedOrbits = [];
  const fixedSlots = [];
  const unmatchedSlots = [];
  const transformedSlotIdBySourceSlotId = {};

  for (const slot of geometryPattern.slots) {
    if (visited.has(slot.id)) continue;
    const reflected = reflectSlotHorizontally(slot, printableWidthMm);
    const counterpart = slotByGeometry.get(geometryKey(reflected)) ?? null;
    if (counterpart === null) {
      visited.add(slot.id);
      unmatchedSlots.push(createSlotReference(slot));
      continue;
    }
    if (counterpart.id === slot.id) {
      visited.add(slot.id);
      transformedSlotIdBySourceSlotId[slot.id] = slot.id;
      fixedSlots.push(createSlotReference(slot));
      continue;
    }

    const reflectedCounterpart = reflectSlotHorizontally(counterpart, printableWidthMm);
    if (geometryKey(reflectedCounterpart) !== geometryKey(slot)) {
      throw new RangeError(`horizontal reflection is not involutive for ${slot.id}`);
    }
    visited.add(slot.id);
    visited.add(counterpart.id);
    transformedSlotIdBySourceSlotId[slot.id] = counterpart.id;
    transformedSlotIdBySourceSlotId[counterpart.id] = slot.id;
    const ordered = [slot, counterpart].sort(compareSlots);
    pairedOrbits.push(Object.freeze({
      index: pairedOrbits.length,
      first: createSlotReference(ordered[0]),
      second: createSlotReference(ordered[1]),
    }));
  }

  pairedOrbits.sort((a, b) => compareSlots(a.first, b.first));
  const normalizedOrbits = pairedOrbits.map((orbit, index) => Object.freeze({ ...orbit, index }));
  fixedSlots.sort(compareSlots);
  unmatchedSlots.sort(compareSlots);
  const usefulCapacity = normalizedOrbits.length * 2;
  const blankSlotCount = fixedSlots.length + unmatchedSlots.length;
  const analysis = {
    transform: {
      type: "horizontalReflection",
      printableWidthMm,
    },
    geometryCapacity: geometryPattern.capacity,
    pairedOrbitCount: normalizedOrbits.length,
    usefulCapacity,
    blankSlotCount,
    fixedSlotCount: fixedSlots.length,
    unmatchedSlotCount: unmatchedSlots.length,
    fullySymmetric: unmatchedSlots.length === 0,
    eligible: usefulCapacity > 0,
    utilizationPercent: geometryPattern.capacity > 0
      ? Math.round((usefulCapacity / geometryPattern.capacity) * 10000) / 100
      : 0,
    pairedOrbits: normalizedOrbits,
    fixedSlots,
    unmatchedSlots,
    transformedSlotIdBySourceSlotId,
  };
  analysis.structuralSignature = createAnalysisSignature({
    geometryPattern,
    pairedOrbits: normalizedOrbits,
    fixedSlots,
    unmatchedSlots,
  });
  return deepFreeze(analysis);
}
