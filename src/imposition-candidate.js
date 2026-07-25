import { directionForRotation } from "./orientation.js";
import { productionPairKey } from "./production-metrics.js";

export const IMPOSITION_CANDIDATE_KIND = "impositionCandidate";
export const PAIR_DEMAND_STATE_KIND = "pairDemandState";

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function normalizeFile(value, label = "file") {
  const file = String(value ?? "").trim();
  if (!file || file === "-") {
    throw new RangeError(`${label} must be present and cannot be '-'`);
  }
  return file;
}

function normalizePagePair(pair, index) {
  const file = normalizeFile(pair?.file, `pagePairs[${index}].file`);
  const pairIndex = requirePositiveInteger(pair?.pairIndex, `pagePairs[${index}].pairIndex`);
  const quantity = requirePositiveInteger(pair?.quantity, `pagePairs[${index}].quantity`);
  const frontPage = requirePositiveInteger(pair?.frontPage, `pagePairs[${index}].frontPage`);
  if (frontPage % 2 === 0) {
    throw new RangeError(`pagePairs[${index}].frontPage must be odd`);
  }

  const backPage = pair?.backPage === null
    ? null
    : requirePositiveInteger(pair?.backPage, `pagePairs[${index}].backPage`);
  if (backPage !== null && backPage !== frontPage + 1) {
    throw new RangeError(`pagePairs[${index}].backPage must equal frontPage + 1 or null`);
  }

  return Object.freeze({
    key: productionPairKey(file, pairIndex),
    file,
    pairIndex,
    quantity,
    frontPage,
    backPage,
  });
}

function frontLookupKey(file, frontPage) {
  return `${file}\u0000${frontPage}`;
}

function normalizePagePairs(pagePairs) {
  if (!Array.isArray(pagePairs) || pagePairs.length === 0) {
    throw new TypeError("pagePairs must be a non-empty array");
  }

  const byKey = new Map();
  const byFront = new Map();
  const normalized = pagePairs.map((pair, index) => normalizePagePair(pair, index));

  normalized.forEach((pair) => {
    if (byKey.has(pair.key)) {
      throw new RangeError(`Duplicate page pair: file ${pair.file}, pair ${pair.pairIndex}`);
    }
    const frontKey = frontLookupKey(pair.file, pair.frontPage);
    if (byFront.has(frontKey)) {
      throw new RangeError(`Duplicate front page: file ${pair.file}, page ${pair.frontPage}`);
    }
    byKey.set(pair.key, pair);
    byFront.set(frontKey, pair);
  });

  return { normalized: Object.freeze(normalized), byKey, byFront };
}

function buildDemandState(rows) {
  const frozenRows = Object.freeze(rows.map((row) => Object.freeze({ ...row })));
  const requiredQuantity = frozenRows.reduce((sum, row) => sum + row.requiredQuantity, 0);
  const producedQuantity = frozenRows.reduce((sum, row) => sum + row.producedQuantity, 0);
  const remainingQuantity = frozenRows.reduce((sum, row) => sum + row.remainingQuantity, 0);
  const overrunQuantity = frozenRows.reduce((sum, row) => sum + row.overrun, 0);
  const satisfiedPairCount = frozenRows.filter((row) => row.remainingQuantity === 0).length;

  return Object.freeze({
    kind: PAIR_DEMAND_STATE_KIND,
    pairCount: frozenRows.length,
    requiredQuantity,
    producedQuantity,
    remainingQuantity,
    overrunQuantity,
    satisfiedPairCount,
    allSatisfied: remainingQuantity === 0,
    rows: frozenRows,
  });
}

export function createInitialDemandState(pagePairs) {
  const { normalized } = normalizePagePairs(pagePairs);
  return buildDemandState(normalized.map((pair) => ({
    key: pair.key,
    file: pair.file,
    pairIndex: pair.pairIndex,
    frontPage: pair.frontPage,
    backPage: pair.backPage,
    requiredQuantity: pair.quantity,
    producedQuantity: 0,
    remainingQuantity: pair.quantity,
    overrun: 0,
  })));
}

function requireCandidate(candidate) {
  if (!candidate || candidate.kind !== IMPOSITION_CANDIDATE_KIND) {
    throw new TypeError("An imposition candidate is required");
  }
  return candidate;
}

function requireDemandState(demandState) {
  if (!demandState || demandState.kind !== PAIR_DEMAND_STATE_KIND || !Array.isArray(demandState.rows)) {
    throw new TypeError("A pair demand state is required");
  }
  return demandState;
}

export function createImpositionCandidate({
  id,
  rows,
  columns,
  rotation,
  blocks,
  pagePairs,
}) {
  const candidateId = String(id ?? "").trim();
  if (!candidateId) throw new RangeError("candidate id is required");

  const normalizedRows = requirePositiveInteger(rows, "rows");
  const normalizedColumns = requirePositiveInteger(columns, "columns");
  const normalizedRotation = Number(rotation);
  const direction = directionForRotation(normalizedRotation);

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new TypeError("blocks must be a non-empty array");
  }

  const { byFront } = normalizePagePairs(pagePairs);
  const seenPairKeys = new Set();
  const normalizedBlocks = [];
  let filledPositions = 0;

  blocks.forEach((block, index) => {
    const file = normalizeFile(block?.file, `blocks[${index}].file`);
    const frontPage = requirePositiveInteger(block?.frontPage, `blocks[${index}].frontPage`);
    if (frontPage % 2 === 0) {
      throw new RangeError(`blocks[${index}].frontPage must be odd`);
    }
    const count = requirePositiveInteger(block?.count, `blocks[${index}].count`);
    const pair = byFront.get(frontLookupKey(file, frontPage));
    if (!pair) {
      throw new RangeError(`Unknown page pair for file ${file}, front page ${frontPage}`);
    }
    if (seenPairKeys.has(pair.key)) {
      throw new RangeError(`Duplicate candidate block for file ${file}, pair ${pair.pairIndex}`);
    }
    seenPairKeys.add(pair.key);
    filledPositions += count;
    normalizedBlocks.push(Object.freeze({
      key: pair.key,
      file: pair.file,
      pairIndex: pair.pairIndex,
      frontPage: pair.frontPage,
      backPage: pair.backPage,
      count,
    }));
  });

  const capacity = normalizedRows * normalizedColumns;
  if (filledPositions !== capacity) {
    throw new RangeError(`Candidate requires exactly ${capacity} positions; received ${filledPositions}`);
  }

  const frozenBlocks = Object.freeze(normalizedBlocks);
  const pairPositions = Object.freeze(frozenBlocks.map((block) => Object.freeze({
    key: block.key,
    file: block.file,
    pairIndex: block.pairIndex,
    frontPage: block.frontPage,
    backPage: block.backPage,
    positionCount: block.count,
  })));

  return Object.freeze({
    kind: IMPOSITION_CANDIDATE_KIND,
    id: candidateId,
    rows: normalizedRows,
    columns: normalizedColumns,
    rotation: normalizedRotation,
    direction,
    capacity,
    filledPositions,
    pairCount: pairPositions.length,
    blocks: frozenBlocks,
    pairPositions,
  });
}

function demandIndexForCandidate(candidate, demandState) {
  const demandByKey = new Map(demandState.rows.map((row) => [row.key, row]));
  candidate.pairPositions.forEach((position) => {
    const demand = demandByKey.get(position.key);
    if (!demand) {
      throw new RangeError(`Candidate ${candidate.id} references a pair missing from demand state: ${position.file}/${position.pairIndex}`);
    }
    if (demand.frontPage !== position.frontPage || demand.backPage !== position.backPage) {
      throw new RangeError(`Candidate ${candidate.id} page metadata does not match demand state for ${position.file}/${position.pairIndex}`);
    }
  });
  return demandByKey;
}

export function calculateCandidateRunBounds({ candidate, demandState }) {
  const normalizedCandidate = requireCandidate(candidate);
  const normalizedDemand = requireDemandState(demandState);
  const demandByKey = demandIndexForCandidate(normalizedCandidate, normalizedDemand);

  const activePairs = normalizedCandidate.pairPositions
    .map((position) => {
      const demand = demandByKey.get(position.key);
      if (demand.remainingQuantity === 0) return null;
      return Object.freeze({
        key: position.key,
        file: position.file,
        pairIndex: position.pairIndex,
        frontPage: position.frontPage,
        backPage: position.backPage,
        positionCount: position.positionCount,
        remainingQuantity: demand.remainingQuantity,
        runToSatisfy: Math.ceil(demand.remainingQuantity / position.positionCount),
      });
    })
    .filter(Boolean);

  if (activePairs.length === 0) {
    return Object.freeze({
      candidateId: normalizedCandidate.id,
      activePairCount: 0,
      inactivePairCount: normalizedCandidate.pairCount,
      firstSaturationRunLength: 0,
      completionRunLength: 0,
      activePairs: Object.freeze([]),
      firstSatisfiedPairs: Object.freeze([]),
      completionPairs: Object.freeze([]),
      needed: false,
    });
  }

  const firstSaturationRunLength = Math.min(...activePairs.map((pair) => pair.runToSatisfy));
  const completionRunLength = Math.max(...activePairs.map((pair) => pair.runToSatisfy));

  return Object.freeze({
    candidateId: normalizedCandidate.id,
    activePairCount: activePairs.length,
    inactivePairCount: normalizedCandidate.pairCount - activePairs.length,
    firstSaturationRunLength,
    completionRunLength,
    activePairs: Object.freeze(activePairs),
    firstSatisfiedPairs: Object.freeze(activePairs.filter(
      (pair) => pair.runToSatisfy === firstSaturationRunLength,
    )),
    completionPairs: Object.freeze(activePairs.filter(
      (pair) => pair.runToSatisfy === completionRunLength,
    )),
    needed: true,
  });
}

export function createFrontLayoutInputFromCandidate(candidate, runLength) {
  const normalizedCandidate = requireCandidate(candidate);
  const normalizedRunLength = requirePositiveInteger(runLength, "runLength");
  return Object.freeze({
    id: normalizedCandidate.id,
    runLength: normalizedRunLength,
    rows: normalizedCandidate.rows,
    columns: normalizedCandidate.columns,
    rotation: normalizedCandidate.rotation,
    blocks: Object.freeze(normalizedCandidate.blocks.map((block) => Object.freeze({
      file: block.file,
      frontPage: block.frontPage,
      count: block.count,
    }))),
  });
}

export function evaluateCandidateRun({ candidate, demandState, runLength }) {
  const normalizedCandidate = requireCandidate(candidate);
  const normalizedDemand = requireDemandState(demandState);
  const normalizedRunLength = requirePositiveInteger(runLength, "runLength");
  demandIndexForCandidate(normalizedCandidate, normalizedDemand);

  const positionsByKey = new Map(normalizedCandidate.pairPositions.map((position) => [position.key, position]));
  const previousOverrun = normalizedDemand.overrunQuantity;
  const nextRows = normalizedDemand.rows.map((row) => {
    const position = positionsByKey.get(row.key);
    const producedIncrement = position ? position.positionCount * normalizedRunLength : 0;
    const producedQuantity = row.producedQuantity + producedIncrement;
    return {
      ...row,
      producedQuantity,
      remainingQuantity: Math.max(0, row.requiredQuantity - producedQuantity),
      overrun: Math.max(0, producedQuantity - row.requiredQuantity),
    };
  });

  const nextDemandState = buildDemandState(nextRows);
  const nextByKey = new Map(nextDemandState.rows.map((row) => [row.key, row]));
  const beforeByKey = new Map(normalizedDemand.rows.map((row) => [row.key, row]));
  const pairResults = Object.freeze(normalizedCandidate.pairPositions.map((position) => {
    const before = beforeByKey.get(position.key);
    const after = nextByKey.get(position.key);
    const producedIncrement = position.positionCount * normalizedRunLength;
    return Object.freeze({
      key: position.key,
      file: position.file,
      pairIndex: position.pairIndex,
      frontPage: position.frontPage,
      backPage: position.backPage,
      positionCount: position.positionCount,
      runLength: normalizedRunLength,
      producedIncrement,
      remainingBefore: before.remainingQuantity,
      remainingAfter: after.remainingQuantity,
      overrunAfter: after.overrun,
      newlySatisfied: before.remainingQuantity > 0 && after.remainingQuantity === 0,
    });
  }));

  const producedIncrement = pairResults.reduce((sum, result) => sum + result.producedIncrement, 0);
  const remainingReduction = normalizedDemand.remainingQuantity - nextDemandState.remainingQuantity;

  return Object.freeze({
    candidateId: normalizedCandidate.id,
    runLength: normalizedRunLength,
    physicalSheets: normalizedRunLength,
    producedIncrement,
    remainingReduction,
    overrunIncrement: nextDemandState.overrunQuantity - previousOverrun,
    newlySatisfiedPairCount: pairResults.filter((result) => result.newlySatisfied).length,
    candidatePairsSatisfied: pairResults.every((result) => result.remainingAfter === 0),
    allDemandSatisfied: nextDemandState.allSatisfied,
    pairResults,
    nextDemandState,
  });
}
