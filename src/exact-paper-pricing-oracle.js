import { validateMultiProductSimplexColumn } from "./multi-product-simplex-columns.js";
import { validateMultiProductSeparateDuplexColumn } from "./multi-product-duplex-columns.js";

const DEFAULT_EPSILON = 1e-9;

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

function asNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function asFiniteNonNegativeNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${label} must be a finite non-negative number`);
  }
  return number;
}

function asFinitePositiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a finite positive number`);
  }
  return number;
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

function normalizeCatalog(columnCatalog) {
  if (!columnCatalog || typeof columnCatalog !== "object" || Array.isArray(columnCatalog)) {
    throw new TypeError("columnCatalog must be an object");
  }
  if (columnCatalog.coverage?.completeWithinRequestedSpace !== true
    || columnCatalog.coverage?.truncated !== false) {
    throw new RangeError("exact pricing oracle requires a complete non-truncated column catalog");
  }
  if (!Array.isArray(columnCatalog.demands) || columnCatalog.demands.length === 0) {
    throw new RangeError("columnCatalog.demands must be non-empty");
  }
  if (!Array.isArray(columnCatalog.columns) || columnCatalog.columns.length === 0) {
    throw new RangeError("columnCatalog.columns must be non-empty");
  }

  const demands = columnCatalog.demands;
  const demandJson = JSON.stringify(demands);
  const columns = [...columnCatalog.columns].sort(compareColumns);
  const firstDefinition = familyDefinition(columns[0], "columnCatalog.columns[0]");
  const columnFamily = columns[0].family;
  const columnStrategy = columns[0].strategy;
  const geometrySignature = columns[0].geometryPattern.structuralSignature;
  if (columnCatalog.family !== firstDefinition.catalogFamily) {
    throw new RangeError("columnCatalog.family does not match its production columns");
  }
  if (columnCatalog.geometryPattern?.structuralSignature !== geometrySignature) {
    throw new RangeError("columnCatalog.geometryPattern does not match its production columns");
  }

  const seenSignatures = new Set();
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    const definition = familyDefinition(column, `columnCatalog.columns[${index}]`);
    if (definition !== firstDefinition
      || column.family !== columnFamily
      || column.strategy !== columnStrategy) {
      throw new RangeError("exact pricing oracle cannot mix column families or strategies");
    }
    if (column.geometryPattern.structuralSignature !== geometrySignature) {
      throw new RangeError("exact pricing oracle cannot mix geometry patterns");
    }
    if (JSON.stringify(column.demands) !== demandJson) {
      throw new RangeError("every pricing column must use the catalog demands");
    }
    if (seenSignatures.has(column.columnSignature)) {
      throw new RangeError(`duplicate column signature: ${column.columnSignature}`);
    }
    seenSignatures.add(column.columnSignature);
    if (!Array.isArray(column.allocation) || column.allocation.length !== demands.length) {
      throw new RangeError("column allocation length must equal demand count");
    }
    for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
      const entry = column.allocation[demandIndex];
      if (entry.demandId !== demands[demandIndex].demandId
        || entry.productId !== demands[demandIndex].productId) {
        throw new RangeError("column allocation does not match canonical demand order");
      }
      if (!Number.isInteger(entry.positionsPerSheet) || entry.positionsPerSheet < 0) {
        throw new RangeError("column positionsPerSheet must be a non-negative integer");
      }
    }
  }

  return deepFreeze({
    source: columnCatalog,
    demands,
    columns,
    columnFamily,
    columnStrategy,
    geometryPattern: columnCatalog.geometryPattern,
    geometrySignature,
  });
}

function normalizeShadowPrices(demands, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("demandShadowPrices must be an object keyed by demandId");
  }
  const knownDemandIds = new Set(demands.map(({ demandId }) => demandId));
  for (const key of Object.keys(input)) {
    if (!knownDemandIds.has(key)) {
      throw new RangeError(`demandShadowPrices contains unknown demandId: ${key}`);
    }
  }
  const entries = demands.map((demand) => Object.freeze({
    demandId: demand.demandId,
    shadowPrice: asFiniteNonNegativeNumber(
      input[demand.demandId],
      `demandShadowPrices.${demand.demandId}`,
    ),
  }));
  return deepFreeze({
    entries,
    byDemandId: Object.freeze(Object.fromEntries(
      entries.map(({ demandId, shadowPrice }) => [demandId, shadowPrice]),
    )),
  });
}

function normalizeExistingSignatures(columns, input = []) {
  if (!Array.isArray(input)) {
    throw new TypeError("existingColumnSignatures must be an array");
  }
  const known = new Set(columns.map(({ columnSignature }) => columnSignature));
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

function scoreColumn(column, shadowPrices, sheetUnitCost, epsilon, existingSet) {
  const demandCredits = Object.freeze(column.allocation.map((entry) => {
    const shadowPrice = shadowPrices.byDemandId[entry.demandId];
    const credit = shadowPrice * entry.positionsPerSheet;
    return Object.freeze({
      demandId: entry.demandId,
      positionsPerSheet: entry.positionsPerSheet,
      shadowPrice,
      credit,
    });
  }));
  const coverageCredit = demandCredits.reduce((sum, entry) => sum + entry.credit, 0);
  const reducedCost = sheetUnitCost - coverageCredit;
  const existing = existingSet.has(column.columnSignature);
  return deepFreeze({
    column,
    columnSignature: column.columnSignature,
    allocationSignature: column.allocationSignature,
    occupiedPositionsPerSheet: column.metrics.occupiedPositionsPerSheet,
    activeDemandCount: column.metrics.activeDemandCount,
    demandCredits,
    coverageCredit,
    sheetUnitCost,
    reducedCost,
    improving: reducedCost < -epsilon,
    existing,
    eligibleForAddition: !existing && reducedCost < -epsilon,
  });
}

function compareScoredCandidates(a, b) {
  if (a.reducedCost !== b.reducedCost) return a.reducedCost - b.reducedCost;
  if (a.coverageCredit !== b.coverageCredit) return b.coverageCredit - a.coverageCredit;
  if (a.occupiedPositionsPerSheet !== b.occupiedPositionsPerSheet) {
    return b.occupiedPositionsPerSheet - a.occupiedPositionsPerSheet;
  }
  if (a.activeDemandCount !== b.activeDemandCount) {
    return b.activeDemandCount - a.activeDemandCount;
  }
  return a.columnSignature.localeCompare(b.columnSignature);
}

function createRequestSignature({
  context,
  shadowPrices,
  existingColumnSignatures,
  sheetUnitCost,
  epsilon,
}) {
  return [
    "exact-paper-pricing-request-v1",
    `family=${context.columnFamily}`,
    `strategy=${context.columnStrategy}`,
    `geometry=${context.geometrySignature}`,
    `shadow=${shadowPrices.entries.map(({ demandId, shadowPrice }) => `${demandId}:${shadowPrice}`).join(";")}`,
    `existing=${existingColumnSignatures.join(";")}`,
    `sheetUnitCost=${sheetUnitCost}`,
    `epsilon=${epsilon}`,
  ].join("|");
}

function buildResult({
  id,
  columnCatalog,
  demandShadowPrices,
  existingColumnSignatures,
  sheetUnitCost,
  epsilon,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  const context = normalizeCatalog(columnCatalog);
  const shadowPrices = normalizeShadowPrices(context.demands, demandShadowPrices);
  const existingSignatures = normalizeExistingSignatures(context.columns, existingColumnSignatures);
  const normalizedSheetUnitCost = asFinitePositiveNumber(sheetUnitCost, "sheetUnitCost");
  const normalizedEpsilon = asFinitePositiveNumber(epsilon, "epsilon");
  const existingSet = new Set(existingSignatures);
  const evaluatedCandidates = context.columns
    .map((column) => scoreColumn(
      column,
      shadowPrices,
      normalizedSheetUnitCost,
      normalizedEpsilon,
      existingSet,
    ))
    .sort(compareScoredCandidates);
  const improvingCandidates = evaluatedCandidates.filter(({ improving }) => improving);
  const addableImprovingCandidates = evaluatedCandidates.filter(({ eligibleForAddition }) => (
    eligibleForAddition
  ));
  const requestSignature = createRequestSignature({
    context,
    shadowPrices,
    existingColumnSignatures: existingSignatures,
    sheetUnitCost: normalizedSheetUnitCost,
    epsilon: normalizedEpsilon,
  });
  return deepFreeze({
    id: normalizedId,
    family: "exactPaperPricingOracleResult",
    objective: "paperOnlyLinearRelaxation",
    columnFamily: context.columnFamily,
    columnStrategy: context.columnStrategy,
    geometryPattern: context.geometryPattern,
    demands: context.demands,
    demandShadowPrices: shadowPrices,
    existingColumnSignatures: existingSignatures,
    sheetUnitCost: normalizedSheetUnitCost,
    epsilon: normalizedEpsilon,
    evaluatedCandidates: Object.freeze(evaluatedCandidates),
    improvingCandidates: Object.freeze(improvingCandidates),
    addableImprovingCandidates: Object.freeze(addableImprovingCandidates),
    bestImprovingCandidate: addableImprovingCandidates[0] ?? null,
    requestSignature,
    coverage: {
      scope: "all validated columns in the supplied complete small catalog",
      evaluatedColumnCount: evaluatedCandidates.length,
      improvingColumnCount: improvingCandidates.length,
      addableImprovingColumnCount: addableImprovingCandidates.length,
      completeWithinSuppliedCatalog: true,
      suppliedCatalogTruncated: false,
      columnsGeneratedOnDemand: false,
      fixedFormCostsIncluded: false,
      fixedPlateCostsIncluded: false,
      pressSetupCostsIncluded: false,
      integerMasterSolved: false,
      dualOptimalityVerified: false,
      globalCompletenessClaimed: false,
    },
  });
}

export function validateExactPaperPricingOracleResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("result must be an object");
  }
  if (result.family !== "exactPaperPricingOracleResult") {
    throw new RangeError("result.family must be exactPaperPricingOracleResult");
  }
  const expected = buildResult({
    id: result.id,
    columnCatalog: {
      family: COLUMN_FAMILIES[result.columnFamily]?.catalogFamily,
      geometryPattern: result.geometryPattern,
      demands: result.demands,
      columns: result.evaluatedCandidates?.map(({ column }) => column),
      coverage: {
        completeWithinRequestedSpace: result.coverage?.completeWithinSuppliedCatalog,
        truncated: result.coverage?.suppliedCatalogTruncated,
      },
    },
    demandShadowPrices: result.demandShadowPrices?.byDemandId,
    existingColumnSignatures: result.existingColumnSignatures,
    sheetUnitCost: result.sheetUnitCost,
    epsilon: result.epsilon,
  });
  for (const key of [
    "objective",
    "columnFamily",
    "columnStrategy",
    "demandShadowPrices",
    "existingColumnSignatures",
    "sheetUnitCost",
    "epsilon",
    "evaluatedCandidates",
    "improvingCandidates",
    "addableImprovingCandidates",
    "bestImprovingCandidate",
    "requestSignature",
    "coverage",
  ]) {
    if (JSON.stringify(result[key]) !== JSON.stringify(expected[key])) {
      throw new RangeError(`exact paper pricing ${key} mismatch`);
    }
  }
  return true;
}

export function evaluateExactPaperPricing({
  id = "exact-paper-pricing",
  columnCatalog,
  demandShadowPrices,
  existingColumnSignatures = [],
  sheetUnitCost = 1,
  epsilon = DEFAULT_EPSILON,
}) {
  const result = buildResult({
    id,
    columnCatalog,
    demandShadowPrices,
    existingColumnSignatures,
    sheetUnitCost,
    epsilon,
  });
  validateExactPaperPricingOracleResult(result);
  return result;
}
