import {
  DUPLEX_SEARCH_MODES,
  DUPLEX_STRATEGIES,
  WORK_AND_TURN_RUNTIME_STATUS,
  WORK_AND_TURN_STATE_EVENT,
  createWorkAndTurnErrorState,
  createWorkAndTurnRuntimeState,
  prepareWorkAndTurnRuntime,
} from "./work-and-turn-runtime.js";

const TEXT = Object.freeze({
  ru: Object.freeze({
    kicker: "M7.4",
    title: "Свой оборот: одна форма, два прогона",
    intro: "Проверенный контрольный кейс: четыре разных A6, 2 страницы, 1+1, по 4000 экземпляров. Режимы используют одну подготовленную модель и не подменяют рабочий прайс демонстрационными числами.",
    separateOnly: "Только чужой оборот",
    compareBoth: "Сравнить оба",
    workAndTurnOnly: "Только свой оборот",
    pricingReady: "прайс готов",
    noPricing: "без денежного сравнения",
    error: "ошибка проверки",
    separateTitle: "Чужой оборот",
    workAndTurnTitle: "Свой оборот",
    recommended: "Рекомендуемый",
    sheets: "Листы",
    passes: "Прогоны",
    forms: "Layout-формы",
    plates: "Пластины",
    underproduction: "Недопечатка",
    total: "Итого",
    unavailable: "—",
    separateNote: "Отдельная форма лица и отдельная форма оборота.",
    workAndTurnNote: "Одна симметричная форма используется повторно после горизонтального переворота листа.",
    summaryPrefix: "Одинаково: 1 000 листов и 2 000 прогонов.",
    summarySaving: "Свой оборот уменьшает layout-формы 2 → 1 и цветовые пластины 2 → 1.",
    moneySaving: "Экономия по текущему прайсу",
    plateTitle: "Общая форма 4 × 4",
    plateHint: "Светлые ячейки — страницы лица; серые — парные страницы оборота на той же форме.",
    frontRole: "лицо",
    backRole: "оборот",
    warning: "Технологическое ограничение: модель подтверждает горизонтальный переворот и симметричные пары. Перед производством оператор обязан проверить захват, боковой упор, приводку и допустимость переворота для конкретной машины.",
    modeHint: "Переключение режима только фильтрует уже проверенные варианты; геометрия и production report повторно не строятся.",
  }),
  en: Object.freeze({
    kicker: "M7.4",
    title: "Work-and-turn: one plate, two passes",
    intro: "Verified control case: four different A6 jobs, 2 pages, 1+1, 4000 copies each. The modes use one prepared model and never replace operator pricing with demo values.",
    separateOnly: "Separate forms only",
    compareBoth: "Compare both",
    workAndTurnOnly: "Work-and-turn only",
    pricingReady: "pricing ready",
    noPricing: "without monetary comparison",
    error: "validation error",
    separateTitle: "Separate front/back forms",
    workAndTurnTitle: "Work-and-turn",
    recommended: "Recommended",
    sheets: "Sheets",
    passes: "Press passes",
    forms: "Side-layout forms",
    plates: "Plates",
    underproduction: "Underproduction",
    total: "Total",
    unavailable: "—",
    separateNote: "A separate front form and a separate back form are used.",
    workAndTurnNote: "One symmetric plate is reused after the sheet is turned horizontally.",
    summaryPrefix: "Equal: 1,000 sheets and 2,000 press passes.",
    summarySaving: "Work-and-turn reduces side-layout forms 2 → 1 and color plates 2 → 1.",
    moneySaving: "Saving under current pricing",
    plateTitle: "Shared 4 × 4 plate",
    plateHint: "Light cells are front pages; grey cells are the paired back pages on the same plate.",
    frontRole: "front",
    backRole: "back",
    warning: "Technology boundary: the model validates horizontal turning and symmetric pairs. Before production, the operator must verify gripper, side guide, registration, and whether the specific press permits this turn.",
    modeHint: "Changing the mode only filters already validated alternatives; geometry and the production report are not rebuilt.",
  }),
});

let searchMode = DUPLEX_SEARCH_MODES.COMPARE_BOTH;
let pricingState = window.__uimpositionPricingState ?? Object.freeze({ state: "incomplete", pricing: null });
let prepared = null;
let runtimeState = null;

function language() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function t(key) {
  return TEXT[language()][key] ?? TEXT.ru[key] ?? key;
}

function locale() {
  return language() === "ru" ? "ru-RU" : "en-US";
}

function formatNumber(value, maximumFractionDigits = 2) {
  return Number(value).toLocaleString(locale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatCurrency(value, currency) {
  if (value === null || value === undefined || !currency) return t("unavailable");
  return `${formatNumber(value, 2)} ${currency}`;
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function ensureStylesheet() {
  if (document.querySelector("link[data-m7-work-turn-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "m7-work-and-turn.css";
  link.setAttribute("data-m7-work-turn-styles", "");
  document.head.append(link);
}

function createPanel() {
  const existing = document.querySelector("#workAndTurnComparison");
  if (existing) return existing;

  const panel = element("section", "panel work-turn-panel");
  panel.id = "workAndTurnComparison";
  panel.innerHTML = `
    <div class="section-heading">
      <div><p id="workTurnKicker" class="section-kicker"></p><h2 id="workTurnTitle"></h2></div>
      <span id="workTurnStatus" class="status-chip status-chip--warning"></span>
    </div>
    <p id="workTurnIntro"></p>
    <div class="work-turn-toolbar">
      <div id="workTurnModes" class="button-row">
        <button class="button button--quiet" type="button" data-work-turn-mode="separateOnly"></button>
        <button class="button button--quiet" type="button" data-work-turn-mode="compareBoth"></button>
        <button class="button button--quiet" type="button" data-work-turn-mode="workAndTurnOnly"></button>
      </div>
      <p id="workTurnModeHint" class="hint"></p>
    </div>
    <p id="workTurnSummary" class="work-turn-summary"></p>
    <p id="workTurnError" class="error-box work-turn-error" hidden></p>
    <div id="workTurnAlternatives" class="work-turn-alternatives"></div>
    <div class="work-turn-plate-wrap">
      <div class="work-turn-plate-heading"><h3 id="workTurnPlateTitle"></h3><p id="workTurnPlateHint" class="hint"></p></div>
      <div id="workTurnPlate" class="work-turn-plate" aria-label="Work-and-turn shared plate"></div>
    </div>
    <p id="workTurnWarning" class="work-turn-warning"></p>
  `;

  const alternativesPanel = document.querySelector("#productionAlternatives");
  const roadmap = document.querySelector(".roadmap-panel");
  const workspace = document.querySelector(".workspace");
  if (!workspace) throw new Error("Workspace container not found");
  if (alternativesPanel) alternativesPanel.after(panel);
  else workspace.insertBefore(panel, roadmap ?? null);
  return panel;
}

ensureStylesheet();
const panel = createPanel();
const ui = Object.freeze({
  kicker: panel.querySelector("#workTurnKicker"),
  title: panel.querySelector("#workTurnTitle"),
  status: panel.querySelector("#workTurnStatus"),
  intro: panel.querySelector("#workTurnIntro"),
  modes: panel.querySelector("#workTurnModes"),
  modeHint: panel.querySelector("#workTurnModeHint"),
  summary: panel.querySelector("#workTurnSummary"),
  error: panel.querySelector("#workTurnError"),
  alternatives: panel.querySelector("#workTurnAlternatives"),
  plateTitle: panel.querySelector("#workTurnPlateTitle"),
  plateHint: panel.querySelector("#workTurnPlateHint"),
  plate: panel.querySelector("#workTurnPlate"),
  warning: panel.querySelector("#workTurnWarning"),
});

function modeLabel(mode) {
  if (mode === DUPLEX_SEARCH_MODES.SEPARATE_ONLY) return t("separateOnly");
  if (mode === DUPLEX_SEARCH_MODES.WORK_AND_TURN_ONLY) return t("workAndTurnOnly");
  return t("compareBoth");
}

function strategyLabel(strategy) {
  return strategy === DUPLEX_STRATEGIES.WORK_AND_TURN
    ? t("workAndTurnTitle")
    : t("separateTitle");
}

function metric(label, value) {
  const node = element("div", "work-turn-metric");
  node.append(element("span", "", label), element("strong", "", value));
  return node;
}

function alternativeCard(metrics, state) {
  const card = element("article", "work-turn-card");
  card.dataset.duplexStrategy = metrics.duplexMode;
  const recommended = state.recommendedStrategy === metrics.duplexMode;
  card.classList.toggle("is-recommended", recommended);

  const heading = element("div", "work-turn-card__heading");
  heading.append(element("h3", "", strategyLabel(metrics.duplexMode)));
  if (recommended) heading.append(element("span", "work-turn-badge", t("recommended")));

  const grid = element("div", "work-turn-metrics");
  grid.append(
    metric(t("sheets"), formatNumber(metrics.physicalSheets)),
    metric(t("passes"), formatNumber(metrics.pressPasses)),
    metric(t("forms"), formatNumber(metrics.layoutForms)),
    metric(t("plates"), formatNumber(metrics.colorPlates)),
    metric(t("underproduction"), formatNumber(metrics.fileUnderproduction + metrics.pairUnderproduction)),
    metric(t("total"), formatCurrency(metrics.estimatedTotalCost, metrics.currency)),
  );

  const note = metrics.duplexMode === DUPLEX_STRATEGIES.WORK_AND_TURN
    ? t("workAndTurnNote")
    : t("separateNote");
  card.append(heading, grid, element("p", "work-turn-card__note", note));
  return card;
}

function renderPlate(state) {
  const preview = state.platePreview;
  ui.plate.style.gridTemplateColumns = `repeat(${preview.columns}, minmax(0, 1fr))`;
  ui.plate.replaceChildren(...preview.cells.map((cell) => {
    const role = cell.pageRole === "back" ? t("backRole") : t("frontRole");
    const node = element("div", `work-turn-plate-cell${cell.pageRole === "back" ? " is-back" : ""}`);
    node.dataset.file = cell.file;
    node.dataset.page = String(cell.page);
    node.dataset.pageRole = cell.pageRole;
    node.append(
      element("strong", "", `${cell.file} · ${cell.page}`),
      element("small", "", `${role} · ${cell.direction}`),
    );
    return node;
  }));
}

function renderStaticText() {
  ui.kicker.textContent = t("kicker");
  ui.title.textContent = t("title");
  ui.intro.textContent = t("intro");
  ui.modeHint.textContent = t("modeHint");
  ui.plateTitle.textContent = t("plateTitle");
  ui.plateHint.textContent = t("plateHint");
  ui.warning.textContent = t("warning");
  ui.modes.querySelectorAll("[data-work-turn-mode]").forEach((button) => {
    button.textContent = modeLabel(button.dataset.workTurnMode);
  });
}

function renderError(state) {
  ui.status.textContent = t("error");
  ui.status.classList.remove("status-chip--success");
  ui.status.classList.add("status-chip--warning");
  ui.error.textContent = state.error?.message ?? t("error");
  ui.error.hidden = false;
  ui.summary.textContent = "";
  ui.alternatives.replaceChildren();
  ui.plate.replaceChildren();
}

function renderReady(state) {
  ui.status.textContent = state.pricingReady ? t("pricingReady") : t("noPricing");
  ui.status.classList.add("status-chip--success");
  ui.status.classList.remove("status-chip--warning");
  ui.error.hidden = true;

  const savingsText = `${t("summaryPrefix")} ${t("summarySaving")}`;
  const pricedText = state.pricingReady && state.savings.estimatedTotalCost !== null
    ? ` ${t("moneySaving")}: ${formatCurrency(
      state.savings.estimatedTotalCost,
      state.alternatives.find((item) => item.currency)?.currency,
    )}.`
    : "";
  ui.summary.textContent = `${savingsText}${pricedText}`;
  ui.alternatives.replaceChildren(...state.alternatives.map((metrics) => alternativeCard(metrics, state)));
  renderPlate(state);

  ui.modes.querySelectorAll("[data-work-turn-mode]").forEach((button) => {
    const active = button.dataset.workTurnMode === state.searchMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  panel.dataset.searchMode = state.searchMode;
  panel.dataset.recommendedStrategy = state.recommendedStrategy;
  panel.dataset.pricingReady = String(state.pricingReady);
  panel.dataset.physicalSheets = String(state.alternatives[0]?.physicalSheets ?? "");
  panel.dataset.pressPasses = String(state.alternatives[0]?.pressPasses ?? "");
  panel.dataset.savedForms = String(state.savings.layoutForms);
  panel.dataset.savedPlates = String(state.savings.colorPlates);
}

function publish(state) {
  window.__uimpositionWorkAndTurnState = state;
  window.dispatchEvent(new CustomEvent(WORK_AND_TURN_STATE_EVENT, { detail: state }));
}

function rebuildPrepared() {
  prepared = prepareWorkAndTurnRuntime({ pricingState });
}

function render() {
  renderStaticText();
  try {
    if (!prepared) rebuildPrepared();
    runtimeState = createWorkAndTurnRuntimeState({ prepared, searchMode });
  } catch (error) {
    runtimeState = createWorkAndTurnErrorState(error, searchMode);
  }

  if (runtimeState.status === WORK_AND_TURN_RUNTIME_STATUS.ERROR) renderError(runtimeState);
  else renderReady(runtimeState);
  publish(runtimeState);
}

ui.modes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-work-turn-mode]");
  if (!button) return;
  searchMode = button.dataset.workTurnMode;
  render();
});

window.addEventListener("uimposition:pricing", (event) => {
  pricingState = event.detail ?? Object.freeze({ state: "incomplete", pricing: null });
  try {
    rebuildPrepared();
  } catch (error) {
    prepared = null;
    runtimeState = createWorkAndTurnErrorState(error, searchMode);
  }
  render();
});

document.querySelector("#languageButton")?.addEventListener("click", () => {
  setTimeout(render, 0);
});

render();
