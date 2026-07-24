import { CONFIG } from "./config.js";
import {
  PDF_PAGE_MODES,
  createProductionReportPdfDocument,
  createSchemePdfDocument,
} from "./pdf-document-model.js";
import {
  downloadPdfBytes,
  renderSchemePdfBytes,
} from "./pdf-scheme-renderer.js";
import { renderProductionReportPdfBytes } from "./pdf-report-renderer.js";

const TEXT = Object.freeze({
  ru: {
    title: "Экспорт в PDF",
    intro: "Схемы и производственный отчёт создаются как два независимых документа.",
    pageMode: "Режим страниц схем",
    a4: "Вписать в A4",
    proportional: "Сохранить пропорции листа",
    custom: "Пользовательский формат",
    width: "Ширина, мм",
    height: "Высота, мм",
    exportSchemes: "Скачать PDF схем",
    exportReport: "Скачать PDF отчёта (A4)",
    waiting: "Сначала загрузите контрольный заказ",
    ready: "Готово: схемы 8 стр. · отчёт 6 стр.",
    buildingSchemes: "Создание PDF схем…",
    buildingReport: "Создание PDF отчёта…",
    schemesComplete: "PDF схем создан: 8 страниц",
    reportComplete: "PDF отчёта создан: 6 страниц",
    failed: "Не удалось создать PDF",
    note: "Основной PDF содержит ровно восемь схем — по одной на страницу. Производственный отчёт формируется отдельным шестистраничным PDF формата A4.",
  },
  en: {
    title: "PDF export",
    intro: "Scheme pages and the production report are generated as two independent documents.",
    pageMode: "Scheme page mode",
    a4: "Fit to A4",
    proportional: "Preserve sheet proportions",
    custom: "Custom page size",
    width: "Width, mm",
    height: "Height, mm",
    exportSchemes: "Download scheme PDF",
    exportReport: "Download report PDF (A4)",
    waiting: "Load the control dataset first",
    ready: "Ready: 8 scheme pages · 6 report pages",
    buildingSchemes: "Building scheme PDF…",
    buildingReport: "Building report PDF…",
    schemesComplete: "Scheme PDF created: 8 pages",
    reportComplete: "Report PDF created: 6 pages",
    failed: "Could not create PDF",
    note: "The primary PDF contains exactly eight schemes, one per page. The production report is a separate six-page A4 PDF.",
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
  getReport,
  getSheetSize,
  getLanguage,
}) {
  if (
    typeof getRecords !== "function"
    || typeof getReport !== "function"
    || typeof getSheetSize !== "function"
    || typeof getLanguage !== "function"
  ) {
    throw new TypeError("PDF export controller requires record, report, sheet-size, and language getters");
  }

  const panel = createPanel(anchor);
  const ui = {
    mode: document.createElement("select"),
    customWrap: createElement("div", "field-grid pdf-custom-size"),
    width: numberInput("pdfCustomWidth"),
    height: numberInput("pdfCustomHeight"),
    schemeButton: createElement("button", "button", ""),
    reportButton: createElement("button", "button button--quiet", ""),
    status: createElement("span", "status-chip", ""),
  };
  ui.mode.id = "pdfPageMode";
  ui.schemeButton.id = "exportSchemesPdf";
  ui.schemeButton.type = "button";
  ui.reportButton.id = "exportReportPdf";
  ui.reportButton.type = "button";
  ui.status.id = "pdfExportStatus";

  ui.width.value = "320";
  ui.height.value = "220";

  [PDF_PAGE_MODES.A4, PDF_PAGE_MODES.SHEET_PROPORTIONAL, PDF_PAGE_MODES.CUSTOM]
    .forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      ui.mode.append(option);
    });

  const setBusy = (busy) => {
    ui.schemeButton.disabled = busy || !Array.isArray(getRecords()) || getRecords().length === 0;
    ui.reportButton.disabled = busy || getReport()?.valid !== true;
  };

  const render = () => {
    const language = getLanguage();
    const text = TEXT[language] ?? TEXT.ru;
    const records = getRecords();
    const report = getReport();
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

    ui.schemeButton.textContent = text.exportSchemes;
    ui.reportButton.textContent = text.exportReport;
    const ready = Array.isArray(records) && records.length > 0 && report?.valid === true;
    setBusy(false);
    ui.status.textContent = ready ? text.ready : text.waiting;

    const actions = createElement("div", "pdf-export-actions");
    actions.append(ui.schemeButton, ui.reportButton);
    const controls = createElement("div", "pdf-export-controls");
    controls.append(modeLabel, ui.customWrap, actions);
    const note = createElement("div", "formula-card");
    note.append(createElement("p", "", text.note));

    panel.append(heading, createElement("p", "", text.intro), controls, note);
  };

  ui.mode.addEventListener("change", render);
  ui.schemeButton.addEventListener("click", async () => {
    const language = getLanguage();
    const text = TEXT[language] ?? TEXT.ru;
    const records = getRecords();
    if (!Array.isArray(records) || records.length === 0) {
      render();
      return;
    }

    setBusy(true);
    ui.status.textContent = text.buildingSchemes;
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
      ui.status.textContent = text.schemesComplete;
    } catch (error) {
      console.error(error);
      ui.status.textContent = `${text.failed}: ${error.message}`;
    } finally {
      setBusy(false);
    }
  });

  ui.reportButton.addEventListener("click", async () => {
    const language = getLanguage();
    const text = TEXT[language] ?? TEXT.ru;
    const report = getReport();
    if (report?.valid !== true) {
      render();
      return;
    }

    setBusy(true);
    ui.status.textContent = text.buildingReport;
    try {
      const documentModel = createProductionReportPdfDocument({
        report,
        language,
        pageMode: PDF_PAGE_MODES.A4,
      });
      const bytes = await renderProductionReportPdfBytes(documentModel);
      downloadPdfBytes(bytes, documentModel.fileName);
      ui.status.textContent = text.reportComplete;
    } catch (error) {
      console.error(error);
      ui.status.textContent = `${text.failed}: ${error.message}`;
    } finally {
      setBusy(false);
    }
  });

  render();
  return Object.freeze({ panel, sync: render });
}
