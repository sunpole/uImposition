import {
  SELECTED_PLAN_TAB_IDS,
  createSelectedPlanTabState,
  nextSelectedPlanTabId,
  normalizeSelectedPlanTabId,
} from "./selected-plan-tabs-model.js";
import { subscribeUserProductionPlanRuntime } from "./user-production-plans-runtime.js";

const TEXT = Object.freeze({
  ru: Object.freeze({
    overview: "Обзор",
    schemes: "Схемы",
    report: "Отчёт",
    files: "Файлы",
    overviewHint: "Ключевые показатели и последствия выбора оператора.",
    schemesHint: "Лицо и оборот выбранного производственного плана.",
    reportHint: "Итоговые листы, формы, прогоны и контроль недопечатки.",
    filesHint: "Подробные итоги по файлам и печатным парам.",
    filesEmpty: "Подробные данные по файлам недоступны.",
  }),
  en: Object.freeze({
    overview: "Overview",
    schemes: "Schemes",
    report: "Report",
    files: "Files",
    overviewHint: "Key metrics and consequences of the operator choice.",
    schemesHint: "Front and back of the selected production plan.",
    reportHint: "Final sheets, forms, passes and underproduction control.",
    filesHint: "Detailed totals for files and print pairs.",
    filesEmpty: "Detailed file data is unavailable.",
  }),
});

let activeTabId = "overview";
let selectedPlanId = null;
let buildScheduled = false;
let panelObserver = null;

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

function tabHint(tabId) {
  return t(`${tabId}Hint`);
}

function setActiveTab(root, nextTabId, { focus = false } = {}) {
  activeTabId = normalizeSelectedPlanTabId(nextTabId);
  const state = createSelectedPlanTabState(activeTabId);

  state.tabs.forEach((tabState) => {
    const button = root.querySelector(`#${tabState.tabId}`);
    const panel = root.querySelector(`#${tabState.panelId}`);
    if (!button || !panel) return;
    button.setAttribute("aria-selected", String(tabState.active));
    button.tabIndex = tabState.active ? 0 : -1;
    button.classList.toggle("is-active", tabState.active);
    panel.hidden = !tabState.active;
    if (tabState.active && focus) button.focus();
  });
}

function createTabButton(tabId) {
  const button = element("button", "selected-plan-tab", t(tabId));
  button.type = "button";
  button.id = `selectedPlanTab-${tabId}`;
  button.dataset.selectedPlanTab = tabId;
  button.setAttribute("role", "tab");
  button.setAttribute("aria-controls", `selectedPlanTabPanel-${tabId}`);
  return button;
}

function createTabPanel(tabId, contentNodes) {
  const panel = element("section", "selected-plan-tab-panel");
  panel.id = `selectedPlanTabPanel-${tabId}`;
  panel.dataset.selectedPlanTabPanel = tabId;
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", `selectedPlanTab-${tabId}`);
  panel.tabIndex = 0;

  const hint = element("p", "selected-plan-tab-panel__hint", tabHint(tabId));
  panel.append(hint, ...contentNodes);
  return panel;
}

function extractSelectedPlanParts(panel) {
  const summary = panel.querySelector(":scope > .selected-plan-summary");
  const schemes = [...panel.querySelectorAll(":scope > .selected-plan-section")]
    .find((section) => section.querySelector(".selected-plan-schemes")) ?? null;
  const report = panel.querySelector(":scope > .selected-plan-report");
  if (!summary || !schemes || !report) return null;

  const detailBlocks = [...report.querySelectorAll(":scope > .selected-plan-details-block")];
  detailBlocks.forEach((details) => {
    details.open = false;
    details.remove();
  });

  return { summary, schemes, report, detailBlocks };
}

function buildTabs(panel) {
  if (panel.querySelector(":scope > .selected-plan-tabs")) {
    setActiveTab(panel, activeTabId);
    return;
  }

  const parts = extractSelectedPlanParts(panel);
  if (!parts) return;

  const root = element("div", "selected-plan-tabs");
  const tabList = element("div", "selected-plan-tab-list");
  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", language() === "en" ? "Selected plan sections" : "Разделы выбранного плана");

  SELECTED_PLAN_TAB_IDS.forEach((tabId) => tabList.append(createTabButton(tabId)));

  const content = element("div", "selected-plan-tab-content");
  content.append(
    createTabPanel("overview", [parts.summary]),
    createTabPanel("schemes", [parts.schemes]),
    createTabPanel("report", [parts.report]),
    createTabPanel("files", parts.detailBlocks.length > 0
      ? parts.detailBlocks
      : [element("p", "app-empty-state", t("filesEmpty"))]),
  );

  root.append(tabList, content);
  panel.prepend(root);

  tabList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-selected-plan-tab]");
    if (!button) return;
    setActiveTab(root, button.dataset.selectedPlanTab);
  });

  tabList.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const button = event.target.closest("[data-selected-plan-tab]");
    if (!button) return;
    event.preventDefault();
    setActiveTab(root, nextSelectedPlanTabId(button.dataset.selectedPlanTab, event.key), { focus: true });
  });

  setActiveTab(root, activeTabId);
}

function scheduleBuild() {
  if (buildScheduled) return;
  buildScheduled = true;
  queueMicrotask(() => {
    buildScheduled = false;
    const panel = document.querySelector("#selectedUserPlanDetails");
    if (panel) buildTabs(panel);
  });
}

function attachPanelObserver() {
  const panel = document.querySelector("#selectedUserPlanDetails");
  if (!panel || panelObserver) return;
  panelObserver = new MutationObserver(scheduleBuild);
  panelObserver.observe(panel, { childList: true, subtree: true });
  scheduleBuild();
}

subscribeUserProductionPlanRuntime((snapshot) => {
  if (snapshot.selectedPlanId !== selectedPlanId) {
    selectedPlanId = snapshot.selectedPlanId;
    activeTabId = "overview";
  }
  scheduleBuild();
});

new MutationObserver(scheduleBuild).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["lang"],
});

attachPanelObserver();
