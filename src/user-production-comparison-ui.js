import {
  COMPARISON_SORT_DIRECTION,
  COMPARISON_STATUS_FILTER,
  createUserProductionComparisonTable,
} from "./user-production-comparison-table.js";

const MAIN_COLUMN_IDS = Object.freeze([
  "label",
  "physicalSheets",
  "layoutForms",
  "colorPlates",
  "pressPasses",
  "pairOverrun",
  "estimatedTotalCost",
  "status",
]);

const MONEY_COLUMNS = new Set([
  "paperCost",
  "colorPlateCost",
  "layoutFormPreparationCost",
  "estimatedTotalCost",
  "estimatedUnitCost",
]);

const INTEGER_COLUMNS = new Set([
  "rank",
  "physicalSheets",
  "layoutForms",
  "colorPlates",
  "pressPasses",
  "pairOverrun",
  "fileOverrun",
  "splitOrders",
  "impositionCount",
  "orientation",
]);

const TEXT = Object.freeze({
  ru: Object.freeze({
    title: "Сравнение производственных вариантов",
    subtitle: "Одна строка на каждый допустимый план",
    all: "Все",
    pareto: "Pareto",
    recommended: "Рекомендуемые",
    dominated: "Доминируемые",
    onlyDifferences: "Только различия",
    family: "Семейство",
    allFamilies: "Все семейства",
    duplex: "Способ оборота",
    allDuplex: "Все способы",
    shown: "показано",
    variants: "варианта(ов)",
    exactScope: "Полный набор внутри заявленной области: uniform-сетки 0°/90° и поддерживаемые plan-family. Это не глобальный перебор mixed-layout и всех последовательностей форм.",
    workAndTurnScope: "«Свой оборот» рассчитывается только для сеток с чётным числом колонок: одна общая форма, горизонтальный переворот, два прогона.",
    workAndTurnBlankExcluded: "«Свой оборот» исключён для текущего заказа из-за технически пустой оборотной страницы.",
    from: "из",
    reference: "Дельты относительно",
    selectedReference: "выбранного плана",
    recommendedReference: "рекомендации",
    retained: "Все планы сохранены; фильтры и сортировка меняют только представление.",
    noRows: "По текущим фильтрам вариантов нет.",
    select: "Выбрать",
    selected: "Выбран",
    recommendedBadge: "рекомендован",
    paretoBadge: "Pareto",
    dominatedBadge: "доминируем",
    equivalentBadge: "те же метрики",
    feasibleBadge: "допустим",
    lowerBound: "доказан минимум бумаги",
    familyComplete: "полный набор семейства",
    feasibleProof: "допустимый план",
    pricingMissing: "нет прайса",
    sortAscending: "по возрастанию",
    sortDescending: "по убыванию",
    action: "Действие",
    details: "Подробности",
    rowsReused: "готовых планов использовано повторно",
    rowsRegenerated: "планов построено заново",
  }),
  en: Object.freeze({
    title: "Production variant comparison",
    subtitle: "One row for every feasible plan",
    all: "All",
    pareto: "Pareto",
    recommended: "Recommended",
    dominated: "Dominated",
    onlyDifferences: "Differences only",
    family: "Family",
    allFamilies: "All families",
    duplex: "Duplex method",
    allDuplex: "All methods",
    shown: "shown",
    variants: "variant(s)",
    exactScope: "Complete inside the declared scope: uniform 0°/90° grids and supported plan families. This is not a global enumeration of mixed layouts or every form sequence.",
    workAndTurnScope: "Work-and-turn is evaluated only for grids with an even column count: one shared plate, horizontal turn and two passes.",
    workAndTurnBlankExcluded: "Work-and-turn is excluded for this order because it contains a technical blank back page.",
    from: "of",
    reference: "Deltas relative to",
    selectedReference: "the selected plan",
    recommendedReference: "the recommendation",
    retained: "Every plan is retained; filters and sorting only transform the view.",
    noRows: "No variants match the current filters.",
    select: "Select",
    selected: "Selected",
    recommendedBadge: "recommended",
    paretoBadge: "Pareto",
    dominatedBadge: "dominated",
    equivalentBadge: "same metrics",
    feasibleBadge: "feasible",
    lowerBound: "paper minimum proven",
    familyComplete: "family set complete",
    feasibleProof: "feasible plan",
    pricingMissing: "no pricing",
    sortAscending: "ascending",
    sortDescending: "descending",
    action: "Action",
    details: "Details",
    rowsReused: "generated plans reused",
    rowsRegenerated: "plans regenerated",
  }),
});

const VALUE_LABELS = Object.freeze({
  ru: Object.freeze({
    paperMinimum: "Минимум бумаги",
    dedicatedPairForms: "Отдельные формы лица и оборота",
    workAndTurnDedicatedPairs: "Свой оборот — общая форма",
    separateFrontBackForms: "Чужой оборот",
    workAndTurn: "Свой оборот",
  }),
  en: Object.freeze({
    paperMinimum: "Paper minimum",
    dedicatedPairForms: "Separate front/back forms",
    workAndTurnDedicatedPairs: "Work-and-turn shared plate",
    separateFrontBackForms: "Separate front/back forms",
    workAndTurn: "Work-and-turn",
  }),
});

const COLUMN_LABELS = Object.freeze({
  ru: Object.freeze({
    label: "Вариант",
    rank: "Ранг",
    status: "Статус",
    physicalSheets: "Листы",
    paperWeightKg: "Бумага, кг",
    layoutForms: "Формы",
    colorPlates: "Пластины",
    pressPasses: "Прогоны",
    pairOverrun: "Перетираж",
    fileOverrun: "Перетираж файлов",
    splitOrders: "Разделённые заказы",
    impositionCount: "Монтажи",
    paperCost: "Бумага",
    colorPlateCost: "Пластины",
    layoutFormPreparationCost: "Подготовка",
    estimatedTotalCost: "Стоимость",
    estimatedUnitCost: "За изделие",
    proofStatus: "Доказательство",
    orientation: "Поворот",
    grid: "Сетка",
    family: "Семейство",
    duplexMode: "Оборот",
  }),
  en: Object.freeze({
    label: "Variant",
    rank: "Rank",
    status: "Status",
    physicalSheets: "Sheets",
    paperWeightKg: "Paper, kg",
    layoutForms: "Forms",
    colorPlates: "Plates",
    pressPasses: "Passes",
    pairOverrun: "Overrun",
    fileOverrun: "File overrun",
    splitOrders: "Split orders",
    impositionCount: "Impositions",
    paperCost: "Paper",
    colorPlateCost: "Plates",
    layoutFormPreparationCost: "Preparation",
    estimatedTotalCost: "Cost",
    estimatedUnitCost: "Per unit",
    proofStatus: "Proof",
    orientation: "Rotation",
    grid: "Grid",
    family: "Family",
    duplexMode: "Duplex",
  }),
});

const viewState = {
  statusFilter: COMPARISON_STATUS_FILTER.ALL,
  planFamily: null,
  duplexMode: null,
  sortBy: "rank",
  sortDirection: COMPARISON_SORT_DIRECTION.ASCENDING,
  onlyDifferences: false,
};

function language() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function t(key) {
  return TEXT[language()][key] ?? TEXT.ru[key] ?? key;
}

function valueLabel(value) {
  return VALUE_LABELS[language()][value] ?? VALUE_LABELS.ru[value] ?? String(value);
}

function columnLabel(columnId) {
  return COLUMN_LABELS[language()][columnId] ?? COLUMN_LABELS.ru[columnId] ?? columnId;
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function locale() {
  return language() === "en" ? "en-US" : "ru-RU";
}

function formatNumber(value, maximumFractionDigits = 2) {
  return Number(value).toLocaleString(locale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatValue(columnId, value, row) {
  if (value === null || value === undefined) {
    return MONEY_COLUMNS.has(columnId) ? t("pricingMissing") : "—";
  }
  if (columnId === "orientation") return `${formatNumber(value, 0)}°`;
  if (columnId === "family" || columnId === "duplexMode") return valueLabel(value);
  if (MONEY_COLUMNS.has(columnId)) {
    const currency = row.plan.metrics.currency ?? "BYN";
    return `${formatNumber(value, columnId === "estimatedUnitCost" ? 4 : 2)} ${currency}`;
  }
  if (INTEGER_COLUMNS.has(columnId)) return formatNumber(value, 0);
  if (columnId === "paperWeightKg") return formatNumber(value, 3);
  if (columnId === "proofStatus") return proofText(value);
  return String(value);
}

function proofText(value) {
  if (value === "provenPaperMinimum") return t("lowerBound");
  if (value === "completeWithinFamily") return t("familyComplete");
  return t("feasibleProof");
}

function deltaText(columnId, value) {
  if (value === null || value === undefined || value === 0) return "";
  const sign = value > 0 ? "+" : "−";
  const absolute = Math.abs(value);
  if (MONEY_COLUMNS.has(columnId)) return `${sign}${formatNumber(absolute, 2)}`;
  if (columnId === "paperWeightKg") return `${sign}${formatNumber(absolute, 3)}`;
  return `${sign}${formatNumber(absolute, INTEGER_COLUMNS.has(columnId) ? 0 : 2)}`;
}

function statusBadges(row) {
  const wrap = element("div", "comparison-statuses");
  if (row.selected) wrap.append(badge(t("selected"), "selected"));
  if (row.recommended) wrap.append(badge(t("recommendedBadge"), "recommended"));
  if (row.pareto) wrap.append(badge(t("paretoBadge"), "pareto"));
  if (row.dominated) wrap.append(badge(t("dominatedBadge"), "dominated"));
  if (row.metricEquivalent) wrap.append(badge(t("equivalentBadge"), "equivalent"));
  if (wrap.children.length === 0) wrap.append(badge(t("feasibleBadge"), "feasible"));
  return wrap;
}

function badge(text, modifier) {
  return element("span", `comparison-badge comparison-badge--${modifier}`, text);
}

function statusButton(filterId, label, count) {
  const button = element("button", "comparison-filter", `${label} · ${count}`);
  button.type = "button";
  button.dataset.comparisonStatus = filterId;
  button.classList.toggle("is-active", viewState.statusFilter === filterId);
  button.setAttribute("aria-pressed", String(viewState.statusFilter === filterId));
  return button;
}

function uniqueOptions(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((left, right) => (
    valueLabel(left).localeCompare(valueLabel(right), locale())
  ));
}

function selectControl(labelText, dataName, allText, values, currentValue) {
  const label = element("label", "comparison-control");
  label.append(element("span", "comparison-control__label", labelText));
  const select = document.createElement("select");
  select.dataset[dataName] = "";
  select.append(new Option(allText, ""));
  values.forEach((value) => select.append(new Option(valueLabel(value), String(value))));
  select.value = currentValue ?? "";
  label.append(select);
  return label;
}

function visibleColumnIds(tableModel) {
  const visible = new Set(tableModel.visibleColumns.map(({ id }) => id));
  return MAIN_COLUMN_IDS.filter((columnId) => visible.has(columnId));
}

function renderHeaderCell(columnId) {
  const th = element("th", "comparison-table__heading");
  th.scope = "col";
  const sortable = columnId !== "status";
  if (!sortable) {
    th.textContent = columnLabel(columnId);
    return th;
  }
  const button = element("button", "comparison-sort-button", columnLabel(columnId));
  button.type = "button";
  button.dataset.comparisonSort = columnId;
  if (viewState.sortBy === columnId) {
    const descending = viewState.sortDirection === COMPARISON_SORT_DIRECTION.DESCENDING;
    button.append(element("span", "comparison-sort-marker", descending ? "↓" : "↑"));
    button.setAttribute("aria-label", `${columnLabel(columnId)}, ${t(descending ? "sortDescending" : "sortAscending")}`);
  }
  th.append(button);
  return th;
}

function localizedPlanTitle(row) {
  const family = valueLabel(row.family ?? row.values.family);
  const duplex = valueLabel(row.duplexMode ?? row.values.duplexMode);
  return `${family} · ${duplex}`;
}

function renderValueCell(row, columnId) {
  const td = element("td", `comparison-table__cell comparison-table__cell--${columnId}`);
  td.dataset.label = columnLabel(columnId);

  if (columnId === "label") {
    const copy = element("div", "comparison-plan-copy");
    copy.append(
      element("strong", "comparison-plan-copy__title", localizedPlanTitle(row)),
      element("span", "comparison-plan-copy__meta", `${row.values.orientation ?? 0}° · ${row.values.grid ?? "—"} · #${row.rank}`),
      element("span", "comparison-plan-copy__proof", proofText(row.values.proofStatus)),
    );
    td.append(copy);
    return td;
  }

  if (columnId === "status") {
    td.append(statusBadges(row));
    return td;
  }

  const value = element("strong", "comparison-value", formatValue(columnId, row.values[columnId], row));
  const delta = deltaText(columnId, row.deltas[columnId]);
  td.append(value);
  if (delta) td.append(element("small", `comparison-delta${row.deltas[columnId] > 0 ? " is-positive" : " is-negative"}`, delta));
  return td;
}

function renderRow(row, columnIds) {
  const tr = element("tr", "comparison-table__row");
  tr.dataset.planId = row.id;
  tr.dataset.duplexMode = row.duplexMode ?? "";
  tr.dataset.planFamily = row.family ?? "";
  tr.classList.toggle("is-recommended", row.recommended);
  tr.classList.toggle("is-operator-selected", row.selected);
  columnIds.forEach((columnId) => tr.append(renderValueCell(row, columnId)));

  const action = element("td", "comparison-table__cell comparison-table__cell--action");
  action.dataset.label = t("action");
  const button = element(
    "button",
    `button comparison-select-button${row.selected ? "" : " button--quiet"}`,
    row.selected ? t("selected") : t("select"),
  );
  button.type = "button";
  button.dataset.selectUserPlan = row.id;
  button.setAttribute("aria-pressed", String(row.selected));
  action.append(button);
  tr.append(action);
  return tr;
}

function renderTable(tableModel) {
  const columnIds = visibleColumnIds(tableModel);
  const wrap = element("div", "comparison-table-wrap");
  const table = element("table", "comparison-table");
  const thead = element("thead");
  const headerRow = element("tr");
  columnIds.forEach((columnId) => headerRow.append(renderHeaderCell(columnId)));
  const actionHeading = element("th", "comparison-table__heading", t("action"));
  actionHeading.scope = "col";
  headerRow.append(actionHeading);
  thead.append(headerRow);

  const tbody = element("tbody");
  tableModel.rows.forEach((row) => tbody.append(renderRow(row, columnIds)));
  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
}

function renderMobileReference(tableModel) {
  const referenceIsSelected = tableModel.referencePlanId === tableModel.selectedPlanId && tableModel.selectedPlanId;
  const label = referenceIsSelected ? t("selectedReference") : t("recommendedReference");
  return `${t("reference")}: ${label}`;
}

function workAndTurnScopeText(planSet) {
  if (planSet.scope?.workAndTurnExcludedByTechnicalBlank) return t("workAndTurnBlankExcluded");
  if (planSet.scope?.workAndTurnEvaluated) return t("workAndTurnScope");
  return null;
}

function handleControls(panel, renderAgain) {
  panel.querySelectorAll("[data-comparison-status]").forEach((button) => {
    button.addEventListener("click", () => {
      viewState.statusFilter = button.dataset.comparisonStatus;
      renderAgain();
    });
  });

  panel.querySelector("[data-comparison-family]")?.addEventListener("change", (event) => {
    viewState.planFamily = event.target.value || null;
    renderAgain();
  });

  panel.querySelector("[data-comparison-duplex]")?.addEventListener("change", (event) => {
    viewState.duplexMode = event.target.value || null;
    renderAgain();
  });

  panel.querySelector("[data-comparison-differences]")?.addEventListener("change", (event) => {
    viewState.onlyDifferences = event.target.checked;
    renderAgain();
  });

  panel.querySelectorAll("[data-comparison-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const columnId = button.dataset.comparisonSort;
      if (viewState.sortBy === columnId) {
        viewState.sortDirection = viewState.sortDirection === COMPARISON_SORT_DIRECTION.ASCENDING
          ? COMPARISON_SORT_DIRECTION.DESCENDING
          : COMPARISON_SORT_DIRECTION.ASCENDING;
      } else {
        viewState.sortBy = columnId;
        viewState.sortDirection = COMPARISON_SORT_DIRECTION.ASCENDING;
      }
      renderAgain();
    });
  });
}

export function renderUserProductionComparisonPanel(panel, planSet, {
  selectedPlanId = null,
} = {}) {
  const tableModel = createUserProductionComparisonTable(planSet, {
    selectedPlanId,
    statusFilter: viewState.statusFilter,
    planFamily: viewState.planFamily,
    duplexMode: viewState.duplexMode,
    sortBy: viewState.sortBy,
    sortDirection: viewState.sortDirection,
    onlyDifferences: viewState.onlyDifferences,
  });

  panel.replaceChildren();
  panel.dataset.comparisonWorkspace = "true";

  const heading = element("div", "comparison-heading");
  const headingCopy = element("div");
  headingCopy.append(
    element("h2", "comparison-heading__title", t("title")),
    element("p", "comparison-heading__subtitle", t("subtitle")),
  );
  heading.append(headingCopy, badge(`${tableModel.allRows.length} ${t("variants")}`, "count"));

  const statusFilters = element("div", "comparison-status-filters");
  const summary = planSet.catalog.summary;
  statusFilters.append(
    statusButton(COMPARISON_STATUS_FILTER.ALL, t("all"), summary.feasibleSolutionCount),
    statusButton(COMPARISON_STATUS_FILTER.PARETO, t("pareto"), summary.paretoSolutionCount),
    statusButton(COMPARISON_STATUS_FILTER.RECOMMENDED, t("recommended"), 1),
    statusButton(COMPARISON_STATUS_FILTER.DOMINATED, t("dominated"), summary.dominatedSolutionCount),
  );

  const controls = element("div", "comparison-controls");
  controls.append(
    selectControl(t("family"), "comparisonFamily", t("allFamilies"), uniqueOptions(tableModel.allRows, "family"), viewState.planFamily),
    selectControl(t("duplex"), "comparisonDuplex", t("allDuplex"), uniqueOptions(tableModel.allRows, "duplexMode"), viewState.duplexMode),
  );
  const differences = element("label", "comparison-differences");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = viewState.onlyDifferences;
  checkbox.dataset.comparisonDifferences = "";
  differences.append(checkbox, element("span", "", t("onlyDifferences")));
  controls.append(differences);

  const status = element("div", "comparison-view-status");
  const workAndTurnStatus = workAndTurnScopeText(planSet);
  status.append(
    element("strong", "", `${t("shown")}: ${tableModel.summary.viewRowCount} ${t("from")} ${tableModel.summary.catalogFeasibleSolutionCount}`),
    element("span", "", renderMobileReference(tableModel)),
    element("span", "", t("exactScope")),
  );
  if (workAndTurnStatus) status.append(element("span", "comparison-work-and-turn-scope", workAndTurnStatus));
  status.append(
    element("span", "", t("retained")),
    element("span", "comparison-runtime-proof", `${tableModel.summary.reusedPlanCount} ${t("rowsReused")} · ${tableModel.summary.regeneratedPlanCount} ${t("rowsRegenerated")}`),
  );

  panel.append(heading, statusFilters, controls, status);
  if (tableModel.rows.length === 0) panel.append(element("p", "empty-state", t("noRows")));
  else panel.append(renderTable(tableModel));

  const renderAgain = () => renderUserProductionComparisonPanel(panel, planSet, { selectedPlanId });
  handleControls(panel, renderAgain);
  return tableModel;
}
