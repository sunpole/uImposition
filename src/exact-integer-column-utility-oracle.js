import {
  solveExactProductionSmallMaster,
  validateExactProductionSmallMasterPlan,
} from "./exact-production-small-master.js";
import { validateMultiProductSimplexColumn } from "./multi-product-simplex-columns.js";
import { validateMultiProductSeparateDuplexColumn } from "./multi-product-duplex-columns.js";

const DEFAULT_OBJECTIVE_ORDER = Object.freeze([
  "physicalSheets",
  "layoutForms",
  "colorPlates",
  "pressPasses",
  "totalOverrun",
  "blankProductPositions",
]);

const SUPPORTED_OBJECTIVES = new Set(DEFAULT_OBJECTIVE_ORDER);

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

function normalizeObjectiveOrder(input = DEFAULT_OBJECTIVE_ORDER) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new RangeError("objectiveOrder must be a non-empty array");
  }
  const seen = new Set();
  const result = input.map((value, index) => {
    const key = asNonEmptyString(value, `objectiveOrder[${index}]`);
    if (!SUPPORTED_OBJECTIVES.has(key)) throw new RangeError(`unsupported objective: ${key}`);
    if (seen.has(key)) throw new RangeError(`duplicate objective: ${key}`);
    seen.add(key);
    return key;
  });
  return Object.freeze(result);
}

function comparePlans(first, second, objectiveOrder) {
  for (const key of objectiveOrder) {
    if (first.metrics[key] !== second.metrics[key]) {
      return first.metrics[key] - second.metrics[key];
    }
  }
  return first.planSignature.localeCompare(second.planSignature);
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
  const demandJson = JSON.stringify(columnCatalog.demands);
  const geometrySignature = first.geometryPattern.structuralSignature;
  const seen = new Set();
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    const columnDefinition = COLUMN_FAMILIES[column.family];
    if (columnDefinition !== definition || column.strategy !== definition.strategy) {
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
    demands: columnCatalog.demands,
    geometryPattern: columnCatalog.geometryPattern,
    columns,
    bySignature: new Map(columns.map((column) => [column.columnSignature, column])),
  });
}

function normalizeExistingSignatures(context, input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new RangeError("existingColumnSignatures must be a non-empty array");
  }
  const seen = new Set();
  for (let index = 0; index < input.length; index += 1) {
    const signature = asNonEmptyString(input[index], `existingColumnSignatures[${index}]`);
    if (!context.bySignature.has(signature)) {
      throw new RangeError(`existing column is not part of the supplied catalog: ${signature}`);
    }
    if (seen.has(signature)) throw new RangeError(`duplicate existing column signature: ${signature}`);
    seen.add(signature);
  }
  return Object.freeze([...seen].sort());
}

function createSubsetCatalog(context, signatures) {
  const columns = signatures.map((signature) => context.bySignature.get(signature));
  return deepFreeze({
    id: `integer-column-utility-subset:${signatures.join(";")}`,
    family: context.definition.catalogFamily,
    geometryPattern: context.geometryPattern,
    demands: context.demands,
    columns: Object.freeze(columns),
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
  const catalog = createSubsetCatalog(context, signatures);
  const solution = solveExactProductionSmallMaster({
    id,
    columnCatalog: catalog,
    maxSelectedColumns: Math.min(maxSelectedColumns, signatures.length),
    maxRunLength,
    maxExactStateCount,
  });
  const bestPlan = [...solution.plans].sort((a, b) => comparePlans(a, b, objectiveOrder))[0] ?? null;
  return deepFreeze({ solution, bestPlan });
}

function compareOptionalPlans(first, second, objectiveOrder) {
  if (first === null && second === null) return 0;
  if (first === null) return 1;
  if (second === null) return -1;
  return comparePlans(first, second, objectiveOrder);
}

function createMetricDeltas(baselinePlan, candidatePlan) {
  return Object.freeze(Object.fromEntries(DEFAULT_OBJECTIVE_ORDER.map((key) => [
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
  const byPlan = compareOptionalPlans(first.bestPlanWithCandidate, second.bestPlanWithCandidate, objectiveOrder);
  if (byPlan !== 0) return byPlan;
  return first.candidateColumnSignature.localeCompare(second.candidateColumnSignature);
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
  const normalizedMaxSelectedColumns = asPositiveInteger(maxSelectedColumns, "maxSelectedColumns");
  const normalizedMaxRunLength = asPositiveInteger(maxRunLength, "maxRunLength");
  const normalizedMaxExactStateCount = asPositiveInteger(
    maxExactStateCount,
    "maxExactStateCount",
  );
  const normalizedMaxCandidateEvaluationCount = asPositiveInteger(
    maxCandidateEvaluationCount,
    "maxCandidateEvaluationCount",
  );
  const existingSet = new Set(existing);
  const candidateColumns = context.columns.filter(({ columnSignature }) => !existingSet.has(columnSignature));
  if (candidateColumns.length > normalizedMaxCandidateEvaluationCount) {
    throw new RangeError(
      `candidate evaluation count ${candidateColumns.length} exceeds maxCandidateEvaluationCount ${normalizedMaxCandidateEvaluationCount}`,
    );
  }

  const baseline = solveSubset({
    context,
    signatures: existing,
    maxSelectedColumns: normalizedMaxSelectedColumns,
    maxRunLength: normalizedMaxRunLength,
    maxExactStateCount: normalizedMaxExactStateCount,
    objectiveOrder: normalizedObjectiveOrder,
    id: `${normalizedId}:baseline`,
  });

  const evaluations = candidateColumns.map((candidateColumn) => {
    const signatures = Object.freeze([...existing, candidateColumn.columnSignature].sort());
    const candidateSolve = solveSubset({
      context,
      signatures,
      maxSelectedColumns: normalizedMaxSelectedColumns,
      maxRunLength: normalizedMaxRunLength,
      maxExactStateCount: normalizedMaxExactStateCount,
      objectiveOrder: normalizedObjectiveOrder,
      id: `${normalizedId}:candidate:${candidateColumn.columnSignature}`,
    });
    const comparison = compareOptionalPlans(
      candidateSolve.bestPlan,
      baseline.bestPlan,
      normalizedObjectiveOrder,
    );
    const improving = comparison < 0;
    return deepFreeze({
      candidateColumn,
      candidateColumnSignature: candidateColumn.columnSignature,
      restrictedColumnSignatures: signatures,
      bestPlanWithCandidate: candidateSolve.bestPlan,
      exactSolutionWithCandidate: candidateSolve.solution,
      improving,
      createsFeasiblePlan: baseline.bestPlan === null && candidateSolve.bestPlan !== null,
      firstImprovedObjective: improving
        ? firstImprovedObjective(baseline.bestPlan, candidateSolve.bestPlan, normalizedObjectiveOrder)
        : null,
      metricDeltas: createMetricDeltas(baseline.bestPlan, candidateSolve.bestPlan),
    });
  }).sort((a, b) => compareEvaluations(a, b, normalizedObjectiveOrder));

  const improvingEvaluations = evaluations.filter(({ improving }) => improving);
  return deepFreeze({
    id: normalizedId,
    family: "exactIntegerColumnUtilityOracleResult",
    columnFamily: context.family,
    columnStrategy: context.strategy,
    geometryPattern: context.geometryPattern,
    demands: context.demands,
    existingColumnSignatures: existing,
    objectiveOrder: normalizedObjectiveOrder,
    limits: {
      maxSelectedColumns: normalizedMaxSelectedColumns,
      maxRunLength: normalizedMaxRunLength,
      maxExactStateCount: normalizedMaxExactStateCount,
      maxCandidateEvaluationCount: normalizedMaxCandidateEvaluationCount,
    },
    baselineSolution: baseline.solution,
    baselineBestPlan: baseline.bestPlan,
    candidateEvaluations: Object.freeze(evaluations),
    improvingCandidateEvaluations: Object.freeze(improvingEvaluations),
    bestImprovingCandidateEvaluation: improvingEvaluations[0] ?? null,
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
  if (result.baselineBestPlan) validateExactProductionSmallMasterPlan(result.baselineBestPlan);
  const existingSet = new Set(result.existingColumnSignatures ?? []);
  for (const evaluation of result.candidateEvaluations ?? []) {
    if (existingSet.has(evaluation.candidateColumnSignature)) {
      throw new RangeError("candidate evaluation repeats an existing column");
    }
    if (!evaluation.restrictedColumnSignatures.includes(evaluation.candidateColumnSignature)) {
      throw new RangeError("candidate restricted set must include the evaluated column");
    }
    if (evaluation.bestPlanWithCandidate) {
      validateExactProductionSmallMasterPlan(evaluation.bestPlanWithCandidate);
    }
    const expectedImproving = compareOptionalPlans(
      evaluation.bestPlanWithCandidate,
      result.baselineBestPlan,
      result.objectiveOrder,
    ) < 0;
    if (evaluation.improving !== expectedImproving) {
      throw new RangeError("candidate improving status mismatch");
    }
  }
  const improving = (result.candidateEvaluations ?? []).filter(({ improving }) => improving);
  if (JSON.stringify(improving) !== JSON.stringify(result.improvingCandidateEvaluations)) {
    throw new RangeError("improving candidate list mismatch");
  }
  if ((result.bestImprovingCandidateEvaluation?.candidateColumnSignature ?? null)
    !== (improving[0]?.candidateColumnSignature ?? null)) {
    throw new RangeError("best improving candidate mismatch");
  }
  return true;
}

export function evaluateExactIntegerColumnUtility({
  id = "exact-integer-column-utility",
  columnCatalog,
  existingColumnSignatures,
  objectiveOrder = DEFAULT_OBJECTIVE_ORDER,
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
