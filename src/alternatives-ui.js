import {
  ALTERNATIVES_RUNTIME_STATUS,
  createAlternativesRuntimeState,
  prepareAlternativesProductionState,
} from "./alternatives-runtime.js";
import {
  createDecisionProfile,
  moveDecisionObjective,
} from "./decision-profile.js";

const TEXT = Object.freeze({
  ru: Object.freeze({
    kicker: "M7.3",
    title: "Реальные варианты производства",
    intro: "Оба варианта построены из одного контрольного заказа и прошли проверку недопечатки. Меняйте первый приоритет без повторной генерации монтажей.",
    paperPriority: "Сначала бумага",
    costPriority: "Сначала стоимость",
    waiting: "Загрузите контрольный заказ",
    waitingDetail: "После загрузки production report появятся compact manual и доказанный paper minimum.",
    error: "Ошибка сравнения",
    ready: "pricing ready",
    readyWithoutPricing: "без денежного сравнения",
    recommended: "Рекомендуемый",
    reference: "База сравнения",
    setReference: "Сравнивать с этим",
    sheets: "Листы",
    forms: "Layout-формы",
    plates: "Пластины",
    passes: "Листопрогоны",
    fileOverrun: "Перетираж файлов",
    pairOverrun: "Перетираж пар",
    splitOrders: "Разделённые заказы",
    cost: "Итог",
    unavailable: "—",
    componentTitle: "Разница стоимости относительно базы",
    noMoney: "Покомпонентная стоимость появится только после совместимого рабочего прайса.",
    priorityHint: "Приоритет меняет рекомендацию мгновенно; исходные схемы и production report остаются неизменными.",
  }),
  en: Object.freeze({
    kicker: "M7.3",
    title: "Real production alternatives",
    intro: "Both alternatives come from the same control order and pass zero-underproduction validation. Change the first priority without regenerating impositions.",
    paperPriority: "Paper first",
    costPriority: "Cost first",
    waiting: "Load the control dataset",
    waitingDetail: "Compact manual and the proven paper minimum appear after the production report is loaded.",
    error: "Comparison error",
    ready: "pricing ready",
    readyWithoutPricing: "without monetary comparison",
    recommended: "Recommended",
    reference: "Comparison reference",
    setReference: "Compare against this",
    sheets: "Sheets",
    forms: "Side-layout forms",
    plates: "Plates",
    passes: "Press passes",
    fileOverrun: "File overrun",
    pairOverrun: "Pair overrun",
    splitOrders: "Split orders",
    cost: "Total",
    unavailable: "—",
    componentTitle: "Cost difference from reference",
    noMoney: "Component costs appear only after a compatible production pricing profile is ready.",
    priorityHint: "Priority changes the recommendation instantly; source schemes and the production report stay unchanged.",
  }),
});

const SOLUTION_LABELS = Object.freeze({
  "manual-compact": Object.freeze({ ru: "Компактный ручной", en: "Compact manual" }),
  "paper-minimum": Object.freeze({ ru: "Минимум бумаги", en: "Paper minimum" }),
});

let productionState = window.__uimpositionProductionState ?? { report: null, controlCase: null };
let pricingState = window.__uimpositionPricingState ?? { state: "incomplete", pricing: null };
let decisionProfile = createDecisionProfile({ id: "m7-runtime" });
let referenceSolutionId = null;
let preparedProductionState = null;
let preparedReport = null;
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
  return `${formatNumber(value, 2)} ${currency}`;
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function ensureStylesheet() {
  if (document.querySelector("link[data-m7-alternatives-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "m7-alternatives.css";
  link.setAttribute("data-m7-alternatives-styles", "");
  document.head.append(link);
}

function createPanel() {
  const existing = document.querySelector("#productionAlternatives");
  if (existing) return existing;
  const panel = element("section", "panel alternatives-panel");
  panel.id = "productionAlternatives";
  panel.innerHTML = `
    <div class="section-heading alternatives-panel__heading">
      <div><p class="section-kicker" id="alternativesKicker"></p><h2 id="alternativesTitle"></h2></div>
      <span id="alternativesStatus" class="status-chip status-chip--warning"></span>
    </div>
    <p id="alternativesIntro"></p>
    <div class="alternatives-toolbar">
      <div class="button-row" id="alternativesPriorities">
        <button id="alternativesPaperFirst" class="button button--quiet" type="button"></button>
        <button id="alternativesCostFirst" class="button button--quiet" type="button"></button>
      </div>
      <p id="alternativesPriorityHint" class="hint"></p>
    </div>
    <p id="alternativesSummary" class="alternatives-summary"></p>
    <p id="alternativesEmpty" class="empty-state"></p>
    <p id="alternativesError" class="error-box" hidden></p>
    <div id="alternativesList" class="alternatives-list"></div>
  `;
  const paperPanel = document.querySelector("#paperSolution");
  const roadmap = document.querySelector(".roadmap-panel");
  const workspace = document.querySelector(".workspace");
  if (!workspace) throw new Error("Workspace container not found");
  if (paperPanel) paperPanel.after(panel);
  else workspace.insertBefore(panel, roadmap ?? null);
  return panel;
}

ensureStylesheet();
const panel = createPanel();
const ui = {
  kicker: panel.querySelector("#alternativesKicker"),
  title: panel.querySelector("#alternativesTitle"),
  status: panel.querySelector("#alternativesStatus"),
  intro: panel.querySelector("#alternativesIntro"),
  paperFirst: panel.querySelector("#alternativesPaperFirst"),
  costFirst: panel.querySelector("#alternativesCostFirst"),
  priorityHint: panel.querySelector("#alternativesPriorityHint"),
  summary: panel.querySelector("#alternativesSummary"),
  empty: panel.querySelector("#alternativesEmpty"),
  error: panel.querySelector("#alternativesError"),
  list: panel.querySelector("#alternativesList"),
};

function solutionMetricsMap(state) {
  return new Map(state.alternativeSet.solutionMetrics.map((metrics) => [metrics.id, metrics]));
}

function localizedSolutionLabel(solutionId, fallback) {
  return SOLUTION_LABELS[solutionId]?.[language()] ?? fallback ?? solutionId;
}

function metric(label, value, accent = false) {
  const item = element("div", `alternatives-metric${accent ? " is-accent" : ""}`);
  item.append(element("span", "", label), element("strong", "", value));
  return item;
}

function componentRows(entry) {
  const block = element("div", "alternatives-cost-components");
  block.append(element("strong", "alternatives-cost-components__title", t("componentTitle")));
  if (!entry.monetary.available) {
    block.append(element("p", "hint", t("noMoney")));
    return block;
  }
  const list = element("div", "alternatives-cost-components__grid");
  entry.monetary.components.forEach((component) => {
    const row = element("div", "alternatives-cost-component");
    row.dataset.componentId = component.componentId;
    row.append(
      element("span", "", component.label),
      element(
        "strong",
        component.delta < 0 ? "is-better" : component.delta > 0 ? "is-worse" : "",
        component.formattedDelta,
      ),
    );
    list.append(row);
  });
  block.append(list);
  return block;
}

function alternativeCard(entry, metrics) {
  const card = element("article", "alternative-card");
  card.dataset.solutionId = entry.solutionId;
  card.classList.toggle("is-recommended", entry.recommended);
  card.classList.toggle("is-reference", entry.reference);

  const heading = element("div", "alternative-card__heading");
  const title = element(
    "h3",
    "",
    localizedSolutionLabel(entry.solutionId, entry.label),
  );
  const badges = element("div", "alternative-card__badges");
  if (entry.recommended) badges.append(element("span", "alternative-badge is-recommended", t("recommended")));
  if (entry.reference) badges.append(element("span", "alternative-badge is-reference", t("reference")));
  heading.append(title, badges);

  const cost = metrics.estimatedTotalCost === null
    ? t("unavailable")
    : formatCurrency(metrics.estimatedTotalCost, metrics.currency);
  const grid = element("div", "alternatives-metrics");
  grid.append(
    metric(t("sheets"), formatNumber(metrics.physicalSheets), true),
    metric(t("forms"), formatNumber(metrics.layoutForms)),
    metric(t("plates"), formatNumber(metrics.colorPlates)),
    metric(t("passes"), formatNumber(metrics.pressPasses)),
    metric(t("fileOverrun"), formatNumber(metrics.fileOverrun)),
    metric(t("pairOverrun"), formatNumber(metrics.pairOverrun)),
    metric(t("splitOrders"), formatNumber(metrics.splitOrders)),
    metric(t("cost"), cost, metrics.estimatedTotalCost !== null),
  );

  const reasons = element("div", "alternative-card__reasons");
  entry.reasonTexts.forEach((reason) => reasons.append(element("span", "alternative-reason", reason)));

  const explanation = element("div", "alternative-card__explanation");
  if (entry.decidingText) explanation.append(element("p", "alternative-deciding", entry.decidingText));
  explanation.append(
    element("p", "alternative-advantage", entry.advantageText),
    element("p", "alternative-tradeoff", entry.tradeoffText),
  );

  const footer = element("div", "alternative-card__footer");
  const referenceButton = element("button", "button button--quiet", t("setReference"));
  referenceButton.type = "button";
  referenceButton.dataset.referenceSolutionId = entry.solutionId;
  referenceButton.disabled = entry.reference;
  footer.append(referenceButton);

  card.append(heading, reasons, grid, explanation, componentRows(entry), footer);
  return card;
}

function publishRuntimeState(state) {
  window.__uimpositionAlternativesState = state;
  window.dispatchEvent(new CustomEvent("uimposition:alternatives", { detail: state }));
}

function updateStaticText() {
  ui.kicker.textContent = t("kicker");
  ui.title.textContent = t("title");
  ui.intro.textContent = t("intro");
  ui.paperFirst.textContent = t("paperPriority");
  ui.costFirst.textContent = t("costPriority");
  ui.priorityHint.textContent = t("priorityHint");
}

function renderWaiting() {
  ui.status.textContent = t("waiting");
  ui.status.classList.remove("status-chip--success");
  ui.status.classList.add("status-chip--warning");
  ui.summary.textContent = "";
  ui.empty.textContent = t("waitingDetail");
  ui.empty.hidden = false;
  ui.error.hidden = true;
  ui.list.replaceChildren();
  ui.paperFirst.disabled = true;
  ui.costFirst.disabled = true;
}

function renderError(state) {
  ui.status.textContent = t("error");
  ui.status.classList.remove("status-chip--success");
  ui.status.classList.add("status-chip--warning");
  ui.summary.textContent = "";
  ui.empty.hidden = true;
  ui.error.textContent = state.error?.message ?? t("error");
  ui.error.hidden = false;
  ui.list.replaceChildren();
  ui.paperFirst.disabled = false;
  ui.costFirst.disabled = true;
}

function renderReady(state) {
  const pricingReady = state.status === ALTERNATIVES_RUNTIME_STATUS.READY;
  ui.status.textContent = `${state.alternativeSet.pareto.frontier.length} Pareto · ${pricingReady ? t("ready") : t("readyWithoutPricing")}`;
  ui.status.classList.toggle("status-chip--success", true);
  ui.status.classList.toggle("status-chip--warning", false);
  ui.summary.textContent = state.explanations.summaryText;
  ui.empty.hidden = true;
  ui.error.hidden = true;

  ui.paperFirst.disabled = false;
  ui.costFirst.disabled = !state.pricingComparison?.comparable;
  ui.paperFirst.classList.toggle("is-active", state.priorityObjectiveId === "physicalSheets");
  ui.costFirst.classList.toggle("is-active", state.priorityObjectiveId === "estimatedTotalCost");
  ui.paperFirst.setAttribute("aria-pressed", String(state.priorityObjectiveId === "physicalSheets"));
  ui.costFirst.setAttribute("aria-pressed", String(state.priorityObjectiveId === "estimatedTotalCost"));

  const metricsById = solutionMetricsMap(state);
  ui.list.replaceChildren(...state.explanations.entries.map((entry) => (
    alternativeCard(entry, metricsById.get(entry.solutionId))
  )));
  panel.dataset.recommendedSolutionId = state.explanations.recommendedSolutionId;
  panel.dataset.referenceSolutionId = state.explanations.referenceSolutionId;
  panel.dataset.priorityObjectiveId = state.priorityObjectiveId;
  panel.dataset.pricingComparable = String(Boolean(state.pricingComparison?.comparable));
}

function prepareProductionOnce() {
  if (!productionState?.report || !productionState?.controlCase) {
    preparedProductionState = null;
    preparedReport = null;
    return;
  }
  if (preparedProductionState && preparedReport === productionState.report) return;
  preparedProductionState = prepareAlternativesProductionState(productionState);
  preparedReport = productionState.report;
}

function render() {
  updateStaticText();
  try {
    prepareProductionOnce();
  } catch (error) {
    runtimeState = Object.freeze({
      status: ALTERNATIVES_RUNTIME_STATUS.ERROR,
      error,
    });
    renderError(runtimeState);
    publishRuntimeState(runtimeState);
    return;
  }

  runtimeState = createAlternativesRuntimeState({
    productionState,
    preparedProductionState,
    pricingState,
    decisionProfile,
    language: language(),
    referenceSolutionId,
  });
  if (runtimeState.status === ALTERNATIVES_RUNTIME_STATUS.WAITING_PRODUCTION) {
    renderWaiting();
  } else if (runtimeState.status === ALTERNATIVES_RUNTIME_STATUS.ERROR) {
    renderError(runtimeState);
  } else {
    if (!runtimeState.explanations.entries.some((entry) => entry.solutionId === referenceSolutionId)) {
      referenceSolutionId = runtimeState.referenceSolutionId;
    }
    renderReady(runtimeState);
  }
  publishRuntimeState(runtimeState);
}

ui.paperFirst.addEventListener("click", () => {
  decisionProfile = moveDecisionObjective(decisionProfile, "physicalSheets", 0);
  referenceSolutionId = null;
  render();
});

ui.costFirst.addEventListener("click", () => {
  if (!runtimeState?.pricingComparison?.comparable) return;
  decisionProfile = moveDecisionObjective(decisionProfile, "estimatedTotalCost", 0);
  referenceSolutionId = null;
  render();
});

ui.list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-reference-solution-id]");
  if (!button) return;
  referenceSolutionId = button.dataset.referenceSolutionId;
  render();
});

window.addEventListener("uimposition:production-report", (event) => {
  productionState = event.detail ?? { report: null, controlCase: null };
  preparedProductionState = null;
  preparedReport = null;
  referenceSolutionId = null;
  render();
});

window.addEventListener("uimposition:pricing", (event) => {
  pricingState = event.detail ?? { state: "incomplete", pricing: null };
  if (!pricingState.pricing && decisionProfile.objectiveOrder[0] === "estimatedTotalCost") {
    decisionProfile = moveDecisionObjective(decisionProfile, "physicalSheets", 0);
    referenceSolutionId = null;
  }
  render();
});

new MutationObserver(render).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["lang"],
});

render();
