import { countExactSimplexSmallMasterStates } from "./exact-simplex-small-master.js";
import { validateMultiProductSimplexColumn } from "./multi-product-simplex-columns.js";
import { validateMultiProductSeparateDuplexColumn } from "./multi-product-duplex-columns.js";

const DEFAULT_MAX_EXACT_STATE_COUNT = 100000;

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

function columnFamilyDefinition(column, label = "column") {
  if (!column || typeof column !== "object" || Array.isArray(column)) {
    throw new TypeError(`${label} must be an object`);
  }
  const definition = COLUMN_FAMILIES[column.family];
  if (!definition) {
    throw new RangeError(`unsupported production column family: ${column.family}`);
  }
  if (column.strategy !== definition.strategy) {
    throw new RangeError(`${label}.strategy does not match ${column.family}`);
  }
  definition.validate(column);
  return definition;
}

function normalizedColumnMetrics(column, definition, label) {
  const layoutFormsPerColumn = asPositiveInteger(
    column.metrics?.layoutFormsPerColumn,
    `${label}.metrics.layoutFormsPerColumn`,
  );
  const colorPlatesPerColumn = asPositiveInteger(
    column.metrics?.colorPlatesPerColumn,
    `${label}.metrics.colorPlatesPerColumn`,
  );
  const pressPassesPerSheet = asPositiveInteger(
    column.metrics?.pressPassesPerSheet,
    `${label}.metrics.pressPassesPerSheet`,
  );
  const blankProductPositionsPerSheet = asNonNegativeInteger(
    column.metrics?.[definition.blankMetricKey],
    `${label}.metrics.${definition.blankMetricKey}`,
  );
  const occupiedPositionsPerSheet = asPositiveInteger(
    column.metrics?.occupiedPositionsPerSheet,
    `${label}.metrics.occupiedPositionsPerSheet`,
  );
  const geometryCapacity = asPositiveInteger(
    column.metrics?.geometryCapacity,
    `${label}.metrics.geometryCapacity`,
  );
  if (occupiedPositionsPerSheet + blankProductPositionsPerSheet !== geometryCapacity) {
    throw new RangeError(`${label} occupied and blank positions must equal geometry capacity`);
  }
  return Object.freeze({
    layoutFormsPerColumn,
    colorPlatesPerColumn,
    pressPassesPerSheet,
    blankProductPositionsPerSheet,
    occupiedPositionsPerSheet,
    geometryCapacity,
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
    throw new RangeError("exact production master requires a complete non-truncated column catalog");
  }

  const columns = [...columnCatalog.columns].sort(compareColumns);
  const firstDefinition = columnFamilyDefinition(columns[0], "columnCatalog.columns[0]");
  const columnFamily = columns[0].family;
  const columnStrategy = columns[0].strategy;
  if (columnCatalog.family !== firstDefinition.catalogFamily) {
    throw new RangeError("columnCatalog.family does not match its production columns");
  }
  const demandSignature = JSON.stringify(columnCatalog.demands);
  const geometrySignature = columns[0].geometryPattern.structuralSignature;
  if (columnCatalog.geometryPattern?.structuralSignature !== geometrySignature) {
    throw new RangeError("columnCatalog.geometryPattern does not match its columns");
  }

  const seenSignatures = new Set();
  const normalizedColumns = columns.map((column, index) => {
    const definition = columnFamilyDefinition(column, `columnCatalog.columns[${index}]`);
    if (column.family !== columnFamily || column.strategy !== columnStrategy) {
      throw new RangeError("exact production master cannot mix production column families or strategies");
    }
    if (definition !== firstDefinition) {
      throw new RangeError("production column family definition mismatch");
    }
    if (JSON.stringify(column.demands) !== demandSignature) {
      throw new RangeError("every production column must use the catalog demands");
    }
    if (column.geometryPattern.structuralSignature !== geometrySignature) {
      throw new RangeError("every production column must use the same geometry pattern");
    }
    if (seenSignatures.has(column.columnSignature)) {
      throw new RangeError(`duplicate production column signature: ${column.columnSignature}`);
    }
    seenSignatures.add(column.columnSignature);
    return Object.freeze({
      column,
      normalizedMetrics: normalizedColumnMetrics(
        column,
        definition,
        `columnCatalog.columns[${index}]`,
      ),
    });
  });

  return deepFreeze({
    demands: columnCatalog.demands,
    geometryPattern: columnCatalog.geometryPattern,
    columnFamily,
    columnStrategy,
    definition: firstDefinition,
    columns: normalizedColumns,
  });
}

function normalizeRuns(runsInput, demands, expectedFamily = null, expectedStrategy = null) {
  if (!Array.isArray(runsInput) || runsInput.length === 0) {
    throw new RangeError("runs must be a non-empty array");
  }
  const demandSignature = JSON.stringify(demands);
  let columnFamily = expectedFamily;
  let columnStrategy = expectedStrategy;
  let geometrySignature = null;

  const runs = runsInput.map((run, index) => {
    if (!run || typeof run !== "object" || Array.isArray(run)) {
      throw new TypeError(`runs[${index}] must be an object`);
    }
    const definition = columnFamilyDefinition(run.column, `runs[${index}].column`);
    columnFamily ??= run.column.family;
    columnStrategy ??= run.column.strategy;
    geometrySignature ??= run.column.geometryPattern.structuralSignature;
    if (run.column.family !== columnFamily || run.column.strategy !== columnStrategy) {
      throw new RangeError("one production plan cannot mix column families or strategies");
    }
    if (run.column.geometryPattern.structuralSignature !== geometrySignature) {
      throw new RangeError("one production plan cannot mix geometry patterns");
    }
    if (JSON.stringify(run.column.demands) !== demandSignature) {
      throw new RangeError(`runs[${index}].column demand mismatch`);
    }
    return Object.freeze({
      column: run.column,
      runLength: asPositiveInteger(run.runLength, `runs[${index}].runLength`),
      normalizedMetrics: normalizedColumnMetrics(
        run.column,
        definition,
        `runs[${index}].column`,
      ),
    });
  }).sort((a, b) => compareColumns(a.column, b.column));

  const seenSignatures = new Set();
  for (const run of runs) {
    if (seenSignatures.has(run.column.columnSignature)) {
      throw new RangeError("a production column may appear only once; merge duplicate run lengths first");
    }
    seenSignatures.add(run.column.columnSignature);
  }
  return deepFreeze({ columnFamily, columnStrategy, geometrySignature, runs });
}

function createDemandMetrics(demands, runs) {
  return Object.freeze(demands.map((demand, demandIndex) => {
    let producedQuantity = 0;
    let contributingColumnCount = 0;
    for (const run of runs) {
      const positionsPerSheet = run.column.allocation[demandIndex].positionsPerSheet;
      if (positionsPerSheet > 0) contributingColumnCount += 1;
      producedQuantity += positionsPerSheet * run.runLength;
    }
    return Object.freeze({
      demandId: demand.demandId,
      productId: demand.productId,
      requiredQuantity: demand.requiredQuantity,
      producedQuantity,
      overrun: Math.max(0, producedQuantity - demand.requiredQuantity),
      underproduction: Math.max(0, demand.requiredQuantity - producedQuantity),
      contributingColumnCount,
      splitAcrossColumns: contributingColumnCount > 1,
    });
  }));
}

function createMetrics(demands, runs, demandMetrics) {
  const physicalSheets = runs.reduce((sum, run) => sum + run.runLength, 0);
  const totalRequiredQuantity = demands.reduce((sum, demand) => sum + demand.requiredQuantity, 0);
  const totalProducedQuantity = demandMetrics.reduce((sum, metric) => sum + metric.producedQuantity, 0);
  const totalOverrun = demandMetrics.reduce((sum, metric) => sum + metric.overrun, 0);
  const totalUnderproduction = demandMetrics.reduce((sum, metric) => sum + metric.underproduction, 0);
  return Object.freeze({
    physicalSheets,
    selectedColumnCount: runs.length,
    layoutForms: runs.reduce(
      (sum, run) => sum + run.normalizedMetrics.layoutFormsPerColumn,
      0,
    ),
    colorPlates: runs.reduce(
      (sum, run) => sum + run.normalizedMetrics.colorPlatesPerColumn,
      0,
    ),
    pressPasses: runs.reduce(
      (sum, run) => sum + (run.normalizedMetrics.pressPassesPerSheet * run.runLength),
      0,
    ),
    totalRequiredQuantity,
    totalProducedQuantity,
    totalOverrun,
    totalUnderproduction,
    blankProductPositions: runs.reduce(
      (sum, run) => sum + (
        run.normalizedMetrics.blankProductPositionsPerSheet * run.runLength
      ),
      0,
    ),
    splitDemandCount: demandMetrics.filter((metric) => metric.splitAcrossColumns).length,
  });
}

function createSignatures({ demands, runs, columnFamily, columnStrategy }) {
  const runSignature = runs
    .map((run) => `${run.column.columnSignature}@${run.runLength}`)
    .join(";");
  const structuralSignature = [
    "exact-production-small-master-plan-v1",
    `family=${columnFamily}`,
    `strategy=${columnStrategy}`,
    `runs=${runSignature}`,
  ].join("|");
  const demandSignature = demands.map((demand) => [
    demand.demandId,
    demand.productId,
    demand.requiredQuantity,
  ].join(":")).join(";");
  return Object.freeze({
    structuralSignature,
    planSignature: `${structuralSignature}|demands=${demandSignature}`,
  });
}

function comparableRuns(runs) {
  return Object.freeze(runs.map((run) => Object.freeze({
    column: run.column,
    runLength: run.runLength,
  })));
}

export function validateExactProductionSmallMasterPlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new TypeError("plan must be an object");
  }
  if (!Array.isArray(plan.demands) || plan.demands.length === 0) {
    throw new RangeError("plan.demands must be non-empty");
  }
  const normalized = normalizeRuns(
    plan.runs,
    plan.demands,
    plan.columnFamily,
    plan.columnStrategy,
  );
  if (JSON.stringify(plan.runs) !== JSON.stringify(comparableRuns(normalized.runs))) {
    throw new RangeError("runs must use canonical production-column signature order");
  }
  if (plan.columnFamily !== normalized.columnFamily
    || plan.columnStrategy !== normalized.columnStrategy) {
    throw new RangeError("plan production family mismatch");
  }
  const demandMetrics = createDemandMetrics(plan.demands, normalized.runs);
  if (JSON.stringify(plan.demandMetrics) !== JSON.stringify(demandMetrics)) {
    throw new RangeError("demandMetrics mismatch");
  }
  const metrics = createMetrics(plan.demands, normalized.runs, demandMetrics);
  if (metrics.totalUnderproduction !== 0) throw new RangeError("underproduction is forbidden");
  if (JSON.stringify(plan.metrics) !== JSON.stringify(metrics)) {
    throw new RangeError("metrics mismatch");
  }
  const signatures = createSignatures({
    demands: plan.demands,
    runs: normalized.runs,
    columnFamily: normalized.columnFamily,
    columnStrategy: normalized.columnStrategy,
  });
  if (plan.structuralSignature !== signatures.structuralSignature
    || plan.planSignature !== signatures.planSignature) {
    throw new RangeError("plan signatures mismatch");
  }
  return true;
}

export function createExactProductionSmallMasterPlan({
  id,
  demands,
  columnFamily,
  columnStrategy,
  runs: runsInput,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  if (!Array.isArray(demands) || demands.length === 0) {
    throw new RangeError("demands must be non-empty");
  }
  const normalized = normalizeRuns(runsInput, demands, columnFamily, columnStrategy);
  const demandMetrics = createDemandMetrics(demands, normalized.runs);
  const metrics = createMetrics(demands, normalized.runs, demandMetrics);
  if (metrics.totalUnderproduction !== 0) throw new RangeError("underproduction is forbidden");
  const signatures = createSignatures({
    demands,
    runs: normalized.runs,
    columnFamily: normalized.columnFamily,
    columnStrategy: normalized.columnStrategy,
  });
  const plan = Object.freeze({
    id: normalizedId,
    family: "exactProductionSmallMasterPlan",
    columnFamily: normalized.columnFamily,
    columnStrategy: normalized.columnStrategy,
    demands,
    runs: comparableRuns(normalized.runs),
    demandMetrics,
    metrics,
    structuralSignature: signatures.structuralSignature,
    planSignature: signatures.planSignature,
  });
  validateExactProductionSmallMasterPlan(plan);
  return deepFreeze(plan);
}

function enumerateCombinations(items, count, callback) {
  const selected = [];
  function visit(startIndex) {
    if (selected.length === count) {
      callback([...selected]);
      return;
    }
    const remainingNeeded = count - selected.length;
    for (let index = startIndex; index <= items.length - remainingNeeded; index += 1) {
      selected.push(items[index]);
      visit(index + 1);
      selected.pop();
    }
  }
  visit(0);
}

function enumerateRunLengths(count, maxRunLength, callback) {
  const runLengths = Array(count).fill(1);
  function visit(index) {
    if (index === count) {
      callback([...runLengths]);
      return;
    }
    for (let runLength = 1; runLength <= maxRunLength; runLength += 1) {
      runLengths[index] = runLength;
      visit(index + 1);
    }
  }
  visit(0);
}

function isFeasible(demands, columns, runLengths) {
  for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
    let produced = 0;
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      produced += columns[columnIndex].column.allocation[demandIndex].positionsPerSheet
        * runLengths[columnIndex];
    }
    if (produced < demands[demandIndex].requiredQuantity) return false;
  }
  return true;
}

const OBJECTIVE_KEYS = Object.freeze([
  "physicalSheets",
  "layoutForms",
  "colorPlates",
  "pressPasses",
  "totalOverrun",
  "blankProductPositions",
]);

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

function createParetoPlanIds(plans) {
  const frontier = [];
  for (const plan of plans) {
    if (frontier.some((candidate) => dominates(candidate, plan))) continue;
    for (let index = frontier.length - 1; index >= 0; index -= 1) {
      if (dominates(plan, frontier[index])) frontier.splice(index, 1);
    }
    frontier.push(plan);
  }
  return Object.freeze(frontier.map((plan) => plan.id).sort());
}

function selectBestPlanId(plans, firstKey) {
  if (plans.length === 0) return null;
  const keys = [firstKey, ...OBJECTIVE_KEYS.filter((key) => key !== firstKey)];
  return [...plans].sort((a, b) => {
    for (const key of keys) {
      if (a.metrics[key] !== b.metrics[key]) return a.metrics[key] - b.metrics[key];
    }
    return a.planSignature.localeCompare(b.planSignature);
  })[0].id;
}

export function solveExactProductionSmallMaster({
  id = "exact-production-small-master",
  columnCatalog,
  maxSelectedColumns = 2,
  maxRunLength,
  maxExactStateCount = DEFAULT_MAX_EXACT_STATE_COUNT,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  const context = normalizeColumnCatalog(columnCatalog);
  const selectedLimit = Math.min(
    asPositiveInteger(maxSelectedColumns, "maxSelectedColumns"),
    context.columns.length,
  );
  const runLimit = asPositiveInteger(maxRunLength, "maxRunLength");
  const stateLimit = asPositiveInteger(maxExactStateCount, "maxExactStateCount");
  const theoreticalStateCount = countExactSimplexSmallMasterStates({
    candidateColumnCount: context.columns.length,
    maxSelectedColumns: selectedLimit,
    maxRunLength: runLimit,
  });
  if (theoreticalStateCount > BigInt(stateLimit)) {
    throw new RangeError(
      `exact production-master space ${theoreticalStateCount} exceeds maxExactStateCount ${stateLimit}`,
    );
  }

  let evaluatedStateCount = 0;
  const plans = [];
  for (let selectedCount = 1; selectedCount <= selectedLimit; selectedCount += 1) {
    enumerateCombinations(context.columns, selectedCount, (columns) => {
      enumerateRunLengths(selectedCount, runLimit, (runLengths) => {
        evaluatedStateCount += 1;
        if (!isFeasible(context.demands, columns, runLengths)) return;
        plans.push(createExactProductionSmallMasterPlan({
          id: `${normalizedId}:state-${evaluatedStateCount}`,
          demands: context.demands,
          columnFamily: context.columnFamily,
          columnStrategy: context.columnStrategy,
          runs: columns.map(({ column }, index) => ({
            column,
            runLength: runLengths[index],
          })),
        }));
      });
    });
  }
  if (BigInt(evaluatedStateCount) !== theoreticalStateCount) {
    throw new RangeError("exact production-master evaluated state count mismatch");
  }
  plans.sort(comparePlans);
  const uniqueSignatures = new Set(plans.map((plan) => plan.planSignature));
  if (uniqueSignatures.size !== plans.length) {
    throw new RangeError("duplicate plan signatures in exact production-master catalog");
  }
  const frozenPlans = Object.freeze(plans);
  return deepFreeze({
    id: normalizedId,
    family: "exactProductionSmallMasterCatalog",
    columnFamily: context.columnFamily,
    columnStrategy: context.columnStrategy,
    geometryPattern: context.geometryPattern,
    demands: context.demands,
    plans: frozenPlans,
    paretoPlanIds: createParetoPlanIds(frozenPlans),
    bestPlanIds: Object.freeze(Object.fromEntries(
      OBJECTIVE_KEYS.map((key) => [key, selectBestPlanId(frozenPlans, key)]),
    )),
    coverage: {
      scope: "all unique supplied production-column combinations and positive run lengths inside explicit bounds",
      columnFamily: context.columnFamily,
      columnStrategy: context.columnStrategy,
      candidateColumnCount: context.columns.length,
      maxSelectedColumns: selectedLimit,
      maxRunLength: runLimit,
      theoreticalStateCount: theoreticalStateCount.toString(),
      evaluatedStateCount,
      feasiblePlanCount: frozenPlans.length,
      completeWithinRequestedSpace: true,
      truncated: false,
      globalCompletenessClaimed: false,
      mixedProductionStrategiesEvaluated: false,
      columnsOutsideSuppliedCatalogEvaluated: false,
      runsAboveMaximumEvaluated: false,
      largerColumnSetsEvaluated: false,
      pricingEvaluated: false,
      workAndTurnEvaluated: false,
    },
  });
}
