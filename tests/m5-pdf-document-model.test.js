import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPagePairs } from "../src/orders.js";
import { createFrontLayout } from "../src/front-layout.js";
import { createBackLayout } from "../src/back-layout.js";
import { validateImposition } from "../src/imposition-validation.js";
import { buildProductionReport } from "../src/production-report.js";
import {
  PDF_DOCUMENT_KINDS,
  PDF_PAGE_MODES,
  createProductionReportPdfDocument,
  createSchemePdfDocument,
  resolvePdfPageSpec,
} from "../src/pdf-document-model.js";

const controlCase = JSON.parse(
  readFileSync(new URL("../data/control-case.json", import.meta.url), "utf8"),
);
const controlLayout = JSON.parse(
  readFileSync(new URL("../data/control-layout-m3.json", import.meta.url), "utf8"),
);
const pagePairs = expandPagePairs(controlCase.orders);

function buildRecords() {
  return controlLayout.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    return { front, back, validation };
  });
}

function buildReport(records = buildRecords()) {
  return buildProductionReport({
    pagePairs,
    impositions: records,
    duplexMode: controlCase.duplexMode,
  });
}

test("four impositions create exactly eight scheme pages in required order", () => {
  const document = createSchemePdfDocument({ records: buildRecords(), language: "ru" });

  assert.equal(document.kind, PDF_DOCUMENT_KINDS.SCHEMES);
  assert.equal(document.fileName, "uImposition-schemes.pdf");
  assert.equal(document.pageCount, 8);
  assert.equal(document.impositionCount, 4);
  assert.equal(document.oneSchemePerPage, true);
  assert.deepEqual(document.pages.map((page) => page.title), [
    "ЛИСТ-1_ЛИЦО",
    "ЛИСТ-1_ОБОРОТ",
    "ЛИСТ-2_ЛИЦО",
    "ЛИСТ-2_ОБОРОТ",
    "ЛИСТ-3_ЛИЦО",
    "ЛИСТ-3_ОБОРОТ",
    "ЛИСТ-4_ЛИЦО",
    "ЛИСТ-4_ОБОРОТ",
  ]);
  assert.deepEqual(document.pages.map((page) => page.safeFileName), [
    "LIST-01_FRONT.pdf",
    "LIST-01_BACK.pdf",
    "LIST-02_FRONT.pdf",
    "LIST-02_BACK.pdf",
    "LIST-03_FRONT.pdf",
    "LIST-03_BACK.pdf",
    "LIST-04_FRONT.pdf",
    "LIST-04_BACK.pdf",
  ]);
  assert.deepEqual(document.pages.map((page) => page.pageNumber), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(document.pages.every((page) => page.kind === "scheme" && page.layout.cells.length === 16));
  assert.ok(Object.isFrozen(document));
  assert.ok(Object.isFrozen(document.pages));
  assert.ok(document.pages.every(Object.isFrozen));
});

test("English titles preserve the same deterministic page order", () => {
  const document = createSchemePdfDocument({ records: buildRecords(), language: "en" });
  assert.deepEqual(document.pages.slice(0, 4).map((page) => page.title), [
    "SHEET-1_FRONT",
    "SHEET-1_BACK",
    "SHEET-2_FRONT",
    "SHEET-2_BACK",
  ]);
});

test("A4, proportional, and custom page modes remain explicit", () => {
  assert.deepEqual(resolvePdfPageSpec({ mode: PDF_PAGE_MODES.A4 }), {
    mode: "a4",
    widthMm: 210,
    heightMm: 297,
    marginMm: 10,
    fit: "contain",
    preserveAspectRatio: true,
  });

  const proportional = resolvePdfPageSpec({
    mode: PDF_PAGE_MODES.SHEET_PROPORTIONAL,
    sheetSize: { widthMm: 616, heightMm: 446 },
  });
  assert.equal(proportional.sourceWidthMm, 616);
  assert.equal(proportional.sourceHeightMm, 446);
  assert.equal(proportional.aspectRatio, 616 / 446);
  assert.equal(proportional.preserveAspectRatio, true);
  assert.equal("widthMm" in proportional, false);

  assert.deepEqual(resolvePdfPageSpec({
    mode: PDF_PAGE_MODES.CUSTOM,
    customPageSize: { widthMm: 320, heightMm: 220 },
  }), {
    mode: "custom",
    widthMm: 320,
    heightMm: 220,
    marginMm: 10,
    fit: "contain",
    preserveAspectRatio: true,
  });
});

test("invalid page modes and dimensions are rejected", () => {
  assert.throws(() => resolvePdfPageSpec({ mode: "letter" }), /Unsupported PDF page mode/);
  assert.throws(
    () => resolvePdfPageSpec({ mode: PDF_PAGE_MODES.SHEET_PROPORTIONAL }),
    /sheetSize.widthMm/,
  );
  assert.throws(
    () => resolvePdfPageSpec({
      mode: PDF_PAGE_MODES.CUSTOM,
      customPageSize: { widthMm: 0, heightMm: 200 },
    }),
    /customPageSize.widthMm/,
  );
});

test("damaged or unvalidated impositions cannot enter the PDF model", () => {
  const records = buildRecords();
  assert.throws(
    () => createSchemePdfDocument({
      records: [{ ...records[0], validation: { valid: false } }, ...records.slice(1)],
    }),
    /validated imposition/,
  );
  assert.throws(
    () => createSchemePdfDocument({
      records: [{ ...records[0], back: { ...records[0].back, id: "OTHER" } }, ...records.slice(1)],
    }),
    /front\/back ids differ/,
  );
});

test("production report becomes a separate document model", () => {
  const reportDocument = createProductionReportPdfDocument({ report: buildReport(), language: "ru" });

  assert.equal(reportDocument.kind, PDF_DOCUMENT_KINDS.PRODUCTION_REPORT);
  assert.equal(reportDocument.fileName, "uImposition-production-report.pdf");
  assert.equal(reportDocument.separateFromSchemeDocument, true);
  assert.equal(reportDocument.fileCount, 20);
  assert.equal(reportDocument.pairCount, 35);
  assert.deepEqual(reportDocument.sections.map((section) => section.kind), [
    "summary",
    "fileTable",
    "pairTable",
  ]);
  assert.equal(reportDocument.sections[0].totals.physicalSheets, 3395);
  assert.equal(reportDocument.sections[1].rows.length, 20);
  assert.equal(reportDocument.sections[2].rows.length, 35);
});

test("an invalid production report cannot be exported", () => {
  const report = buildReport();
  assert.throws(
    () => createProductionReportPdfDocument({ report: { ...report, valid: false, status: "invalid" } }),
    /production-ready report/,
  );
});
