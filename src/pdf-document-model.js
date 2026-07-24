import { CONFIG } from "./config.js";

export const PDF_PAGE_MODES = Object.freeze({
  A4: "a4",
  SHEET_PROPORTIONAL: "sheetProportional",
  CUSTOM: "custom",
});

export const PDF_DOCUMENT_KINDS = Object.freeze({
  SCHEMES: "schemes",
  PRODUCTION_REPORT: "productionReport",
});

const TITLES = Object.freeze({
  ru: { sheet: "ЛИСТ", front: "ЛИЦО", back: "ОБОРОТ" },
  en: { sheet: "SHEET", front: "FRONT", back: "BACK" },
});

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive number`);
  }
  return number;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function requireLanguage(language) {
  if (!CONFIG.app.supportedLanguages.includes(language)) {
    throw new RangeError(`Unsupported language: ${language}`);
  }
  return language;
}

function freezeSize(size) {
  return Object.freeze(size);
}

export function resolvePdfPageSpec({
  mode = CONFIG.pdf.defaultPageMode,
  sheetSize = null,
  customPageSize = null,
} = {}) {
  if (!CONFIG.pdf.supportedPageModes.includes(mode)) {
    throw new RangeError(`Unsupported PDF page mode: ${mode}`);
  }

  if (mode === PDF_PAGE_MODES.A4) {
    return freezeSize({
      mode,
      widthMm: CONFIG.pdf.a4.widthMm,
      heightMm: CONFIG.pdf.a4.heightMm,
      marginMm: CONFIG.pdf.defaultMarginMm,
      fit: "contain",
      preserveAspectRatio: CONFIG.pdf.preserveAspectRatio,
    });
  }

  if (mode === PDF_PAGE_MODES.SHEET_PROPORTIONAL) {
    const widthMm = positiveNumber(sheetSize?.widthMm, "sheetSize.widthMm");
    const heightMm = positiveNumber(sheetSize?.heightMm, "sheetSize.heightMm");
    return freezeSize({
      mode,
      sourceWidthMm: widthMm,
      sourceHeightMm: heightMm,
      aspectRatio: widthMm / heightMm,
      marginMm: CONFIG.pdf.defaultMarginMm,
      fit: "contain",
      preserveAspectRatio: true,
    });
  }

  return freezeSize({
    mode,
    widthMm: positiveNumber(customPageSize?.widthMm, "customPageSize.widthMm"),
    heightMm: positiveNumber(customPageSize?.heightMm, "customPageSize.heightMm"),
    marginMm: CONFIG.pdf.defaultMarginMm,
    fit: "contain",
    preserveAspectRatio: CONFIG.pdf.preserveAspectRatio,
  });
}

function requireLayout(layout, side, recordIndex) {
  if (!layout || layout.side !== side) {
    throw new TypeError(`records[${recordIndex}].${side} must be a ${side} layout`);
  }
  if (!Array.isArray(layout.cells) || layout.cells.length !== layout.rows * layout.columns) {
    throw new RangeError(`records[${recordIndex}].${side} cell count does not match its grid`);
  }
  return layout;
}

function schemeTitle(impositionNumber, side, language) {
  const text = TITLES[language];
  return `${text.sheet}-${impositionNumber}_${text[side]}`;
}

function safePageFileName(impositionNumber, side) {
  const number = String(impositionNumber).padStart(CONFIG.pdf.safeNameDigits, "0");
  return `LIST-${number}_${side.toUpperCase()}.pdf`;
}

function createSchemePage({
  layout,
  impositionNumber,
  side,
  language,
  orderIndex,
  pageSpec,
}) {
  return Object.freeze({
    pageNumber: orderIndex + 1,
    orderIndex,
    kind: "scheme",
    impositionNumber,
    impositionId: String(layout.id),
    side,
    title: schemeTitle(impositionNumber, side, language),
    safeFileName: safePageFileName(impositionNumber, side),
    runLength: positiveInteger(layout.runLength, `layout ${layout.id} runLength`),
    rows: positiveInteger(layout.rows, `layout ${layout.id} rows`),
    columns: positiveInteger(layout.columns, `layout ${layout.id} columns`),
    rotation: Number(layout.rotation),
    pageSpec,
    layout,
  });
}

export function createSchemePdfDocument({
  records,
  language = CONFIG.app.defaultLanguage,
  pageMode = CONFIG.pdf.defaultPageMode,
  sheetSize = null,
  customPageSize = null,
} = {}) {
  requireLanguage(language);
  if (!Array.isArray(records) || records.length === 0) {
    throw new TypeError("records must be a non-empty array");
  }

  const pageSpec = resolvePdfPageSpec({ mode: pageMode, sheetSize, customPageSize });
  const pages = [];
  const impositionIds = new Set();

  records.forEach((record, recordIndex) => {
    if (record?.validation?.valid !== true) {
      throw new Error(`records[${recordIndex}] must contain a validated imposition`);
    }

    const front = requireLayout(record.front, "front", recordIndex);
    const back = requireLayout(record.back, "back", recordIndex);
    if (String(front.id) !== String(back.id)) {
      throw new RangeError(`records[${recordIndex}] front/back ids differ`);
    }
    if (front.rows !== back.rows || front.columns !== back.columns) {
      throw new RangeError(`records[${recordIndex}] front/back grids differ`);
    }
    if (front.runLength !== back.runLength) {
      throw new RangeError(`records[${recordIndex}] front/back run lengths differ`);
    }
    if (impositionIds.has(String(front.id))) {
      throw new RangeError(`Duplicate imposition id: ${front.id}`);
    }
    impositionIds.add(String(front.id));

    const impositionNumber = recordIndex + 1;
    pages.push(createSchemePage({
      layout: front,
      impositionNumber,
      side: "front",
      language,
      orderIndex: pages.length,
      pageSpec,
    }));
    pages.push(createSchemePage({
      layout: back,
      impositionNumber,
      side: "back",
      language,
      orderIndex: pages.length,
      pageSpec,
    }));
  });

  return Object.freeze({
    schemaVersion: 1,
    kind: PDF_DOCUMENT_KINDS.SCHEMES,
    language,
    fileName: CONFIG.pdf.schemeDocumentFileName,
    pageMode,
    pageCount: pages.length,
    impositionCount: records.length,
    oneSchemePerPage: true,
    pages: Object.freeze(pages),
  });
}

export function createProductionReportPdfDocument({
  report,
  language = CONFIG.app.defaultLanguage,
  pageMode = CONFIG.pdf.defaultPageMode,
  customPageSize = null,
} = {}) {
  requireLanguage(language);
  if (!report || report.valid !== true || report.status !== "ready") {
    throw new Error("A production-ready report is required for PDF export");
  }
  if (!Array.isArray(report.fileMetrics) || !Array.isArray(report.pairMetrics)) {
    throw new TypeError("The production report must contain file and pair metrics");
  }

  const pageSpec = resolvePdfPageSpec({
    mode: pageMode,
    customPageSize,
    sheetSize: pageMode === PDF_PAGE_MODES.SHEET_PROPORTIONAL
      ? { widthMm: CONFIG.pdf.a4.widthMm, heightMm: CONFIG.pdf.a4.heightMm }
      : null,
  });

  const sections = Object.freeze([
    Object.freeze({ id: "summary", kind: "summary", totals: report.totals }),
    Object.freeze({ id: "files", kind: "fileTable", rows: report.fileMetrics }),
    Object.freeze({ id: "pairs", kind: "pairTable", rows: report.pairMetrics }),
  ]);

  return Object.freeze({
    schemaVersion: 1,
    kind: PDF_DOCUMENT_KINDS.PRODUCTION_REPORT,
    language,
    fileName: CONFIG.pdf.reportDocumentFileName,
    pageMode,
    pageSpec,
    separateFromSchemeDocument: true,
    sections,
    fileCount: report.fileMetrics.length,
    pairCount: report.pairMetrics.length,
  });
}
