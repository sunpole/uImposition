import { CONFIG } from "./config.js";
import { calculatePlacementOptions, calculateSheetGeometry } from "./geometry.js";
import { ordersToText, parseOrders } from "./orders.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const sides = ["left", "right", "top", "bottom"];
const ids = { left: "Left", right: "Right", top: "Top", bottom: "Bottom" };

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
  productPreset: $("#productPreset"),
  productWidth: $("#productWidth"),
  productHeight: $("#productHeight"),
  productBleed: $("#productBleed"),
  spacingMode: $("#spacingMode"),
  productGap: $("#productGap"),
  spacingHint: $("#spacingHint"),
  placementResults: $("#placementResults"),
  placementStatus: $("#placementStatus"),
  placementError: $("#placementError"),
  productFinishedResult: $("#productFinishedResult"),
  productOccupiedResult: $("#productOccupiedResult"),
  bestGridResult: $("#bestGridResult"),
  bestPositionsResult: $("#bestPositionsResult"),
  bestRotationResult: $("#bestRotationResult"),
  candidate0Grid: $("#candidate0Grid"),
  candidate0Positions: $("#candidate0Positions"),
  candidate0Unused: $("#candidate0Unused"),
  candidate90Grid: $("#candidate90Grid"),
  candidate90Positions: $("#candidate90Positions"),
  candidate90Unused: $("#candidate90Unused"),
  candidate0Card: $("#candidate0Card"),
  candidate90Card: $("#candidate90Card"),
  placementPreview: $("#placementPreview"),
  placementPreviewNote: $("#placementPreviewNote"),
  ordersInput: $("#ordersInput"),
  ordersError: $("#ordersError"),
  orderCount: $("#orderCount"),
  printPairCount: $("#printPairCount"),
  totalQuantity: $("#totalQuantity"),
  pagePairsBody: $("#pagePairsBody"),
  pagePairsEmpty: $("#pagePairsEmpty"),
  pagePairsNotice: $("#pagePairsNotice"),
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
let currentGeometry = null;
if (!CONFIG.app.supportedLanguages.includes(language)) language = CONFIG.app.defaultLanguage;

const t = (key) => CONFIG.i18n[language][key] ?? CONFIG.i18n.ru[key] ?? key;
const formatMm = ({ width, height }) => `${width} × ${height} ${CONFIG.app.unit}`;
const formatValue = (value) => Number(value).toLocaleString(language);
const values = (inputs) => Object.fromEntries(sides.map((side) => [side, inputs[side].value]));
const directionArrow = (rotation) => (rotation === 0 ? "↑" : "→");

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
  const customSheet = ui.sheetPreset.options[0];
  if (customSheet?.value === "custom") customSheet.textContent = t("customPreset");
  const customProduct = ui.productPreset.options[0];
  if (customProduct?.value === "custom") customProduct.textContent = t("customProduct");
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

  ui.productPreset.append(new Option(t("customProduct"), "custom"));
  CONFIG.productPresets.forEach((preset) => {
    ui.productPreset.append(new Option(`${preset.label} ${CONFIG.app.unit}`, preset.id));
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
  ui.productPreset.value = d.productPresetId;
  ui.productWidth.value = d.productWidth;
  ui.productHeight.value = d.productHeight;
  ui.productBleed.value = d.productBleedMm;
  ui.spacingMode.value = d.spacingMode;
  ui.productGap.value = d.productGapMm;
  ui.ordersInput.value = d.ordersText;
}

function applySheetPreset() {
  const preset = CONFIG.sheetPresets.find(({ id }) => id === ui.sheetPreset.value);
  if (!preset) return;
  ui.sheetWidth.value = preset.width;
  ui.sheetHeight.value = preset.height;
  ui.sizeStage.value = preset.sizeStage;
  renderGeometry();
}

function applyProductPreset() {
  const preset = CONFIG.productPresets.find(({ id }) => id === ui.productPreset.value);
  if (!preset) return;
  ui.productWidth.value = preset.width;
  ui.productHeight.value = preset.height;
  renderPlacement();
}

function syncTrimControls() {
  const unavailable = !ui.trimEnabled.checked || ui.sizeStage.value === "afterTrim";
  ui.trimUniformMm.disabled = unavailable || !ui.trimUniform.checked;
  sides.forEach((side) => { ui.trim[side].disabled = unavailable || ui.trimUniform.checked; });
}

function syncProductControls() {
  const commonCut = ui.spacingMode.value === "commonCut";
  ui.productGap.disabled = commonCut;
  ui.spacingHint.textContent = commonCut ? t("commonCutHint") : t("separatedHint");
}

function trimValues() {
  if (!ui.trimUniform.checked) return values(ui.trim);
  return Object.fromEntries(sides.map((side) => [side, ui.trimUniformMm.value]));
}

function productValues() {
  return {
    width: ui.productWidth.value,
    height: ui.productHeight.value,
    bleed: ui.productBleed.value,
    spacingMode: ui.spacingMode.value,
    gap: ui.productGap.value,
  };
}

function renderGeometry() {
  syncTrimControls();
  ui.stageHint.textContent = ui.sizeStage.value === "afterTrim"
    ? t("stageAfterTrimHint")
    : t("stageBeforeTrimHint");

  try {
    currentGeometry = calculateSheetGeometry({
      width: ui.sheetWidth.value,
      height: ui.sheetHeight.value,
      sizeStage: ui.sizeStage.value,
      trim: { enabled: ui.trimEnabled.checked, sides: trimValues() },
      pressMargins: values(ui.margins),
      limits: CONFIG.limits,
    });
    ui.sourceResult.textContent = formatMm(currentGeometry.source);
    ui.trimmedResult.textContent = formatMm(currentGeometry.trimmed);
    ui.printableResult.textContent = formatMm(currentGeometry.printable);
    ui.trimStatus.textContent = currentGeometry.trimApplied
      ? (language === "ru" ? "Зачистка применена" : "Sheet trim applied")
      : (language === "ru" ? "Повторная зачистка не применена" : "No duplicate trim reduction");
    ui.geometryError.hidden = true;
    ui.geometryResults.classList.remove("has-error");
  } catch (error) {
    currentGeometry = null;
    ui.geometryError.textContent = `${t("invalidInput")}: ${error.message}`;
    ui.geometryError.hidden = false;
    ui.geometryResults.classList.add("has-error");
  }
  renderPlacement();
}

function renderCandidate(candidate, card, grid, positions, unused) {
  grid.textContent = `${candidate.columns} × ${candidate.rows}`;
  positions.textContent = `${formatValue(candidate.positions)} ${t("positions")}`;
  unused.textContent = `${candidate.unused.width} × ${candidate.unused.height} ${CONFIG.app.unit}`;
  card.classList.toggle("is-best", candidate.rotation === Number(ui.bestRotationResult.dataset.rotation));
}

function renderPreview(best) {
  ui.placementPreview.replaceChildren();
  if (best.positions === 0) {
    ui.placementPreviewNote.textContent = t("doesNotFit");
    return;
  }

  const shown = Math.min(best.positions, CONFIG.limits.maxPreviewCells);
  ui.placementPreview.style.setProperty("--grid-columns", best.columns);
  ui.placementPreview.style.setProperty("--cell-ratio", best.cell.width / best.cell.height);
  const arrow = directionArrow(best.rotation);
  for (let index = 0; index < shown; index += 1) {
    const cell = document.createElement("div");
    cell.className = "placement-cell";
    const number = document.createElement("span");
    number.textContent = String(index + 1);
    const direction = document.createElement("strong");
    direction.textContent = arrow;
    cell.append(number, direction);
    ui.placementPreview.append(cell);
  }
  ui.placementPreviewNote.textContent = language === "ru"
    ? `Показана однородная сетка ${best.columns} × ${best.rows}. Смешанные повороты пока не рассчитываются.`
    : `Uniform ${best.columns} × ${best.rows} grid. Mixed rotations are not evaluated yet.`;
}

function renderPlacement() {
  syncProductControls();
  if (!currentGeometry) {
    ui.placementError.textContent = language === "ru"
      ? "Сначала исправьте геометрию печатного листа."
      : "Fix the printing-sheet geometry first.";
    ui.placementError.hidden = false;
    ui.placementResults.classList.add("has-error");
    return;
  }

  try {
    const result = calculatePlacementOptions({
      printable: currentGeometry.printable,
      product: productValues(),
      limits: CONFIG.limits,
    });
    const [candidate0, candidate90] = result.candidates;
    const best = result.best;
    ui.productFinishedResult.textContent = formatMm(result.footprint.finished);
    ui.productOccupiedResult.textContent = formatMm(result.footprint.occupied);
    ui.bestGridResult.textContent = `${best.columns} × ${best.rows}`;
    ui.bestPositionsResult.textContent = formatValue(best.positions);
    ui.bestRotationResult.textContent = `${best.rotation}° ${directionArrow(best.rotation)}`;
    ui.bestRotationResult.dataset.rotation = String(best.rotation);
    ui.placementStatus.textContent = result.fits ? t("fits") : t("doesNotFit");
    renderCandidate(candidate0, ui.candidate0Card, ui.candidate0Grid, ui.candidate0Positions, ui.candidate0Unused);
    renderCandidate(candidate90, ui.candidate90Card, ui.candidate90Grid, ui.candidate90Positions, ui.candidate90Unused);
    renderPreview(best);
    ui.placementError.hidden = true;
    ui.placementResults.classList.remove("has-error");
  } catch (error) {
    ui.placementError.textContent = `${t("invalidInput")}: ${error.message}`;
    ui.placementError.hidden = false;
    ui.placementResults.classList.add("has-error");
    ui.placementStatus.textContent = t("doesNotFit");
    ui.placementPreview.replaceChildren();
    ui.placementPreviewNote.textContent = "";
  }
}

function appendPairRow(pair) {
  const row = document.createElement("tr");
  const valuesToShow = [pair.file, pair.pairIndex, pair.frontPage, pair.backPage ?? "-", formatValue(pair.quantity)];
  valuesToShow.forEach((value) => {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    row.append(cell);
  });
  ui.pagePairsBody.append(row);
}

function renderPagePairs(pagePairs) {
  ui.pagePairsBody.replaceChildren();
  ui.pagePairsEmpty.hidden = pagePairs.length > 0;
  ui.pagePairsEmpty.textContent = t("noPairs");
  const visiblePairs = pagePairs.slice(0, CONFIG.limits.maxPagePairRows);
  visiblePairs.forEach(appendPairRow);
  ui.pagePairsNotice.hidden = pagePairs.length <= visiblePairs.length;
  ui.pagePairsNotice.textContent = language === "ru"
    ? `Показаны первые ${visiblePairs.length} из ${pagePairs.length} пар.`
    : `Showing the first ${visiblePairs.length} of ${pagePairs.length} pairs.`;
}

function renderOrders() {
  const result = parseOrders(ui.ordersInput.value, CONFIG.limits);
  ui.orderCount.textContent = formatValue(result.summary.orderCount);
  ui.printPairCount.textContent = formatValue(result.summary.printPairCount);
  ui.totalQuantity.textContent = formatValue(result.summary.totalQuantity);
  ui.ordersError.hidden = result.errors.length === 0;
  ui.ordersInput.toggleAttribute("aria-invalid", result.errors.length > 0);
  ui.ordersError.textContent = result.errors.slice(0, 5)
    .map((error) => `${language === "ru" ? "Строка" : "Line"} ${error.line}: ${error.message}`)
    .join("\n");
  renderPagePairs(result.pagePairs);
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
    const product = data.product ?? {};
    const matchingPreset = CONFIG.productPresets.find(
      (preset) => preset.width === product.width && preset.height === product.height,
    );
    ui.productPreset.value = matchingPreset?.id ?? "custom";
    ui.productWidth.value = product.width ?? CONFIG.defaults.productWidth;
    ui.productHeight.value = product.height ?? CONFIG.defaults.productHeight;
    ui.productBleed.value = product.bleed ?? CONFIG.defaults.productBleedMm;
    ui.spacingMode.value = product.spacingMode
      ?? ((Number(product.bleed ?? 0) === 0 && Number(product.gap ?? 0) === 0) ? "commonCut" : "separated");
    ui.productGap.value = product.gap ?? CONFIG.defaults.productGapMm;
    ui.ordersInput.value = ordersToText(data.orders);
    renderGeometry();
    renderOrders();
    toast(t("loadedControlCase"));
  } catch (error) {
    console.error(error);
    toast(t("loadFailed"));
  }
}

function initializeResponsiveSettingsPanel() {
  const compactViewport = window.matchMedia("(max-width: 620px)").matches;
  ui.settingsPanel.classList.toggle("is-collapsed", compactViewport);
  ui.settingsToggle.ariaExpanded = String(!compactViewport);
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
  ui.sheetPreset.addEventListener("change", applySheetPreset);
  ui.productPreset.addEventListener("change", applyProductPreset);
  [ui.sizeStage, ui.trimEnabled, ui.trimUniform].forEach((input) => input.addEventListener("change", renderGeometry));
  [ui.sheetWidth, ui.sheetHeight, ui.trimUniformMm, ...Object.values(ui.trim), ...Object.values(ui.margins)]
    .forEach((input) => input.addEventListener("input", renderGeometry));
  [ui.productBleed, ui.productGap].forEach((input) => input.addEventListener("input", renderPlacement));
  ui.spacingMode.addEventListener("change", renderPlacement);
  [ui.productWidth, ui.productHeight].forEach((input) => input.addEventListener("input", () => {
    ui.productPreset.value = "custom";
    renderPlacement();
  }));
  ui.ordersInput.addEventListener("input", renderOrders);
  ui.loadControlCase.addEventListener("click", loadControlCase);
  ui.clearOrders.addEventListener("click", () => { ui.ordersInput.value = ""; renderOrders(); });
}

populatePresets();
applyDefaults();
initializeResponsiveSettingsPanel();
attachListeners();
renderLanguage();
renderVersion();

if (new URLSearchParams(location.search).get(CONFIG.demo.queryParameter) === "control") {
  loadControlCase();
}
