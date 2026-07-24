import { CONFIG } from "./config.js";
import { calculateSheetGeometry } from "./geometry.js";
import { ordersToText, parseOrders } from "./orders.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const sides = ["left", "right", "top", "bottom"];
const ids = {
  left: "Left",
  right: "Right",
  top: "Top",
  bottom: "Bottom",
};

const ui = {
  languageButton: $("#languageButton"),
  settingsPanel: $("#settingsPanel"),
  settingsToggle: $("#settingsToggle"),
  sheetPreset: $("#sheetPreset"),
  sizeStage: $("#sizeStage"),
  sheetWidth: $("#sheetWidth"),
  sheetHeight: $("#sheetHeight"),
  trimEnabled: $("#trimEnabled"),
  trimUniform: $("#trimUniform"),
  trimUniformMm: $("#trimUniformMm"),
  stageHint: $("#stageHint"),
  sourceResult: $("#sourceResult"),
  trimmedResult: $("#trimmedResult"),
  printableResult: $("#printableResult"),
  trimStatus: $("#trimStatus"),
  geometryError: $("#geometryError"),
  geometryResults: $("#geometryResults"),
  ordersInput: $("#ordersInput"),
  ordersError: $("#ordersError"),
  orderCount: $("#orderCount"),
  printPairCount: $("#printPairCount"),
  totalQuantity: $("#totalQuantity"),
  loadControlCase: $("#loadControlCase"),
  clearOrders: $("#clearOrders"),
  toast: $("#toast"),
  trim: Object.fromEntries(sides.map((side) => [side, $(`#trim${ids[side]}`)])),
  margins: Object.fromEntries(sides.map((side) => [side, $(`#margin${ids[side]}`)])),
};

function readStoredLanguage() {
  try {
    return localStorage.getItem(CONFIG.storage.languageKey);
  } catch {
    return null;
  }
}

let language = readStoredLanguage() || CONFIG.app.defaultLanguage;
if (!CONFIG.app.supportedLanguages.includes(language)) language = CONFIG.app.defaultLanguage;

const t = (key) => CONFIG.i18n[language][key] ?? CONFIG.i18n.ru[key] ?? key;
const formatMm = ({ width, height }) => `${width} × ${height} ${CONFIG.app.unit}`;
const values = (inputs) => Object.fromEntries(sides.map((side) => [side, inputs[side].value]));

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { ui.toast.hidden = true; }, 2800);
}

function renderLanguage() {
  document.documentElement.lang = language;
  $$('[data-lang]').forEach((element) => {
    element.hidden = element.dataset.lang !== language;
  });
  const custom = ui.sheetPreset.options[0];
  if (custom?.value === "custom") custom.textContent = t("customPreset");
  ui.languageButton.textContent = language === "ru" ? "EN" : "RU";
  ui.languageButton.ariaLabel = language === "ru" ? "Switch to English" : "Переключить на русский";
  try { localStorage.setItem(CONFIG.storage.languageKey, language); } catch { /* optional */ }
  renderGeometry();
  renderOrders();
}

async function renderVersion() {
  try {
    const response = await fetch("./VERSION.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { version } = await response.json();
    if (typeof version !== "string" || !version.trim()) throw new Error("Invalid version");
    $$('[data-project-version]').forEach((element) => { element.textContent = version; });
    document.title = `${CONFIG.app.name} · v${version}`;
  } catch (error) {
    console.warn("VERSION.json could not be loaded; the HTML fallback remains visible.", error);
  }
}

function populatePresets() {
  ui.sheetPreset.append(new Option(t("customPreset"), "custom"));
  CONFIG.sheetPresets.forEach((preset) => {
    ui.sheetPreset.append(new Option(`${preset.label} ${CONFIG.app.unit}`, preset.id));
  });
}

function applyDefaults() {
  const d = CONFIG.defaults;
  ui.sheetPreset.value = d.sheetPresetId;
  ui.sheetWidth.value = d.sheetWidth;
  ui.sheetHeight.value = d.sheetHeight;
  ui.sizeStage.value = d.sizeStage;
  ui.trimEnabled.checked = d.trimEnabled;
  ui.trimUniform.checked = d.trimUniform;
  ui.trimUniformMm.value = d.trimUniformMm;
  sides.forEach((side) => {
    ui.trim[side].value = d.trimSidesMm[side];
    ui.margins[side].value = d.pressMarginsMm[side];
  });
  ui.ordersInput.value = d.ordersText;
}

function applyPreset() {
  const preset = CONFIG.sheetPresets.find(({ id }) => id === ui.sheetPreset.value);
  if (!preset) return;
  ui.sheetWidth.value = preset.width;
  ui.sheetHeight.value = preset.height;
  ui.sizeStage.value = preset.sizeStage;
  renderGeometry();
}

function syncTrimControls() {
  const unavailable = !ui.trimEnabled.checked || ui.sizeStage.value === "afterTrim";
  ui.trimUniformMm.disabled = unavailable || !ui.trimUniform.checked;
  sides.forEach((side) => { ui.trim[side].disabled = unavailable || ui.trimUniform.checked; });
}

function trimValues() {
  if (!ui.trimUniform.checked) return values(ui.trim);
  return Object.fromEntries(sides.map((side) => [side, ui.trimUniformMm.value]));
}

function renderGeometry() {
  syncTrimControls();
  ui.stageHint.textContent = ui.sizeStage.value === "afterTrim"
    ? t("stageAfterTrimHint")
    : t("stageBeforeTrimHint");

  try {
    const result = calculateSheetGeometry({
      width: ui.sheetWidth.value,
      height: ui.sheetHeight.value,
      sizeStage: ui.sizeStage.value,
      trim: { enabled: ui.trimEnabled.checked, sides: trimValues() },
      pressMargins: values(ui.margins),
      limits: CONFIG.limits,
    });
    ui.sourceResult.textContent = formatMm(result.source);
    ui.trimmedResult.textContent = formatMm(result.trimmed);
    ui.printableResult.textContent = formatMm(result.printable);
    ui.trimStatus.textContent = result.trimApplied
      ? (language === "ru" ? "Зачистка применена" : "Sheet trim applied")
      : (language === "ru" ? "Повторная зачистка не применена" : "No duplicate trim reduction");
    ui.geometryError.hidden = true;
    ui.geometryResults.classList.remove("has-error");
  } catch (error) {
    ui.geometryError.textContent = `${t("invalidInput")}: ${error.message}`;
    ui.geometryError.hidden = false;
    ui.geometryResults.classList.add("has-error");
  }
}

function renderOrders() {
  const result = parseOrders(ui.ordersInput.value, CONFIG.limits);
  ui.orderCount.textContent = result.summary.orderCount.toLocaleString(language);
  ui.printPairCount.textContent = result.summary.printPairCount.toLocaleString(language);
  ui.totalQuantity.textContent = result.summary.totalQuantity.toLocaleString(language);
  ui.ordersError.hidden = result.errors.length === 0;
  ui.ordersInput.toggleAttribute("aria-invalid", result.errors.length > 0);
  ui.ordersError.textContent = result.errors.slice(0, 5)
    .map((error) => `${language === "ru" ? "Строка" : "Line"} ${error.line}: ${error.message}`)
    .join("\n");
}

async function loadControlCase() {
  try {
    const response = await fetch(CONFIG.demo.controlCaseUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    ui.sheetPreset.value = "custom";
    ui.sheetWidth.value = data.sheet.width;
    ui.sheetHeight.value = data.sheet.height;
    ui.sizeStage.value = data.sheet.sizeStage;
    ui.trimEnabled.checked = data.sheet.trim.enabled;
    ui.trimUniform.checked = sides.every((side) => data.sheet.trim[side] === data.sheet.trim.left);
    ui.trimUniformMm.value = data.sheet.trim.left;
    sides.forEach((side) => {
      ui.trim[side].value = data.sheet.trim[side];
      ui.margins[side].value = data.sheet.pressMargins[side];
    });
    ui.ordersInput.value = ordersToText(data.orders);
    renderGeometry();
    renderOrders();
    toast(t("loadedControlCase"));
  } catch (error) {
    console.error(error);
    toast(t("loadFailed"));
  }
}

function attachListeners() {
  ui.languageButton.addEventListener("click", () => {
    language = language === "ru" ? "en" : "ru";
    renderLanguage();
  });
  ui.settingsToggle.addEventListener("click", () => {
    ui.settingsPanel.classList.toggle("is-collapsed");
    ui.settingsToggle.ariaExpanded = String(!ui.settingsPanel.classList.contains("is-collapsed"));
  });
  ui.sheetPreset.addEventListener("change", applyPreset);
  [ui.sizeStage, ui.trimEnabled, ui.trimUniform].forEach((input) => input.addEventListener("change", renderGeometry));
  [ui.sheetWidth, ui.sheetHeight, ui.trimUniformMm, ...Object.values(ui.trim), ...Object.values(ui.margins)]
    .forEach((input) => input.addEventListener("input", renderGeometry));
  ui.ordersInput.addEventListener("input", renderOrders);
  ui.loadControlCase.addEventListener("click", loadControlCase);
  ui.clearOrders.addEventListener("click", () => { ui.ordersInput.value = ""; renderOrders(); });
}

populatePresets();
applyDefaults();
attachListeners();
renderLanguage();
renderVersion();

if (new URLSearchParams(location.search).get(CONFIG.demo.queryParameter) === "control") {
  loadControlCase();
}
