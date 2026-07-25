import { createBackLayout } from "./back-layout.js";
import { candidateProductionSignature } from "./candidate-generator.js";
import { createFrontLayout } from "./front-layout.js";
import {
  createFrontLayoutInputFromCandidate,
  createImpositionCandidate,
  createInitialDemandState,
  evaluateCandidateRun,
} from "./imposition-candidate.js";
import { validateImposition } from "./imposition-validation.js";
import {
  DUPLEX_MODES,
  calculateFileMetrics,
} from "./production-metrics.js";

export const PAPER_SOLUTION_KIND = "paperMinimumSolution";
export const PAPER_OPTIMALITY = Object.freeze({
  PROVEN_GLOBAL_MINIMUM: "provenGlobalMinimum",
  FEASIBLE_NOT_PROVEN: "feasibleNotProven",
});

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function comparePairRows(left, right) {
  const quantityOrder = left.remainingQuantity - right.remainingQuantity;
  if (quantityOrder) return quantityOrder;
  const fileOrder = String(left.file).localeCompare(String(right.file), "en", { numeric: true });
  return fileOrder || left.pairIndex - right.pairIndex;
}

function candidateFromAllocations({ id, rows, columns, rotation, allocations, pagePairs }) {
  return createImpositionCandidate({
    id,
    rows,
    columns,
    rotation,
    pagePairs,
    blocks: allocations.map((allocation) => ({
      file: allocation.file,
      frontPage: allocation.frontPage,
      count: allocation.positionCount,
    })),
  });
}

export function packResidualPairDemand({ demandState, capacity }) {
  if (!demandState || !Array.isArray(demandState.rows)) {
    throw new TypeError("A pair demand state is required");
  }
  const normalizedCapacity = requirePositiveInteger(capacity, "capacity");
  const queue = demandState.rows
    .map((row) => ({
      key: row.key,
      file: row.file,
      pairIndex: row.pairIndex,
      frontPage: row.frontPage,
      backPage: row.backPage,
      remainingQuantity: row.requiredQuantity % normalizedCapacity,
    }))
    .filter((row) => row.remainingQuantity > 0);

  const bins = [];
  while (queue.length > 0) {
    queue.sort(comparePairRows);
    const smallest = queue.shift();

    if (queue.length === 0) {
      bins.push(Object.freeze({
        allocations: Object.freeze([Object.freeze({
          ...smallest,
          positionCount: normalizedCapacity,
        })]),
        requiredQuantity: smallest.remainingQuantity,
        producedQuantity: normalizedCapacity,
        overrun: normalizedCapacity - smallest.remainingQuantity,
      }));
      break;
    }

    const largest = queue.pop();
    const secondPositionCount = normalizedCapacity - smallest.remainingQuantity;
    const allocations = [Object.freeze({
      ...smallest,
      positionCount: smallest.remainingQuantity,
    })];

    if (smallest.remainingQuantity + largest.remainingQuantity <= normalizedCapacity) {
      allocations.push(Object.freeze({
        ...largest,
        positionCount: secondPositionCount,
      }));
      const requiredQuantity = smallest.remainingQuantity + largest.remainingQuantity;
      bins.push(Object.freeze({
        allocations: Object.freeze(allocations),
        requiredQuantity,
        producedQuantity: normalizedCapacity,
        overrun: normalizedCapacity - requiredQuantity,
      }));
    } else {
      allocations.push(Object.freeze({
        ...largest,
        positionCount: secondPositionCount,
      }));
      bins.push(Object.freeze({
        allocations: Object.freeze(allocations),
        requiredQuantity: normalizedCapacity,
        producedQuantity: normalizedCapacity,
        overrun: 0,
      }));
      queue.push({
        ...largest,
        remainingQuantity: largest.remainingQuantity - secondPositionCount,
      });
    }
  }

  const frozenBins = Object.freeze(bins);
  const requiredQuantity = frozenBins.reduce((sum, bin) => sum + bin.requiredQuantity, 0);
  const producedQuantity = frozenBins.length * normalizedCapacity;
  return Object.freeze({
    capacity: normalizedCapacity,
    residualPairCount: demandState.rows.filter(
      (row) => row.requiredQuantity % normalizedCapacity > 0,
    ).length,
    binCount: frozenBins.length,
    requiredQuantity,
    producedQuantity,
    overrun: producedQuantity - requiredQuantity,
    bins: frozenBins,
  });
}

function mergeEquivalentRuns({ rawRuns, pagePairs, rows, columns, rotation, idPrefix }) {
  const groups = new Map();
  rawRuns.forEach((run) => {
    const signature = candidateProductionSignature(run.candidate);
    const existing = groups.get(signature);
    if (existing) {
      existing.runLength += run.runLength;
      existing.sourceIds.push(run.candidate.id);
    } else {
      groups.set(signature, {
        prototype: run.candidate,
        runLength: run.runLength,
        sourceIds: [run.candidate.id],
      });
    }
  });

  const digits = Math.max(3, String(groups.size).length);
  return Object.freeze([...groups.values()].map((group, index) => {
    const candidate = candidateFromAllocations({
      id: `${idPrefix}-${String(index + 1).padStart(digits, "0")}`,
      rows,
      columns,
      rotation,
      pagePairs,
      allocations: group.prototype.pairPositions.map((position) => ({
        file: position.file,
        pairIndex: position.pairIndex,
        frontPage: position.frontPage,
        backPage: position.backPage,
        positionCount: position.positionCount,
      })),
    });
    return Object.freeze({
      candidate,
      runLength: group.runLength,
      physicalSheets: group.runLength,
      mergedSourceCount: group.sourceIds.length,
      sourceIds: Object.freeze(group.sourceIds),
    });
  }));
}

function fileMetricsFromDemandState(demandState) {
  return calculateFileMetrics(demandState.rows.map((row) => ({
    file: row.file,
    pairIndex: row.pairIndex,
    requiredQuantity: row.requiredQuantity,
    producedQuantity: row.producedQuantity,
    underproduction: row.remainingQuantity,
    overrun: row.overrun,
  })));
}

export function minimizePhysicalPaper({
  pagePairs,
  rows,
  columns,
  rotation,
  duplexMode = DUPLEX_MODES.SEPARATE_FRONT_BACK_FORMS,
  idPrefix = "PAPER",
}) {
  if (duplexMode !== DUPLEX_MODES.SEPARATE_FRONT_BACK_FORMS) {
    throw new RangeError(`Unsupported duplex mode: ${duplexMode}`);
  }
  const normalizedRows = requirePositiveInteger(rows, "rows");
  const normalizedColumns = requirePositiveInteger(columns, "columns");
  const capacity = normalizedRows * normalizedColumns;
  const prefix = String(idPrefix ?? "").trim();
  if (!prefix) throw new RangeError("idPrefix is required");

  const initialDemandState = createInitialDemandState(pagePairs);
  const paperLowerBound = Math.ceil(initialDemandState.requiredQuantity / capacity);
  const unavoidablePairOverrun = paperLowerBound * capacity - initialDemandState.requiredQuantity;
  const rawRuns = [];

  initialDemandState.rows.forEach((row, index) => {
    const fullRunLength = Math.floor(row.requiredQuantity / capacity);
    if (fullRunLength === 0) return;
    const candidate = candidateFromAllocations({
      id: `${prefix}-BASE-${index + 1}`,
      rows: normalizedRows,
      columns: normalizedColumns,
      rotation,
      pagePairs,
      allocations: [{
        file: row.file,
        pairIndex: row.pairIndex,
        frontPage: row.frontPage,
        backPage: row.backPage,
        positionCount: capacity,
      }],
    });
    rawRuns.push(Object.freeze({ candidate, runLength: fullRunLength }));
  });

  const residualPacking = packResidualPairDemand({
    demandState: initialDemandState,
    capacity,
  });
  residualPacking.bins.forEach((bin, index) => {
    const candidate = candidateFromAllocations({
      id: `${prefix}-RESIDUAL-${index + 1}`,
      rows: normalizedRows,
      columns: normalizedColumns,
      rotation,
      pagePairs,
      allocations: bin.allocations,
    });
    rawRuns.push(Object.freeze({ candidate, runLength: 1 }));
  });

  const plannedRuns = mergeEquivalentRuns({
    rawRuns,
    pagePairs,
    rows: normalizedRows,
    columns: normalizedColumns,
    rotation,
    idPrefix: prefix,
  });

  let demandState = initialDemandState;
  const evaluationSteps = plannedRuns.map((plannedRun) => {
    const evaluation = evaluateCandidateRun({
      candidate: plannedRun.candidate,
      demandState,
      runLength: plannedRun.runLength,
    });
    demandState = evaluation.nextDemandState;
    return Object.freeze({
      candidateId: plannedRun.candidate.id,
      runLength: plannedRun.runLength,
      producedIncrement: evaluation.producedIncrement,
      remainingAfter: demandState.remainingQuantity,
      overrunIncrement: evaluation.overrunIncrement,
    });
  });

  const physicalSheets = plannedRuns.reduce((sum, run) => sum + run.runLength, 0);
  const fileMetrics = fileMetricsFromDemandState(demandState);
  const fileOverrun = fileMetrics.reduce((sum, metric) => sum + metric.overrun, 0);
  const lowerBoundReached = physicalSheets === paperLowerBound;
  const valid = demandState.allSatisfied;
  const optimality = valid && lowerBoundReached
    ? PAPER_OPTIMALITY.PROVEN_GLOBAL_MINIMUM
    : PAPER_OPTIMALITY.FEASIBLE_NOT_PROVEN;

  return Object.freeze({
    kind: PAPER_SOLUTION_KIND,
    duplexMode,
    rows: normalizedRows,
    columns: normalizedColumns,
    rotation: Number(rotation),
    capacity,
    valid,
    optimality,
    proof: Object.freeze({
      totalRequiredPairQuantity: initialDemandState.requiredQuantity,
      outputPerPhysicalSheet: capacity,
      paperLowerBound,
      lowerBoundReached,
      unavoidablePairOverrun,
      explanation: lowerBoundReached
        ? "A valid solution reaches ceil(total required pair quantity / positions per sheet)."
        : "The constructed solution is valid but does not reach the universal capacity lower bound.",
    }),
    metrics: Object.freeze({
      physicalSheets,
      impositionCount: plannedRuns.length,
      frontForms: plannedRuns.length,
      backForms: plannedRuns.length,
      forms: plannedRuns.length * 2,
      pressPasses: physicalSheets * 2,
      requiredPairQuantity: demandState.requiredQuantity,
      producedPairQuantity: demandState.producedQuantity,
      remainingPairQuantity: demandState.remainingQuantity,
      pairOverrun: demandState.overrunQuantity,
      fileOverrun,
    }),
    residualPacking,
    plannedRuns,
    evaluationSteps: Object.freeze(evaluationSteps),
    finalDemandState: demandState,
    fileMetrics,
  });
}

export function materializePaperSolution({ solution, pagePairs }) {
  if (!solution || solution.kind !== PAPER_SOLUTION_KIND || !Array.isArray(solution.plannedRuns)) {
    throw new TypeError("A paper minimum solution is required");
  }
  if (!solution.valid) {
    throw new RangeError("Cannot materialize an invalid paper solution");
  }

  return Object.freeze(solution.plannedRuns.map((plannedRun) => {
    const front = createFrontLayout({
      ...createFrontLayoutInputFromCandidate(plannedRun.candidate, plannedRun.runLength),
      pagePairs,
    });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    if (!validation.valid) {
      throw new Error(`Generated imposition ${front.id} failed validation: ${validation.errors.join("; ")}`);
    }
    return Object.freeze({ front, back, validation });
  }));
}
