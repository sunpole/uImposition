import { CONFIG } from "./config.js";
import { calculateSheetGeometry } from "./geometry.js";
import { calculateSheetWeightKg, createPricingProfile } from "./production-cost.js";
import { createProductionReportSolutionMetrics } from "./production-solution-metrics.js";

const sides = ["left", "right", "top", "bottom"];
const ids = { left: "Left", right: "Right", top: "Top", bottom: "Bottom" };

const TEXT = Object.freeze({
  ru: Object.freeze({
    title: "Рабочий прайс",
    subtitle: "Цены оператора",
    grammage: "Плотность, г/м²",
    paperPrice: "Бумага, BYN/кг",
    colorPlatePrice: "Цветовая форма, BYN/шт",
    layoutPreparationPrice: "Подготовка layout-формы, BYN/шт",
    hint: "Поля прайса не подставляют демонстрационные значения. Пока обязательные цены пустые, стоимость решения остаётся недоступной.",
    incomplete: "pricing incomplete",
    ready: "pricing inputs ready",
    costReady: "pricing ready",
    invalid: "pricing invalid",
    profileLabel: "Прайс-профиль",
    sheetWeightLabel: "Вес исходного листа",
    costLabel: "Стоимость решения",
    nextStepLabel: "Следующий шаг",
    nullValue: "null",
    dash: "—",
    blocked: "заблокировано",
    waitingReport: "ожидает отчёт",
    enterPrices: "введите цены",
    loadReport: "загрузите заказ",
    calculateCost: "расчёт стоимости",
    costReadyNext: "сравнение вариантов",
    missingPrices: "Введите плотность, цену бумаги и цену цветовой формы. До этого SolutionMetrics сохраняет стоимость как null.",
    invalidPrices: "Проверьте прайс или отчёт: плотность должна быть больше 0, цены — не меньше 0, а cost object должен совпадать с production report.",
    readyExplanation: "Прайс-профиль готов. Вес исходного листа считается по текущей геометрии. Стоимость включится после загрузки production report.",
    costReadyExplanation: "Production report подключён к SolutionMetrics. Стоимость считается по реальному числу листов, layout-форм и цветовых форм; следующий шаг — сравнение нескольких вариантов.",
  }),
  en: Object.freeze({
    title: "Production pricing",
    subtitle: "Operator prices",
    grammage: "Grammage, gsm",
    paperPrice: "Paper, BYN/kg",
    colorPlatePrice: "Color plate, BYN/each",
    layoutPreparationPrice: "Side-layout preparation, BYN/each",
    hint: "Pricing fields do not inject illustrative defaults. Until required prices are present, solution cost remains unavailable.",
    incomplete: "pricing incomplete",
    ready: "pricing inputs ready",
    costReady: "pricing ready",
    invalid: "pricing invalid",
    profileLabel: "Pricing profile",
    sheetWeightLabel: "Source sheet weight",
    costLabel: "Solution cost",
    nextStepLabel: "Next step",
    nullValue: "null",
    dash: "—",
    blocked: "blocked",
    waitingReport: "waiting report",
    enterPrices: "enter prices",
    loadReport: "load order",
    calculateCost: "cost calculation",
    costReadyNext: "compare variants",
    missingPrices: "Enter grammage, paper price, and color-plate price. Until then, SolutionMetrics keeps cost as null.",
    invalidPrices: "Check pricing or report: grammage must be greater than 0, prices must be at least 0, and the cost object must match the production report.",
    readyExplanation: "The pricing profile is ready. Source-sheet weight is calculated from the current geometry. Cost turns on after the production report is loaded.",
    costReadyExplanation: "The production report is connected to SolutionMetrics. Cost is calculated from real sheets, side-layout forms, and color plates; the next step is comparing multiple variants.",
  }),
});

const $ = (selector) => document.querySelector(selector);
let productionState = window.__uimpositionProductionState ?? { report: null, controlCase: null };

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

function localizedSpan(key, lang) {
  const span = element("span", "", TEXT[lang][key]);
  span.dataset.lang = lang;
  span.hidden = lang !== language();
  return span;
}

function createLocalizedLabel(key, input) {
  const label = element("label", "field");
  label.append(localizedSpan(key, "ru"), localizedSpan(key, "en"), input);
  return label;
}

function createNumberInput({ id, min, placeholder = "" }) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "number";
  input.min = String(min);
  input.step = "0.01";
  input.inputMode = "decimal";
  input.placeholder = placeholder;
  return input;
}

function setLocalizedText(elementToUpdate, key) {
  elementToUpdate.textContent = t(key);
}

function readNumberOrNull(input) {
  const text = String(input?.value ?? "").trim();
  if (!text) return null;
  return Number(text.replace(",", "."));
}

function values(prefix) {
  return Object.fromEntries(sides.map((side) => [side, $(`#${prefix}${ids[side]}`)?.value]));
}

function trimValues() {
  if (!$("#trimUniform")?.checked) return values("trim");
  const value = $("#trimUniformMm")?.value;
  return Object.fromEntries(sides.map((side) => [side, value]));
}

function readSourceSheet() {
  const sourceSheet = productionState.controlCase?.verifiedM2?.sourceSheet;
  if (sourceSheet) return sourceSheet;
  const geometry = calculateSheetGeometry({
    width: $("#sheetWidth")?.value,
    height: $("#sheetHeight")?.value,
    sizeStage: $("#sizeStage")?.value,
    trim: { enabled: Boolean($("#trimEnabled")?.checked), sides: trimValues() },
    pressMargins: values("margin"),
    limits: CONFIG.limits,
  });
  return geometry.source;
}

function formatNumber(value, maximumFractionDigits = 2) {
  return Number(value).toLocaleString(language() === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatCurrency(value, currency) {
  return `${formatNumber(value, 2)} ${currency}`;
}

function formatKg(value) {
  return `${formatNumber(value, 5)} kg`;
}

function createPricingControls() {
  if ($("#pricingControls")) return;
  const settingsContent = $(".settings-panel__content");
  if (!settingsContent) throw new Error("Settings panel content not found");

  const divider = element("div", "settings-divider");
  const titleRu = element("h2", "settings-section-title", TEXT.ru.title);
  titleRu.dataset.lang = "ru";
  const titleEn = element("h2", "settings-section-title", TEXT.en.title);
  titleEn.dataset.lang = "en";
  titleEn.hidden = language() !== "en";

  const controls = element("section", "pricing-controls");
  controls.id = "pricingControls";

  const grid = element("div", "field-grid");
  grid.append(
    createLocalizedLabel("grammage", createNumberInput({ id: "pricingGrammageGsm", min: 0.01, placeholder: "130" })),
    createLocalizedLabel("paperPrice", createNumberInput({ id: "pricingPaperPricePerKg", min: 0, placeholder: "4" })),
    createLocalizedLabel("colorPlatePrice", createNumberInput({ id: "pricingColorPlatePrice", min: 0, placeholder: "15" })),
    createLocalizedLabel("layoutPreparationPrice", createNumberInput({ id: "pricingLayoutFormPreparationPrice", min: 0, placeholder: "0" })),
  );

  const hint = element("p", "hint pricing-controls__hint", t("hint"));
  hint.id = "pricingInputHint";
  controls.append(grid, hint);
  settingsContent.append(divider, titleRu, titleEn, controls);
}

function replaceMilestonePanel() {
  const panel = $(".milestone-panel");
  if (!panel || $("#pricingProfileStatus")) return;
  panel.innerHTML = `
    <div class="section-heading">
      <div><p class="section-kicker">M7.2</p><h2 data-lang="ru">Статус прайса и стоимости</h2><h2 data-lang="en" hidden>Pricing and cost status</h2></div>
      <span id="pricingProfileStatus" class="status-chip status-chip--warning">pricing incomplete</span>
    </div>
    <div class="result-grid result-grid--m7-status">
      <article class="metric metric--accent"><span data-lang="ru">Прайс-профиль</span><span data-lang="en" hidden>Pricing profile</span><strong id="pricingProfileResult">null</strong></article>
      <article class="metric"><span data-lang="ru">Вес исходного листа</span><span data-lang="en" hidden>Source sheet weight</span><strong id="pricingSheetWeightResult">—</strong></article>
      <article class="metric"><span data-lang="ru">Стоимость решения</span><span data-lang="en" hidden>Solution cost</span><strong id="pricingCostRankingResult" data-lang="ru">заблокировано</strong><strong id="pricingCostRankingResultEn" data-lang="en" hidden>blocked</strong></article>
      <article class="metric"><span data-lang="ru">Следующий шаг</span><span data-lang="en" hidden>Next step</span><strong id="pricingNextStepResult" data-lang="ru">введите цены</strong><strong id="pricingNextStepResultEn" data-lang="en" hidden>enter prices</strong></article>
    </div>
    <div class="formula-card">
      <p id="pricingStatusExplanation"></p>
    </div>
  `;
}

function readPricingProfile() {
  const grammageGsm = readNumberOrNull($("#pricingGrammageGsm"));
  const paperPricePerKg = readNumberOrNull($("#pricingPaperPricePerKg"));
  const colorPlatePrice = readNumberOrNull($("#pricingColorPlatePrice"));
  const layoutFormPreparationPrice = readNumberOrNull($("#pricingLayoutFormPreparationPrice")) ?? 0;

  if (grammageGsm === null || paperPricePerKg === null || colorPlatePrice === null) {
    return { state: "incomplete", pricing: null, metrics: null, error: null };
  }

  try {
    const pricing = createPricingProfile({
      currency: CONFIG.pricing.currency,
      grammageGsm,
      paperPricePerKg,
      colorPlatePrice,
      layoutFormPreparationPrice,
    });
    if (!productionState.report) return { state: "ready", pricing, metrics: null, error: null };
    const metrics = createProductionReportSolutionMetrics({
      report: productionState.report,
      sourceSheet: readSourceSheet(),
      pricing,
      label: "Current production report",
      layoutCompactness: null,
    });
    return { state: "costReady", pricing, metrics, error: null };
  } catch (error) {
    return { state: "invalid", pricing: null, metrics: null, error };
  }
}

function setChip(state) {
  const chip = $("#pricingProfileStatus");
  const ready = state === "ready" || state === "costReady";
  chip.classList.toggle("status-chip--success", ready);
  chip.classList.toggle("status-chip--warning", !ready);
  chip.textContent = t(state === "costReady" ? "costReady" : state === "ready" ? "ready" : state === "invalid" ? "invalid" : "incomplete");
}

function publishPricingState(result) {
  const detail = Object.freeze({
    state: result.state,
    pricing: result.pricing,
    metrics: result.metrics,
  });
  window.__uimpositionPricingState = detail;
  window.dispatchEvent(new CustomEvent("uimposition:pricing", { detail }));
}

function setStatusText(result) {
  const { state, pricing, metrics } = result;
  setChip(state);
  const profile = $("#pricingProfileResult");
  const sheetWeight = $("#pricingSheetWeightResult");
  const costRu = $("#pricingCostRankingResult");
  const costEn = $("#pricingCostRankingResultEn");
  const nextRu = $("#pricingNextStepResult");
  const nextEn = $("#pricingNextStepResultEn");
  const explanation = $("#pricingStatusExplanation");

  if (state === "costReady") {
    profile.textContent = metrics.currency;
    sheetWeight.textContent = formatKg(metrics.sheetWeightKg);
    costRu.textContent = formatCurrency(metrics.estimatedTotalCost, metrics.currency);
    costEn.textContent = formatCurrency(metrics.estimatedTotalCost, metrics.currency);
    nextRu.textContent = TEXT.ru.costReadyNext;
    nextEn.textContent = TEXT.en.costReadyNext;
    explanation.textContent = t("costReadyExplanation");
    publishPricingState(result);
    return;
  }

  if (state === "ready") {
    profile.textContent = pricing.currency;
    try {
      const sourceSheet = readSourceSheet();
      const weight = calculateSheetWeightKg({
        widthMm: sourceSheet.width,
        heightMm: sourceSheet.height,
        grammageGsm: pricing.grammageGsm,
      });
      sheetWeight.textContent = formatKg(weight);
    } catch {
      sheetWeight.textContent = t("dash");
    }
    costRu.textContent = TEXT.ru.waitingReport;
    costEn.textContent = TEXT.en.waitingReport;
    nextRu.textContent = TEXT.ru.loadReport;
    nextEn.textContent = TEXT.en.loadReport;
    explanation.textContent = t("readyExplanation");
    publishPricingState(result);
    return;
  }

  profile.textContent = state === "invalid" ? t("invalid") : t("nullValue");
  sheetWeight.textContent = t("dash");
  costRu.textContent = TEXT.ru.blocked;
  costEn.textContent = TEXT.en.blocked;
  nextRu.textContent = TEXT.ru.enterPrices;
  nextEn.textContent = TEXT.en.enterPrices;
  explanation.textContent = t(state === "invalid" ? "invalidPrices" : "missingPrices");
  publishPricingState(result);
}

function renderPricingStatus() {
  const result = readPricingProfile();
  setStatusText(result);
}

function refreshLocalizedPricingText() {
  const hint = $("#pricingInputHint");
  if (hint) setLocalizedText(hint, "hint");
  renderPricingStatus();
}

function attachPricingListeners() {
  [
    "#pricingGrammageGsm",
    "#pricingPaperPricePerKg",
    "#pricingColorPlatePrice",
    "#pricingLayoutFormPreparationPrice",
    "#sheetWidth",
    "#sheetHeight",
    "#sizeStage",
    "#trimEnabled",
    "#trimUniform",
    "#trimUniformMm",
    ...sides.map((side) => `#trim${ids[side]}`),
  ].forEach((selector) => {
    const input = $(selector);
    if (input) input.addEventListener("input", renderPricingStatus);
    if (input) input.addEventListener("change", renderPricingStatus);
  });

  window.addEventListener("uimposition:production-report", (event) => {
    productionState = event.detail ?? { report: null, controlCase: null };
    renderPricingStatus();
  });

  new MutationObserver(refreshLocalizedPricingText).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
}

createPricingControls();
replaceMilestonePanel();
attachPricingListeners();
renderPricingStatus();
