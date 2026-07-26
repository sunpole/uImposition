import {
  PDF_PAGE_MODES,
  createProductionReportPdfDocument,
  createSchemePdfDocument,
} from "./pdf-document-model.js";
import { renderProductionReportPdfBytes } from "./pdf-report-renderer.js";
import {
  downloadPdfBytes,
  renderSchemePdfBytes,
} from "./pdf-scheme-renderer.js";
import { renderSchemePairs } from "./scheme-renderer.js";
import {
  clearUserProductionPlanSelection,
  selectUserProductionPlan,
  subscribeUserProductionPlanRuntime,
} from "./user-production-plans-runtime.js";

const PREVIEW_IMPOSITION_LIMIT = 8;
const INTERACTIVE_PDF_IMPOSITION_LIMIT = 120;

const TEXT = Object.freeze({
  ru: Object.freeze({
    select: "Выбрать",
    selected: "Выбран",
    changeSelection: "Снять выбор",
    panelTitle: "Выбранный производственный план",
    panelKicker: "M7.5 · SELECTED",
    noSelection: "Выберите любой вариант в каталоге выше. Рекомендация не применяется автоматически.",
    unavailable: "Сначала введите корректный заказ и дождитесь построения вариантов.",
    validated: "проверен",
    orientation: "Ориентация",
    grid: "Сетка",
    sheets: "Физические листы",
    forms: "Layout-формы",
    plates: "Цветовые пластины",
    passes: "Листопрогоны",
    pairOverrun: "Перетираж пар",
    fileOverrun: "Перетираж файлов",
    cost: "Себестоимость",
    pricingMissing: "прайс не введён",
    schemesTitle: "Реальные схемы выбранного плана",
    schemesIntro: "Лицо и оборот materialize-ятся из выбранного плана и повторно проходят общую производственную проверку.",
    previewShown: "Показано монтажей",
    previewLimited: "В preview показана только первая часть. PDF содержит весь выбранный план.",
    reportTitle: "Производственный отчёт выбранного плана",
    reportReady: "Недопечатки нет · отчёт проверен",
    filesTitle: "Итоги по файлам",
    pairsTitle: "Итоги по печатным парам",
    file: "Файл",
    pair: "Пара",
    pages: "Страницы",
    required: "Требуется",
    produced: "Напечатано",
    overrun: "Перетираж",
    underproduction: "Недопечатка",
    contributions: "Вклады монтажей",
    exportTitle: "Экспорт выбранного плана",
    exportIntro: "Схемы и отчёт создаются из выбранного варианта, а не из контрольного набора и не из автоматически рекомендованного плана.",
    exportSchemes: "Скачать PDF схем",
    exportReport: "Скачать PDF отчёта",
    exportReady: "PDF готов к созданию",
    buildingSchemes: "Создание PDF схем…",
    buildingReport: "Создание PDF отчёта…",
    schemesComplete: "PDF схем создан",
    reportComplete: "PDF отчёта создан",
    exportFailed: "Не удалось создать PDF",
    exportTooLarge: `Интерактивный PDF временно ограничен ${INTERACTIVE_PDF_IMPOSITION_LIMIT} монтажами. Сам план и отчёт остаются доступны; для большего экспорта будет добавлен отдельный worker.`,
    technicalBoundary: "Экспорт относится к выбранному uniform-grid плану с отдельными лицевыми и оборотными формами. Он не превращает текущую ограниченную область поиска в глобальный mixed-format или work-and-turn solver.",
  }),
  en: Object.freeze({
    select: "Select",
    selected: "Selected",
    changeSelection: "Clear selection",
    panelTitle: "Selected production plan",
    panelKicker: "M7.5 · SELECTED",
    noSelection: "Select any catalog variant above. The recommendation is never applied automatically.",
    unavailable: "Enter a valid order and wait for alternatives first.",
    validated: "validated",
    orientation: "Orientation",
    grid: "Grid",
    sheets: "Physical sheets",
    forms: "Layout forms",
    plates: "Color plates",
    passes: "Press passes",
    pairOverrun: "Pair overrun",
    fileOverrun: "File overrun",
    cost: "Production cost",
    pricingMissing: "pricing not entered",
    schemesTitle: "Real schemes of the selected plan",
    schemesIntro: "Front and back are materialized from the selected plan and pass the shared production validator again.",
    previewShown: "Impositions shown",
    previewLimited: "The preview shows only the first part. The PDF contains the full selected plan.",
    reportTitle: "Selected-plan production report",
    reportReady: "Zero underproduction · report validated",
    filesTitle: "File totals",
    pairsTitle: "Print-pair totals",
    file: "File",
    pair: "Pair",
    pages: "Pages",
    required: "Required",
    produced: "Produced",
    overrun: "Overrun",
    underproduction: "Underproduction",
    contributions: "Imposition contributions",
    exportTitle: "Export selected plan",
    exportIntro: "Scheme and report PDFs are built from the selected variant, not the control dataset or an automatically recommended plan.",
    exportSchemes: "Download scheme PDF",
    exportReport: "Download report PDF",
    exportReady: "PDF is ready to build",
    buildingSchemes: "Building scheme PDF…",
    buildingReport: "Building report PDF…",
    schemesComplete: "Scheme PDF created",
    reportComplete: "Report PDF created",
    exportFailed: "Could not create PDF",
    exportTooLarge: `Interactive PDF is temporarily limited to ${INTERACTIVE_PDF_IMPOSITION_LIMIT} impositions. The plan and report remain available; a dedicated worker will handle larger exports.`,
    technicalBoundary: "Export applies to the selected uniform-grid plan with separate front/back forms. It does not turn the bounded search into a global mixed-format or work-and-turn solver.",
  }),
});

let runtimeSnapshot = Object.freeze({ ready: false, planSet: null, selectedPlan: null, selectedPlanId: null });
let exportBusy = false;
let exportStatusKey = "exportReady";
let exportStatusDetail = "";
let mutationObserver = null;

const $ = (selector) => document.querySelector(selector);

function language() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function t(key) {
  return TEXT[language()][key] ?? TEXT.ru[key] ?? key;
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function ensureStylesheet() {
  if ($('link[data-user-plan-details-styles]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "user-production-plan-details.css";
  link.setAttribute("data-user-plan-details-styles", "");
  document.head.append(link);
}

function ensurePanel() {
  const existing = $("#selectedUserPlanDetails");
  if (existing) return existing;
  const panel = element("section", "panel selected-user-plan-details");
  panel.id = "selectedUserPlanDetails";
  const catalog = $("#userProductionPlans");
  const workspace = $(".workspace");
  if (!workspace) throw new Error("Workspace container not found");
  if (catalog) catalog.after(panel);
  else workspace.append(panel);
  return panel;
}

function formatNumber(value, maximumFractionDigits = 2) {
  return Number(value).toLocaleString(language() === "en" ? "en-US" : "ru-RU", {
    maximumFractionDigits,
  });
}

function safeFilePart(value) {
  const normalized = String(value ?? "plan")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "plan";
}

function costText(metrics) {
  if (metrics.estimatedTotalCost === null) return t("pricingMissing");
  return `${formatNumber(metrics.estimatedTotalCost, 2)} ${metrics.currency}`;
}

function metric(label, value, accent = false) {
  const card = element("article", `metric${accent ? " metric--accent" : ""}`);
  card.append(element("span", "", label), element("strong", "", value));
  return card;
}

function heading(title, kicker, status = "") {
  const node = element("div", "section-heading");
  const copy = element("div");
  copy.append(element("p", "section-kicker", kicker), element("h2", "", title));
  node.append(copy);
  if (status) node.append(element("span", "status-chip status-chip--success", status));
  return node;
}

function pagesText(row) {
  return row.backPage === null ? `${row.frontPage}/-` : `${row.frontPage}/${row.backPage}`;
}

function contributionsText(row) {
  return row.contributions
    .map((item) => `${item.impositionId}: ${item.positionCount} × ${formatNumber(item.runLength)} = ${formatNumber(item.producedQuantity)}`)
    .join("; ");
}

function appendCell(row, value, className = "") {
  row.append(element("td", className, String(value)));
}

function table(headers, rows, rowBuilder, className = "") {
  const wrap = element("div", "table-wrap");
  const tableNode = element("table", className);
  const thead = element("thead");
  const headRow = element("tr");
  headers.forEach((header) => headRow.append(element("th", "", header)));
  thead.append(headRow);
  const tbody = element("tbody");
  rows.forEach((row, index) => tbody.append(rowBuilder(row, index)));
  tableNode.append(thead, tbody);
  wrap.append(tableNode);
  return wrap;
}

function details(summary, content, open = false) {
  const node = element("details", "selected-plan-details-block");
  node.open = open;
  node.append(element("summary", "", summary), content);
  return node;
}

function renderFileTable(report) {
  return table(
    [t("file"), t("required"), t("produced"), t("overrun"), t("underproduction")],
    report.fileMetrics,
    (row) => {
      const tr = element("tr");
      appendCell(tr, row.file);
      appendCell(tr, formatNumber(row.requiredQuantity));
      appendCell(tr, formatNumber(row.producedQuantity));
      appendCell(tr, formatNumber(row.overrun));
      appendCell(tr, formatNumber(row.underproduction), row.underproduction > 0 ? "is-error" : "");
      return tr;
    },
    "selected-plan-table",
  );
}

function renderPairTable(report) {
  return table(
    [t("file"), t("pair"), t("pages"), t("required"), t("produced"), t("overrun"), t("contributions")],
    report.pairMetrics,
    (row) => {
      const tr = element("tr");
      appendCell(tr, row.file);
      appendCell(tr, formatNumber(row.pairIndex));
      appendCell(tr, pagesText(row));
      appendCell(tr, formatNumber(row.requiredQuantity));
      appendCell(tr, formatNumber(row.producedQuantity));
      appendCell(tr, formatNumber(row.overrun));
      appendCell(tr, contributionsText(row), "selected-plan-contributions");
      return tr;
    },
    "selected-plan-table selected-plan-table--pairs",
  );
}

function renderEmpty(panel) {
  panel.replaceChildren(
    heading(t("panelTitle"), t("panelKicker")),
    element("p", "empty-state", runtimeSnapshot.ready ? t("noSelection") : t("unavailable")),
  );
}

function renderSelectedSummary(plan) {
  const section = element("section", "selected-plan-summary");
  const header = heading(plan.label, t("panelKicker"), t("validated"));
  const clear = element("button", "button button--quiet selected-plan-clear", t("changeSelection"));
  clear.type = "button";
  clear.addEventListener("click", clearUserProductionPlanSelection);
  header.append(clear);

  const grid = element("div", "result-grid selected-plan-summary__metrics");
  grid.append(
    metric(t("sheets"), formatNumber(plan.metrics.physicalSheets), true),
    metric(t("forms"), formatNumber(plan.metrics.layoutForms)),
    metric(t("plates"), formatNumber(plan.metrics.colorPlates)),
    metric(t("passes"), formatNumber(plan.metrics.pressPasses)),
    metric(t("pairOverrun"), formatNumber(plan.metrics.pairOverrun)),
    metric(t("fileOverrun"), formatNumber(plan.metrics.fileOverrun)),
    metric(t("cost"), costText(plan.metrics), plan.metrics.estimatedTotalCost !== null),
  );
  const meta = element("p", "selected-plan-meta");
  meta.textContent = `${t("orientation")}: ${plan.grid.rotation}° · ${t("grid")}: ${plan.grid.columns} × ${plan.grid.rows} · ${plan.id}`;
  section.append(header, grid, meta);
  return section;
}

function renderSchemes(plan) {
  const section = element("section", "selected-plan-section");
  section.append(
    element("h3", "", t("schemesTitle")),
    element("p", "", t("schemesIntro")),
  );
  const shown = plan.impositions.slice(0, PREVIEW_IMPOSITION_LIMIT);
  const note = element("p", "selected-plan-preview-note");
  note.textContent = `${t("previewShown")}: ${shown.length} / ${plan.impositions.length}.${shown.length < plan.impositions.length ? ` ${t("previewLimited")}` : ""}`;
  const container = element("div", "scheme-pairs selected-plan-schemes");
  renderSchemePairs(container, shown, { language: language() });
  section.append(note, container);
  return section;
}

function renderReport(plan) {
  const report = plan.report;
  const section = element("section", "selected-plan-section selected-plan-report");
  section.append(
    heading(t("reportTitle"), "PRODUCTION", t("reportReady")),
  );
  const summary = element("div", "result-grid selected-plan-report__metrics");
  summary.append(
    metric(t("sheets"), formatNumber(report.totals.physicalSheets), true),
    metric(t("forms"), formatNumber(report.totals.forms)),
    metric(t("passes"), formatNumber(report.totals.pressPasses)),
    metric(t("underproduction"), formatNumber(report.totals.underproduction)),
    metric(t("pairOverrun"), formatNumber(report.totals.overrun)),
    metric(t("fileOverrun"), formatNumber(report.totals.fileOverrun)),
  );
  section.append(
    summary,
    details(t("filesTitle"), renderFileTable(report), true),
    details(t("pairsTitle"), renderPairTable(report)),
  );
  return section;
}

function statusText() {
  const base = t(exportStatusKey);
  return exportStatusDetail ? `${base}: ${exportStatusDetail}` : base;
}

async function exportSchemes(plan, status, buttons) {
  if (plan.impositions.length > INTERACTIVE_PDF_IMPOSITION_LIMIT) {
    exportStatusKey = "exportTooLarge";
    exportStatusDetail = "";
    status.textContent = statusText();
    return;
  }
  exportBusy = true;
  exportStatusKey = "buildingSchemes";
  exportStatusDetail = "";
  buttons.forEach((button) => { button.disabled = true; });
  status.textContent = statusText();
  try {
    const documentModel = createSchemePdfDocument({
      records: plan.impositions,
      language: language(),
      pageMode: PDF_PAGE_MODES.A4,
    });
    const bytes = await renderSchemePdfBytes(documentModel);
    downloadPdfBytes(bytes, `uImposition-${safeFilePart(plan.id)}-schemes.pdf`);
    exportStatusKey = "schemesComplete";
    exportStatusDetail = `${documentModel.pageCount} pages`;
  } catch (error) {
    console.error(error);
    exportStatusKey = "exportFailed";
    exportStatusDetail = error.message;
  } finally {
    exportBusy = false;
    buttons.forEach((button) => { button.disabled = false; });
    status.textContent = statusText();
  }
}

async function exportReport(plan, status, buttons) {
  exportBusy = true;
  exportStatusKey = "buildingReport";
  exportStatusDetail = "";
  buttons.forEach((button) => { button.disabled = true; });
  status.textContent = statusText();
  try {
    const documentModel = createProductionReportPdfDocument({
      report: plan.report,
      language: language(),
      pageMode: PDF_PAGE_MODES.A4,
    });
    const bytes = await renderProductionReportPdfBytes(documentModel);
    downloadPdfBytes(bytes, `uImposition-${safeFilePart(plan.id)}-production-report.pdf`);
    exportStatusKey = "reportComplete";
    exportStatusDetail = "";
  } catch (error) {
    console.error(error);
    exportStatusKey = "exportFailed";
    exportStatusDetail = error.message;
  } finally {
    exportBusy = false;
    buttons.forEach((button) => { button.disabled = false; });
    status.textContent = statusText();
  }
}

function renderExport(plan) {
  const section = element("section", "selected-plan-section selected-plan-export");
  section.append(element("h3", "", t("exportTitle")), element("p", "", t("exportIntro")));
  const status = element("span", "status-chip selected-plan-export__status", statusText());
  const schemes = element("button", "button", t("exportSchemes"));
  const report = element("button", "button button--quiet", t("exportReport"));
  schemes.type = "button";
  report.type = "button";
  schemes.dataset.exportSelectedPlan = "schemes";
  report.dataset.exportSelectedPlan = "report";
  const buttons = [schemes, report];
  buttons.forEach((button) => { button.disabled = exportBusy; });
  schemes.addEventListener("click", () => exportSchemes(plan, status, buttons));
  report.addEventListener("click", () => exportReport(plan, status, buttons));
  const actions = element("div", "selected-plan-export__actions");
  actions.append(schemes, report, status);
  const boundary = element("div", "formula-card");
  boundary.append(element("p", "", t("technicalBoundary")));
  section.append(actions, boundary);
  return section;
}

function render() {
  const panel = ensurePanel();
  const plan = runtimeSnapshot.selectedPlan;
  if (!plan) {
    renderEmpty(panel);
    syncCardButtons();
    return;
  }
  panel.replaceChildren(
    renderSelectedSummary(plan),
    renderSchemes(plan),
    renderReport(plan),
    renderExport(plan),
  );
  syncCardButtons();
}

function syncCardButtons() {
  const catalog = $("#userProductionPlans");
  if (!catalog) return;
  catalog.querySelectorAll("[data-plan-id]").forEach((card) => {
    const planId = card.dataset.planId;
    const footer = card.querySelector(".production-plan-card__footer") ?? card;
    let button = card.querySelector("[data-select-user-plan]");
    if (!button) {
      button = element("button", "button button--quiet select-user-plan-button");
      button.type = "button";
      button.dataset.selectUserPlan = planId;
      footer.append(button);
    }
    const selected = runtimeSnapshot.selectedPlanId === planId;
    card.classList.toggle("is-operator-selected", selected);
    button.classList.toggle("button--quiet", !selected);
    const label = selected ? t("selected") : t("select");
    if (button.textContent !== label) button.textContent = label;
    button.setAttribute("aria-pressed", String(selected));
  });
}

function attachCatalogController() {
  const catalog = $("#userProductionPlans");
  if (!catalog) return;
  catalog.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-user-plan]");
    if (!button || !catalog.contains(button)) return;
    selectUserProductionPlan(button.dataset.selectUserPlan);
  });
  mutationObserver = new MutationObserver(syncCardButtons);
  mutationObserver.observe(catalog, { childList: true, subtree: true });
}

function refreshLanguage() {
  exportStatusKey = "exportReady";
  exportStatusDetail = "";
  render();
}

ensureStylesheet();
ensurePanel();
attachCatalogController();
subscribeUserProductionPlanRuntime((snapshot) => {
      const selectionChanged = snapshot.selectedPlanId !== runtimeSnapshot.selectedPlanId;
      runtimeSnapshot = snapshot;
      if (selectionChanged) {
        exportStatusKey = "exportReady";
        exportStatusDetail = "";
      }
      render();
    });
new MutationObserver(refreshLanguage).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["lang"],
});
