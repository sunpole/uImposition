import { CONFIG } from "../src/config.js";
import {
  APPLICATION_CALCULATION_STATUSES,
  APPLICATION_SCREEN_IDS,
  applySheetPressPresetToApplicationState,
  createDefaultApplicationState,
  replaceApplicationInput,
  selectApplicationPlan,
  setApplicationActiveScreen,
} from "../src/application-state.js";
import {
  addApplicationProductRow,
  duplicateApplicationProductRow,
  getApplicationProductRows,
  removeApplicationProductRow,
  setApplicationProductRowEnabled,
  updateApplicationProductRow,
} from "../src/application-product-rows.js";
import {
  createApplicationStateRepository,
  createSheetPressPresetRepository,
} from "../src/local-state-repository.js";
import {
  createBuiltInSheetPressPresets,
  createLocalSheetPressPreset,
} from "../src/sheet-press-presets.js";
import {
  calculateOperatorWorkspace,
  createOperatorWorkspaceCalculationRequest,
  resolveOperatorWorkspaceCalculation,
} from "../src/operator-workspace-calculation.js";
import { calculateSheetGeometry } from "../src/geometry.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const storage = window.localStorage;
const applicationRepository = createApplicationStateRepository({ storage });
const presetRepository = createSheetPressPresetRepository({ storage });
const builtInPresets = createBuiltInSheetPressPresets();

const ui = {
  shell: $("#appShell"),
  saveStatus: $("#saveStatus"),
  saveStatusText: $("#saveStatusText"),
  globalMessage: $("#globalMessage"),
  presetList: $("#presetList"),
  sheetFacts: $("#sheetFacts"),
  productList: $("#productList"),
  productTemplate: $("#productRowTemplate"),
  working: $("#calculationWorking"),
  calculationError: $("#calculationError"),
  summaryContext: $("#summaryContext"),
  summaryContent: $("#summaryContent"),
  quickComparison: $("#quickComparisonContent"),
  alternativesList: $("#alternativesList"),
  scopeNote: $("#scopeNote"),
  layoutSheet: $("#layoutSheet"),
  layoutDetails: $("#layoutDetails"),
  presetDialog: $("#presetDialog"),
  presetForm: $("#presetForm"),
  presetDialogError: $("#presetDialogError"),
  pricingDialog: $("#pricingDialog"),
  pricingForm: $("#pricingForm"),
};

const ISSUE_TEXT = Object.freeze({
  nameRequired: "Укажите название или имя файла.",
  required: "Заполните поле.",
  invalidNumber: "Введите число.",
  integerRequired: "Нужно целое число.",
  outOfRange: "Значение выходит за допустимый диапазон.",
  duplexFrontColorsRequired: "Для лица нужно указать хотя бы одну краску.",
  duplexBackColorsRequired: "Для оборота нужно указать хотя бы одну краску.",
  simplexFrontColorsRequired: "Для односторонней печати укажите краски лица.",
  commonCutRequiresZeroBleed: "Общий рез возможен только при выпуске 0 мм.",
  totalQuantityTooLarge: "Общий тираж строки превышает допустимый предел.",
  uniformPipelineRequiresDuplex: "Текущий расчёт поддерживает только двусторонние работы.",
  uniformPipelineRequiresCompletePagePairs: "Текущий расчёт требует чётное число страниц.",
  uniformPipelineWorkAndTurnNotGeneralized: "Общий автоматический расчёт своего оборота ещё не реализован.",
  uniformPipelineForcedRotationNotSupported: "Принудительный поворот пока нельзя передать текущему solver.",
  uniformPipelineRequiresSharedGeometryAndColor: "Для текущего расчёта все включённые строки должны иметь одинаковый формат, цветность, выпуск и рез.",
  uniformPipelineRequiresEnabledRows: "Добавьте или включите хотя бы один вид продукции.",
  uniformCalculationRequiresEqualBleedSides: "Текущий uniform-расчёт требует одинаковый выпуск со всех сторон.",
  productDoesNotFitPrintableArea: "Изделие не помещается в печатную область выбранного листа.",
});

let state;
let lastValidResult = null;
let attemptedResult = null;
let calculationTimer = null;
let calculationSequence = 0;
let layoutSide = "front";
let storageWarning = null;

function defaultProduct(overrides = {}) {
  return {
    name: "Листовка А6",
    finished: { widthMm: 105, heightMm: 148 },
    quantityPerVariant: 1000,
    variantCount: 1,
    pages: 2,
    print: {
      mode: "duplex",
      frontColors: 4,
      backColors: 4,
      duplexPreference: "auto",
    },
    bleed: { mode: "uniform", uniformMm: 0 },
    cut: { mode: "commonCut", gapMm: 0 },
    rotationPolicy: "auto",
    notes: "",
    ...overrides,
  };
}

function initialiseState() {
  try {
    const loaded = applicationRepository.load();
    if (loaded) return loaded;
  } catch (error) {
    storageWarning = `Сохранённый проект повреждён и не был перезаписан: ${error.message}`;
  }

  let initial = createDefaultApplicationState();
  initial = applySheetPressPresetToApplicationState(initial, builtInPresets[0]);
  initial = addApplicationProductRow(initial, defaultProduct());
  try {
    applicationRepository.save(initial);
  } catch (error) {
    storageWarning = `Не удалось сохранить новый проект: ${error.message}`;
  }
  return initial;
}

function saveState() {
  try {
    state = applicationRepository.save(state);
  } catch (error) {
    storageWarning = `Автосохранение недоступно: ${error.message}`;
  }
}

function number(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

function cost(metrics) {
  if (!metrics || metrics.estimatedTotalCost === null) return "Прайс не введён";
  return `${number(metrics.estimatedTotalCost, 2)} ${metrics.currency}`;
}

function valueAtPath(object, path) {
  return path.split(".").reduce((current, key) => current?.[key], object);
}

function patchForPath(path, value) {
  const keys = path.split(".");
  if (keys.length === 1) return { [path]: value };
  return { [keys[0]]: { [keys[1]]: value } };
}

function inputDraftValue(input) {
  if (input.type === "number") return input.value === "" ? null : input.value;
  return input.value;
}

function trimSides(sheet) {
  if (sheet.trim.mode === "uniform") {
    return {
      left: sheet.trim.uniformMm,
      right: sheet.trim.uniformMm,
      top: sheet.trim.uniformMm,
      bottom: sheet.trim.uniformMm,
    };
  }
  return sheet.trim.sidesMm;
}

function currentSheetGeometry() {
  try {
    return calculateSheetGeometry({
      width: state.input.sheet.width,
      height: state.input.sheet.height,
      sizeStage: state.input.sheet.sizeStage,
      trim: { enabled: state.input.sheet.trim.enabled, sides: trimSides(state.input.sheet) },
      pressMargins: state.input.press.marginsMm,
      limits: CONFIG.limits,
    });
  } catch {
    return null;
  }
}

function messageForIssue(entry) {
  return ISSUE_TEXT[entry.code] ?? entry.code;
}

function activeIssues() {
  if (attemptedResult?.status === "invalid") return attemptedResult.issues;
  return lastValidResult?.issues ?? [];
}

function isCurrentResult() {
  return Boolean(lastValidResult && lastValidResult.revision === state.runtime.inputRevision);
}

function setStatus(kind, text) {
  ui.saveStatus.classList.toggle("is-working", kind === "working");
  ui.saveStatus.classList.toggle("is-error", kind === "error");
  ui.saveStatusText.textContent = text;
}

function renderStatus() {
  if (storageWarning) {
    ui.globalMessage.hidden = false;
    ui.globalMessage.textContent = storageWarning;
  } else {
    ui.globalMessage.hidden = true;
  }

  const status = state.runtime.calculation.status;
  ui.working.hidden = status !== APPLICATION_CALCULATION_STATUSES.CALCULATING;
  if (status === APPLICATION_CALCULATION_STATUSES.CALCULATING) {
    setStatus("working", "Пересчёт и автосохранение…");
  } else if (status === APPLICATION_CALCULATION_STATUSES.ERROR) {
    setStatus("error", "Есть ошибки · показан последний корректный результат");
  } else if (status === APPLICATION_CALCULATION_STATUSES.DIRTY) {
    setStatus("working", "Изменения сохранены · ожидается пересчёт");
  } else if (status === APPLICATION_CALCULATION_STATUSES.READY) {
    setStatus("ready", "Проект сохранён · результат актуален");
  } else {
    setStatus("ready", "Проект сохранён локально");
  }

  const issues = activeIssues().filter((entry) => entry.blocking !== false);
  ui.calculationError.hidden = issues.length === 0;
  ui.calculationError.textContent = issues.length === 0
    ? ""
    : [...new Set(issues.map(messageForIssue))].slice(0, 3).join(" ");
}

function allPresets() {
  let locals = [];
  try {
    locals = presetRepository.list();
  } catch (error) {
    storageWarning = `Локальные пресеты не прочитаны: ${error.message}`;
  }
  return [...builtInPresets, ...locals];
}

function renderPresets() {
  ui.presetList.innerHTML = "";
  const selectedId = state.input.selectedSheetPressPresetId;
  allPresets().forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `preset-button${preset.kind === "local" ? " is-local" : ""}`;
    button.classList.toggle("is-active", preset.id === selectedId);
    button.dataset.presetId = preset.id;
    button.textContent = preset.name;
    button.title = `${preset.sheet.width} × ${preset.sheet.height} мм`;
    ui.presetList.append(button);
  });
}

function renderSheetFacts() {
  const geometry = currentSheetGeometry();
  if (!geometry) {
    ui.sheetFacts.innerHTML = '<div class="sheet-fact"><span>Лист</span><strong>Проверьте параметры пресета</strong></div>';
    return;
  }
  const margins = geometry.pressMargins;
  ui.sheetFacts.innerHTML = `
    <div class="sheet-fact"><span>Исходный лист</span><strong>${number(geometry.source.width)} × ${number(geometry.source.height)} мм</strong></div>
    <div class="sheet-fact"><span>После зачистки</span><strong>${number(geometry.trimmed.width)} × ${number(geometry.trimmed.height)} мм</strong></div>
    <div class="sheet-fact"><span>Печатная область</span><strong>${number(geometry.printable.width)} × ${number(geometry.printable.height)} мм</strong></div>
    <div class="sheet-fact"><span>Поля машины Л/П/В/Н</span><strong>${number(margins.left)} / ${number(margins.right)} / ${number(margins.top)} / ${number(margins.bottom)} мм</strong></div>
  `;
}

function setFieldValue(input, value) {
  input.value = value === null || value === undefined ? "" : String(value);
}

function renderProducts() {
  const collection = getApplicationProductRows(state);
  ui.productList.innerHTML = "";
  if (collection.rows.length === 0) {
    ui.productList.innerHTML = '<div class="summary-empty">В заказе пока нет продукции. Нажмите «Добавить вид».</div>';
    return;
  }

  collection.rows.forEach((row) => {
    const fragment = ui.productTemplate.content.cloneNode(true);
    const article = $("[data-product-row]", fragment);
    article.dataset.rowId = row.id;
    article.classList.toggle("is-disabled", !row.enabled);
    $$('[data-product-field]', article).forEach((input) => {
      const path = input.dataset.productField;
      setFieldValue(input, valueAtPath(row, path));
      input.disabled = !row.enabled;
    });
    const toggle = $('[data-row-action="toggle"]', article);
    toggle.textContent = row.enabled ? "✓" : "○";
    toggle.title = row.enabled ? "Отключить строку" : "Включить строку";
    ui.productList.append(fragment);
  });
  renderProductIssues();
}

function renderProductIssues() {
  $$("[data-product-row]", ui.productList).forEach((rowNode) => {
    $$('[data-field-wrap]', rowNode).forEach((field) => field.classList.remove("has-error"));
    $("[data-row-error]", rowNode).textContent = "";
  });

  const grouped = new Map();
  activeIssues().forEach((entry) => {
    if (!entry.rowId) return;
    const messages = grouped.get(entry.rowId) ?? [];
    messages.push(messageForIssue(entry));
    grouped.set(entry.rowId, messages);
    const rowNode = $(`[data-product-row][data-row-id="${CSS.escape(entry.rowId)}"]`, ui.productList);
    if (!rowNode) return;
    const field = $(`[data-field-wrap="${CSS.escape(entry.field)}"]`, rowNode);
    field?.classList.add("has-error");
  });
  grouped.forEach((messages, rowId) => {
    const node = $(`[data-product-row][data-row-id="${CSS.escape(rowId)}"] [data-row-error]`, ui.productList);
    if (node) node.textContent = [...new Set(messages)].join(" ");
  });
}

function planTitle(plan) {
  const family = plan.family === "paperMinimum" ? "Минимум бумаги" : "Отдельные формы на пары";
  return `${family} · ${plan.grid.rotation}° · ${plan.grid.columns}×${plan.grid.rows}`;
}

function metricList(metrics) {
  return `
    <ul class="metric-list">
      <li><span>Физические листы</span><strong>${number(metrics.physicalSheets, 0)}</strong></li>
      <li><span>Layout-формы</span><strong>${number(metrics.layoutForms, 0)}</strong></li>
      <li><span>Цветовые пластины</span><strong>${number(metrics.colorPlates, 0)}</strong></li>
      <li><span>Прогоны</span><strong>${number(metrics.pressPasses, 0)}</strong></li>
      <li><span>Перетираж</span><strong>${number(metrics.pairOverrun, 0)}</strong></li>
      <li><span>Себестоимость</span><strong>${cost(metrics)}</strong></li>
    </ul>
  `;
}

function renderSummary() {
  if (!lastValidResult?.selectedPlan) {
    ui.summaryContext.textContent = "Введите корректный заказ.";
    ui.summaryContent.innerHTML = '<div class="summary-empty">После проверки полей здесь появится лучший текущий вариант и его производственные показатели.</div>';
    return;
  }

  const plan = lastValidResult.selectedPlan;
  const current = isCurrentResult();
  ui.summaryContext.textContent = current
    ? `${lastValidResult.summary.enabledRowCount} строк · ${lastValidResult.summary.variantCount} видов · результат актуален`
    : "Показан последний корректный результат. Исправьте текущий ввод для обновления.";
  ui.summaryContent.innerHTML = `
    <div class="summary-hero">
      <div class="summary-hero__badges">
        ${plan.recommended ? '<span class="badge badge--primary">Рекомендация</span>' : ''}
        ${plan.pareto ? '<span class="badge">Pareto</span>' : ''}
        ${current ? '' : '<span class="badge badge--warn">Предыдущая ревизия</span>'}
      </div>
      <strong>${number(plan.metrics.physicalSheets, 0)} листов</strong>
      <span>${planTitle(plan)}</span>
    </div>
    ${metricList(plan.metrics)}
    <div class="summary-actions">
      <button class="button button--primary" type="button" data-summary-action="alternatives">Сравнить все варианты</button>
      <button class="button" type="button" data-summary-action="layout">Открыть схему</button>
    </div>
  `;
}

function renderQuickComparison() {
  const metrics = lastValidResult?.selectedPlan?.metrics;
  if (!metrics) {
    ui.quickComparison.innerHTML = '<div class="summary-empty" style="margin:0 14px 14px">Корректный расчёт ещё не выполнен.</div>';
    return;
  }
  ui.quickComparison.innerHTML = `
    <div class="quick-metrics">
      <div class="quick-metric"><span>Бумага</span><strong>${number(metrics.physicalSheets, 0)}</strong><em>физических листов</em></div>
      <div class="quick-metric"><span>Формы</span><strong>${number(metrics.layoutForms, 0)}</strong><em>стороны монтажей</em></div>
      <div class="quick-metric"><span>Пластины</span><strong>${number(metrics.colorPlates, 0)}</strong><em>цветовые пластины</em></div>
      <div class="quick-metric"><span>Прогоны</span><strong>${number(metrics.pressPasses, 0)}</strong><em>лицо + оборот</em></div>
      <div class="quick-metric"><span>Стоимость</span><strong>${cost(metrics)}</strong><em>${lastValidResult.pricingReady ? 'по рабочему прайсу' : 'добавьте прайс'}</em></div>
    </div>
  `;
}

function renderAlternatives() {
  ui.alternativesList.innerHTML = "";
  if (!lastValidResult?.plans.length) {
    ui.alternativesList.innerHTML = '<div class="summary-empty">Нет корректного набора вариантов. Вернитесь к заказу и проверьте поля.</div>';
    ui.scopeNote.textContent = "Текущий расчёт не выполнен.";
    return;
  }

  ui.scopeNote.textContent = "Полный lossless-набор внутри текущей конечной области: один общий формат и цветность, fitting 0°/90° и две uniform plan-family. Mixed-format, simplex, общий свой оборот и произвольные последовательности форм здесь не выдаются за рассчитанные.";
  const current = isCurrentResult();
  lastValidResult.plans.forEach((plan) => {
    const card = document.createElement("article");
    card.className = "alternative-card";
    card.classList.toggle("is-selected", plan.id === lastValidResult.selectedPlanId);
    card.dataset.planId = plan.id;
    card.innerHTML = `
      <div class="alternative-cell alternative-cell--title">
        <div class="alternative-card__badges">
          ${plan.recommended ? '<span class="badge badge--primary">Рекомендация</span>' : ''}
          ${plan.pareto ? '<span class="badge">Pareto</span>' : ''}
          ${plan.dominated ? '<span class="badge badge--muted">Доминируемый</span>' : ''}
          ${plan.id === lastValidResult.selectedPlanId ? '<span class="badge badge--warn">Выбран оператором</span>' : ''}
        </div>
        <strong>${planTitle(plan)}</strong>
        <span>Ранг ${plan.rank}</span>
      </div>
      <div class="alternative-cell" data-metric="paper"><span>Листы</span><strong>${number(plan.metrics.physicalSheets, 0)}</strong></div>
      <div class="alternative-cell" data-metric="forms"><span>Формы</span><strong>${number(plan.metrics.layoutForms, 0)}</strong></div>
      <div class="alternative-cell" data-metric="plates"><span>Пластины</span><strong>${number(plan.metrics.colorPlates, 0)}</strong></div>
      <div class="alternative-cell" data-metric="passes"><span>Прогоны</span><strong>${number(plan.metrics.pressPasses, 0)}</strong></div>
      <div class="alternative-cell" data-metric="cost"><span>Стоимость</span><strong>${cost(plan.metrics)}</strong></div>
      <div class="alternative-action"><button class="button ${plan.id === lastValidResult.selectedPlanId ? '' : 'button--primary'}" type="button" data-select-plan="${plan.id}" ${current ? '' : 'disabled'}>${plan.id === lastValidResult.selectedPlanId ? 'Выбран' : 'Выбрать'}</button></div>
    `;
    ui.alternativesList.append(card);
  });
}

function renderLayout() {
  const preview = lastValidResult?.layoutPreview;
  const plan = lastValidResult?.selectedPlan;
  ui.layoutSheet.innerHTML = "";
  if (!preview || !plan) {
    ui.layoutSheet.style.display = "block";
    ui.layoutSheet.innerHTML = '<div class="layout-empty">Сначала получите корректный расчёт и выберите вариант.</div>';
    ui.layoutDetails.innerHTML = '<div class="layout-empty">Показатели выбранной схемы появятся здесь.</div>';
    return;
  }

  ui.layoutSheet.style.display = "grid";
  ui.layoutSheet.style.gridTemplateColumns = `repeat(${preview.columns}, minmax(0, 1fr))`;
  ui.layoutSheet.style.gridTemplateRows = `repeat(${preview.rows}, minmax(0, 1fr))`;
  const geometry = lastValidResult.geometry;
  ui.layoutSheet.style.aspectRatio = `${geometry.trimmed.width} / ${geometry.trimmed.height}`;
  preview.cells.forEach((cell) => {
    const node = document.createElement("div");
    node.className = "layout-cell";
    const page = layoutSide === "front" ? cell.frontPage : cell.backPage;
    node.innerHTML = `${cell.file}<small>${layoutSide === "front" ? 'стр.' : 'обр.'} ${page ?? '—'}</small>`;
    ui.layoutSheet.append(node);
  });
  ui.layoutDetails.innerHTML = `
    <p class="kicker">Выбранный план</p>
    <h2>${planTitle(plan)}</h2>
    <p class="muted">Первый монтаж · тираж ${number(preview.runLength, 0)} · вместимость ${preview.capacity}. Поворот ${preview.rotation}°.</p>
    ${metricList(plan.metrics)}
    <div class="scope-note" style="margin:12px 0 0">Оборот отображается из тех же печатных пар. Отдельное ручное редактирование оборота здесь намеренно отсутствует.</div>
    <button class="button" type="button" style="width:100%;margin-top:10px" disabled>PDF будет подключён после проверки рабочего R3-маршрута</button>
  `;
}

function renderScreens() {
  const active = state.runtime.activeScreen;
  $$('[data-screen]').forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === active));
  $$('[data-mobile-screen]').forEach((button) => button.classList.toggle("is-active", button.dataset.mobileScreen === active));
}

function renderResults() {
  renderStatus();
  renderProductIssues();
  renderSummary();
  renderQuickComparison();
  renderAlternatives();
  renderLayout();
  renderScreens();
  publishDebugSnapshot();
}

function renderAll() {
  renderPresets();
  renderSheetFacts();
  renderProducts();
  renderResults();
}

function scheduleCalculation({ immediate = false } = {}) {
  clearTimeout(calculationTimer);
  state = {
    ...state,
    runtime: {
      ...state.runtime,
      calculation: {
        ...state.runtime.calculation,
        status: APPLICATION_CALCULATION_STATUSES.DIRTY,
        activeRevision: null,
        error: null,
      },
    },
  };
  renderStatus();
  calculationTimer = setTimeout(runCalculation, immediate ? 0 : 150);
}

function runCalculation() {
  const request = createOperatorWorkspaceCalculationRequest(state);
  state = request.inputState;
  const sequence = ++calculationSequence;
  renderStatus();
  setTimeout(() => {
    const resolution = resolveOperatorWorkspaceCalculation({
      currentState: state,
      request,
      previousValidResult: lastValidResult,
    });
    if (sequence !== calculationSequence && resolution.stale) return;
    state = resolution.state;
    attemptedResult = resolution.attemptedResult ?? attemptedResult;
    lastValidResult = resolution.lastValidResult ?? lastValidResult;
    saveState();
    renderResults();
  }, 24);
}

function updateProductFromInput(input) {
  const rowNode = input.closest("[data-product-row]");
  if (!rowNode) return;
  const rowId = rowNode.dataset.rowId;
  const path = input.dataset.productField;
  try {
    state = updateApplicationProductRow(state, rowId, patchForPath(path, inputDraftValue(input)));
    saveState();
    scheduleCalculation();
  } catch (error) {
    storageWarning = `Поле не обновлено: ${error.message}`;
    renderStatus();
  }
}

function sourceForNewRow() {
  const rows = getApplicationProductRows(state).rows;
  const source = rows.find(({ enabled }) => enabled) ?? rows[0];
  if (!source) return defaultProduct({ name: "Новый вид" });
  return {
    ...source,
    id: undefined,
    name: "Новый вид",
    sourceFileName: null,
    quantityPerVariant: 1000,
    variantCount: 1,
    notes: "",
  };
}

function structuralProductAction(action, rowId) {
  if (action === "duplicate") state = duplicateApplicationProductRow(state, rowId);
  if (action === "toggle") {
    const row = getApplicationProductRows(state).rows.find(({ id }) => id === rowId);
    state = setApplicationProductRowEnabled(state, rowId, !row.enabled);
  }
  if (action === "remove") state = removeApplicationProductRow(state, rowId);
  saveState();
  attemptedResult = null;
  renderProducts();
  scheduleCalculation();
}

function applyPreset(id) {
  const preset = allPresets().find((entry) => entry.id === id);
  if (!preset) return;
  state = applySheetPressPresetToApplicationState(state, preset);
  if (preset.kind === "local") {
    try { presetRepository.markUsed(preset.id); } catch (error) { storageWarning = error.message; }
  }
  saveState();
  renderPresets();
  renderSheetFacts();
  scheduleCalculation();
}

function openScreen(screen) {
  state = setApplicationActiveScreen(state, screen);
  saveState();
  renderScreens();
  if (screen === APPLICATION_SCREEN_IDS.LAYOUT) renderLayout();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectPlan(id) {
  if (!lastValidResult || !isCurrentResult()) return;
  state = selectApplicationPlan(state, id);
  saveState();
  const result = calculateOperatorWorkspace(state);
  if (result.status === "ready") {
    lastValidResult = result;
    attemptedResult = result;
    renderResults();
  }
}

function showPresetDialog() {
  ui.presetDialogError.hidden = true;
  ui.presetDialog.showModal();
}

function submitPreset(event) {
  event.preventDefault();
  const data = new FormData(ui.presetForm);
  try {
    const existing = presetRepository.list();
    const trim = Number(data.get("trim"));
    const preset = createLocalSheetPressPreset({
      name: data.get("name"),
      sheet: {
        width: data.get("width"),
        height: data.get("height"),
        sizeStage: "beforeTrim",
        trim: {
          enabled: trim > 0,
          mode: "uniform",
          uniformMm: trim,
        },
      },
      press: {
        marginsMm: {
          left: data.get("marginLeft"),
          right: data.get("marginRight"),
          top: data.get("marginTop"),
          bottom: data.get("marginBottom"),
        },
      },
      metadata: {},
    }, { existingPresets: existing });
    const saved = presetRepository.save(preset);
    state = applySheetPressPresetToApplicationState(state, saved);
    saveState();
    ui.presetDialog.close();
    renderPresets();
    renderSheetFacts();
    scheduleCalculation();
  } catch (error) {
    ui.presetDialogError.hidden = false;
    ui.presetDialogError.textContent = error.message;
  }
}

function pricingValue(form, name) {
  const value = form.elements[name].value;
  return value === "" ? null : Number(value);
}

function openPricingDialog() {
  const pricing = state.input.pricing;
  ["grammageGsm", "paperPricePerKg", "colorPlatePrice", "layoutFormPreparationPrice"].forEach((name) => {
    ui.pricingForm.elements[name].value = pricing[name] ?? "";
  });
  ui.pricingDialog.showModal();
}

function submitPricing(event) {
  event.preventDefault();
  state = replaceApplicationInput(state, {
    ...state.input,
    pricing: {
      currency: "BYN",
      grammageGsm: pricingValue(ui.pricingForm, "grammageGsm"),
      paperPricePerKg: pricingValue(ui.pricingForm, "paperPricePerKg"),
      colorPlatePrice: pricingValue(ui.pricingForm, "colorPlatePrice"),
      layoutFormPreparationPrice: pricingValue(ui.pricingForm, "layoutFormPreparationPrice") ?? 0,
    },
  });
  saveState();
  ui.pricingDialog.close();
  scheduleCalculation();
}

function clearPricing() {
  ["grammageGsm", "paperPricePerKg", "colorPlatePrice", "layoutFormPreparationPrice"].forEach((name) => {
    ui.pricingForm.elements[name].value = "";
  });
  submitPricing(new Event("submit", { cancelable: true }));
}

function publishDebugSnapshot() {
  window.__uimpositionR3 = Object.freeze({
    getSnapshot: () => ({
      state,
      lastValidResult,
      attemptedResult,
      layoutSide,
    }),
    recalculate: () => scheduleCalculation({ immediate: true }),
    openScreen,
  });
}

function attachEvents() {
  $("#createPresetButton").addEventListener("click", showPresetDialog);
  $("#pricingButton").addEventListener("click", openPricingDialog);
  $("#addProductButton").addEventListener("click", () => {
    state = addApplicationProductRow(state, sourceForNewRow());
    saveState();
    renderProducts();
    scheduleCalculation();
  });
  ui.presetForm.addEventListener("submit", submitPreset);
  ui.pricingForm.addEventListener("submit", submitPricing);
  $("#clearPricingButton").addEventListener("click", clearPricing);

  ui.presetList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset-id]");
    if (button) applyPreset(button.dataset.presetId);
  });
  ui.productList.addEventListener("input", (event) => {
    if (event.target.matches("[data-product-field]")) updateProductFromInput(event.target);
  });
  ui.productList.addEventListener("change", (event) => {
    if (event.target.matches("select[data-product-field]")) updateProductFromInput(event.target);
  });
  ui.productList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-row-action]");
    const row = event.target.closest("[data-product-row]");
    if (button && row) structuralProductAction(button.dataset.rowAction, row.dataset.rowId);
  });
  document.addEventListener("click", (event) => {
    const screenButton = event.target.closest("[data-open-screen]");
    if (screenButton) openScreen(screenButton.dataset.openScreen);
    const mobileButton = event.target.closest("[data-mobile-screen]");
    if (mobileButton) openScreen(mobileButton.dataset.mobileScreen);
    const summaryAction = event.target.closest("[data-summary-action]");
    if (summaryAction) openScreen(summaryAction.dataset.summaryAction);
    const selectButton = event.target.closest("[data-select-plan]");
    if (selectButton) selectPlan(selectButton.dataset.selectPlan);
    const sideButton = event.target.closest("[data-layout-side]");
    if (sideButton) {
      layoutSide = sideButton.dataset.layoutSide;
      $$('[data-layout-side]').forEach((button) => button.classList.toggle("is-active", button === sideButton));
      renderLayout();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== CONFIG.storage.applicationStateKey) return;
    try {
      const loaded = applicationRepository.load();
      if (loaded) {
        state = loaded;
        lastValidResult = null;
        attemptedResult = null;
        renderAll();
        scheduleCalculation({ immediate: true });
      }
    } catch (error) {
      storageWarning = error.message;
      renderStatus();
    }
  });
}

state = initialiseState();
attachEvents();
renderAll();
scheduleCalculation({ immediate: true });
