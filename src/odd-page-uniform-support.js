import { CONFIG } from "./config.js";
import {
  PRODUCT_DUPLEX_PREFERENCES,
  PRODUCT_ISSUE_SEVERITIES,
  PRODUCT_PRINT_MODES,
  PRODUCT_ROTATION_POLICIES,
  validateProductRow,
} from "./product-row.js";
import {
  normalizeProductRowCollection,
  validateProductRowCollection,
} from "./product-row-collection.js";
import { buildFeasibleSolutionCatalog } from "./feasible-solution-catalog.js";
import {
  DEFAULT_OBJECTIVE_ORDER,
  OPTIMIZATION_OBJECTIVE_IDS,
} from "./optimization-objectives.js";
import { buildProductionReport } from "./production-report.js";
import { createProductionReportSolutionMetrics } from "./production-solution-metrics.js";
import { createUserUniformProductionPlanSet } from "./user-uniform-production-plans.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function issue(code, field, details = {}, rowId = null) {
  return deepFreeze({
    severity: PRODUCT_ISSUE_SEVERITIES.ERROR,
    code,
    field,
    messageKey: `product.${code}`,
    details: { ...details },
    ...(rowId ? { rowId } : {}),
    blocking: true,
  });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function uniformSignature(row) {
  return JSON.stringify(canonicalize({
    finished: row.finished,
    print: {
      mode: row.print.mode,
      frontColors: row.print.frontColors,
      backColors: row.print.backColors,
      duplexPreference: row.print.duplexPreference,
    },
    bleed: row.bleed,
    cut: row.cut,
    rotationPolicy: row.rotationPolicy,
  }));
}

function blocking(entry) {
  return entry.severity === PRODUCT_ISSUE_SEVERITIES.ERROR && entry.blocking !== false;
}

export function validateProductRowsForOddPageUniformPipeline(collection, config = CONFIG) {
  const base = validateProductRowCollection(collection, config);
  const issues = [...base.issues];
  const enabledRows = base.collection.rows.filter(({ enabled }) => enabled);

  if (enabledRows.length === 0) {
    issues.push(issue("uniformPipelineRequiresEnabledRows", "rows"));
  }

  enabledRows.forEach((row) => {
    const result = validateProductRow(row, config);
    if (!result.valid) return;
    if (row.print.mode !== PRODUCT_PRINT_MODES.DUPLEX) {
      issues.push(issue("uniformPipelineRequiresDuplex", "print.mode", {}, row.id));
    }
    if (row.print.duplexPreference === PRODUCT_DUPLEX_PREFERENCES.WORK_AND_TURN) {
      issues.push(issue("uniformPipelineWorkAndTurnNotGeneralized", "print.duplexPreference", {}, row.id));
    }
    if (row.rotationPolicy !== PRODUCT_ROTATION_POLICIES.AUTO) {
      issues.push(issue(
        "uniformPipelineForcedRotationNotSupported",
        "rotationPolicy",
        { rotationPolicy: row.rotationPolicy },
        row.id,
      ));
    }
  });

  const validEnabledRows = enabledRows.filter((row) => validateProductRow(row, config).valid);
  if (validEnabledRows.length > 1) {
    const expected = uniformSignature(validEnabledRows[0]);
    const mixed = validEnabledRows.filter((row) => uniformSignature(row) !== expected);
    if (mixed.length > 0) {
      issues.push(issue(
        "uniformPipelineRequiresSharedGeometryAndColor",
        "rows",
        { rowIds: mixed.map(({ id }) => id) },
      ));
    }
  }

  return deepFreeze({
    ...base,
    issues,
    valid: !issues.some(blocking),
    summary: {
      ...base.summary,
      technicalBlankPageCount: enabledRows.reduce(
        (sum, row) => sum + (Number.isInteger(row.pages) && row.pages % 2 === 1 ? row.variantCount : 0),
        0,
      ),
    },
  });
}

export function expandOddPageProductRowsToLegacyOrders(collection, config = CONFIG) {
  const validation = validateProductRowsForOddPageUniformPipeline(collection, config);
  if (!validation.valid) {
    const error = new TypeError("Product rows are not compatible with the odd-page uniform pipeline");
    error.issues = validation.issues;
    throw error;
  }

  return deepFreeze(validation.collection.rows
    .filter(({ enabled }) => enabled)
    .flatMap((row) => Array.from({ length: row.variantCount }, (_, index) => ({
      file: row.variantCount === 1 ? row.name : `${row.name} · ${index + 1}`,
      quantity: row.quantityPerVariant,
      pages: row.pages,
      printPairs: Math.ceil(row.pages / 2),
      note: row.notes,
      productRowId: row.id,
      variantIndex: index + 1,
    }))));
}

function pairKey(file, pairIndex) {
  return `${file}\u0000${pairIndex}`;
}

function completePagePairs(pagePairs) {
  return deepFreeze(pagePairs.map((pair) => pair.backPage === null
    ? { ...pair, backPage: pair.frontPage + 1, technicalBlankBack: true }
    : { ...pair, technicalBlankBack: false }));
}

function restoreCell(cell, blankKeys, side) {
  const blank = blankKeys.has(pairKey(cell.file, cell.pairIndex));
  if (!blank) return deepFreeze({ ...cell });
  return deepFreeze({
    ...cell,
    backPage: null,
    page: side === "back" ? null : cell.page,
    technicalBlank: side === "back",
  });
}

function restoreImpositions(impositions, blankKeys) {
  return deepFreeze(impositions.map(({ front, back, ...rest }) => ({
    ...rest,
    front: deepFreeze({
      ...front,
      cells: deepFreeze(front.cells.map((cell) => restoreCell(cell, blankKeys, "front"))),
    }),
    back: deepFreeze({
      ...back,
      cells: deepFreeze(back.cells.map((cell) => restoreCell(cell, blankKeys, "back"))),
    }),
  })));
}

function activeObjectiveIds(pricing) {
  return deepFreeze(pricing
    ? [...OPTIMIZATION_OBJECTIVE_IDS]
    : OPTIMIZATION_OBJECTIVE_IDS.filter((id) => id !== "estimatedTotalCost"));
}

function activeObjectiveOrder(pricing, objectiveOrder) {
  const requested = Array.isArray(objectiveOrder) && objectiveOrder.length > 0
    ? objectiveOrder
    : DEFAULT_OBJECTIVE_ORDER;
  return deepFreeze(requested.filter((id) => pricing || id !== "estimatedTotalCost"));
}

function rebuildPlan(plan, {
  pagePairs,
  blankKeys,
  sourceSheet,
  pricing,
  printSpecification,
}) {
  const impositions = restoreImpositions(plan.impositions, blankKeys);
  const report = buildProductionReport({ pagePairs, impositions });
  const metrics = createProductionReportSolutionMetrics({
    report,
    sourceSheet,
    pricing,
    printSpecification,
    id: plan.id,
    label: plan.label,
    source: `user-uniform/${plan.family}`,
    layoutCompactness: plan.metrics.layoutCompactness,
    distinctOrdersPerImposition: plan.metrics.distinctOrdersPerImposition,
    splitOrders: plan.metrics.splitOrders,
    fragmentedBlocks: plan.metrics.fragmentedBlocks,
  });
  return deepFreeze({ ...plan, impositions, report, metrics });
}

export function createOddPageUniformProductionPlanSet({
  pagePairs,
  placementOptions,
  sourceSheet,
  printSpecification,
  pricing = null,
  objectiveOrder = DEFAULT_OBJECTIVE_ORDER,
} = {}) {
  const completedPairs = completePagePairs(pagePairs);
  const blankKeys = new Set(pagePairs
    .filter(({ backPage }) => backPage === null)
    .map(({ file, pairIndex }) => pairKey(file, pairIndex)));
  const base = createUserUniformProductionPlanSet({
    pagePairs: completedPairs,
    placementOptions,
    sourceSheet,
    printSpecification,
    pricing,
    objectiveOrder,
  });
  const plans = deepFreeze(base.plans.map((plan) => rebuildPlan(plan, {
    pagePairs,
    blankKeys,
    sourceSheet,
    pricing,
    printSpecification,
  })));
  const objectiveIds = activeObjectiveIds(pricing);
  const normalizedObjectiveOrder = activeObjectiveOrder(pricing, objectiveOrder);
  const catalog = buildFeasibleSolutionCatalog(
    plans.map((plan) => deepFreeze({
      id: plan.id,
      label: plan.label,
      family: plan.family,
      grid: plan.grid,
      metrics: plan.metrics,
    })),
    {
      objectiveIds,
      objectiveOrder: normalizedObjectiveOrder,
      searchCoverage: base.catalog.searchCoverage,
    },
  );

  return deepFreeze({
    ...base,
    pagePairCount: pagePairs.length,
    technicalBlankPairCount: blankKeys.size,
    plans,
    catalog,
    scope: deepFreeze({
      ...base.scope,
      oddPageTechnicalBlanks: true,
    }),
  });
}

export function normalizeOddPageCollection(collection, config = CONFIG) {
  return normalizeProductRowCollection(collection, config);
}
