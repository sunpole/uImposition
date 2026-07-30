export const USER_PRODUCTION_COMPARISON_TABLE_KIND = "userProductionComparisonTable";

export const COMPARISON_STATUS_FILTER = Object.freeze({
  ALL: "all",
  PARETO: "pareto",
  RECOMMENDED: "recommended",
  DOMINATED: "dominated",
});

export const COMPARISON_SORT_DIRECTION = Object.freeze({
  ASCENDING: "asc",
  DESCENDING: "desc",
});

export const COMPARISON_PROOF_STATUS = Object.freeze({
  PROVEN_PAPER_MINIMUM: "provenPaperMinimum",
  COMPLETE_WITHIN_FAMILY: "completeWithinFamily",
  FEASIBLE: "feasible",
});

const STATUS_FILTERS = new Set(Object.values(COMPARISON_STATUS_FILTER));
const SORT_DIRECTIONS = new Set(Object.values(COMPARISON_SORT_DIRECTION));

function column(id, label, {
  type = "number",
  alwaysVisible = false,
  delta = false,
} = {}) {
  return Object.freeze({ id, label, type, alwaysVisible, delta });
}

export const USER_PRODUCTION_COMPARISON_COLUMNS = Object.freeze([
  column("label", "Вариант", { type: "text", alwaysVisible: true }),
  column("rank", "Ранг", { alwaysVisible: true }),
  column("status", "Статус", { type: "text", alwaysVisible: true }),
  column("physicalSheets", "Физические листы", { delta: true }),
  column("paperWeightKg", "Вес бумаги, кг", { delta: true }),
  column("layoutForms", "Layout-формы", { delta: true }),
  column("colorPlates", "Цветовые пластины", { delta: true }),
  column("pressPasses", "Листопрогоны", { delta: true }),
  column("pairOverrun", "Перетираж пар", { delta: true }),
  column("fileOverrun", "Перетираж файлов", { delta: true }),
  column("splitOrders", "Разделённые заказы", { delta: true }),
  column("impositionCount", "Монтажи", { delta: true }),
  column("paperCost", "Стоимость бумаги", { delta: true }),
  column("colorPlateCost", "Стоимость пластин", { delta: true }),
  column("layoutFormPreparationCost", "Подготовка форм", { delta: true }),
  column("estimatedTotalCost", "Итого", { delta: true }),
  column("estimatedUnitCost", "Цена изделия", { delta: true }),
  column("proofStatus", "Доказательство", { type: "text" }),
  column("orientation", "Ориентация", { type: "number" }),
  column("grid", "Сетка", { type: "text" }),
  column("family", "Plan-family", { type: "text" }),
  column("duplexMode", "Способ оборота", { type: "text" }),
]);

const COLUMN_BY_ID = new Map(USER_PRODUCTION_COMPARISON_COLUMNS.map((definition) => [
  definition.id,
  definition,
]));
const DELTA_COLUMN_IDS = Object.freeze(
  USER_PRODUCTION_COMPARISON_COLUMNS.filter(({ delta }) => delta).map(({ id }) => id),
);

function requirePlanSet(planSet) {
  if (!planSet || typeof planSet !== "object") {
    throw new TypeError("planSet must be an object");
  }
  if (!Array.isArray(planSet.plans) || planSet.plans.length === 0) {
    throw new TypeError("planSet.plans must be a non-empty array");
  }
  if (!planSet.catalog || !Array.isArray(planSet.catalog.entries)) {
    throw new TypeError("planSet.catalog.entries is required");
  }
  if (planSet.catalog.summary?.hiddenSolutionCount !== 0) {
    throw new RangeError("Comparison table requires a lossless catalog");
  }
  return planSet;
}

function requireUniquePlans(plans) {
  const byId = new Map();
  plans.forEach((plan, index) => {
    const id = String(plan?.id ?? "").trim();
    if (!id) throw new RangeError(`planSet.plans[${index}].id is required`);
    if (byId.has(id)) throw new RangeError(`Duplicate plan id: ${id}`);
    if (!plan?.metrics || typeof plan.metrics !== "object") {
      throw new TypeError(`${id}.metrics is required`);
    }
    byId.set(id, plan);
  });
  return byId;
}

function proofStatus(plan) {
  if (plan?.proof?.lowerBoundReached === true) {
    return COMPARISON_PROOF_STATUS.PROVEN_PAPER_MINIMUM;
  }
  if (plan?.proof?.completeWithinFamily === true) {
    return COMPARISON_PROOF_STATUS.COMPLETE_WITHIN_FAMILY;
  }
  return COMPARISON_PROOF_STATUS.FEASIBLE;
}

function gridLabel(grid) {
  const columns = Number(grid?.columns);
  const rows = Number(grid?.rows);
  if (!Number.isInteger(columns) || columns <= 0 || !Number.isInteger(rows) || rows <= 0) {
    return null;
  }
  return `${columns}×${rows}`;
}

function statusValue(entry, selected) {
  const parts = [];
  if (selected) parts.push("selected");
  if (entry.recommended) parts.push("recommended");
  if (entry.pareto) parts.push("pareto");
  if (entry.dominated) parts.push("dominated");
  if (entry.metricEquivalent) parts.push("metricEquivalent");
  return parts.join("|") || "feasible";
}

function rowValues(plan, entry, selected) {
  const metrics = plan.metrics;
  return Object.freeze({
    label: plan.label ?? entry.solution?.label ?? plan.id,
    rank: entry.rank,
    status: statusValue(entry, selected),
    physicalSheets: metrics.physicalSheets,
    paperWeightKg: metrics.paperWeightKg,
    layoutForms: metrics.layoutForms,
    colorPlates: metrics.colorPlates,
    pressPasses: metrics.pressPasses,
    pairOverrun: metrics.pairOverrun,
    fileOverrun: metrics.fileOverrun,
    splitOrders: metrics.splitOrders,
    impositionCount: metrics.impositionCount,
    paperCost: metrics.paperCost,
    colorPlateCost: metrics.colorPlateCost,
    layoutFormPreparationCost: metrics.layoutFormPreparationCost,
    estimatedTotalCost: metrics.estimatedTotalCost,
    estimatedUnitCost: metrics.estimatedUnitCost,
    proofStatus: proofStatus(plan),
    orientation: Number.isFinite(Number(plan.grid?.rotation)) ? Number(plan.grid.rotation) : null,
    grid: gridLabel(plan.grid),
    family: plan.family ?? entry.solution?.family ?? null,
    duplexMode: metrics.duplexMode ?? null,
  });
}

function createBaseRows(planSet, selectedPlanId) {
  const plansById = requireUniquePlans(planSet.plans);
  const seenEntries = new Set();
  const rows = planSet.catalog.entries.map((entry, index) => {
    const id = String(entry?.id ?? "").trim();
    if (!id) throw new RangeError(`planSet.catalog.entries[${index}].id is required`);
    if (seenEntries.has(id)) throw new RangeError(`Duplicate catalog entry id: ${id}`);
    seenEntries.add(id);

    const plan = plansById.get(id);
    if (!plan) throw new RangeError(`Catalog entry has no source plan: ${id}`);
    const selected = id === selectedPlanId;
    return Object.freeze({
      id,
      plan,
      catalogEntry: entry,
      rank: entry.rank,
      recommended: entry.recommended === true,
      selected,
      pareto: entry.pareto === true,
      dominated: entry.dominated === true,
      metricEquivalent: entry.metricEquivalent === true,
      family: plan.family ?? entry.solution?.family ?? null,
      duplexMode: plan.metrics.duplexMode ?? null,
      values: rowValues(plan, entry, selected),
    });
  });

  if (rows.length !== planSet.plans.length) {
    throw new RangeError("Comparison table requires one catalog entry per source plan");
  }
  return Object.freeze(rows);
}

function requireExistingId(rows, id, label) {
  if (id === null || id === undefined || id === "") return null;
  const normalized = String(id);
  if (!rows.some((row) => row.id === normalized)) {
    throw new RangeError(`${label} does not exist in the plan set: ${normalized}`);
  }
  return normalized;
}

function numberOrNull(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function attachDeltas(rows, referenceRow) {
  return Object.freeze(rows.map((row) => {
    const deltas = {};
    DELTA_COLUMN_IDS.forEach((columnId) => {
      const current = numberOrNull(row.values[columnId]);
      const reference = numberOrNull(referenceRow?.values[columnId]);
      deltas[columnId] = current === null || reference === null ? null : current - reference;
    });
    return Object.freeze({ ...row, deltas: Object.freeze(deltas) });
  }));
}

function requireStatusFilter(value) {
  const normalized = value ?? COMPARISON_STATUS_FILTER.ALL;
  if (!STATUS_FILTERS.has(normalized)) {
    throw new RangeError(`Unsupported status filter: ${normalized}`);
  }
  return normalized;
}

function requireSort(columnId, direction) {
  const normalizedColumnId = columnId ?? "rank";
  const normalizedDirection = direction ?? COMPARISON_SORT_DIRECTION.ASCENDING;
  if (!COLUMN_BY_ID.has(normalizedColumnId)) {
    throw new RangeError(`Unsupported comparison sort column: ${normalizedColumnId}`);
  }
  if (!SORT_DIRECTIONS.has(normalizedDirection)) {
    throw new RangeError(`Unsupported comparison sort direction: ${normalizedDirection}`);
  }
  return Object.freeze({ columnId: normalizedColumnId, direction: normalizedDirection });
}

function matchesStatus(row, statusFilter) {
  if (statusFilter === COMPARISON_STATUS_FILTER.ALL) return true;
  if (statusFilter === COMPARISON_STATUS_FILTER.PARETO) return row.pareto;
  if (statusFilter === COMPARISON_STATUS_FILTER.RECOMMENDED) return row.recommended;
  return row.dominated;
}

function filterRows(rows, { statusFilter, planFamily, duplexMode }) {
  return rows.filter((row) => (
    matchesStatus(row, statusFilter)
    && (planFamily === null || planFamily === undefined || row.family === planFamily)
    && (duplexMode === null || duplexMode === undefined || row.duplexMode === duplexMode)
  ));
}

function comparePresentValues(left, right, type) {
  if (type === "number") return Number(left) - Number(right);
  return String(left).localeCompare(String(right), "ru");
}

function sortRows(rows, sort) {
  const definition = COLUMN_BY_ID.get(sort.columnId);
  const multiplier = sort.direction === COMPARISON_SORT_DIRECTION.DESCENDING ? -1 : 1;
  return Object.freeze([...rows].sort((left, right) => {
    const leftValue = left.values[sort.columnId];
    const rightValue = right.values[sort.columnId];
    const leftMissing = leftValue === null || leftValue === undefined;
    const rightMissing = rightValue === null || rightValue === undefined;

    if (leftMissing && rightMissing) return left.rank - right.rank || left.id.localeCompare(right.id);
    if (leftMissing) return 1;
    if (rightMissing) return -1;

    const compared = comparePresentValues(leftValue, rightValue, definition.type) * multiplier;
    return compared || left.rank - right.rank || left.id.localeCompare(right.id);
  }));
}

function signature(value) {
  if (value === null || value === undefined) return "missing";
  if (typeof value === "number") return `number:${Object.is(value, -0) ? 0 : value}`;
  return `${typeof value}:${String(value)}`;
}

function decorateColumns(rows, onlyDifferences) {
  const columns = USER_PRODUCTION_COMPARISON_COLUMNS.map((definition) => {
    const values = rows.map((row) => row.values[definition.id]);
    const signatures = new Set(values.map(signature));
    const available = values.some((value) => value !== null && value !== undefined);
    const differs = signatures.size > 1;
    const visible = definition.alwaysVisible || !onlyDifferences || differs;
    return Object.freeze({ ...definition, available, differs, visible });
  });
  return Object.freeze(columns);
}

/**
 * Creates a view model for a compact, lossless comparison table.
 *
 * The model never rebuilds production plans. `allRows` always contains one row
 * per catalog entry and keeps the exact source plan object by reference. Filters,
 * sorting and `onlyDifferences` affect only `rows`/column visibility.
 */
export function createUserProductionComparisonTable(planSet, {
  selectedPlanId = null,
  referencePlanId = null,
  statusFilter = COMPARISON_STATUS_FILTER.ALL,
  planFamily = null,
  duplexMode = null,
  sortBy = "rank",
  sortDirection = COMPARISON_SORT_DIRECTION.ASCENDING,
  onlyDifferences = false,
} = {}) {
  const normalizedPlanSet = requirePlanSet(planSet);
  const baseRows = createBaseRows(normalizedPlanSet, selectedPlanId);
  const normalizedSelectedPlanId = requireExistingId(baseRows, selectedPlanId, "selectedPlanId");
  const requestedReferenceId = referencePlanId
    ?? normalizedSelectedPlanId
    ?? normalizedPlanSet.catalog.recommendedId;
  const normalizedReferencePlanId = requireExistingId(baseRows, requestedReferenceId, "referencePlanId");
  const referenceBaseRow = baseRows.find(({ id }) => id === normalizedReferencePlanId) ?? null;
  const allRows = attachDeltas(baseRows, referenceBaseRow);
  const normalizedStatusFilter = requireStatusFilter(statusFilter);
  const normalizedSort = requireSort(sortBy, sortDirection);
  const filteredRows = filterRows(allRows, {
    statusFilter: normalizedStatusFilter,
    planFamily,
    duplexMode,
  });
  const rows = sortRows(filteredRows, normalizedSort);
  const columns = decorateColumns(rows, Boolean(onlyDifferences));

  return Object.freeze({
    kind: USER_PRODUCTION_COMPARISON_TABLE_KIND,
    catalog: normalizedPlanSet.catalog,
    allRows,
    rows,
    columns,
    visibleColumns: Object.freeze(columns.filter(({ visible }) => visible)),
    referencePlanId: normalizedReferencePlanId,
    selectedPlanId: normalizedSelectedPlanId,
    recommendedPlanId: normalizedPlanSet.catalog.recommendedId,
    filters: Object.freeze({
      status: normalizedStatusFilter,
      planFamily: planFamily ?? null,
      duplexMode: duplexMode ?? null,
      onlyDifferences: Boolean(onlyDifferences),
    }),
    sort: normalizedSort,
    summary: Object.freeze({
      catalogFeasibleSolutionCount: allRows.length,
      viewRowCount: rows.length,
      hiddenByViewCount: allRows.length - rows.length,
      catalogHiddenSolutionCount: normalizedPlanSet.catalog.summary.hiddenSolutionCount,
      reusedPlanCount: allRows.length,
      regeneratedPlanCount: 0,
    }),
  });
}
