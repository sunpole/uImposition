import {
  replaceApplicationInput,
  setApplicationActiveScreen,
} from "../src/application-state.js";
import { addApplicationProductRow } from "../src/application-product-rows.js";
import { createApplicationStateRepository } from "../src/local-state-repository.js";
import { parseProductRowsTxt } from "../src/product-row-txt.js";
import {
  createSimpleProductRowsTxtTemplate,
  looksLikeExtendedProductRowsTxt,
  parseSimpleProductRowsTxt,
} from "../src/simple-product-row-txt.js";

const addButton = document.querySelector("#addProductButton");
const heading = addButton?.parentElement ?? null;
const repository = createApplicationStateRepository({ storage: window.localStorage });
const CONTROL_REFERENCE_KEY = "uImposition.controlReference.active.2026-08-01";

function downloadText(text, fileName) {
  const blob = new Blob([`\uFEFF${text}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function issueSummary(issues) {
  return issues.slice(0, 8).map(({ line, field, message }) => (
    `Строка ${line}, ${field}: ${message}`
  )).join("\n");
}

function fallbackBaseRow() {
  return {
    finished: { widthMm: 105, heightMm: 148 },
    print: {
      mode: "duplex",
      frontColors: 4,
      backColors: 4,
      duplexPreference: "auto",
    },
    bleed: {
      mode: "uniform",
      uniformMm: 0,
      sidesMm: { left: 0, right: 0, top: 0, bottom: 0 },
    },
    cut: { mode: "commonCut", gapMm: 0 },
    rotationPolicy: "auto",
  };
}

function currentBaseRow() {
  const rows = repository.load()?.input?.products ?? [];
  return rows.find(({ enabled }) => enabled !== false) ?? rows[0] ?? fallbackBaseRow();
}

function parseImportText(text) {
  return looksLikeExtendedProductRowsTxt(text)
    ? parseProductRowsTxt(text)
    : parseSimpleProductRowsTxt(text, { baseRow: currentBaseRow() });
}

function buildImportedState(rows, {
  inputPatch = null,
  activeScreen = null,
} = {}) {
  const loaded = repository.load();
  if (!loaded) throw new Error("Текущий проект не найден в локальном хранилище.");
  let next = replaceApplicationInput(loaded, {
    ...loaded.input,
    ...(inputPatch ?? {}),
    products: [],
  });
  rows.forEach((row) => {
    next = addApplicationProductRow(next, row);
  });
  if (activeScreen) next = setApplicationActiveScreen(next, activeScreen);
  return next;
}

function applyRows(rows, status, message, options = {}) {
  repository.save(buildImportedState(rows, options));
  if (options.controlReference) {
    window.localStorage.setItem(CONTROL_REFERENCE_KEY, "1");
  } else {
    window.localStorage.removeItem(CONTROL_REFERENCE_KEY);
  }
  status.hidden = false;
  status.textContent = `${message} Обновляем рабочий экран…`;
  window.setTimeout(() => window.location.reload(), 80);
}

async function importFile(file, status) {
  if (!file) return;
  status.hidden = false;
  status.textContent = "Проверяем TXT…";
  try {
    const result = parseImportText(await file.text());
    if (!result.valid) {
      status.textContent = `TXT не применён.\n${issueSummary(result.issues)}`;
      return;
    }
    applyRows(result.rows, status, `Импортировано строк: ${result.rows.length}.`);
  } catch (error) {
    status.textContent = `TXT не применён: ${error.message}`;
  }
}

function controlCaseRows(controlCase) {
  return controlCase.orders.map((order) => ({
    name: String(order.file),
    sourceFileName: null,
    finished: {
      widthMm: order.width ?? controlCase.product.width,
      heightMm: order.height ?? controlCase.product.height,
    },
    quantityPerVariant: order.quantity,
    variantCount: 1,
    pages: order.pages,
    print: {
      mode: "duplex",
      frontColors: 1,
      backColors: 1,
      duplexPreference: "separateFrontBackForms",
    },
    bleed: {
      mode: "uniform",
      uniformMm: order.bleed ?? 0,
      sidesMm: {
        left: order.bleed ?? 0,
        right: order.bleed ?? 0,
        top: order.bleed ?? 0,
        bottom: order.bleed ?? 0,
      },
    },
    cut: (order.bleed ?? 0) === 0
      ? { mode: "commonCut", gapMm: 0 }
      : { mode: "separated", gapMm: 0 },
    rotationPolicy: "auto",
    notes: "Старый контрольный заказ M3 · чёрно-белый 1+1",
  }));
}

function controlCaseInput(controlCase) {
  const trim = controlCase.sheet.trim;
  return {
    selectedSheetPressPresetId: null,
    sheet: {
      width: controlCase.sheet.width,
      height: controlCase.sheet.height,
      sizeStage: controlCase.sheet.sizeStage,
      trim: {
        enabled: trim.enabled,
        mode: "sides",
        uniformMm: 0,
        sidesMm: {
          left: trim.left,
          right: trim.right,
          top: trim.top,
          bottom: trim.bottom,
        },
      },
    },
    press: {
      marginsMm: { ...controlCase.sheet.pressMargins },
    },
  };
}

async function loadControlCase(status) {
  status.hidden = false;
  status.textContent = "Загружаем старый контрольный заказ 1+1…";
  try {
    const response = await fetch("../data/control-case.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const controlCase = await response.json();
    const rows = controlCaseRows(controlCase);
    applyRows(rows, status, "Загружен точный старый пример: 20 файлов A6, 1+1, эталон 4 лица + 4 оборота.", {
      inputPatch: controlCaseInput(controlCase),
      activeScreen: "layout",
      controlReference: true,
    });
  } catch (error) {
    status.textContent = `Пример не загружен: ${error.message}`;
  }
}

function installControls() {
  if (!heading || document.querySelector("[data-txt-import-controls]")) return;

  const controls = document.createElement("div");
  controls.dataset.txtImportControls = "true";
  controls.className = "product-import-actions";

  const exampleButton = document.createElement("button");
  exampleButton.type = "button";
  exampleButton.className = "button button--quiet";
  exampleButton.textContent = "Тест: 20 файлов · 1+1";
  exampleButton.title = "Точный старый контрольный заказ из data/control-case.json и data/control-layout-m3.json";

  const templateButton = document.createElement("button");
  templateButton.type = "button";
  templateButton.className = "button button--quiet";
  templateButton.textContent = "Шаблон TXT";
  templateButton.title = "Простой формат: название;тираж;страницы;виды";
  templateButton.addEventListener("click", () => {
    downloadText(createSimpleProductRowsTxtTemplate(), "uImposition-simple-products.txt");
  });

  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.className = "button";
  importButton.textContent = "Импорт TXT";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".txt,text/plain";
  fileInput.hidden = true;

  const status = document.createElement("pre");
  status.className = "txt-import-status";
  status.hidden = true;
  status.setAttribute("aria-live", "polite");

  exampleButton.addEventListener("click", () => loadControlCase(status));
  fileInput.addEventListener("change", () => importFile(fileInput.files?.[0], status));
  importButton.addEventListener("click", () => fileInput.click());

  controls.append(exampleButton, templateButton, importButton, addButton, fileInput);
  heading.append(controls, status);
}

installControls();

window.__uimpositionR3TxtImport = Object.freeze({
  parse: parseImportText,
  template: createSimpleProductRowsTxtTemplate,
  importText(text) {
    const result = parseImportText(text);
    if (!result.valid) return result;
    repository.save(buildImportedState(result.rows));
    window.localStorage.removeItem(CONTROL_REFERENCE_KEY);
    return result;
  },
  loadControlCase: async () => {
    const response = await fetch("../data/control-case.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const controlCase = await response.json();
    const rows = controlCaseRows(controlCase);
    repository.save(buildImportedState(rows, {
      inputPatch: controlCaseInput(controlCase),
      activeScreen: "layout",
    }));
    window.localStorage.setItem(CONTROL_REFERENCE_KEY, "1");
    return rows;
  },
});
