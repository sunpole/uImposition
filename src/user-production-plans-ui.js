import { CONFIG } from "./config.js";
import { calculatePlacementOptions, calculateSheetGeometry } from "./geometry.js";
import { parseOrders } from "./orders.js";
import { createDuplexPrintSpecification } from "./print-specification.js";
import { createUserUniformProductionPlanSet } from "./user-uniform-production-plans.js";
import {
  clearUserProductionPlanSet,
  setUserProductionPlanSet,
  subscribeUserProductionPlanRuntime,
} from "./user-production-plans-runtime.js";
import { renderUserProductionComparisonPanel } from "./user-production-comparison-ui.js";

const sides = ["left", "right", "top", "bottom"];
const ids = { left: "Left", right: "Right", top: "Top", bottom: "Bottom" };
const MAX_INTERACTIVE_PAGE_PAIRS = 500;

const FILTERS = Object.freeze({
  ALL: "all",
  PARETO: "pareto",
  RECOMMENDED: "recommended",
  DOMINATED: "dominated",
});

const TEXT = Object.freeze({
  ru: Object.freeze({
    colorsTitle: "Цветность общего заказа",
    frontColors: "Лицо, красок",
    backColors: "Оборот, красок",
    colorsHint: "Пока цветность общая для всех строк. Индивидуальная цветность каждого файла будет добавлена в расширенной модели заказа.",
    panelTitle: "Варианты пользовательского заказа",
    panelSubtitle: "Проверенные uniform-grid планы",
    waitingOrders: "Введите корректные строки заказа, чтобы построить производственные варианты.",
    waitingColors: "Укажите положительное число красок на лице и обороте.",
    invalidInput: "Расчёт не выполнен",
    tooManyPairs: `Для интерактивного alpha-расчёта поддерживается до ${MAX_INTERACTIVE_PAGE_PAIRS} печатных пар. Уменьшите набор или дождитесь отдельного тяжёлого search worker.`,
    all: "Все",
    pareto: "Pareto",
    recommended: "Рекомендуемые",
    dominated: "Доминируемые",
    variants: "варианта(ов)",
    shown: "показано",
    exactScope: "Полный набор внутри текущей области: fitting 0°/90° × две uniform plan-family. Это не глобальный перебор mixed-layout и всех последовательностей форм.",
    pricingMissing: "Прайс не введён",
    recommendedBadge: "рекомендован",
    paretoBadge: "Pareto",
    dominatedBadge: "доминируем",
    equivalentBadge: "те же метрики",
    provenMinimum: "нижняя граница достигнута",
    feasiblePaper: "бумажный план без доказанного минимума",
    dedicated: "отдельные формы на пары",
    sheets: "Листы",
    forms: "Layout-формы",
    plates: "Пластины",
    passes: "Прогоны",
    overrun: "Перетираж пар",
    cost: "Себестоимость",
    orientation: "Ориентация",
    grid: "Сетка",
    noFiltered: "По выбранному фильтру вариантов нет. Переключитесь на «Все».",
  }),
  en: Object.freeze({
    colorsTitle: "Shared order colors",
    frontColors: "Front colors",
    backColors: "Back colors",
    colorsHint: "Colors are currently shared by all rows. Per-file colors arrive with the expanded order model.",
    panelTitle: "User-order alternatives",
    panelSubtitle: "Validated uniform-grid plans",
    waitingOrders: "Enter valid order rows to generate production alternatives.",
    waitingColors: "Enter a positive color count for both front and back.",
    invalidInput: "Calculation unavailable",
    tooManyPairs: `Interactive alpha calculation supports up to ${MAX_INTERACTIVE_PAGE_PAIRS} print pairs. Reduce the set or wait for the dedicated heavy-search worker.`,
    all: "All",
    pareto: "Pareto",
    recommended: "Recommended",
    dominated: "Dominated",
    variants: "variant(s)",
    shown: "shown",
    exactScope: "Complete inside the current scope: fitting 0°/90° × two uniform plan families. This is not a global enumeration of mixed layouts or every form sequence.",
    pricingMissing: "Pricing not entered",
    recommendedBadge: "recommended",
    paretoBadge: "Pareto",
    dominatedBadge: "dominated",
    equivalentBadge: "same metrics",
    provenMinimum: "lower bound reached",
    feasiblePaper: "paper-focused plan without proven minimum",
    dedicated: "dedicated pair forms",
    sheets: "Sheets",
    forms: "Layout forms",
    plates: "Plates",
    passes: "Passes",
    overrun: "Pair overrun",
    cost: "Cost",
    orientation: "Orientation",
    grid: "Grid",
    noFiltered: "No variants match this filter. Switch to All.",
  }),
});

const state = {
  filter: FILTERS.ALL,
  planSet: null,
  error: null,
  timer: null,
  pricing: window.__uimpositionPricingState?.pricing ?? null,
  selectedPlanId: null,
};

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
  if (text) node.textContent = text;
  return node;
}

function ensureStylesheet() {
  if ($('link[data-user-production-plans-styles]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "user-production-plans.css";
  link.setAttribute("data-user-production-plans-styles", "");
  document.head.append(link);
  if (!$('link[data-user-production-comparison-styles]')) {
    const comparisonLink = document.createElement("link");
    comparisonLink.rel = "stylesheet";
    comparisonLink.href = "user-production-comparison.css";
    comparisonLink.setAttribute("data-user-production-comparison-styles", "");
    document.head.append(comparisonLink);
  }
}

function localizedSpan(key, lang) {
  const span = element("span", "", TEXT[lang][key]);
  span.dataset.lang = lang;
  span.hidden = lang !== language();
  return span;
}

function createNumberInput(id, value) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "number";
  input.min = "1";
  input.max = "16";
  input.step = "1";
  input.inputMode = "numeric";
  input.value = String(value);
  return input;
}

function createLocalizedField(key, input) {
  const label = element("label", "field");
  label.append(localizedSpan(key, "ru"), localizedSpan(key, "en"), input);
  return label;
}

function ensureColorControls() {
  if ($("#userPrintColors")) return;
  const settings = $(".settings-panel__content");
  if (!settings) throw new Error("Settings panel content not found");

  const divider = element("div", "settings-divider");
  const titleRu = element("h2", "settings-section-title", TEXT.ru.colorsTitle);
  titleRu.dataset.lang = "ru";
  const titleEn = element("h2", "settings-section-title", TEXT.en.colorsTitle);
  titleEn.dataset.lang = "en";
  titleEn.hidden = language() !== "en";

  const section = element("section", "user-print-colors");
  section.id = "userPrintColors";
  const grid = element("div", "field-grid");
  grid.append(
    createLocalizedField("frontColors", createNumberInput("userFrontColors", 4)),
    createLocalizedField("backColors", createNumberInput("userBackColors", 4)),
  );
  const hint = element("p", "hint user-print-colors__hint", t("colorsHint"));
  hint.id = "userPrintColorsHint";
  section.append(grid, hint);

  const pricing = $("#pricingControls");
  const pricingTitle = pricing?.previousElementSibling;
  const anchor = pricingTitle?.previousElementSibling?.classList.contains("settings-divider")
    ? pricingTitle.previousElementSibling
    : pricingTitle ?? pricing;
  if (anchor) {
    settings.insertBefore(divider, anchor);
    settings.insertBefore(titleRu, anchor);
    settings.insertBefore(titleEn, anchor);
    settings.insertBefore(section, anchor);
  } else {
    settings.append(divider, titleRu, titleEn, section);
  }
}

function ensurePanel() {
  const existing = $("#userProductionPlans");
  if (existing) return existing;

  const panel = element("section", "panel user-production-plans");
  panel.id = "userProductionPlans";
  const pagePairsPanel = $(".page-pairs-panel");
  const milestone = $(".milestone-panel");
  const workspace = $(".workspace");
  if (!workspace) throw new Error("Workspace container not found");
  if (pagePairsPanel) pagePairsPanel.after(panel);
  else workspace.insertBefore(panel, milestone ?? null);
  return panel;
}

function values(prefix) {
  return Object.fromEntries(sides.map((side) => [side, $(`#${prefix}${ids[side]}`)?.value]));
}

function trimValues() {
  if (!$("#trimUniform")?.checked) return values("trim");
  const value = $("#trimUniformMm")?.value;
  return Object.fromEntries(sides.map((side) => [side, value]));
}

function currentInput() {
  const geometry = calculateSheetGeometry({
    width: $("#sheetWidth")?.value,
    height: $("#sheetHeight")?.value,
    sizeStage: $("#sizeStage")?.value,
    trim: {
      enabled: Boolean($("#trimEnabled")?.checked),
      sides: trimValues(),
    },
    pressMargins: values("margin"),
    limits: CONFIG.limits,
  });

  const placementOptions = calculatePlacementOptions({
    printable: geometry.printable,
    product: {
      width: $("#productWidth")?.value,
      height: $("#productHeight")?.value,
      bleed: $("#productBleed")?.value,
      spacingMode: $("#spacingMode")?.value,
      gap: $("#productGap")?.value,
    },
    limits: CONFIG.limits,
  });

  const orders = parseOrders($("#ordersInput")?.value ?? "", CONFIG.limits);
  return { geometry, placementOptions, orders };
}

function readPositiveInteger(selector) {
  const number = Number($(selector)?.value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function calculate() {
  try {
    const input = currentInput();
    if (input.orders.errors.length > 0 || input.orders.pagePairs.length === 0) {
      state.planSet = null;
      clearUserProductionPlanSet();
      state.error = null;
      render();
      return;
    }
    if (input.orders.pagePairs.length > MAX_INTERACTIVE_PAGE_PAIRS) {
      state.planSet = null;
      clearUserProductionPlanSet();
      state.error = new RangeError(t("tooManyPairs"));
      render();
      return;
    }

    const frontColors = readPositiveInteger("#userFrontColors");
    const backColors = readPositiveInteger("#userBackColors");
    if (frontColors === null || backColors === null) {
      state.planSet = null;
      clearUserProductionPlanSet();
      state.error = new RangeError(t("waitingColors"));
      render();
      return;
    }

    state.planSet = createUserUniformProductionPlanSet({
      pagePairs: input.orders.pagePairs,
      placementOptions: input.placementOptions,
      sourceSheet: input.geometry.source,
      printSpecification: createDuplexPrintSpecification({ frontColors, backColors }),
      pricing: state.pricing,
    });
    setUserProductionPlanSet(state.planSet);
    state.error = null;
  } catch (error) {
    state.planSet = null;
    clearUserProductionPlanSet();
    state.error = error;
  }
  render();
}

function scheduleCalculation() {
  clearTimeout(state.timer);
  state.timer = setTimeout(calculate, 100);
}

function formatNumber(value, maximumFractionDigits = 2) {
  return Number(value).toLocaleString(language() === "ru" ? "ru-RU" : "en-US", {
    maximumFractionDigits,
  });
}

function formatCost(metrics) {
  if (metrics.estimatedTotalCost === null) return t("pricingMissing");
  return `${formatNumber(metrics.estimatedTotalCost, 2)} ${metrics.currency}`;
}

function filteredEntries() {
  const entries = state.planSet?.catalog.entries ?? [];
  if (state.filter === FILTERS.PARETO) return entries.filter(({ pareto }) => pareto);
  if (state.filter === FILTERS.RECOMMENDED) return entries.filter(({ recommended }) => recommended);
  if (state.filter === FILTERS.DOMINATED) return entries.filter(({ dominated }) => dominated);
  return entries;
}

function badge(text, modifier = "") {
  return element("span", `plan-badge${modifier ? ` plan-badge--${modifier}` : ""}`, text);
}

function proofText(plan) {
  if (plan.family === "dedicatedPairForms") return t("dedicated");
  return plan.proof.lowerBoundReached ? t("provenMinimum") : t("feasiblePaper");
}

function metric(label, value, accent = false) {
  const item = element("div", `plan-metric${accent ? " plan-metric--accent" : ""}`);
  item.append(element("span", "", label), element("strong", "", value));
  return item;
}

function renderEntry(entry) {
  const plan = state.planSet.plans.find(({ id }) => id === entry.id);
  const card = element("article", "production-plan-card");
  card.dataset.planId = entry.id;
  if (entry.recommended) card.classList.add("is-recommended");

  const heading = element("div", "production-plan-card__heading");
  const titleWrap = element("div");
  titleWrap.append(
    element("h3", "", plan.label),
    element("p", "production-plan-card__proof", proofText(plan)),
  );
  const badges = element("div", "production-plan-card__badges");
  if (entry.recommended) badges.append(badge(t("recommendedBadge"), "recommended"));
  if (entry.pareto) badges.append(badge(t("paretoBadge"), "pareto"));
  if (entry.dominated) badges.append(badge(t("dominatedBadge"), "dominated"));
  if (entry.metricEquivalent) badges.append(badge(t("equivalentBadge"), "equivalent"));
  heading.append(titleWrap, badges);

  const grid = element("div", "production-plan-card__metrics");
  grid.append(
    metric(t("sheets"), formatNumber(plan.metrics.physicalSheets), true),
    metric(t("forms"), formatNumber(plan.metrics.layoutForms)),
    metric(t("plates"), formatNumber(plan.metrics.colorPlates)),
    metric(t("passes"), formatNumber(plan.metrics.pressPasses)),
    metric(t("overrun"), formatNumber(plan.metrics.pairOverrun)),
    metric(t("cost"), formatCost(plan.metrics), plan.metrics.estimatedTotalCost !== null),
  );

  const footer = element("div", "production-plan-card__footer");
  footer.append(
    element("span", "", `${t("orientation")}: ${plan.grid.rotation}°`),
    element("span", "", `${t("grid")}: ${plan.grid.columns} × ${plan.grid.rows}`),
    element("span", "", `#${entry.rank}`),
  );
  card.append(heading, grid, footer);
  return card;
}

function filterButton(filter, labelKey, count) {
  const button = element("button", "plan-filter", `${t(labelKey)} · ${count}`);
  button.type = "button";
  button.dataset.filter = filter;
  button.classList.toggle("is-active", state.filter === filter);
  button.setAttribute("aria-pressed", String(state.filter === filter));
  return button;
}

function renderEmpty(panel, message, error = false) {
  panel.innerHTML = "";
  const heading = element("div", "section-heading");
  const title = element("div");
  title.append(
    element("p", "section-kicker", "M7.5"),
    element("h2", "", t("panelTitle")),
  );
  heading.append(title, badge(t("panelSubtitle")));
  panel.append(heading, element("p", error ? "error-box" : "empty-state", message));
}

function render() {
  const panel = ensurePanel();
  if (state.error) {
    renderEmpty(panel, `${t("invalidInput")}: ${state.error.message}`, true);
    return;
  }
  if (!state.planSet) {
    renderEmpty(panel, t("waitingOrders"));
    return;
  }

  renderUserProductionComparisonPanel(panel, state.planSet, {
    selectedPlanId: state.selectedPlanId,
  });
  return;

  const entries = filteredEntries();
  const summary = state.planSet.catalog.summary;
  panel.innerHTML = "";

  const heading = element("div", "section-heading user-production-plans__heading");
  const title = element("div");
  title.append(
    element("p", "section-kicker", "M7.5"),
    element("h2", "", t("panelTitle")),
    element("p", "user-production-plans__subtitle", t("panelSubtitle")),
  );
  heading.append(
    title,
    badge(`${summary.feasibleSolutionCount} ${t("variants")}`, "count"),
  );

  const filters = element("div", "plan-filters");
  filters.append(
    filterButton(FILTERS.ALL, "all", summary.feasibleSolutionCount),
    filterButton(FILTERS.PARETO, "pareto", summary.paretoSolutionCount),
    filterButton(FILTERS.RECOMMENDED, "recommended", 1),
    filterButton(FILTERS.DOMINATED, "dominated", summary.dominatedSolutionCount),
  );

  const status = element(
    "p",
    "user-production-plans__status",
    `${t("shown")}: ${entries.length} / ${summary.feasibleSolutionCount}. ${t("exactScope")}`,
  );
  const list = element("div", "production-plan-list");
  if (entries.length === 0) list.append(element("p", "empty-state", t("noFiltered")));
  else entries.forEach((entry) => list.append(renderEntry(entry)));

  panel.append(heading, filters, status, list);
  panel.querySelectorAll(".plan-filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      render();
    });
  });
}

function refreshLanguage() {
  const hint = $("#userPrintColorsHint");
  if (hint) hint.textContent = t("colorsHint");
  render();
}

function attachListeners() {
  const settings = $("#settingsPanel");
  const orders = $("#ordersInput");
  settings?.addEventListener("input", scheduleCalculation);
  settings?.addEventListener("change", scheduleCalculation);
  orders?.addEventListener("input", scheduleCalculation);

  window.addEventListener("uimposition:pricing", (event) => {
    state.pricing = event.detail?.pricing ?? null;
    scheduleCalculation();
  });

  new MutationObserver(refreshLanguage).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
}

ensureStylesheet();
ensureColorControls();
ensurePanel();
attachListeners();
calculate();
subscribeUserProductionPlanRuntime((runtimeSnapshot) => {
  const planSetChanged = runtimeSnapshot.planSet !== state.planSet;
  const selectionChanged = runtimeSnapshot.selectedPlanId !== state.selectedPlanId;
  if (!planSetChanged && !selectionChanged) return;
  state.planSet = runtimeSnapshot.planSet;
  state.selectedPlanId = runtimeSnapshot.selectedPlanId;
  state.error = null;
  if (!state.planSet) state.filter = FILTERS.ALL;
  render();
});
