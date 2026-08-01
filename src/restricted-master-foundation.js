import { validateMultiProductSimplexColumn } from "./multi-product-simplex-columns.js";
import { validateMultiProductSeparateDuplexColumn } from "./multi-product-duplex-columns.js";

const DEFAULT_MAX_SELECTED_COLUMNS = 4;
const DEFAULT_MAX_RUN_LENGTH = 1000000;
const DEFAULT_INITIAL_MIXED_COLUMN_LIMIT = 8;

const COLUMN_FAMILIES = Object.freeze({
  multiProductSimplexColumn: Object.freeze({
    strategy: "singleSharedFrontFormCandidate",
    catalogFamily: "exactMultiProductSimplexCandidateColumns",
    blankMetricKey: "blankPositionsPerSheet",
    validate: validateMultiProductSimplexColumn,
  }),
  multiProductSeparateDuplexColumn: Object.freeze({
    strategy: "separateFrontBackFormsCandidate",
    catalogFamily: "exactMultiProductSeparateDuplexCandidateColumns",
    blankMetricKey: "blankPositionsPerSide",
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

function asNonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
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

function compareColumns(a, b) {
  return a.columnSignature.localeCompare(b.columnSignature);
}

function familyDefinition(column, label) {
  if (!column || typeof column !== "object" || Array.isArray(column)) {
    throw new TypeError(`${label} must be an object`);
  }
  const definition = COLUMN_FAMILIES[column.family];
  if (!definition) throw new RangeError(`unsupported production column family: ${column.family}`);
  if (column.strategy !== definition.strategy) {
    throw new RangeError(`${label}.strategy does not match ${column.family}`);
  }
  definition.validate(column);
  return definition;
}

function normalizeColumnMetrics(column, definition, label) {
  const metrics = column.metrics;
  const geometryCapacity = asPositiveInteger(metrics?.geometryCapacity, `${label}.metrics.geometryCapacity`);
  const occupiedPositionsPerSheet = asPositiveInteger(
    metrics?.occupiedPositionsPerSheet,
    `${label}.metrics.occupiedPositionsPerSheet`,
  );
  const blankProductPositionsPerSheet = asNonNegativeInteger(
    metrics?.[definition.blankMetricKey],
    `${label}.metrics.${definition.blankMetricKey}`,
  );
  if (occupiedPositionsPerSheet + blankProductPositionsPerSheet !== geometryCapacity) {
    throw new RangeError(`${label} occupied and blank positions must equal geometry capacity`);
  }
  return Object.freeze({
    geometryCapacity,
    occupiedPositionsPerSheet,
    blankProductPositionsPerSheet,
    activeDemandCount: asPositiveInteger(metrics.activeDemandCount, `${label}.metrics.activeDemandCount`),
    layoutFormsPerColumn: asPositiveInteger(
      metrics.layoutFormsPerColumn,
      `${label}.metrics.layoutFormsPerColumn`,
    ),
    colorPlatesPerColumn: asPositiveInteger(
      metrics.colorPlatesPerColumn,
      `${label}.metrics.colorPlatesPerColumn`,
    ),
    pressPassesPerSheet: asPositiveInteger(
      metrics.pressPassesPerSheet,
      `${label}.metrics.pressPassesPerSheet`,
    ),
  });
}

function normalizeColumnCatalog(columnCatalog) {
  if (!columnCatalog || typeof columnCatalog !== "object" || Array.isArray(columnCatalog)) {
    throw new TypeError("columnCatalog must be an object");
  }
  if (!Array.isArray(columnCatalog.demands) || columnCatalog.demands.length === 0) {
    throw new RangeError("columnCatalog.demands must be non-empty");
  }
  if (!Array.isArray(columnCatalog.columns) || columnCatalog.columns.length === 0) {
    throw new RangeError("columnCatalog.columns must be non-empty");
  }
  if (columnCatalog.coverage?.completeWithinRequestedSpace !== true
    || columnCatalog.coverage?.truncated !== false) {
    throw new RangeError("restricted master requires a complete non-truncated supplied column catalog");
  }

  const demands = columnCatalog.demands;
  const demandSignature = JSON.stringify(demands);
  const columns = [...columnCatalog.columns].sort(compareColumns);
  const firstDefinition = familyDefinition(columns[0], "columnCatalog.columns[0]");
  const columnFamily = columns[0].family;
  const columnStrategy = columns[0].strategy;
  const geometrySignature = columns[0].geometryPattern.structuralSignature;
  if (columnCatalog.family !== firstDefinition.catalogFamily) {
    throw new RangeError("columnCatalog.family does not match its production columns");
  }
  if (columnCatalog.geometryPattern?.structuralSignature !== geometrySignature) {
    throw new RangeError("columnCatalog.geometryPattern does not match its columns");
  }

  const seenColumnSignatures = new Set();
  const normalizedColumns = columns.map((column, index) => {
    const label = `columnCatalog.columns[${index}]`;
    const definition = familyDefinition(column, label);
    if (definition !== firstDefinition
      || column.family !== columnFamily
      || column.strategy !== columnStrategy) {
      throw new RangeError("restricted master cannot mix production column families or strategies");
    }
    if (column.geometryPattern.structuralSignature !== geometrySignature) {
      throw new RangeError("restricted master cannot mix geometry patterns");
    }
    if (JSON.stringify(column.demands) !== demandSignature) {
      throw new RangeError("every column must use the catalog demands");
    }
    if (seenColumnSignatures.has(column.columnSignature)) {
      throw new RangeError(`duplicate column signature: ${column.columnSignature}`);
    }
    seenColumnSignatures.add(column.columnSignature);
    const coefficients = Object.freeze(column.allocation.map((entry, demandIndex) => {
      if (entry.demandId !== demands[demandIndex].demandId
        || entry.productId !== demands[demandIndex].productId) {
        throw new RangeError(`${label}.allocation does not match canonical demands`);
      }
      return asNonNegativeInteger(
        entry.positionsPerSheet,
        `${label}.allocation[${demandIndex}].positionsPerSheet`,
      );
    }));
    return Object.freeze({
      column,
      coefficients,
      metrics: normalizeColumnMetrics(column, definition, label),
    });
  });

  return deepFreeze({
    source: columnCatalog,
    demands,
    columns: normalizedColumns,
    columnFamily,
    columnStrategy,
    geometryPattern: columnCatalog.geometryPattern,
    geometrySignature,
  });
}

function createCoefficientMatrix(context) {
  const demandRows = Object.freeze(context.demands.map((demand, demandIndex) => Object.freeze({
    demandId: demand.demandId,
    productId: demand.productId,
    requiredQuantity: demand.requiredQuantity,
    coefficients: Object.freeze(context.columns.map(({ column, coefficients }) => Object.freeze({
      columnSignature: column.columnSignature,
      positionsPerSheet: coefficients[demandIndex],
    }))),
  })));
  const columnVectors = Object.freeze(context.columns.map(({ column, coefficients, metrics }) => Object.freeze({
    columnSignature: column.columnSignature,
    coefficients,
    activeDemandCount: metrics.activeDemandCount,
    occupiedPositionsPerSheet: metrics.occupiedPositionsPerSheet,
    blankProductPositionsPerSheet: metrics.blankProductPositionsPerSheet,
    layoutFormsPerColumn: metrics.layoutFormsPerColumn,
    colorPlatesPerColumn: metrics.colorPlatesPerColumn,
    pressPassesPerSheet: metrics.pressPassesPerSheet,
  })));
  return deepFreeze({
    rowOrder: Object.freeze(context.demands.map(({ demandId }) => demandId)),
    columnOrder: Object.freeze(context.columns.map(({ column }) => column.columnSignature)),
    demandRows,
    columnVectors,
  });
}

function compareDedicatedForDemand(a, b, demandIndex) {
  if (a.coefficients[demandIndex] !== b.coefficients[demandIndex]) {
    return b.coefficients[demandIndex] - a.coefficients[demandIndex];
  }
  if (a.metrics.blankProductPositionsPerSheet !== b.metrics.blankProductPositionsPerSheet) {
    return a.metrics.blankProductPositionsPerSheet - b.metrics.blankProductPositionsPerSheet;
  }
  if (a.metrics.layoutFormsPerColumn !== b.metrics.layoutFormsPerColumn) {
    return a.metrics.layoutFormsPerColumn - b.metrics.layoutFormsPerColumn;
  }
  if (a.metrics.colorPlatesPerColumn !== b.metrics.colorPlatesPerColumn) {
    return a.metrics.colorPlatesPerColumn - b.metrics.colorPlatesPerColumn;
  }
  return compareColumns(a.column, b.column);
}

function proportionalError(columnContext, demands) {
  const occupied = columnContext.metrics.occupiedPositionsPerSheet;
  const totalRequired = demands.reduce((sum, demand) => sum + demand.requiredQuantity, 0);
  return columnContext.coefficients.reduce((sum, coefficient, index) => (
    sum + Math.abs((coefficient * totalRequired) - (demands[index].requiredQuantity * occupied))
  ), 0);
}

function compareMixedColumns(a, b, demands) {
  if (a.metrics.activeDemandCount !== b.metrics.activeDemandCount) {
    return b.metrics.activeDemandCount - a.metrics.activeDemandCount;
  }
  const errorDifference = proportionalError(a, demands) - proportionalError(b, demands);
  if (errorDifference !== 0) return errorDifference;
  if (a.metrics.blankProductPositionsPerSheet !== b.metrics.blankProductPositionsPerSheet) {
    return a.metrics.blankProductPositionsPerSheet - b.metrics.blankProductPositionsPerSheet;
  }
  if (a.metrics.occupiedPositionsPerSheet !== b.metrics.occupiedPositionsPerSheet) {
    return b.metrics.occupiedPositionsPerSheet - a.metrics.occupiedPositionsPerSheet;
  }
  return compareColumns(a.column, b.column);
}

function selectInitialColumns(context, initialMixedColumnLimit) {
  const dedicated = [];
  for (let demandIndex = 0; demandIndex < context.demands.length; demandIndex += 1) {
    const candidates = context.columns.filter(({ coefficients }) => (
      coefficients[demandIndex] > 0
      && coefficients.every((coefficient, index) => index === demandIndex || coefficient === 0)
    ));
    candidates.sort((a, b) => compareDedicatedForDemand(a, b, demandIndex));
    if (candidates[0]) dedicated.push(candidates[0]);
  }

  const dedicatedSignatures = new Set(dedicated.map(({ column }) => column.columnSignature));
  const mixed = context.columns
    .filter((columnContext) => (
      columnContext.metrics.activeDemandCount >= 2
      && !dedicatedSignatures.has(columnContext.column.columnSignature)
    ))
    .sort((a, b) => compareMixedColumns(a, b, context.demands))
    .slice(0, initialMixedColumnLimit);

  const selected = [...dedicated, ...mixed]
    .filter((columnContext, index, all) => all.findIndex(
      (candidate) => candidate.column.columnSignature === columnContext.column.columnSignature,
    ) === index)
    .sort((a, b) => compareColumns(a.column, b.column));

  return deepFreeze({
    dedicatedColumnSignatures: Object.freeze(dedicated
      .map(({ column }) => column.columnSignature)
      .sort()),
    mixedColumnSignatures: Object.freeze(mixed
      .map(({ column }) => column.columnSignature)
      .sort()),
    initialColumnSignatures: Object.freeze(selected
      .map(({ column }) => column.columnSignature)),
  });
}

function ceilDiv(numerator, denominator) {
  if (denominator <= 0) return null;
  return Math.ceil(numerator / denominator);
}

function createLowerBounds(context) {
  const maxContributionByDemand = context.demands.map((_, demandIndex) => Math.max(
    ...context.columns.map(({ coefficients }) => coefficients[demandIndex]),
  ));
  const perDemandSheetBounds = context.demands.map((demand, index) => Object.freeze({
    demandId: demand.demandId,
    requiredQuantity: demand.requiredQuantity,
    maximumPositionsPerSheet: maxContributionByDemand[index],
    physicalSheetsLowerBound: ceilDiv(demand.requiredQuantity, maxContributionByDemand[index]),
  }));
  const maximumTotalPositionsPerSheet = Math.max(
    ...context.columns.map(({ metrics }) => metrics.occupiedPositionsPerSheet),
  );
  const totalRequiredQuantity = context.demands.reduce(
    (sum, demand) => sum + demand.requiredQuantity,
    0,
  );
  const aggregateSheetBound = ceilDiv(totalRequiredQuantity, maximumTotalPositionsPerSheet);
  const physicalSheetsLowerBound = Math.max(
    aggregateSheetBound,
    ...perDemandSheetBounds.map(({ physicalSheetsLowerBound }) => physicalSheetsLowerBound ?? 0),
  );
  const maximumActiveDemandCount = Math.max(
    ...context.columns.map(({ metrics }) => metrics.activeDemandCount),
  );
  const selectedColumnCountLowerBound = Math.ceil(
    context.demands.length / maximumActiveDemandCount,
  );
  const minimumLayoutFormsPerColumn = Math.min(
    ...context.columns.map(({ metrics }) => metrics.layoutFormsPerColumn),
  );
  const minimumColorPlatesPerColumn = Math.min(
    ...context.columns.map(({ metrics }) => metrics.colorPlatesPerColumn),
  );
  const minimumPressPassesPerSheet = Math.min(
    ...context.columns.map(({ metrics }) => metrics.pressPassesPerSheet),
  );
  return deepFreeze({
    physicalSheets: {
      perDemand: Object.freeze(perDemandSheetBounds),
      aggregateDemandBound: aggregateSheetBound,
      maximumTotalPositionsPerSheet,
      lowerBound: physicalSheetsLowerBound,
    },
    selectedColumnCount: {
      maximumActiveDemandCountPerColumn: maximumActiveDemandCount,
      lowerBound: selectedColumnCountLowerBound,
    },
    layoutForms: {
      minimumPerSelectedColumn: minimumLayoutFormsPerColumn,
      lowerBound: minimumLayoutFormsPerColumn * selectedColumnCountLowerBound,
    },
    colorPlates: {
      minimumPerSelectedColumn: minimumColorPlatesPerColumn,
      lowerBound: minimumColorPlatesPerColumn * selectedColumnCountLowerBound,
    },
    pressPasses: {
      minimumPerPhysicalSheet: minimumPressPassesPerSheet,
      lowerBound: minimumPressPassesPerSheet * physicalSheetsLowerBound,
    },
  });
}

function createFeasibilityWithinLimits(context, limits) {
  const reasons = [];
  const demandCapacity = context.demands.map((demand, demandIndex) => {
    const sortedContributions = context.columns
      .map(({ coefficients }) => coefficients[demandIndex])
      .sort((a, b) => b - a)
      .slice(0, limits.maxSelectedColumns);
    const maximumProducedWithinLimits = sortedContributions.reduce(
      (sum, coefficient) => sum + (coefficient * limits.maxRunLength),
      0,
    );
    const feasible = maximumProducedWithinLimits >= demand.requiredQuantity;
    if (!feasible) reasons.push(`demandCapacity:${demand.demandId}`);
    return Object.freeze({
      demandId: demand.demandId,
      requiredQuantity: demand.requiredQuantity,
      maximumProducedWithinLimits,
      feasible,
    });
  });
  const maximumTotalOutputWithinLimits = context.columns
    .map(({ metrics }) => metrics.occupiedPositionsPerSheet)
    .sort((a, b) => b - a)
    .slice(0, limits.maxSelectedColumns)
    .reduce((sum, occupied) => sum + (occupied * limits.maxRunLength), 0);
  const totalRequiredQuantity = context.demands.reduce(
    (sum, demand) => sum + demand.requiredQuantity,
    0,
  );
  if (maximumTotalOutputWithinLimits < totalRequiredQuantity) {
    reasons.push("aggregateCapacity");
  }
  return deepFreeze({
    feasibleByNecessaryCapacityChecks: reasons.length === 0,
    reasons: Object.freeze([...new Set(reasons)].sort()),
    demandCapacity: Object.freeze(demandCapacity),
    totalRequiredQuantity,
    maximumTotalOutputWithinLimits,
    proofType: reasons.length === 0
      ? "necessaryChecksPassedNotSufficient"
      : "provenInfeasibleWithinLimits",
  });
}

function createProblemSignature({ context, limits, initialColumns }) {
  return [
    "restricted-master-problem-v1",
    `family=${context.columnFamily}`,
    `strategy=${context.columnStrategy}`,
    `geometry=${context.geometrySignature}`,
    `demands=${context.demands.map((demand) => [
      demand.demandId,
      demand.productId,
      demand.requiredQuantity,
    ].join(":")).join(";")}`,
    `columns=${context.columns.map(({ column }) => column.columnSignature).join(";")}`,
    `initial=${initialColumns.initialColumnSignatures.join(";")}`,
    `limits=${limits.maxSelectedColumns},${limits.maxRunLength},${limits.maxStates},${limits.maxMilliseconds}`,
  ].join("|");
}

function buildProblem({
  id,
  columnCatalog,
  maxSelectedColumns,
  maxRunLength,
  maxStates,
  maxMilliseconds,
  initialMixedColumnLimit,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  const context = normalizeColumnCatalog(columnCatalog);
  const limits = deepFreeze({
    maxSelectedColumns: Math.min(
      asPositiveInteger(maxSelectedColumns, "maxSelectedColumns"),
      context.columns.length,
    ),
    maxRunLength: asPositiveInteger(maxRunLength, "maxRunLength"),
    maxStates: asPositiveInteger(maxStates, "maxStates"),
    maxMilliseconds: asPositiveInteger(maxMilliseconds, "maxMilliseconds"),
  });
  const mixedLimit = asNonNegativeInteger(initialMixedColumnLimit, "initialMixedColumnLimit");
  const coefficientMatrix = createCoefficientMatrix(context);
  const initialColumns = selectInitialColumns(context, mixedLimit);
  const lowerBounds = createLowerBounds(context);
  const feasibility = createFeasibilityWithinLimits(context, limits);
  const problemSignature = createProblemSignature({ context, limits, initialColumns });
  return deepFreeze({
    id: normalizedId,
    family: "restrictedMasterProblem",
    columnFamily: context.columnFamily,
    columnStrategy: context.columnStrategy,
    geometryPattern: context.geometryPattern,
    demands: context.demands,
    columns: Object.freeze(context.columns.map(({ column }) => column)),
    coefficientMatrix,
    initialColumns,
    lowerBounds,
    feasibility,
    limits,
    coverage: {
      suppliedColumnCatalogComplete: true,
      suppliedColumnCatalogTruncated: false,
      searchPerformed: false,
      pricingPerformed: false,
      columnsOutsideSuppliedCatalogConsidered: false,
      globalCompletenessClaimed: false,
    },
    problemSignature,
  });
}

export function validateRestrictedMasterProblem(problem) {
  if (!problem || typeof problem !== "object" || Array.isArray(problem)) {
    throw new TypeError("problem must be an object");
  }
  if (problem.family !== "restrictedMasterProblem") {
    throw new RangeError("problem.family must be restrictedMasterProblem");
  }
  const reconstructedCatalog = deepFreeze({
    family: COLUMN_FAMILIES[problem.columnFamily]?.catalogFamily,
    geometryPattern: problem.geometryPattern,
    demands: problem.demands,
    columns: problem.columns,
    coverage: {
      completeWithinRequestedSpace: problem.coverage?.suppliedColumnCatalogComplete,
      truncated: problem.coverage?.suppliedColumnCatalogTruncated,
    },
  });
  const expected = buildProblem({
    id: problem.id,
    columnCatalog: reconstructedCatalog,
    maxSelectedColumns: problem.limits?.maxSelectedColumns,
    maxRunLength: problem.limits?.maxRunLength,
    maxStates: problem.limits?.maxStates,
    maxMilliseconds: problem.limits?.maxMilliseconds,
    initialMixedColumnLimit: problem.initialColumns?.mixedColumnSignatures?.length ?? 0,
  });
  for (const key of [
    "columnFamily",
    "columnStrategy",
    "coefficientMatrix",
    "initialColumns",
    "lowerBounds",
    "feasibility",
    "limits",
    "coverage",
    "problemSignature",
  ]) {
    if (JSON.stringify(problem[key]) !== JSON.stringify(expected[key])) {
      throw new RangeError(`restricted master ${key} mismatch`);
    }
  }
  return true;
}

export function createRestrictedMasterProblem({
  id = "restricted-master-problem",
  columnCatalog,
  maxSelectedColumns = DEFAULT_MAX_SELECTED_COLUMNS,
  maxRunLength = DEFAULT_MAX_RUN_LENGTH,
  maxStates = 100000,
  maxMilliseconds = 1000,
  initialMixedColumnLimit = DEFAULT_INITIAL_MIXED_COLUMN_LIMIT,
}) {
  const problem = buildProblem({
    id,
    columnCatalog,
    maxSelectedColumns,
    maxRunLength,
    maxStates,
    maxMilliseconds,
    initialMixedColumnLimit,
  });
  validateRestrictedMasterProblem(problem);
  return problem;
}
