import { validateMultiProductSimplexColumn } from "./multi-product-simplex-columns.js";

const DEFAULT_MAX_EXACT_STATE_COUNT = 100000;

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

function binomialBigInt(nInput, kInput) {
  const n = BigInt(nInput);
  let k = BigInt(kInput);
  if (k < 0n || k > n) return 0n;
  if (k > n - k) k = n - k;
  let result = 1n;
  for (let index = 1n; index <= k; index += 1n) {
    result = (result * (n - k + index)) / index;
  }
  return result;
}

export function countExactSimplexSmallMasterStates({
  candidateColumnCount: candidateColumnCountInput,
  maxSelectedColumns: maxSelectedColumnsInput,
  maxRunLength: maxRunLengthInput,
}) {
  const candidateColumnCount = asPositiveInteger(candidateColumnCountInput, "candidateColumnCount");
  const maxSelectedColumns = Math.min(
    asPositiveInteger(maxSelectedColumnsInput, "maxSelectedColumns"),
    candidateColumnCount,
  );
  const maxRunLength = BigInt(asPositiveInteger(maxRunLengthInput, "maxRunLength"));
  let total = 0n;
  for (let selectedCount = 1; selectedCount <= maxSelectedColumns; selectedCount += 1) {
    total += binomialBigInt(candidateColumnCount, selectedCount)
      * (maxRunLength ** BigInt(selectedCount));
  }
  return total;
}

function compareColumns(a, b) {
  return a.columnSignature.localeCompare(b.columnSignature);
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
    throw new RangeError("exact small master requires a complete non-truncated column catalog");
  }
  const demands = columnCatalog.demands;
  const demandSignature = JSON.stringify(demands);
  const columns = [...columnCatalog.columns].sort(compareColumns);
  const seenSignatures = new Set();
  for (const column of columns) {
    validateMultiProductSimplexColumn(column);
    if (JSON.stringify(column.demands) !== demandSignature) {
      throw new RangeError("every candidate column must use the catalog demands");
    }
    if (seenSignatures.has(column.columnSignature)) {
      throw new RangeError(`duplicate candidate column signature: ${column.columnSignature}`);
    }
    seenSignatures.add(column.columnSignature);
  }
  return deepFreeze({ demands, columns });
}

function normalizeRuns(runsInput, demands) {
  if (!Array.isArray(runsInput) || runsInput.length === 0) {
    throw new RangeError("runs must be a non-empty array");
  }
  const demandSignature = JSON.stringify(demands);
  const runs = runsInput.map((run, index) => {
    if (!run || typeof run !== "object" || Array.isArray(run)) {
      throw new TypeError(`runs[${index}] must be an object`);
    }
    validateMultiProductSimplexColumn(run.column);
    if (JSON.stringify(run.column.demands) !== demandSignature) {
      throw new RangeError(`runs[${index}].column demand mismatch`);
    }
    return Object.freeze({
      column: run.column,
      runLength: asPositiveInteger(run.runLength, `runs[${index}].runLength`),
    });
  }).sort((a, b) => compareColumns(a.column, b.column));
  const seenSignatures = new Set();
  for (const run of runs) {
    if (seenSignatures.has(run.column.columnSignature)) {
      throw new RangeError("a candidate column may appear only once; merge duplicate run lengths first");
    }
    seenSignatures.add(run.column.columnSignature);
  }
  return Object.freeze(runs);
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
  const blankSheetPositions = runs.reduce((sum, run) => (
    sum + (run.column.metrics.blankPositionsPerSheet * run.runLength)
  ), 0);
  return Object.freeze({
    physicalSheets,
    selectedColumnCount: runs.length,
    layoutForms: runs.length,
    colorPlates: runs.reduce((sum, run) => sum + run.column.metrics.colorPlatesPerColumn, 0),
    pressPasses: physicalSheets,
    totalRequiredQuantity,
    totalProducedQuantity,
    totalOverrun,
    totalUnderproduction,
    blankSheetPositions,
    splitDemandCount: demandMetrics.filter((metric) => metric.splitAcrossColumns).length,
  });
}

function createSignatures(demands, runs) {
  const runSignature = runs.map((run) => `${run.column.columnSignature}@${run.runLength}`).join(";");
  const structuralSignature = `exact-simplex-small-master-plan-v1|runs=${runSignature}`;
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

export function validateExactSimplexSmallMasterPlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new TypeError("plan must be an object");
  }
  if (!Array.isArray(plan.demands) || plan.demands.length === 0) {
    throw new RangeError("plan.demands must be non-empty");
  }
  const runs = normalizeRuns(plan.runs, plan.demands);
  if (JSON.stringify(plan.runs) !== JSON.stringify(runs)) {
    throw new RangeError("runs must use canonical column-signature order");
  }
  const demandMetrics = createDemandMetrics(plan.demands, runs);
  if (JSON.stringify(plan.demandMetrics) !== JSON.stringify(demandMetrics)) {
    throw new RangeError("demandMetrics mismatch");
  }
  const metrics = createMetrics(plan.demands, runs, demandMetrics);
  if (metrics.totalUnderproduction !== 0) throw new RangeError("underproduction is forbidden");
  if (JSON.stringify(plan.metrics) !== JSON.stringify(metrics)) {
    throw new RangeError("metrics mismatch");
  }
  const signatures = createSignatures(plan.demands, runs);
  if (plan.structuralSignature !== signatures.structuralSignature
    || plan.planSignature !== signatures.planSignature) {
    throw new RangeError("plan signatures mismatch");
  }
  return true;
}

export function createExactSimplexSmallMasterPlan({ id, demands, runs: runsInput }) {
  const normalizedId = asNonEmptyString(id, "id");
  if (!Array.isArray(demands) || demands.length === 0) {
    throw new RangeError("demands must be non-empty");
  }
  const runs = normalizeRuns(runsInput, demands);
  const demandMetrics = createDemandMetrics(demands, runs);
  const metrics = createMetrics(demands, runs, demandMetrics);
  if (metrics.totalUnderproduction !== 0) {
    throw new RangeError("underproduction is forbidden");
  }
  const signatures = createSignatures(demands, runs);
  const plan = Object.freeze({
    id: normalizedId,
    family: "exactSimplexSmallMasterPlan",
    demands,
    runs,
    demandMetrics,
    metrics,
    structuralSignature: signatures.structuralSignature,
    planSignature: signatures.planSignature,
  });
  validateExactSimplexSmallMasterPlan(plan);
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
      produced += columns[columnIndex].allocation[demandIndex].positionsPerSheet
        * runLengths[columnIndex];
    }
    if (produced < demands[demandIndex].requiredQuantity) return false;
  }
  return true;
}

function comparePlans(a, b) {
  if (a.metrics.physicalSheets !== b.metrics.physicalSheets) {
    return a.metrics.physicalSheets - b.metrics.physicalSheets;
  }
  if (a.metrics.layoutForms !== b.metrics.layoutForms) {
    return a.metrics.layoutForms - b.metrics.layoutForms;
  }
  if (a.metrics.totalOverrun !== b.metrics.totalOverrun) {
    return a.metrics.totalOverrun - b.metrics.totalOverrun;
  }
  if (a.metrics.blankSheetPositions !== b.metrics.blankSheetPositions) {
    return a.metrics.blankSheetPositions - b.metrics.blankSheetPositions;
  }
  return a.planSignature.localeCompare(b.planSignature);
}

function dominates(a, b) {
  const keys = ["physicalSheets", "layoutForms", "totalOverrun", "blankSheetPositions"];
  let strictlyBetter = false;
  for (const key of keys) {
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

function selectBestPlanId(plans, keys) {
  if (plans.length === 0) return null;
  return [...plans].sort((a, b) => {
    for (const key of keys) {
      if (a.metrics[key] !== b.metrics[key]) return a.metrics[key] - b.metrics[key];
    }
    return a.planSignature.localeCompare(b.planSignature);
  })[0].id;
}

export function solveExactSimplexSmallMaster({
  id = "exact-simplex-small-master",
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
      `exact small-master space ${theoreticalStateCount} exceeds maxExactStateCount ${stateLimit}`,
    );
  }

  let evaluatedStateCount = 0;
  const plans = [];
  for (let selectedCount = 1; selectedCount <= selectedLimit; selectedCount += 1) {
    enumerateCombinations(context.columns, selectedCount, (columns) => {
      enumerateRunLengths(selectedCount, runLimit, (runLengths) => {
        evaluatedStateCount += 1;
        if (!isFeasible(context.demands, columns, runLengths)) return;
        plans.push(createExactSimplexSmallMasterPlan({
          id: `${normalizedId}:state-${evaluatedStateCount}`,
          demands: context.demands,
          runs: columns.map((column, index) => ({ column, runLength: runLengths[index] })),
        }));
      });
    });
  }
  if (BigInt(evaluatedStateCount) !== theoreticalStateCount) {
    throw new RangeError("exact small-master evaluated state count mismatch");
  }
  plans.sort(comparePlans);
  const uniqueSignatures = new Set(plans.map((plan) => plan.planSignature));
  if (uniqueSignatures.size !== plans.length) {
    throw new RangeError("duplicate plan signatures in exact small-master catalog");
  }
  const frozenPlans = Object.freeze(plans);
  return deepFreeze({
    id: normalizedId,
    family: "exactSimplexSmallMasterCatalog",
    demands: context.demands,
    plans: frozenPlans,
    paretoPlanIds: createParetoPlanIds(frozenPlans),
    bestPlanIds: {
      physicalSheets: selectBestPlanId(frozenPlans, [
        "physicalSheets",
        "layoutForms",
        "totalOverrun",
        "blankSheetPositions",
      ]),
      layoutForms: selectBestPlanId(frozenPlans, [
        "layoutForms",
        "physicalSheets",
        "totalOverrun",
        "blankSheetPositions",
      ]),
      overrun: selectBestPlanId(frozenPlans, [
        "totalOverrun",
        "physicalSheets",
        "layoutForms",
        "blankSheetPositions",
      ]),
    },
    coverage: {
      scope: "all unique supplied-column combinations and positive run lengths inside explicit bounds",
      candidateColumnCount: context.columns.length,
      maxSelectedColumns: selectedLimit,
      maxRunLength: runLimit,
      theoreticalStateCount: theoreticalStateCount.toString(),
      evaluatedStateCount,
      feasiblePlanCount: frozenPlans.length,
      completeWithinRequestedSpace: true,
      truncated: false,
      globalCompletenessClaimed: false,
      columnsOutsideSuppliedCatalogEvaluated: false,
      runsAboveMaximumEvaluated: false,
      largerColumnSetsEvaluated: false,
      duplexEvaluated: false,
      pricingEvaluated: false,
    },
  });
}
