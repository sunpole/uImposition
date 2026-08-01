import {
  createSingleProductProductionPattern,
  SINGLE_PRODUCT_PRINT_STRATEGIES,
} from "./single-product-production-pattern.js";
import { analyzeHorizontalWorkAndTurnOrbits } from "./work-and-turn-slot-orbits.js";

const EPSILON = 1e-9;
const MM_PRECISION = 1000;

function asNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function roundMm(value) {
  return Math.round((Number(value) + Number.EPSILON) * MM_PRECISION) / MM_PRECISION;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function compareCells(a, b) {
  if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
  if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
  return a.sourceSlotId.localeCompare(b.sourceSlotId);
}

function createCommonFormCell(slot, demand, imageSide) {
  return Object.freeze({
    id: `shared:${slot.slotId}`,
    form: "shared",
    imageSide,
    demandId: demand.demandId,
    productId: demand.productId,
    page: imageSide === "front" ? demand.frontPage : demand.backPage,
    sourceSlotId: slot.slotId,
    xMm: slot.xMm,
    yMm: slot.yMm,
    widthMm: slot.widthMm,
    heightMm: slot.heightMm,
    rotation: slot.rotation,
  });
}

function createPassTwoCell(commonCell, targetSlot) {
  return Object.freeze({
    id: `pass2:${commonCell.sourceSlotId}`,
    pass: 2,
    imageSide: commonCell.imageSide,
    demandId: commonCell.demandId,
    productId: commonCell.productId,
    page: commonCell.page,
    plateSourceSlotId: commonCell.sourceSlotId,
    physicalSlotId: targetSlot.id,
    xMm: targetSlot.xMm,
    yMm: targetSlot.yMm,
    widthMm: targetSlot.widthMm,
    heightMm: targetSlot.heightMm,
    rotation: targetSlot.rotation,
  });
}

function createFinishedPositions({ geometryPattern, commonFormCells, passTwoCells, demand, pairedSlotIds }) {
  const passOneBySlot = new Map(commonFormCells.map((cell) => [cell.sourceSlotId, cell]));
  const passTwoBySlot = new Map(passTwoCells.map((cell) => [cell.physicalSlotId, cell]));
  const slotById = new Map(geometryPattern.slots.map((slot) => [slot.id, slot]));
  return Object.freeze([...pairedSlotIds]
    .map((slotId) => {
      const slot = slotById.get(slotId);
      const firstPass = passOneBySlot.get(slotId);
      const secondPass = passTwoBySlot.get(slotId);
      const pages = [firstPass?.page, secondPass?.page].sort((a, b) => a - b);
      if (pages[0] !== Math.min(demand.frontPage, demand.backPage)
        || pages[1] !== Math.max(demand.frontPage, demand.backPage)) {
        throw new RangeError(`slot ${slotId} does not receive both product pages`);
      }
      return Object.freeze({
        slotId,
        xMm: slot.xMm,
        yMm: slot.yMm,
        widthMm: slot.widthMm,
        heightMm: slot.heightMm,
        rotation: slot.rotation,
        passOnePage: firstPass.page,
        passTwoPage: secondPass.page,
        pages: Object.freeze([firstPass.page, secondPass.page]),
      });
    })
    .sort(compareCells));
}

function expectedMetrics({ demand, orbitAnalysis, runLength, separateMetrics }) {
  const usefulPositionsPerSheet = orbitAnalysis.usefulCapacity;
  const producedQuantity = usefulPositionsPerSheet * runLength;
  const sharedPlateColorCount = Math.max(demand.frontColorCount, demand.backColorCount);
  return Object.freeze({
    physicalSheets: runLength,
    usefulPositionsPerSheet,
    pairedOrbitCount: orbitAnalysis.pairedOrbitCount,
    blankPositionCount: orbitAnalysis.blankSlotCount,
    fixedBlankPositionCount: orbitAnalysis.fixedSlotCount,
    unmatchedBlankPositionCount: orbitAnalysis.unmatchedSlotCount,
    layoutForms: 1,
    colorPlates: sharedPlateColorCount,
    pressPasses: runLength * 2,
    requiredQuantity: demand.requiredQuantity,
    producedQuantity,
    overrun: producedQuantity - demand.requiredQuantity,
    underproduction: Math.max(0, demand.requiredQuantity - producedQuantity),
    paperDeltaVsSeparate: runLength - separateMetrics.physicalSheets,
    layoutFormDeltaVsSeparate: 1 - separateMetrics.layoutForms,
    colorPlateDeltaVsSeparate: sharedPlateColorCount - separateMetrics.colorPlates,
    pressPassDeltaVsSeparate: (runLength * 2) - separateMetrics.pressPasses,
  });
}

function createSignatures({ geometryPattern, demand, orbitAnalysis, runLength }) {
  const structuralSignature = [
    "single-product-work-and-turn-v1",
    `geometry=${geometryPattern.structuralSignature}`,
    `orbits=${orbitAnalysis.structuralSignature}`,
    `colors=${demand.frontColorCount}+${demand.backColorCount}`,
  ].join("|");
  const planSignature = [
    structuralSignature,
    `demand=${demand.demandId}`,
    `product=${demand.productId}`,
    `pages=${demand.frontPage}/${demand.backPage}`,
    `required=${demand.requiredQuantity}`,
    `run=${runLength}`,
  ].join("|");
  return Object.freeze({ structuralSignature, planSignature });
}

export function validateSingleProductWorkAndTurnPattern(pattern) {
  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) {
    throw new TypeError("pattern must be an object");
  }
  const separateReference = createSingleProductProductionPattern({
    id: `${pattern.id}:validation-reference`,
    geometryPattern: pattern.geometryPattern,
    demand: pattern.demand,
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  });
  const demand = separateReference.demand;
  if (demand.backPage === null) {
    throw new RangeError("work-and-turn requires a printed back page");
  }
  const orbitAnalysis = analyzeHorizontalWorkAndTurnOrbits(pattern.geometryPattern);
  if (!orbitAnalysis.eligible) {
    throw new RangeError("geometry has no usable horizontal reflection orbit");
  }
  if (pattern.orbitAnalysis?.structuralSignature !== orbitAnalysis.structuralSignature) {
    throw new RangeError("orbitAnalysis mismatch");
  }
  const expectedRunLength = Math.ceil(demand.requiredQuantity / orbitAnalysis.usefulCapacity);
  if (pattern.runLength !== expectedRunLength) throw new RangeError("runLength mismatch");
  if (!Array.isArray(pattern.commonFormCells)
    || pattern.commonFormCells.length !== orbitAnalysis.usefulCapacity) {
    throw new RangeError("commonFormCells must cover every paired slot exactly once");
  }
  const commonBySlot = new Map();
  for (const cell of pattern.commonFormCells) {
    if (commonBySlot.has(cell.sourceSlotId)) {
      throw new RangeError(`duplicate common-form slot ${cell.sourceSlotId}`);
    }
    commonBySlot.set(cell.sourceSlotId, cell);
  }
  for (const orbit of orbitAnalysis.pairedOrbits) {
    const frontCell = commonBySlot.get(orbit.first.slotId);
    const backCell = commonBySlot.get(orbit.second.slotId);
    if (frontCell?.imageSide !== "front" || frontCell.page !== demand.frontPage) {
      throw new RangeError(`orbit ${orbit.index} first slot must carry the front image`);
    }
    if (backCell?.imageSide !== "back" || backCell.page !== demand.backPage) {
      throw new RangeError(`orbit ${orbit.index} second slot must carry the back image`);
    }
  }
  const sortedCommon = [...pattern.commonFormCells].sort(compareCells);
  for (let index = 0; index < sortedCommon.length; index += 1) {
    if (sortedCommon[index].id !== pattern.commonFormCells[index].id) {
      throw new RangeError("commonFormCells must use deterministic top-left order");
    }
  }

  if (!Array.isArray(pattern.passTwoCells)
    || pattern.passTwoCells.length !== pattern.commonFormCells.length) {
    throw new RangeError("passTwoCells length mismatch");
  }
  const geometrySlotById = new Map(pattern.geometryPattern.slots.map((slot) => [slot.id, slot]));
  const passTwoByPlateSlot = new Map(pattern.passTwoCells.map((cell) => [cell.plateSourceSlotId, cell]));
  for (const commonCell of pattern.commonFormCells) {
    const targetSlotId = orbitAnalysis.transformedSlotIdBySourceSlotId[commonCell.sourceSlotId];
    const targetSlot = geometrySlotById.get(targetSlotId);
    const passTwo = passTwoByPlateSlot.get(commonCell.sourceSlotId);
    if (!targetSlot || !passTwo) throw new RangeError("pass-two transform target is missing");
    if (passTwo.physicalSlotId !== targetSlot.id
      || Math.abs(passTwo.xMm - targetSlot.xMm) > EPSILON
      || Math.abs(passTwo.yMm - targetSlot.yMm) > EPSILON
      || passTwo.page !== commonCell.page) {
      throw new RangeError(`pass-two transform mismatch for ${commonCell.sourceSlotId}`);
    }
  }

  const pairedSlotIds = orbitAnalysis.pairedOrbits.flatMap((orbit) => [orbit.first.slotId, orbit.second.slotId]);
  const expectedFinished = createFinishedPositions({
    geometryPattern: pattern.geometryPattern,
    commonFormCells: pattern.commonFormCells,
    passTwoCells: pattern.passTwoCells,
    demand,
    pairedSlotIds,
  });
  if (JSON.stringify(pattern.finishedPositions) !== JSON.stringify(expectedFinished)) {
    throw new RangeError("finishedPositions mismatch");
  }
  const expectedMetricValues = expectedMetrics({
    demand,
    orbitAnalysis,
    runLength: expectedRunLength,
    separateMetrics: separateReference.metrics,
  });
  if (expectedMetricValues.underproduction !== 0) throw new RangeError("underproduction is forbidden");
  for (const [key, expected] of Object.entries(expectedMetricValues)) {
    if (pattern.metrics?.[key] !== expected) throw new RangeError(`metrics.${key} mismatch`);
  }
  if (pattern.sharedPlateColorModel?.colorPlateCount !== expectedMetricValues.colorPlates) {
    throw new RangeError("sharedPlateColorModel mismatch");
  }
  return true;
}

export function createSingleProductWorkAndTurnPattern({
  id,
  geometryPattern,
  demand: demandInput,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  const separateReference = createSingleProductProductionPattern({
    id: `${normalizedId}:separate-reference`,
    geometryPattern,
    demand: demandInput,
    strategy: SINGLE_PRODUCT_PRINT_STRATEGIES.SEPARATE_DUPLEX,
  });
  const demand = separateReference.demand;
  if (demand.backPage === null) {
    throw new RangeError("work-and-turn requires a printed back page");
  }
  const orbitAnalysis = analyzeHorizontalWorkAndTurnOrbits(geometryPattern);
  if (!orbitAnalysis.eligible) {
    throw new RangeError("geometry has no usable horizontal reflection orbit");
  }

  const commonFormCells = [];
  for (const orbit of orbitAnalysis.pairedOrbits) {
    commonFormCells.push(createCommonFormCell(orbit.first, demand, "front"));
    commonFormCells.push(createCommonFormCell(orbit.second, demand, "back"));
  }
  commonFormCells.sort(compareCells);
  const frozenCommonFormCells = Object.freeze(commonFormCells);
  const slotById = new Map(geometryPattern.slots.map((slot) => [slot.id, slot]));
  const passTwoCells = Object.freeze(frozenCommonFormCells
    .map((cell) => {
      const targetSlotId = orbitAnalysis.transformedSlotIdBySourceSlotId[cell.sourceSlotId];
      return createPassTwoCell(cell, slotById.get(targetSlotId));
    })
    .sort((a, b) => {
      if (Math.abs(a.yMm - b.yMm) > EPSILON) return a.yMm - b.yMm;
      if (Math.abs(a.xMm - b.xMm) > EPSILON) return a.xMm - b.xMm;
      return a.plateSourceSlotId.localeCompare(b.plateSourceSlotId);
    }));
  const pairedSlotIds = orbitAnalysis.pairedOrbits.flatMap((orbit) => [orbit.first.slotId, orbit.second.slotId]);
  const finishedPositions = createFinishedPositions({
    geometryPattern,
    commonFormCells: frozenCommonFormCells,
    passTwoCells,
    demand,
    pairedSlotIds,
  });
  const runLength = Math.ceil(demand.requiredQuantity / orbitAnalysis.usefulCapacity);
  const metrics = expectedMetrics({
    demand,
    orbitAnalysis,
    runLength,
    separateMetrics: separateReference.metrics,
  });
  const sharedPlateColorCount = Math.max(demand.frontColorCount, demand.backColorCount);
  const sharedPlateColorModel = Object.freeze({
    type: "countOnlyMaximum",
    colorPlateCount: sharedPlateColorCount,
    frontColorCount: demand.frontColorCount,
    backColorCount: demand.backColorCount,
    requiresNamedInkCompatibilityCheck: true,
  });
  const signatures = createSignatures({ geometryPattern, demand, orbitAnalysis, runLength });
  const pattern = Object.freeze({
    id: normalizedId,
    family: "singleProductWorkAndTurn",
    strategy: "workAndTurnHorizontalReflection",
    geometryPattern,
    demand,
    orbitAnalysis,
    turnTransform: orbitAnalysis.transform,
    commonFormCells: frozenCommonFormCells,
    passTwoCells,
    finishedPositions,
    blankSlots: Object.freeze([
      ...orbitAnalysis.fixedSlots,
      ...orbitAnalysis.unmatchedSlots,
    ]),
    runLength,
    metrics,
    separateReferenceMetrics: separateReference.metrics,
    sharedPlateColorModel,
    structuralSignature: signatures.structuralSignature,
    planSignature: signatures.planSignature,
  });
  validateSingleProductWorkAndTurnPattern(pattern);
  return deepFreeze(pattern);
}
