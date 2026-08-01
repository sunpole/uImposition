import {
  createExactProductionSmallMasterPlan,
  validateExactProductionSmallMasterPlan,
} from "./exact-production-small-master.js";
import { validateRestrictedMasterProblem } from "./restricted-master-foundation.js";

const OBJECTIVE_KEYS = Object.freeze([
  "physicalSheets",
  "layoutForms",
  "colorPlates",
  "pressPasses",
  "totalOverrun",
  "blankProductPositions",
]);

function asPositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function asNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function comparePlans(a, b) {
  for (const key of OBJECTIVE_KEYS) {
    if (a.metrics[key] !== b.metrics[key]) return a.metrics[key] - b.metrics[key];
  }
  return a.planSignature.localeCompare(b.planSignature);
}

function dominates(a, b) {
  let strictlyBetter = false;
  for (const key of OBJECTIVE_KEYS) {
    if (a.metrics[key] > b.metrics[key]) return false;
    if (a.metrics[key] < b.metrics[key]) strictlyBetter = true;
  }
  return strictlyBetter;
}

function normalizeCandidateColumns(problem, candidateColumnSignaturesInput) {
  const bySignature = new Map(problem.columns.map((column) => [column.columnSignature, column]));
  const requested = candidateColumnSignaturesInput === undefined
    ? problem.initialColumns.initialColumnSignatures
    : candidateColumnSignaturesInput;
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new RangeError("candidateColumnSignatures must be a non-empty array");
  }
  const unique = [];
  const seen = new Set();
  for (let index = 0; index < requested.length; index += 1) {
    const signature = asNonEmptyString(
      requested[index],
      `candidateColumnSignatures[${index}]`,
    );
    if (seen.has(signature)) throw new RangeError(`duplicate candidate column signature: ${signature}`);
    const column = bySignature.get(signature);
    if (!column) throw new RangeError(`candidate column is not part of the problem: ${signature}`);
    seen.add(signature);
    unique.push(column);
  }

  const initialRank = new Map(problem.initialColumns.initialColumnSignatures.map(
    (signature, index) => [signature, index],
  ));
  unique.sort((a, b) => {
    const aRank = initialRank.get(a.columnSignature);
    const bRank = initialRank.get(b.columnSignature);
    if (aRank !== undefined || bRank !== undefined) {
      if (aRank === undefined) return 1;
      if (bRank === undefined) return -1;
      if (aRank !== bRank) return aRank - bRank;
    }
    return a.columnSignature.localeCompare(b.columnSignature);
  });
  return Object.freeze(unique);
}

function allocationVector(column) {
  return column.allocation.map(({ positionsPerSheet }) => positionsPerSheet);
}

function occupiedPositions(column) {
  return column.metrics.occupiedPositionsPerSheet;
}

function isProducedEnough(problem, produced) {
  return problem.demands.every((demand, index) => produced[index] >= demand.requiredQuantity);
}

function createPlan(problem, id, runs) {
  return createExactProductionSmallMasterPlan({
    id,
    demands: problem.demands,
    columnFamily: problem.columnFamily,
    columnStrategy: problem.columnStrategy,
    runs,
  });
}

function requiredRunForSingleColumn(problem, column) {
  const coefficients = allocationVector(column);
  let requiredRun = 0;
  for (let index = 0; index < problem.demands.length; index += 1) {
    if (coefficients[index] <= 0) return null;
    requiredRun = Math.max(
      requiredRun,
      Math.ceil(problem.demands[index].requiredQuantity / coefficients[index]),
    );
  }
  return requiredRun;
}

function createGreedyPlans(problem, columns, maxSelectedColumns, maxRunLength) {
  const plans = [];
  for (const column of columns) {
    const runLength = requiredRunForSingleColumn(problem, column);
    if (runLength !== null && runLength <= maxRunLength) {
      plans.push(Object.freeze({
        source: "singleCoveringColumn",
        plan: createPlan(problem, `greedy-single:${column.columnSignature}`, [{ column, runLength }]),
      }));
    }
  }

  if (problem.demands.length <= maxSelectedColumns) {
    const selected = [];
    for (let demandIndex = 0; demandIndex < problem.demands.length; demandIndex += 1) {
      const candidates = columns.filter((column) => {
        const coefficients = allocationVector(column);
        return coefficients[demandIndex] > 0
          && coefficients.every((value, index) => index === demandIndex || value === 0);
      }).sort((a, b) => {
        const aValue = allocationVector(a)[demandIndex];
        const bValue = allocationVector(b)[demandIndex];
        if (aValue !== bValue) return bValue - aValue;
        return a.columnSignature.localeCompare(b.columnSignature);
      });
      if (!candidates[0]) {
        selected.length = 0;
        break;
      }
      const column = candidates[0];
      const coefficient = allocationVector(column)[demandIndex];
      const runLength = Math.ceil(problem.demands[demandIndex].requiredQuantity / coefficient);
      if (runLength > maxRunLength) {
        selected.length = 0;
        break;
      }
      selected.push({ column, runLength });
    }
    if (selected.length > 0) {
      plans.push(Object.freeze({
        source: "dedicatedColumns",
        plan: createPlan(problem, "greedy-dedicated", selected),
      }));
    }
  }
  return Object.freeze(plans);
}

function candidateSpecificRootLowerBound(problem, columns) {
  const maximumByDemand = problem.demands.map((_, demandIndex) => Math.max(
    ...columns.map((column) => allocationVector(column)[demandIndex]),
  ));
  const perDemand = problem.demands.map((demand, index) => Object.freeze({
    demandId: demand.demandId,
    maximumPositionsPerSheet: maximumByDemand[index],
    physicalSheetsLowerBound: maximumByDemand[index] > 0
      ? Math.ceil(demand.requiredQuantity / maximumByDemand[index])
      : null,
  }));
  const maximumTotalPositionsPerSheet = Math.max(...columns.map(occupiedPositions));
  const totalRequiredQuantity = problem.demands.reduce(
    (sum, demand) => sum + demand.requiredQuantity,
    0,
  );
  const aggregateDemandBound = Math.ceil(totalRequiredQuantity / maximumTotalPositionsPerSheet);
  const impossibleDemand = perDemand.some(({ physicalSheetsLowerBound }) => physicalSheetsLowerBound === null);
  const lowerBound = impossibleDemand
    ? null
    : Math.max(
      aggregateDemandBound,
      ...perDemand.map(({ physicalSheetsLowerBound }) => physicalSheetsLowerBound),
    );
  return deepFreeze({
    perDemand: Object.freeze(perDemand),
    maximumTotalPositionsPerSheet,
    aggregateDemandBound,
    lowerBound,
  });
}

function remainingCapacityCanCover({
  problem,
  columns,
  startIndex,
  remainingSelections,
  maxRunLength,
  produced,
}) {
  if (remainingSelections <= 0) return isProducedEnough(problem, produced);
  const remaining = columns.slice(startIndex);
  for (let demandIndex = 0; demandIndex < problem.demands.length; demandIndex += 1) {
    const deficit = Math.max(0, problem.demands[demandIndex].requiredQuantity - produced[demandIndex]);
    if (deficit === 0) continue;
    const maximumAdditional = remaining
      .map((column) => allocationVector(column)[demandIndex])
      .sort((a, b) => b - a)
      .slice(0, remainingSelections)
      .reduce((sum, coefficient) => sum + (coefficient * maxRunLength), 0);
    if (maximumAdditional < deficit) return false;
  }
  const totalDeficit = problem.demands.reduce(
    (sum, demand, index) => sum + Math.max(0, demand.requiredQuantity - produced[index]),
    0,
  );
  const maximumAggregateAdditional = remaining
    .map(occupiedPositions)
    .sort((a, b) => b - a)
    .slice(0, remainingSelections)
    .reduce((sum, count) => sum + (count * maxRunLength), 0);
  return maximumAggregateAdditional >= totalDeficit;
}

function additionalSheetLowerBound({ problem, columns, startIndex, produced }) {
  const remaining = columns.slice(startIndex);
  if (remaining.length === 0) return isProducedEnough(problem, produced) ? 0 : Number.POSITIVE_INFINITY;
  let lowerBound = 0;
  for (let demandIndex = 0; demandIndex < problem.demands.length; demandIndex += 1) {
    const deficit = Math.max(0, problem.demands[demandIndex].requiredQuantity - produced[demandIndex]);
    if (deficit === 0) continue;
    const maximumContribution = Math.max(
      ...remaining.map((column) => allocationVector(column)[demandIndex]),
    );
    if (maximumContribution <= 0) return Number.POSITIVE_INFINITY;
    lowerBound = Math.max(lowerBound, Math.ceil(deficit / maximumContribution));
  }
  const totalDeficit = problem.demands.reduce(
    (sum, demand, index) => sum + Math.max(0, demand.requiredQuantity - produced[index]),
    0,
  );
  if (totalDeficit > 0) {
    const maximumOccupied = Math.max(...remaining.map(occupiedPositions));
    lowerBound = Math.max(lowerBound, Math.ceil(totalDeficit / maximumOccupied));
  }
  return lowerBound;
}

function* prioritizedRunLengths(problem, column, produced, maxRunLength) {
  const coefficients = allocationVector(column);
  const preferred = new Set([1, maxRunLength]);
  for (let index = 0; index < problem.demands.length; index += 1) {
    const deficit = Math.max(0, problem.demands[index].requiredQuantity - produced[index]);
    if (deficit > 0 && coefficients[index] > 0) {
      preferred.add(Math.min(maxRunLength, Math.ceil(deficit / coefficients[index])));
    }
  }
  const sortedPreferred = [...preferred].filter((value) => value >= 1 && value <= maxRunLength)
    .sort((a, b) => a - b);
  for (const value of sortedPreferred) yield value;
  for (let value = 1; value <= maxRunLength; value += 1) {
    if (!preferred.has(value)) yield value;
  }
}

function updatePareto(frontier, plan) {
  if (frontier.some((candidate) => dominates(candidate, plan))) return frontier;
  const next = frontier.filter((candidate) => !dominates(plan, candidate));
  if (!next.some((candidate) => candidate.planSignature === plan.planSignature)) next.push(plan);
  next.sort(comparePlans);
  return next;
}

function summarizeIncumbent(plan, source, sequence) {
  return Object.freeze({
    sequence,
    source,
    planSignature: plan.planSignature,
    metrics: plan.metrics,
  });
}

function buildSearchResult({
  id,
  problem,
  columns,
  bestPlan,
  paretoPlans,
  incumbentHistory,
  counters,
  limits,
  truncationReasons,
  rootLowerBound,
}) {
  const truncated = truncationReasons.size > 0;
  const completeWithinRestrictedColumnSpace = !truncated;
  const provenOptimalWithinRestrictedSpace = completeWithinRestrictedColumnSpace && bestPlan !== null;
  const provenInfeasibleWithinRestrictedSpace = completeWithinRestrictedColumnSpace && bestPlan === null;
  const bestSheets = bestPlan?.metrics.physicalSheets ?? null;
  const lowerBound = provenOptimalWithinRestrictedSpace
    ? bestSheets
    : rootLowerBound.lowerBound;
  const absoluteGap = bestSheets !== null && lowerBound !== null
    ? Math.max(0, bestSheets - lowerBound)
    : null;
  const relativeGap = absoluteGap !== null && bestSheets > 0
    ? absoluteGap / bestSheets
    : null;
  return deepFreeze({
    id,
    family: "restrictedMasterSearchResult",
    problemSignature: problem.problemSignature,
    columnFamily: problem.columnFamily,
    columnStrategy: problem.columnStrategy,
    candidateColumnSignatures: Object.freeze(columns.map(({ columnSignature }) => columnSignature)),
    bestPlan,
    encounteredParetoPlans: Object.freeze([...paretoPlans].sort(comparePlans)),
    incumbentHistory: Object.freeze(incumbentHistory),
    bounds: {
      rootPhysicalSheetsLowerBound: rootLowerBound.lowerBound,
      provenPhysicalSheetsLowerBound: lowerBound,
      bestPhysicalSheets: bestSheets,
      absoluteGap,
      relativeGap,
    },
    counters: {
      visitedStateCount: counters.visitedStateCount,
      evaluatedRunStateCount: counters.evaluatedRunStateCount,
      feasiblePlanCount: counters.feasiblePlanCount,
      objectivePrunedStateCount: counters.objectivePrunedStateCount,
      capacityPrunedStateCount: counters.capacityPrunedStateCount,
      duplicateFeasiblePlanCount: counters.duplicateFeasiblePlanCount,
    },
    coverage: {
      scope: "bounded branch-and-bound over the explicit restricted candidate-column set",
      candidateColumnCount: columns.length,
      maxSelectedColumns: limits.maxSelectedColumns,
      maxRunLength: limits.maxRunLength,
      maxStates: limits.maxStates,
      maxMilliseconds: limits.maxMilliseconds,
      completeWithinRestrictedColumnSpace,
      provenOptimalWithinRestrictedSpace,
      provenInfeasibleWithinRestrictedSpace,
      truncated,
      truncationReasons: Object.freeze([...truncationReasons].sort()),
      objectiveOrder: OBJECTIVE_KEYS,
      objectivePruningUsed: true,
      completeFeasibleCatalogEnumerated: false,
      pricingPerformed: false,
      columnsOutsideRestrictedSetConsidered: false,
      globalCompletenessClaimed: false,
    },
  });
}

export function validateRestrictedMasterSearchResult(result, problem) {
  validateRestrictedMasterProblem(problem);
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("result must be an object");
  }
  if (result.family !== "restrictedMasterSearchResult") {
    throw new RangeError("result.family must be restrictedMasterSearchResult");
  }
  if (result.problemSignature !== problem.problemSignature) {
    throw new RangeError("result problemSignature mismatch");
  }
  const problemColumns = new Set(problem.columns.map(({ columnSignature }) => columnSignature));
  const seenCandidates = new Set();
  for (const signature of result.candidateColumnSignatures ?? []) {
    if (!problemColumns.has(signature)) throw new RangeError("result references a column outside the problem");
    if (seenCandidates.has(signature)) throw new RangeError("result contains duplicate candidate signatures");
    seenCandidates.add(signature);
  }
  if (seenCandidates.size === 0) throw new RangeError("result must contain candidate columns");
  for (const plan of [result.bestPlan, ...(result.encounteredParetoPlans ?? [])].filter(Boolean)) {
    validateExactProductionSmallMasterPlan(plan);
    if (plan.columnFamily !== problem.columnFamily || plan.columnStrategy !== problem.columnStrategy) {
      throw new RangeError("result plan production family mismatch");
    }
    const candidateSet = new Set(result.candidateColumnSignatures);
    if (plan.runs.some(({ column }) => !candidateSet.has(column.columnSignature))) {
      throw new RangeError("result plan uses a column outside the restricted set");
    }
  }
  if (result.bestPlan) {
    if (!(result.encounteredParetoPlans ?? []).some(
      (plan) => plan.planSignature === result.bestPlan.planSignature,
    )) {
      throw new RangeError("bestPlan must be retained in encounteredParetoPlans");
    }
  }
  if (result.coverage?.truncated !== (result.coverage?.truncationReasons?.length > 0)) {
    throw new RangeError("result truncation status mismatch");
  }
  if (result.coverage?.completeWithinRestrictedColumnSpace === result.coverage?.truncated) {
    throw new RangeError("result complete/truncated status mismatch");
  }
  if (result.coverage?.provenOptimalWithinRestrictedSpace
    && (!result.bestPlan || result.coverage.truncated || result.bounds.absoluteGap !== 0)) {
    throw new RangeError("invalid proven-optimal status");
  }
  if (result.coverage?.provenInfeasibleWithinRestrictedSpace
    && (result.bestPlan || result.coverage.truncated)) {
    throw new RangeError("invalid proven-infeasible status");
  }
  for (const key of [
    "visitedStateCount",
    "evaluatedRunStateCount",
    "feasiblePlanCount",
    "objectivePrunedStateCount",
    "capacityPrunedStateCount",
    "duplicateFeasiblePlanCount",
  ]) {
    if (!Number.isInteger(result.counters?.[key]) || result.counters[key] < 0) {
      throw new RangeError(`result counter ${key} must be a non-negative integer`);
    }
  }
  return true;
}

export function solveRestrictedMaster({
  id = "restricted-master-search",
  problem,
  candidateColumnSignatures,
  maxStates = problem?.limits?.maxStates,
  maxMilliseconds = problem?.limits?.maxMilliseconds,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  validateRestrictedMasterProblem(problem);
  const columns = normalizeCandidateColumns(problem, candidateColumnSignatures);
  const limits = Object.freeze({
    maxSelectedColumns: Math.min(problem.limits.maxSelectedColumns, columns.length),
    maxRunLength: problem.limits.maxRunLength,
    maxStates: asPositiveInteger(maxStates, "maxStates"),
    maxMilliseconds: asPositiveInteger(maxMilliseconds, "maxMilliseconds"),
  });
  const rootLowerBound = candidateSpecificRootLowerBound(problem, columns);
  const counters = {
    visitedStateCount: 0,
    evaluatedRunStateCount: 0,
    feasiblePlanCount: 0,
    objectivePrunedStateCount: 0,
    capacityPrunedStateCount: 0,
    duplicateFeasiblePlanCount: 0,
  };
  const truncationReasons = new Set();
  const startTime = Date.now();
  let bestPlan = null;
  let paretoPlans = [];
  const incumbentHistory = [];
  const feasibleSignatures = new Set();
  let incumbentSequence = 0;

  function withinBudget() {
    if (counters.visitedStateCount >= limits.maxStates) {
      truncationReasons.add("stateLimit");
      return false;
    }
    if (Date.now() - startTime >= limits.maxMilliseconds) {
      truncationReasons.add("timeLimit");
      return false;
    }
    return true;
  }

  function recordPlan(plan, source) {
    if (feasibleSignatures.has(plan.planSignature)) {
      counters.duplicateFeasiblePlanCount += 1;
      return;
    }
    feasibleSignatures.add(plan.planSignature);
    counters.feasiblePlanCount += 1;
    paretoPlans = updatePareto(paretoPlans, plan);
    if (!bestPlan || comparePlans(plan, bestPlan) < 0) {
      bestPlan = plan;
      incumbentSequence += 1;
      incumbentHistory.push(summarizeIncumbent(plan, source, incumbentSequence));
    }
  }

  for (const greedy of createGreedyPlans(
    problem,
    columns,
    limits.maxSelectedColumns,
    limits.maxRunLength,
  )) {
    recordPlan(greedy.plan, greedy.source);
  }

  if (problem.feasibility.proofType === "provenInfeasibleWithinLimits"
    || rootLowerBound.lowerBound === null) {
    const result = buildSearchResult({
      id: normalizedId,
      problem,
      columns,
      bestPlan,
      paretoPlans,
      incumbentHistory,
      counters,
      limits,
      truncationReasons,
      rootLowerBound,
    });
    validateRestrictedMasterSearchResult(result, problem);
    return result;
  }

  const initialProduced = Object.freeze(problem.demands.map(() => 0));

  function visit(startIndex, runs, produced, physicalSheets) {
    if (!withinBudget()) return;
    counters.visitedStateCount += 1;
    if (runs.length > 0) counters.evaluatedRunStateCount += 1;

    const feasible = runs.length > 0 && isProducedEnough(problem, produced);
    if (feasible) {
      recordPlan(createPlan(
        problem,
        `${normalizedId}:state-${counters.visitedStateCount}`,
        runs,
      ), "branchAndBound");
    }

    if (runs.length >= limits.maxSelectedColumns || startIndex >= columns.length) return;
    if (bestPlan && physicalSheets >= bestPlan.metrics.physicalSheets) {
      counters.objectivePrunedStateCount += 1;
      return;
    }

    const remainingSelections = limits.maxSelectedColumns - runs.length;
    if (!remainingCapacityCanCover({
      problem,
      columns,
      startIndex,
      remainingSelections,
      maxRunLength: limits.maxRunLength,
      produced,
    })) {
      counters.capacityPrunedStateCount += 1;
      return;
    }

    if (bestPlan) {
      const additionalLowerBound = additionalSheetLowerBound({
        problem,
        columns,
        startIndex,
        produced,
      });
      if (physicalSheets + additionalLowerBound > bestPlan.metrics.physicalSheets) {
        counters.objectivePrunedStateCount += 1;
        return;
      }
    }

    for (let columnIndex = startIndex; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];
      const coefficients = allocationVector(column);
      for (const runLength of prioritizedRunLengths(
        problem,
        column,
        produced,
        limits.maxRunLength,
      )) {
        if (!withinBudget()) return;
        const nextProduced = produced.map(
          (value, demandIndex) => value + (coefficients[demandIndex] * runLength),
        );
        visit(
          columnIndex + 1,
          [...runs, Object.freeze({ column, runLength })],
          nextProduced,
          physicalSheets + runLength,
        );
        if (truncationReasons.size > 0) return;
      }
    }
  }

  visit(0, [], initialProduced, 0);
  const result = buildSearchResult({
    id: normalizedId,
    problem,
    columns,
    bestPlan,
    paretoPlans,
    incumbentHistory,
    counters,
    limits,
    truncationReasons,
    rootLowerBound,
  });
  validateRestrictedMasterSearchResult(result, problem);
  return result;
}
