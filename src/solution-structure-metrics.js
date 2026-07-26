export const SOLUTION_STRUCTURE_METRICS_KIND = "solutionStructureMetrics";

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new RangeError(`${label} is required`);
  return text;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function round(value, digits = 9) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function buildStructureMetrics(assignments, pairCountInput) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new TypeError("assignments must be a non-empty array");
  }
  const pairCount = positiveInteger(pairCountInput, "pairCount");
  if (assignments.length < pairCount) {
    throw new RangeError("assignment count cannot be smaller than pair count");
  }

  const seenPairs = new Set();
  const fileImpositions = new Map();
  const impositionFiles = new Map();

  assignments.forEach((assignment, index) => {
    const pairKey = requiredText(assignment?.pairKey, `assignments[${index}].pairKey`);
    const file = requiredText(assignment?.file, `assignments[${index}].file`);
    const impositionId = requiredText(
      assignment?.impositionId,
      `assignments[${index}].impositionId`,
    );
    seenPairs.add(pairKey);
    if (!fileImpositions.has(file)) fileImpositions.set(file, new Set());
    fileImpositions.get(file).add(impositionId);
    if (!impositionFiles.has(impositionId)) impositionFiles.set(impositionId, new Set());
    impositionFiles.get(impositionId).add(file);
  });

  if (seenPairs.size !== pairCount) {
    throw new RangeError(
      `assignment pair count ${seenPairs.size} does not match expected pair count ${pairCount}`,
    );
  }

  const assignmentCount = assignments.length;
  const fragmentedBlocks = assignmentCount - pairCount;
  const splitOrders = [...fileImpositions.values()].filter(
    (impositionIds) => impositionIds.size > 1,
  ).length;
  const distinctOrdersPerImposition = Math.max(
    1,
    ...[...impositionFiles.values()].map((files) => files.size),
  );

  return Object.freeze({
    kind: SOLUTION_STRUCTURE_METRICS_KIND,
    complete: true,
    pairCount,
    assignmentCount,
    splitOrders,
    fragmentedBlocks,
    distinctOrdersPerImposition,
    layoutCompactness: round(pairCount / assignmentCount),
  });
}

function incompleteStructureMetrics(pairCount = null) {
  return Object.freeze({
    kind: SOLUTION_STRUCTURE_METRICS_KIND,
    complete: false,
    pairCount,
    assignmentCount: null,
    splitOrders: 0,
    fragmentedBlocks: 0,
    distinctOrdersPerImposition: 1,
    layoutCompactness: null,
  });
}

export function calculateProductionReportStructureMetrics(report) {
  const pairMetrics = report?.pairMetrics;
  const totalsPairCount = Number(report?.totals?.pairCount);
  if (!Array.isArray(pairMetrics) || pairMetrics.length === 0) {
    const pairCount = Number.isInteger(totalsPairCount) && totalsPairCount > 0
      ? totalsPairCount
      : null;
    return incompleteStructureMetrics(pairCount);
  }

  if (
    Number.isInteger(totalsPairCount)
    && totalsPairCount > 0
    && totalsPairCount !== pairMetrics.length
  ) {
    throw new RangeError("report.totals.pairCount must match report.pairMetrics.length");
  }

  const assignments = [];
  pairMetrics.forEach((metric, pairIndex) => {
    const file = requiredText(metric?.file, `report.pairMetrics[${pairIndex}].file`);
    const normalizedPairIndex = positiveInteger(
      metric?.pairIndex,
      `report.pairMetrics[${pairIndex}].pairIndex`,
    );
    if (!Array.isArray(metric?.contributions) || metric.contributions.length === 0) {
      throw new RangeError(
        `report.pairMetrics[${pairIndex}].contributions must be non-empty`,
      );
    }
    metric.contributions.forEach((contribution, contributionIndex) => {
      assignments.push({
        pairKey: `${file}\u0000${normalizedPairIndex}`,
        file,
        impositionId: requiredText(
          contribution?.impositionId,
          `report.pairMetrics[${pairIndex}].contributions[${contributionIndex}].impositionId`,
        ),
      });
    });
  });

  return buildStructureMetrics(assignments, pairMetrics.length);
}

export function calculatePaperSolutionStructureMetrics(solution) {
  if (!solution || solution.valid !== true || !Array.isArray(solution.plannedRuns)) {
    throw new TypeError("A valid paper solution with plannedRuns is required");
  }
  if (solution.plannedRuns.length === 0) {
    throw new RangeError("paper solution plannedRuns must be non-empty");
  }
  const demandRows = solution?.finalDemandState?.rows;
  if (!Array.isArray(demandRows) || demandRows.length === 0) {
    throw new TypeError("paper solution finalDemandState.rows must be non-empty");
  }

  const assignments = [];
  solution.plannedRuns.forEach((run, runIndex) => {
    const impositionId = requiredText(
      run?.candidate?.id,
      `solution.plannedRuns[${runIndex}].candidate.id`,
    );
    const pairPositions = run?.candidate?.pairPositions;
    if (!Array.isArray(pairPositions) || pairPositions.length === 0) {
      throw new TypeError(
        `solution.plannedRuns[${runIndex}].candidate.pairPositions must be non-empty`,
      );
    }
    pairPositions.forEach((position, positionIndex) => {
      const file = requiredText(
        position?.file,
        `solution.plannedRuns[${runIndex}].candidate.pairPositions[${positionIndex}].file`,
      );
      const pairIndex = positiveInteger(
        position?.pairIndex,
        `solution.plannedRuns[${runIndex}].candidate.pairPositions[${positionIndex}].pairIndex`,
      );
      assignments.push({
        pairKey: String(position?.key ?? `${file}\u0000${pairIndex}`),
        file,
        impositionId,
      });
    });
  });

  return buildStructureMetrics(assignments, demandRows.length);
}
