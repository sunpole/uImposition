import {
  solveExactProductionSmallMaster,
  validateExactProductionSmallMasterPlan,
} from "./exact-production-small-master.js";
import { validateMultiProductSimplexColumn } from "./multi-product-simplex-columns.js";
import { validateMultiProductSeparateDuplexColumn } from "./multi-product-duplex-columns.js";

export const INTEGER_COLUMN_UTILITY_OBJECTIVES = Object.freeze([
  "physicalSheets",
  "layoutForms",
  "colorPlates",
  "pressPasses",
  "totalOverrun",
  "blankProductPositions",
]);

const SUPPORTED_OBJECTIVES = new Set(INTEGER_COLUMN_UTILITY_OBJECTIVES);

const COLUMN_FAMILIES = Object.freeze({
  multiProductSimplexColumn: Object.freeze({
    strategy: "singleSharedFrontFormCandidate",
    catalogFamily: "exactMultiProductSimplexCandidateColumns",
    validate: validateMultiProductSimplexColumn,
  }),
  multiProductSeparateDuplexColumn: Object.freeze({
    strategy: "separateFrontBackFormsCandidate",
    catalogFamily: "exactMultiProductSeparateDuplexCandidateColumns",
    validate: validateMultiProductSeparateDuplexColumn,
  }),
});

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

function normalizeObjectiveOrder(input = INTEGER_COLUMN_UTILITY_OBJECTIVES) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new RangeError("objectiveOrder must be a non-empty array");
  }
  const seen = new Set();
  return Object.freeze(input.map((value, index) => {
    const key = asNonEmptyString(value, `objectiveOrder[${index}]`);
    if (!SUPPORTED_OBJECTIVES.has(key)) throw new RangeError(`unsupported objective: ${key}`);
    if (seen.has(key)) throw new RangeError(`duplicate objective: ${key}`);
    seen.add(key);
    return key;
  }));
}

function comparePlanMetrics(first, second, objectiveOrder) {
  for (const key of objectiveOrder) {
    if (first.metrics[key] !== second.metrics[key]) {
      return first.metrics[key] - second.metrics[key];
    }
  }
  return 0;
}

function comparePlansStable(first, second, objectiveOrder) {
  const metricComparison = comparePlanMetrics(first, second, objectiveOrder);
  if (metricComparison !== 0) return metricComparison;
  return first.planSignature.localeCompare(second.planSignature);
}

function compareOptionalPlansStable(first, second, objectiveOrder) {
  if (first === null && second === null) return 0;
  if (first === null) return 1;
  if (second === null) return -1;
  return comparePlansStable(first, second, objectiveOrder);
}

function compareOptionalPlanMetrics(first, second, objectiveOrder) {
  if (first === null && second === null) return 0;
  if (first === null) return 1;
  if (second === null) return -1;
  return comparePlanMetrics(first, second, objectiveOrder);
}

function normalizeCatalog(columnCatalog) {
  if (!columnCatalog || typeof columnCatalog !== "object" || Array.isArray(columnCatalog)) {
    throw new TypeError("columnCatalog must be an object");
  }
  if (columnCatalog.coverage?.completeWithinRequestedSpace !== true
    || columnCatalog.coverage?.truncated !== false) {
    throw new RangeError("integer column utility requires a complete non-truncated catalog");
  }
  if (!Array.isArray(columnCatalog.demands) || columnCatalog.demands.length === 0) {
    throw new RangeError("columnCatalog.demands must be non-empty");
  }
  if (!Array.isArray(columnCatalog.columns) || columnCatalog.columns.length === 0) {
    throw new RangeError("columnCatalog.columns must be non-empty");
  }

  const columns = [...columnCatalog.columns].sort((a, b) => (
    a.columnSignature.localeCompare(b.columnSignature)
  ));
  const first = columns[0];
  const definition = COLUMN_FAMILIES[first.family];
  if (!definition) throw new RangeError(`unsupported production column family: ${first.family}`);
  if (columnCatalog.family !== definition.catalogFamily) {
    throw new RangeError("columnCatalog.family does not match its columns");
  }
  if (first.strategy !== definition.strategy) {
    throw new RangeError("column strategy does not match its family");
  }
  const demandJson = JSON.stringify(columnCatalog.demands);
  const geometrySignature = first.geometryPattern.structuralSignature;
  if (columnCatalog.geometryPattern?.structuralSignature !== geometrySignature) {
    throw new RangeError("columnCatalog.geometryPattern does not match its columns");
  }

  const seen = new Set();
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    if (column.family !== first.family || column.strategy !== first.strategy) {
      throw new RangeError("integer column utility cannot mix column families or strategies");
    }
    definition.validate(column);
    if (column.geometryPattern.structuralSignature !== geometrySignature) {
      throw new RangeError("integer column utility cannot mix geometry patterns");
    }
    if (JSON.stringify(column.demands) !== demandJson) {
      throw new RangeError("every column must use the catalog demands");
    }
    if (seen.has(column.columnSignature)) {
      throw new RangeError(`duplicate column signature: ${column.columnSignature}`);
    }
    seen.add(column.columnSignature);
  }

  return deepFreeze({
    source: columnCatalog,
    definition,
    family: first.family,
    strategy: first.strategy,
    geometryPattern: columnCatalog.geometryPattern,
    demands: columnCatalog.demands,
    columns: Object.freeze(columns),
  });
}

function normalizeExistingSignatures(context, input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new RangeError("existingColumnSignatures must be a non-empty array");
  }
  const known = new Set(context.columns.map(({ columnSignature }) => columnSignature));
  const seen = new Set();
  for (let index = 0; index < input.length; index += 1) {
    const signature = asNonEmptyString(input[index], `existingColumnSignatures[${index}]`);
    if (!known.has(signature)) {
      throw new RangeError(`existing column is not part of the supplied catalog: ${signature}`);
    }
    if (seen.has(signature)) throw new RangeError(`duplicate existing column signature: ${signature}`);
    seen.add(signature);
  }
  return Object.freeze([...seen].sort());
}

function createSubsetCatalog(context, signatures) {
  const bySignature = new Map(context.columns.map((column) => [column.columnSignature, column]));
  return deepFreeze({
    id: `integer-column-utility-subset:${signatures.join(";")}`,
    family: context.definition.catalogFamily,
    geometryPattern: context.geometryPattern,
    demands: context.demands,
    columns: Object.freeze(signatures.map((signature) => bySignature.get(signature))),
    coverage: {
      scope: "explicit restricted subset used by exact integer column utility",
      completeWithinRequestedSpace: true,
      truncated: false,
    },
  });
}

function solveSubset({
  context,
  signatures,
  maxSelectedColumns,
  maxRunLength,
  maxExactStateCount,
  objectiveOrder,
  id,
}) {
  const solution = solveExactProductionSmallMaster({
    id,
    columnCatalog: createSubsetCatalog(context, signatures),
    maxSelectedColumns: Math.min(maxSelectedColumns, signatures.length),
    maxRunLength,
    maxExactStateCount,
  });
  const bestPlan = [...solution.plans].sort((a, b) => (
    comparePlansStable(a, b, objectiveOrder)
  ))[0] ?? null;
  return deepFreeze({ solution, bestPlan });
}

function createMetricDeltas(baselinePlan, candidatePlan) {
  return Object.freeze(Object.fromEntries(INTEGER_COLUMN_UTILITY_OBJECTIVES.map((key) => [
    key,
    baselinePlan && candidatePlan
      ? candidatePlan.metrics[key] - baselinePlan.metrics[key]
      : null,
  ])));
}

function firstImprovedObjective(baselinePlan, candidatePlan, objectiveOrder) {
  if (!candidatePlan) return null;
  if (!baselinePlan) return "feasibility";
  for (const key of objectiveOrder) {
    if (candidatePlan.metrics[key] < baselinePlan.metrics[key]) return key;
    if (candidatePlan.metrics[key] > baselinePlan.metrics[key]) return null;
  }
  return null;
}

function compareEvaluations(first, second, objectiveOrder) {
  if (first.improving !== second.improving) return first.improving ? -1 : 1;
  const planComparison = compareOptionalPlansStable(
    first.bestPlanWithCandidate,
    second.bestPlanWithCandidate,
    objectiveOrder,
  );
  if (planComparison !== 0) return planComparison;
  return first.candidateColumnSignature.localeCompare(second.candidateColumnSignature);
}

function createRequestSignature({
  context,
  existing,
  objectiveOrder,
  maxSelectedColumns,
  maxRunLength,
  maxExactStateCount,
  maxCandidateEvaluationCount,
}) {
  return [
    "exact-integer-column-utility-request-v2",
    `family=${context.family}`,
    `strategy=${context.strategy}`,
    `geometry=${context.geometryPattern.structuralSignature}`,
    `existing=${existing.join(";")}`,
    `objectives=${objectiveOrder.join(",")}`,
    `limits=${maxSelectedColumns},${maxRunLength},${maxExactStateCount},${maxCandidateEvaluationCount}`,
  ].join("|");
}

function buildResult({
  id,
  columnCatalog,
  existingColumnSignatures,
  objectiveOrder,
  maxSelectedColumns,
  maxRunLength,
  maxExactStateCount,
  maxCandidateEvaluationCount,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  const context = normalizeCatalog(columnCatalog);
  const existing = normalizeExistingSignatures(context, existingColumnSignatures);
  const normalizedObjectiveOrder = normalizeObjectiveOrder(objectiveOrder);
  const limits = deepFreeze({
    maxSelectedColumns: asPositiveInteger(maxSelectedColumns, "maxSelectedColumns"),
    maxRunLength: asPositiveInteger(maxRunLength, "maxRunLength"),
    maxExactStateCount: asPositiveInteger(maxExactStateCount, "maxExactStateCount"),
    maxCandidateEvaluationCount: asPositiveInteger(
      maxCandidateEvaluationCount,
      "maxCandidateEvaluationCount",
    ),
  });
  const existingSet = new Set(existing);
  const candidates = context.columns.filter(({ columnSignature }) => !existingSet.has(columnSignature));
  if (candidates.length > limits.maxCandidateEvaluationCount) {
    throw new RangeError(
      `candidate evaluation count ${candidates.length} exceeds maxCandidateEvaluationCount ${limits.maxCandidateEvaluationCount}`,
    );
  }

  const baseline = solveSubset({
    context,
    signatures: existing,
    maxSelectedColumns: limits.maxSelectedColumns,
    maxRunLength: limits.maxRunLength,
    maxExactStateCount: limits.maxExactStateCount,
    objectiveOrder: normalizedObjectiveOrder,
    id: `${normalizedId}:baseline`,
  });

  const evaluations = candidates.map((candidateColumn) => {
    const restrictedColumnSignatures = Object.freeze([
      ...existing,
      candidateColumn.columnSignature,
    ].sort());
    const candidateSolve = solveSubset({
      context,
      signatures: restrictedColumnSignatures,
      maxSelectedColumns: limits.maxSelectedColumns,
      maxRunLength: limits.maxRunLength,
      maxExactStateCount: limits.maxExactStateCount,
      objectiveOrder: normalizedObjectiveOrder,
      id: `${normalizedId}:candidate:${candidateColumn.columnSignature}`,
    });
    const metricComparison = compareOptionalPlanMetrics(
      candidateSolve.bestPlan,
      baseline.bestPlan,
      normalizedObjectiveOrder,
    );
    const improving = metricComparison < 0;
    return deepFreeze({
      candidateColumn,
      candidateColumnSignature: candidateColumn.columnSignature,
      restrictedColumnSignatures,
      bestPlanWithCandidate: candidateSolve.bestPlan,
      exactSolutionWithCandidate: candidateSolve.solution,
      improving,
      metricallyEqualToBaseline: metricComparison === 0,
      createsFeasiblePlan: baseline.bestPlan === null && candidateSolve.bestPlan !== null,
      firstImprovedObjective: improving
        ? firstImprovedObjective(baseline.bestPlan, candidateSolve.bestPlan, normalizedObjectiveOrder)
        : null,
      metricDeltas: createMetricDeltas(baseline.bestPlan, candidateSolve.bestPlan),
    });
  }).sort((a, b) => compareEvaluations(a, b, normalizedObjectiveOrder));

  const improvingEvaluations = Object.freeze(evaluations.filter(({ improving }) => improving));
  return deepFreeze({
    id: normalizedId,
    family: "exactIntegerColumnUtilityOracleResult",
    columnFamily: context.family,
    columnStrategy: context.strategy,
    geometryPattern: context.geometryPattern,
    demands: context.demands,
    sourceColumnCatalog: context.source,
    existingColumnSignatures: existing,
    objectiveOrder: normalizedObjectiveOrder,
    limits,
    baselineSolution: baseline.solution,
    baselineBestPlan: baseline.bestPlan,
    candidateEvaluations: Object.freeze(evaluations),
    improvingCandidateEvaluations: improvingEvaluations,
    bestImprovingCandidateEvaluation: improvingEvaluations[0] ?? null,
    requestSignature: createRequestSignature({
      context,
      existing,
      objectiveOrder: normalizedObjectiveOrder,
      ...limits,
    }),
    coverage: {
      scope: "every non-existing single-column addition from the supplied complete small catalog",
      evaluatedCandidateCount: evaluations.length,
      improvingCandidateCount: improvingEvaluations.length,
      completeWithinSingleColumnAdditionSpace: true,
      suppliedCatalogComplete: true,
      suppliedCatalogTruncated: false,
      multipleNewColumnsEvaluatedTogether: false,
      fullCatalogProductionSearchPerformed: false,
      onDemandColumnGenerationPerformed: false,
      globalCompletenessClaimed: false,
    },
  });
}

export function validateExactIntegerColumnUtilityOracleResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("result must be an object");
  }
  if (result.family !== "exactIntegerColumnUtilityOracleResult") {
    throw new RangeError("result.family must be exactIntegerColumnUtilityOracleResult");
  }
  const expected = buildResult({
    id: result.id,
    columnCatalog: result.sourceColumnCatalog,
    existingColumnSignatures: result.existingColumnSignatures,
    objectiveOrder: result.objectiveOrder,
    maxSelectedColumns: result.limits?.maxSelectedColumns,
    maxRunLength: result.limits?.maxRunLength,
    maxExactStateCount: result.limits?.maxExactStateCount,
    maxCandidateEvaluationCount: result.limits?.maxCandidateEvaluationCount,
  });
  for (const key of [
    "columnFamily",
    "columnStrategy",
    "existingColumnSignatures",
    "objectiveOrder",
    "limits",
    "baselineSolution",
    "baselineBestPlan",
    "candidateEvaluations",
    "improvingCandidateEvaluations",
    "bestImprovingCandidateEvaluation",
    "requestSignature",
    "coverage",
  ]) {
    if (JSON.stringify(result[key]) !== JSON.stringify(expected[key])) {
      throw new RangeError(`exact integer column utility ${key} mismatch`);
    }
  }
  if (result.baselineBestPlan) validateExactProductionSmallMasterPlan(result.baselineBestPlan);
  for (const evaluation of result.candidateEvaluations) {
    if (evaluation.bestPlanWithCandidate) {
      validateExactProductionSmallMasterPlan(evaluation.bestPlanWithCandidate);
    }
  }
  return true;
}

export function evaluateExactIntegerColumnUtility({
  id = "exact-integer-column-utility",
  columnCatalog,
  existingColumnSignatures,
  objectiveOrder = INTEGER_COLUMN_UTILITY_OBJECTIVES,
  maxSelectedColumns = 4,
  maxRunLength = 100,
  maxExactStateCount = 1000000,
  maxCandidateEvaluationCount = 1000,
}) {
  const result = buildResult({
    id,
    columnCatalog,
    existingColumnSignatures,
    objectiveOrder,
    maxSelectedColumns,
    maxRunLength,
    maxExactStateCount,
    maxCandidateEvaluationCount,
  });
  validateExactIntegerColumnUtilityOracleResult(result);
  return result;
}
