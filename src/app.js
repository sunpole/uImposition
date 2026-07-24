import { CONFIG } from "./config.js";
import { calculateSheetGeometry } from "./geometry.js";
import { ordersToText, parseOrders } from "./orders.js";

const elements = {
  languageButton: document.querySelector("#languageButton"),
  brandVersion: document.querySelectorAll("[data-project-version]"),
  settingsPanel: document.querySelector("#settingsPanel"),
  settingsToggle: document.querySelector("#settingsToggle"),
  sheetPreset: document.querySelector("#sheetPreset"),
  sizeStage: document.querySelector("#sizeStage"),
  sheetWidth: document.querySelector("#sheetWidth"),
  sheetHeight: document.querySelector("#sheetHeight"),
  trimEnabled: document.querySelector("#trimEnabled"),
  trimUniform: document.querySelector("#trimUniform"),
  trimUniformMm: document.querySelector("#trimUniformMm"),
  trimSides: {
    left: document.querySelector("#trimLeft"),
    right: document.querySelector("#trimRight"),
    top: document.querySelector("#trimTop"),
    bottom: document.querySelector("#trimBottom"),
  },
  pressMargins: {
    left: document.querySelector("#marginLeft"),
    right: document.querySelector("#marginRight"),
    top: document.querySelector("#marginTop"),
    bottom: document.querySelector("#marginBottom"),
  },
  stageHint: document.querySelector("#stageHint"),
  sourceResult: document.querySelector("#sourceResult"),
  trimmedResult: document.querySelector("#trimmedResult"),
  printableResult: document.querySelector("#printableResult"),
  trimStatus: document.querySelector("#trimStatus"),
  geometryError: document.querySelector("#geometryError"),
  ordersInput: document.querySelector("#ordersInput"),
  ordersError: document.querySelector("#ordersError"),
  orderCount: document.querySelector("#orderCount"),
  printPairCount: document.querySelector("#printPairCount"),
  totalQuantity: document.querySelector("#totalQuantity"),
  loadControlCase: document.querySelector("#loadControlCase"),
  clearOrders: document.querySelector("#clearOrders"),
  toast: document.querySelector("#toast"),
};

let language = localStorage.getItem(CONFIG.storage.languageKey) || CONFIG.app.defaultLanguage;
if (!CONFIG.app.supportedLanguages.includes(language)) language = CONFIG.app.defaultLanguage;

function t(key) {
  return CONFIG.i18n[language][key] ?? CONFIG.i18n.ru[key] ?? key;
}

function formatMm({ width, height }) {
  return `${width} Ã— ${height} ${CONFIG.app.unit}`;
}

function setToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(setToast.timeout);
  setToast.timeout = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2800);
}

function renderLanguage() {
  document.documentElement.lang = language;
  const customOption = elements.sheetPreset.options[0];
  if (customOption?.value === "custom") customOption.textContent = t("customPreset");
  document.querySelectorAll("[data-lang]").forEach((element) => {
    element.hidden = element.dataset.lang !== language;
  });
  elements.languageButton.textContent = language === "ru" ? "EN" : "RU";
  elements.languageButton.setAttribute("aria-label", language === "ru" ? "Switch to English" : "ÐŸÐµÑ€ÐµÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÑŒ Ð½Ð° Ñ€ÑƒÑÑÐºÐ¸Ð¹");
  localStorage.setItem(CONFIG.storage.languageKey, language);
  renderGeometry();
  renderOrders();
}

async function renderProjectVersion() {
  try {
    const response = await fetch("./VERSION.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`VERSION.json request failed: ${response.status}`);
    const versionData = await response.json();
    if (typeof versionData.version !== "string" || !versionData.version.trim()) {
      throw new Error("VERSION.json contains no valid version");
    }
    elements.brandVersion.forEach((element) => {
      element.textContent = versionData.version;
    });
    document.title = `${CONFIG.app.name} Â· v${versionData.version}`;
  } catch (error) {
    console.warn("Could not load VERSION.json; HTML fallback remains visible.", error);
  }
}

function populatePresets() {
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = t("customPreset");
  elements.sheetPreset.append(customOption);

  CONFIG.sheetPresets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = `${preset.label} ${CONFIG.app.unit}`;
    elements.sheetPreset.append(option);
  });
}

function applyDefaults() {
  elements.sheetPreset.value = CONFIG.defaults.sheetPresetId;
  elements.sheetWidth.value = CONFIG.defaults.sheetWidth;
  elements.sheetHeight.value = CONFIG.defaults.sheetHeight;
  elements.sizeStage.value = CONFIG.defaults.sizeStage;
  elements.trimEnabled.checked = CONFIG.defaults.trimEnabled;
  elements.trimUniform.checked = CONFIG.defaults.trimUniform;
  elements.trimUniformMm.value = CONFIG.defaults.trimUniformMm;

  for (const side of Object.keys(elements.trimSides)) {
    elements.trimSides[side].value = CONFIG.defaults.trimSidesMm[side];
    elements.pressMargins[side].value = CONFIG.defaults.pressMarginsMm[side];
  }

  elements.ordersInput.value = CONFIG.defaults.ordersText;
  syncTrimControls();
}

function selectedPreset() {
  return CONFIG.sheetPresets.find((preset) => preset.id === elements.sheetPreset.value) ?? null;
}

function applyPreset() {
  const preset = selectedPreset();
  if (!preset) return;
  elements.sheetWidth.value = preset.width;
  elements.sheetHeight.value = preset.height;
  elements.sizeStage.value = preset.sizeStage;
  renderGeometry();
}

function syncTrimControls() {
  const disabled = !elements.trimEnabled.checked || elements.sizeStage.value === "afterTrim";
  elements.trimUniformMm.disabled = disabled || !elements.trimUniform.checked;
  Object.values(elements.trimSides).forEach((input) => {
    input.disabled = disabled || elements.trimUniform.checked;
  });
}

function trimSidesFromForm() {
  if (elements.trimUniform.checked) {
    const value = elements.trimUniformMm.value;
    return { left: value, right: value, top: value, bottom: value };
  }
  return Object.fromEntries(
    Object.entries(elements.trimSides).map(([side, input]) => [side, input.value]),
  );
}

function marginsFromForm() {
  return Object.fromEntries(
    Object.entries(elements.pressMargins).map(([side, input]) => [side, input.value]),
  );
}

function readGeometryInput() {
  return {
    width: elements.sheetWidth.value,
    height: elements.sheetHeight.value,
    sizeStage: elements.sizeStage.value,
    trim: {
      enabled: elements.trimEnabled.checked,
      sides: trimSidesFromForm(),
    },
    pressMargins: marginsFromForm(),
    limits: CONFIG.limits,
  };
}

function renderGeometry() {
  syncTrimControls();
  elements.stageHint.textContent =
    elements.sizeStage.value === "afterTrim" ? t("stageAfterTrimHint") : t("stageBeforeTrimHint");

  try {
    const result = calculateSheetGeometry(readGeometryInput());
    elements.sourceResult.textContent = formatMm(result.source);
    elements.trimmedResult.textContent = formatMm(result.trimmed);
    elements.printableResult.textContent = formatMm(result.printable);
    elements.trimStatus.textContent = result.trimApplied
      ? language === "ru"
        ? "Ð—Ð°Ñ‡Ð¸ÑÑ‚ÐºÐ° Ð¿Ñ€Ð¸Ð¼ÐµÐ½ÐµÐ½Ð°"
        : "Sheet trim applied"
      : language === "ru"
        ? "Ð—Ð°Ñ‡Ð¸ÑÑ‚ÐºÐ° Ð½Ðµ Ð²Ñ‹Ñ‡Ð¸Ñ‚Ð°Ð»Ð°ÑÑŒ Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€Ð½Ð¾"
        : "No duplicate trim reduction";
    elements.geometryError.hidden = true;
    document.querySelector("#geometryResults").classList.remove("has-error");
  } catch (error) {
    elements.geometryError.textContent = `${t("invalidInput")}: ${error.message}`;
    elements.geometryError.hidden = false;
    document.querySelector("#geometryResults").classList.add("has-error");
  }
}

function renderOrders() {
  const result = parseOrders(elements.ordersInput.value, CONFIG.limits);
  elements.orderCount.textContent = result.summary.orderCount.toLocaleString(language);
  elements.printPairCount.textContent = result.summary.printPairCount.toLocaleString(language);
  elements.totalQuantity.textContent = result.summary.totalQuantity.toLocaleString(language);

  if (result.errors.length === 0) {
    elements.ordersError.hidden = true;
    elements.ordersInput.removeAttribute("aria-invalid");
  } else {
    elements.ordersError.textContent = result.errors
      .slice(0, 5)
      .map((error) => `${language === "ru" ? "Ð¡Ñ‚Ñ€Ð¾ÐºÐ°" : "Line"} ${error.line}: ${error.message}`)
      .join("\n");
    elements.ordersError.hidden = false;
    elements.ordersInput.setAttribute("aria-invalid", "true");
  }
}

async function loadControlCase() {
  try {
    const response = await fetch(CONFIG.demo.controlCaseUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(R	Ü™\ÜÛœÙKœÝ]\ßX
NÂˆÛÛœÝ]HH]ØZ]™\ÜÛœÙKšœÛÛŠ
NÂ‚ˆ[[Y[ËœÚY]™\Ù]˜[YHH˜Ý\ÝÛHŽÂˆ[[Y[ËœÚY]ÚY˜[YHH]KœÚY]ÚYÂˆ[[Y[ËœÚY]ZYÚ˜[YHH]KœÚY]šZYÚÂˆ[[Y[ËœÚ^™TÝYÙK˜[YHH]KœÚY]œÚ^™TÝYÙNÂˆ[[Y[Ëš[Q[˜X›Y˜ÚXÚÙYH]KœÚY]š[K™[˜X›YÂˆ[[Y[Ëš[U[šY›Ü›K˜ÚXÚÙYBˆ]KœÚY]š[K›YOOH]KœÚY]š[KœšYÚ	‰‚ˆ]KœÚY]š[K›YOOH]KœÚY]š[KÜ	‰‚ˆ]KœÚY]š[K›YOOH]KœÚY]š[K˜›ÝÛNÂˆ[[Y[Ëš[U[šY›Ü›S[K˜[YHH]KœÚY]š[K›YÂ‚ˆ›Üˆ
ÛÛœÝÚYHÙˆØš™XÝšÙ^\Ê[[Y[Ëš[TÚY\ÊJHÂˆ[[Y[Ëš[TÚY\ÖÜÚYWK˜[YHH]KœÚY]š[VÜÚYWNÂˆ[[Y[Ëœ™\ÜÓX\™Ú[œÖÜÚYWK˜[YHH]KœÚY]œ™\ÜÓX\™Ú[œÖÜÚYWNÂˆB‚ˆ[[Y[Ë›Ü™\œÒ[œ]˜[YHHÜ™\œÕÕ^
]K›Ü™\œÊNÂˆ™[™\‘Ù[ÛY]žJ
NÂˆ™[™\“Ü™\œÊ
NÂˆÙ]Ø\Ý

›ØYYÛÛ›ÛØ\ÙHŠJNÂˆHØ]Ú
\œ›ÜŠHÂˆÛÛœÛÛK™\œ›ÜŠ\œ›ÜŠNÂˆÙ]Ø\Ý

›ØY˜Z[YŠJNÂˆBŸB‚™[˜Ý[Ûˆ]XÚ\Ý[™\œÊ
HÂˆ[[Y[Ë›[™ÝXYÙP]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂˆ[™ÝXYÙHH[™ÝXYÙHOOHœHˆÈ™[ˆˆˆœHŽÂˆ™[™\“[™ÝXYÙJ
NÂˆJNÂ‚ˆ[[Y[ËœÙ][™ÜÕÙÙÛK˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂˆ[[Y[ËœÙ][™ÜÔ[™[˜Û\ÜÓ\ÝÙÙÛJš\ËXÛÛ\ÙYŠNÂˆÛÛœÝÛÛ\ÙYH[[Y[ËœÙ][™ÜÔ[™[˜Û\ÜÓ\Ý˜ÛÛZ[œÊš\ËXÛÛ\ÙYŠNÂˆ[[Y[ËœÙ][™ÜÕÙÙÛKœÙ]]šX]J˜\šXKY^[™Y‹Ýš[™ÊXÛÛ\ÙY
JNÂˆJNÂ‚ˆ[[Y[ËœÚY]™\Ù]˜Y]™[\Ý[™\Š˜Ú[™ÙH‹\T™\Ù]
NÂˆ[[Y[ËœÚ^™TÝYÙK˜Y]™[\Ý[™\Š˜Ú[™ÙH‹™[™\‘Ù[ÛY]žJNÂˆ[[Y[Ëš[Q[˜X›Y˜Y]™[\Ý[™\Š˜Ú[™ÙH‹™[™\‘Ù[ÛY]žJNÂˆ[[Y[Ëš[U[šY›Ü›K˜Y]™[\Ý[™\Š˜Ú[™ÙH‹™[™\‘Ù[ÛY]žJNÂ‚ˆÂˆ[[Y[ËœÚY]ÚYˆ[[Y[ËœÚY]ZYÚˆ[[Y[Ëš[U[šY›Ü›S[Kˆ‹‹“Øš™XÝ˜[Y\Ê[[Y[Ëš[TÚY\ÊKˆ‹‹“Øš™XÝ˜[Y\Ê[[Y[Ëœ™\ÜÓX\™Ú[œÊKˆK™›Ü‘XXÚ

[œ]
HOˆ[œ]˜Y]™[\Ý[™\Šš[œ]‹™[™\‘Ù[ÛY]žJJNÂ‚ˆ[[Y[Ë›Ü™\œÒ[œ]˜Y]™[\Ý[™\Šš[œ]‹™[™\“Ü™\œÊNÂˆ[[Y[Ë›ØYÛÛ›ÛØ\ÙK˜Y]™[\Ý[™\Š˜ÛXÚÈ‹ØYÛÛ›ÛØ\ÙJNÂˆ[[Y[Ë˜ÛX\“Ü™\œË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂˆ[[Y[Ë›Ü™\œÒ[œ]˜[YHHˆŽÂˆ™[™\“Ü™\œÊ
NÂˆJNÂŸB‚œÜ[]T™\Ù]Ê
NÂ˜\QY˜][Ê
NÂ˜]XÚ\Ý[™\œÊ
NÂœ™[™\“[™ÝXYÙJ
NÂœ™[™\”›Ú™XÝ™\œÚ[ÛŠ
NÂ‚˜ÛÛœÝ]Y\žHH™]ÈT“ÙX\˜Ú\˜[\ÊÚ[™ÝË›ØØ][Û‹œÙX\˜Ú
NÂšYˆ
]Y\žK™Ù]
ÓÓ‘’QË™[[Ëœ]Y\žT\˜[Y]\ŠHOOH˜ÛÛ›ÛŠHÂˆØYÛÛ›ÛØ\ÙJ
NÂŸB