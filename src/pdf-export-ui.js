import { CONFIG } from "./config.js";
import {
  PDF_PAGE_MODES,
  createSchemePdfDocument,
} from "./pdf-document-model.js";
import {
  downloadPdfBytes,
  renderSchemePdfBytes,
} from "./pdf-scheme-renderer.js";

const TEXT = Object.freeze({
  ru: {
    title: "Экспорт схем в PDF",
    intro: "Каждая проверенная схема будет помещена на отдельную страницу в порядке лицо → оборот.",
    pageMode: "Режим страницы",
    a4: "Вписать в A4",
    proportional: "Сохранить пропорции листа",
    custom: "Пользовательский формат",
    width: "Ширина, мм",
    height: "Высота, мм",
    export: "Скачать PDF схем",
    waiting: "Сначала загрузите контрольный заказ",
    ready: "Готово к экспорту: 8 страниц",
    building: "Создание PDF…",
    complete: "PDF создан: 8 страниц",
    failed: "Не удалось создать PDF",
    note: "Производственный отчёт будет отдельным PDF и не добавляется девятой страницей.",
  },
  en: {
    title: "Export schemes to PDF",
    intro: "Every validated scheme is placed on its own page in front → back order.",
    pageMode: "Page mode",
    a4: "Fit to A4",
    proportional: "Preserve sheet proportions",
    custom: "Custom page size",
    width: "Width, mm",
    height: "Height, mm",
    export: "Download scheme PDF",
    waiting: "Load the control dataset first",
    ready: "Ready to export: 8 pages",
    building: "Building PDF…",
    complete: "PDF created: 8 pages",
    failed: "Could not create PDF",
    note: "The production report remains a separate PDF and is not added as a ninth page.",
  },
});

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createPanel(anchor) {
  if (!(anchor instanceof Element)) throw new TypeError("A PDF export anchor element is required");
  const existing = document.querySelector("#pdfExportPanel");
  if (existing) return existing;

  const panel = createElement("section", "panel pdf-export-panel");
  panel.id = "pdfExportPanel";
  anchor.after(panel);
  return panel;
}

function numberInput(id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "number";
  input.min = "1";
  input.max = String(CONFIG.limits.maxDimensionMm);
  input.step = String(CONFIG.limits.decimalStepMm);
  return input;
}

export function createPdfExportController({
  anchor,
  getRecords,
  getSheetSize,
  getLanguage,
}) {
  if (typeof getRecords !== "function" || typeof getSheetSize !== "function" || typeof getLanguage !== "function") {
    throw new TypeError("PDF export controller requires record, sheet-size, and language getters");
  }

  const panel = createPanel(anchor);
  const ui = {
    mode: document.createElement("select"),
    customWrap: createElement("div", "field-grid pdf-custom-size"),
    width: numberInput("pdfCustomWidth"),
    height: numberInput("pdfCustomHeight"),
    exportButton: createElement("button", "button", ""),
    status: createElement("span", "status-chip", ""),
  };
  ui.mode.id = "pdfPageMode";
  ui.exportButton.id = "exportSchemesPdf";
  ui.exportButton.type = "button";
  ui.status.id = "pdfExportStatus";

  ui.width.value = "320";
  ui.height.value = "220";

  const optionValues = [
    PDF_PAGE_MODES.A4,
    PDF_PAGE_MODES.SHEET_PROPORTIONAL,
    PDF_PAGE_MODES.CUSTOM,
  ];
  optionValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    ui.mode.append(option);
  });

  const render = () => {
    const language = getLanguage();
    const text = TEXT[language] ?? TEXT.ru;
    const records = getRecords();
    panel.replaceChildren();

    const heading = createElement("div", "section-heading");
    const headingText = createElement("div");
    headingText.append(
      createElement("p", "section-kicker", "M5"),
      createElement("h2", "", text.title),
    );
    heading.append(headingText, ui.status);

    const modeLabel = createElement("label", "field");
    modeLabel.append(createElement("span", "", text.pageMode), ui.mode);
    [...ui.mode.options].forEach((option, index) => {
      option.textContent = [text.a4, text.proportional, text.custom][index];
    });

    const widthLabel = createElement("label", "field");
    widthLabel.append(createElement("span", "", text.width), ui.width);
    const heightLabel = createElement("label", "field");
    heightLabel.append(createElement("span", "", text.height), ui.height);
    ui.customWrap.replaceChildren(widthLabel, heightLabel);
    ui.customWrap.hidden = ui.mode.value !== PDF_PAGE_MODES.CUSTOM;

    ui.exportButton.textContent = text.export;
    ui.exportButton.disabled = !Array.isArray(records) || records.length === 0;
    ui.status.textContent = ui.exportButton.disabled ? text.waiting : text.ready;

    const controls = createElement("div", "pdf-export-controls");
    controls.append(modeLabel, ui.customWrap, ui.exportButton);
    const note = createElement("div", "formula-card");
    note.append(createElement("p", "", text.note));

    panel.append(heading, createElement("p", "", text.intro), controls, note);
  };

  ui.mode.addEventListener("change", render);
  ui.exportButton.addEventListener("click", async () => {
    const language = getLanguage();
    const text = TEXT[language] ?? TEXT.ru;
    const records = getRecords();
    if (!Array.isArray(records) || records.length === 0) {
      render();
      return;
    }

    ui.exportButton.disabled = true;
    ui.status.textContent = text.building;
    try {
      const mode = ui.mode.value;
      const sheetSize = getSheetSize();
      const customPageSize = mode === PDF_PAGE_MODES.CUSTOM
        ? { widthMm: Number(ui.width.value), heightMm: Number(ui.height.value) }
        : null;
      const documentModel = createSchemePdfDocument({
        records,
        language,
        pageMode: mode,
        sheetSize,
        customPageSize,
      });
      const bytes = await renderSchemePdfBytes(documentModel);
      downloadPdfBytes(bytes, documentModel.fileName);
      ui.status.textContent = text.complete;
    } catch (error) {
      console.error(error);
      ui.status.textContent = `${text.failed}: ${error.message}`;
    } finally {
      ui.exportButton.disabled = false;
    }
  });

  render();
  return Object.freeze({
    panel,
    sync: render,
  });
}
