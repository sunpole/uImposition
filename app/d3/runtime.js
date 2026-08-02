"use strict";

const {
  CONFIG,
  APPLICATION_CALCULATION_STATUSES,
  APPLICATION_SCREEN_IDS,
  applySheetPressPresetToApplicationState,
  createDefaultApplicationState,
  replaceApplicationInput,
  selectApplicationPlan,
  setApplicationActiveScreen,
  addApplicationProductRow,
  getApplicationProductRows,
  moveApplicationProductRow,
  removeApplicationProductRow,
  replaceApplicationProductRows,
  setApplicationProductRowEnabled,
  updateApplicationProductRow,
  createApplicationStateRepository,
  createSheetPressPresetRepository,
  createBuiltInSheetPressPresets,
  createLocalSheetPressPreset,
  calculateOperatorWorkspace,
  createOperatorWorkspaceCalculationRequest,
  resolveOperatorWorkspaceCalculation,
  calculateSheetGeometry,
  D3_STANDARD_FORMATS,
  createD3CopyName,
  createD3ProductInput,
  emptyD3Draft,
  formatD3Decimal,
  formatD3Integer,
  recognizeD3Format,
  validateD3Draft,
} = window.__uimpositionD3Deps;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const storage = window.localStorage;
const applicationRepository = createApplicationStateRepository({ storage });
const presetRepository = createSheetPressPresetRepository({ storage });
const builtInPresets = createBuiltInSheetPressPresets();

const D3_DRAFT_KEY = "uImposition.d3Draft.v1";
const D3_UI_KEY = "uImposition.d3Ui.v1";
const D3_UI_SCHEMA_VERSION = 1;
const UNDO_WINDOW_MS = 5000;

const ui = {
  shell: $("#appShell"),
  saveStatus: $("#saveStatus"),
  saveStatusText: $("#saveStatusText"),
  settingsSaveStatus: $("#settingsSaveStatus"),
  globalMessage: $("#globalMessage"),
  currentPresetButton: $("#currentPresetButton"),
  currentPresetText: $("#currentPresetText"),
  presetList: $("#presetList"),
  sheetFacts: $("#sheetFacts"),
  liveJobs: $("#liveJobs"),
  livePlates: $("#livePlates"),
  liveSheets: $("#liveSheets"),
  commitDraftButton: $("#commitDraftButton"),
  draftRow: $("#draftRow"),
  draftMessage: $("#draftMessage"),
  productList: $("#productList"),
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
  undoBar: $("#undoBar"),
  undoDeleteButton: $("#undoDeleteButton"),
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
  uniformPipelineRequiresSharedGeometryAndColor: "Для текущего расчёта все включённые строки должны иметь одинаковый формат, красочность, выпуск и рез.",
  uniformPipelineRequiresEnabledRows: "Добавьте хотя бы один заказ.",
  uniformCalculationRequiresEqualBleedSides: "Текущий uniform-расчёт требует одинаковый выпуск со всех сторон.",
  productDoesNotFitPrintableArea: "Изделие не помещается в печатную область выбранного листа.",
});

const DRAFT_ISSUE_TEXT = Object.freeze({
  required: "Выберите формат и заполните обязательные поля.",
  invalidNumber: "Проверьте размеры и выпуск.",
  integerRequired: "Страницы и тираж должны быть целыми числами от 1.",
  outOfRange: "Красочность: 1–20 + 0–20; размеры должны быть положительными.",
  doesNotFit: "Изделие вместе с выпуском не помещается в печатную область.",
});

let state;
let draft;
let d3Meta;
let selectedRowId = null;
let lastValidResult = null;
let attemptedResult = null;
let calculationTimer = null;
let calculationSequence = 0;
let draftSaveTimer = null;
let undoTimer = null;
let undoSnapshot = null;
let layoutSide = "front";
let storageWarning = null;
let openSurfaceId = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function printableArea() {
  const geometry = currentSheetGeometry();
  return geometry ? { width: geometry.printable.width, height: geometry.printable.height } : null;
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
