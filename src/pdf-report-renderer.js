import { CONFIG } from "./config.js";
import { PDF_DOCUMENT_KINDS } from "./pdf-document-model.js";
import { createPdfFromJpegPages } from "./pdf-binary.js";
import { resolveRenderedPdfPageSize } from "./pdf-scheme-renderer.js";

const TEXT = Object.freeze({
  ru: {
    title: "Производственный отчёт",
    summary: "Сводные итоги",
    files: "Итоги по файлам",
    pairs: "Детализация по печатным парам",
    physicalSheets: "Физическая бумага",
    forms: "Печатные формы",
    pressPasses: "Листопрогоны",
    underproduction: "Недопечатка",
    pairOverrun: "Перетираж пар",
    fileOverrun: "Перетираж файлов",
    file: "Файл",
    pair: "Пара",
    pages: "Страницы",
    required: "Требуется",
    produced: "Напечатано",
    complete: "Готовых",
    overrun: "Перетираж",
    pairWaste: "По парам",
    status: "Статус",
    contributions: "Вклады монтажей",
    exact: "Точно",
    over: "Перетираж",
    under: "Недопечатка",
    boundary: "Тиражи монтажей являются ручным контрольным входом, а не результатом оптимизатора.",
    page: "Страница",
  },
  en: {
    title: "Production report",
    summary: "Summary totals",
    files: "File totals",
    pairs: "Print-pair details",
    physicalSheets: "Physical sheets",
    forms: "Printing forms",
    pressPasses: "Press passes",
    underproduction: "Underproduction",
    pairOverrun: "Pair overrun",
    fileOverrun: "File overrun",
    file: "File",
    pair: "Pair",
    pages: "Pages",
    required: "Required",
    produced: "Produced",
    complete: "Complete",
    overrun: "Overrun",
    pairWaste: "Across pairs",
    status: "Status",
    contributions: "Imposition contributions",
    exact: "Exact",
    over: "Overrun",
    under: "Underproduction",
    boundary: "Imposition run lengths are verified manual input, not optimizer output.",
    page: "Page",
  },
});

const FILE_ROWS_PER_PAGE = 16;
const PAIR_ROWS_PER_PAGE = 12;

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive number`);
  }
  return number;
}

function mmToPixels(mm, dpi) {
  return mm * dpi / 25.4;
}

function formatNumber(value, language) {
  return Number(value).toLocaleString(language === "en" ? "en-US" : "ru-RU");
}

export function paginateReportRows(rows, rowsPerPage) {
  if (!Array.isArray(rows)) throw new TypeError("rows must be an array");
  const pageSize = Number(rowsPerPage);
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError("rowsPerPage must be a positive integer");
  }
  const pages = [];
  for (let index = 0; index < rows.length; index += pageSize) {
    pages.push(Object.freeze(rows.slice(index, index + pageSize)));
  }
  return Object.freeze(pages);
}

export function buildReportRenderPages(documentModel) {
  if (!documentModel || documentModel.kind !== PDF_DOCUMENT_KINDS.PRODUCTION_REPORT) {
    throw new TypeError("A production report PDF document model is required");
  }
  const summary = documentModel.sections.find((section) => section.kind === "summary");
  const files = documentModel.sections.find((section) => section.kind === "fileTable");
  const pairs = documentModel.sections.find((section) => section.kind === "pairTable");
  if (!summary || !files || !pairs) {
    throw new Error("Production report document sections are incomplete");
  }

  const pages = [Object.freeze({ kind: "summary", totals: summary.totals })];
  paginateReportRows(files.rows, FILE_ROWS_PER_PAGE).forEach((rows, index, all) => {
    pages.push(Object.freeze({ kind: "files", rows, part: index + 1, partCount: all.length }));
  });
  paginateReportRows(pairs.rows, PAIR_ROWS_PER_PAGE).forEach((rows, index, all) => {
    pages.push(Object.freeze({ kind: "pairs", rows, part: index + 1, partCount: all.length }));
  });
  return Object.freeze(pages.map((page, index) => Object.freeze({
    ...page,
    pageNumber: index + 1,
  })));
}

function createCanvas(width, height, canvasFactory) {
  if (canvasFactory) return canvasFactory(width, height);
  if (!globalThis.document?.createElement) {
    throw new Error("Browser document is required to render report PDF pages");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function setFont(ctx, weight, sizePx) {
  ctx.font = `${weight} ${sizePx}px ${CONFIG.pdf.canvasFontFamily}`;
}

function fitText(ctx, text, maxWidth, initialSize, minimumSize, weight = "400") {
  let size = initialSize;
  while (size > minimumSize) {
    setFont(ctx, weight, size);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return minimumSize;
}

function drawPageHeader(ctx, canvas, title, pageNumber, pageCount, text, px) {
  const margin = px(10);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  setFont(ctx, "700", px(7));
  ctx.fillText(title, margin, margin + px(7));

  const pageLabel = `${text.page} ${pageNumber} / ${pageCount}`;
  setFont(ctx, "700", px(3.2));
  ctx.textAlign = "right";
  ctx.fillText(pageLabel, canvas.width - margin, margin + px(5));
  ctx.textAlign = "left";

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = Math.max(1, px(0.3));
  ctx.beginPath();
  ctx.moveTo(margin, margin + px(10));
  ctx.lineTo(canvas.width - margin, margin + px(10));
  ctx.stroke();
}

function drawFooter(ctx, canvas, text, px) {
  const margin = px(10);
  ctx.fillStyle = "#555555";
  setFont(ctx, "400", px(2.8));
  ctx.textAlign = "left";
  ctx.fillText("uImposition", margin, canvas.height - px(6));
  ctx.textAlign = "right";
  ctx.fillText(text.boundary, canvas.width - margin, canvas.height - px(6));
  ctx.textAlign = "left";
}

function drawSummaryPage(ctx, canvas, page, text, language, pageCount, px) {
  drawPageHeader(ctx, canvas, `${text.title} · ${text.summary}`, page.pageNumber, pageCount, text, px);
  const margin = px(10);
  const top = px(35);
  const gap = px(5);
  const columns = 2;
  const cardWidth = (canvas.width - margin * 2 - gap) / columns;
  const cardHeight = px(40);
  const metrics = [
    [text.physicalSheets, page.totals.physicalSheets],
    [text.forms, page.totals.forms],
    [text.pressPasses, page.totals.pressPasses],
    [text.underproduction, page.totals.underproduction],
    [text.pairOverrun, page.totals.overrun],
    [text.fileOverrun, page.totals.fileOverrun],
  ];

  metrics.forEach(([label, value], index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = margin + column * (cardWidth + gap);
    const cardTop = top + row * (cardHeight + gap);
    ctx.fillStyle = "#f5f5f5";
    ctx.strokeStyle = "#777777";
    ctx.lineWidth = Math.max(1, px(0.25));
    ctx.fillRect(left, cardTop, cardWidth, cardHeight);
    ctx.strokeRect(left, cardTop, cardWidth, cardHeight);

    ctx.fillStyle = "#555555";
    setFont(ctx, "400", px(3.3));
    ctx.fillText(label, left + px(5), cardTop + px(9));
    ctx.fillStyle = "#111111";
    setFont(ctx, "700", px(10));
    ctx.fillText(formatNumber(value, language), left + px(5), cardTop + px(28));
  });

  const detailsTop = top + 3 * (cardHeight + gap) + px(5);
  ctx.fillStyle = "#111111";
  setFont(ctx, "700", px(4));
  ctx.fillText(`${text.required}: ${formatNumber(page.totals.requiredPairQuantity, language)}`, margin, detailsTop);
  ctx.fillText(`${text.produced}: ${formatNumber(page.totals.producedPairQuantity, language)}`, margin, detailsTop + px(8));
  ctx.fillText(`${text.file}: ${formatNumber(page.totals.fileCount, language)} · ${text.pair}: ${formatNumber(page.totals.pairCount, language)}`, margin, detailsTop + px(16));
  drawFooter(ctx, canvas, text, px);
}

function statusText(metric, text) {
  if (metric.underproduction > 0) return text.under;
  if (metric.overrun > 0) return text.over;
  return text.exact;
}

function drawTablePage({
  ctx,
  canvas,
  page,
  pageCount,
  title,
  headers,
  widths,
  rowValues,
  text,
  px,
}) {
  drawPageHeader(ctx, canvas, title, page.pageNumber, pageCount, text, px);
  const margin = px(10);
  const tableTop = px(30);
  const tableWidth = canvas.width - margin * 2;
  const headerHeight = px(11);
  const footerSpace = px(18);
  const rowHeight = (canvas.height - tableTop - footerSpace - headerHeight) / Math.max(1, page.rows.length);

  let x = margin;
  ctx.fillStyle = "#111111";
  headers.forEach((header, index) => {
    const width = tableWidth * widths[index];
    ctx.fillRect(x, tableTop, width, headerHeight);
    ctx.fillStyle = "#ffffff";
    const fontSize = fitText(ctx, header, width - px(2), px(3.2), px(2.2), "700");
    setFont(ctx, "700", fontSize);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(header, x + width / 2, tableTop + headerHeight / 2);
    ctx.fillStyle = "#111111";
    x += width;
  });

  page.rows.forEach((row, rowIndex) => {
    const top = tableTop + headerHeight + rowIndex * rowHeight;
    const values = rowValues(row);
    let left = margin;
    values.forEach((value, columnIndex) => {
      const width = tableWidth * widths[columnIndex];
      ctx.fillStyle = rowIndex % 2 === 0 ? "#ffffff" : "#f6f6f6";
      ctx.fillRect(left, top, width, rowHeight);
      ctx.strokeStyle = "#777777";
      ctx.lineWidth = Math.max(1, px(0.2));
      ctx.strokeRect(left, top, width, rowHeight);

      const stringValue = String(value);
      const initial = columnIndex === values.length - 1 ? px(2.8) : px(3.2);
      const fontSize = fitText(ctx, stringValue, width - px(2), initial, px(1.7), columnIndex === 0 ? "700" : "400");
      setFont(ctx, columnIndex === 0 ? "700" : "400", fontSize);
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stringValue, left + width / 2, top + rowHeight / 2);
      left += width;
    });
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  drawFooter(ctx, canvas, text, px);
}

function contributionsText(metric, language) {
  return metric.contributions
    .map((item) => `${item.impositionId}:${item.positionCount}×${formatNumber(item.runLength, language)}=${formatNumber(item.producedQuantity, language)}`)
    .join("; ");
}

function canvasToJpegBytes(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Canvas could not be converted to JPEG"));
        return;
      }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/jpeg", quality);
  });
}

export async function renderProductionReportPdfBytes(documentModel, {
  dpi = CONFIG.pdf.renderDpi,
  jpegQuality = CONFIG.pdf.jpegQuality,
  canvasFactory = null,
} = {}) {
  positiveNumber(dpi, "dpi");
  const pages = buildReportRenderPages(documentModel);
  const text = TEXT[documentModel.language] ?? TEXT.ru;
  const size = resolveRenderedPdfPageSize(documentModel.pageSpec);
  const pixelWidth = Math.max(1, Math.round(mmToPixels(size.widthMm, dpi)));
  const pixelHeight = Math.max(1, Math.round(mmToPixels(size.heightMm, dpi)));
  const px = (mm) => mmToPixels(mm, dpi);
  const jpegPages = [];

  for (const page of pages) {
    const canvas = createCanvas(pixelWidth, pixelHeight, canvasFactory);
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context is unavailable");

    if (page.kind === "summary") {
      drawSummaryPage(ctx, canvas, page, text, documentModel.language, pages.length, px);
    } else if (page.kind === "files") {
      const suffix = page.partCount > 1 ? ` · ${page.part}/${page.partCount}` : "";
      drawTablePage({
        ctx,
        canvas,
        page,
        pageCount: pages.length,
        title: `${text.title} · ${text.files}${suffix}`,
        headers: [text.file, text.required, text.complete, text.overrun, text.pairWaste, text.status],
        widths: [0.12, 0.17, 0.19, 0.16, 0.18, 0.18],
        rowValues: (metric) => [
          metric.file,
          formatNumber(metric.requiredQuantity, documentModel.language),
          formatNumber(metric.producedQuantity, documentModel.language),
          formatNumber(metric.overrun, documentModel.language),
          formatNumber(metric.pairOverrun, documentModel.language),
          statusText(metric, text),
        ],
        text,
        px,
      });
    } else {
      const suffix = page.partCount > 1 ? ` · ${page.part}/${page.partCount}` : "";
      drawTablePage({
        ctx,
        canvas,
        page,
        pageCount: pages.length,
        title: `${text.title} · ${text.pairs}${suffix}`,
        headers: [text.file, text.pair, text.pages, text.required, text.produced, text.overrun, text.contributions],
        widths: [0.08, 0.07, 0.09, 0.13, 0.14, 0.12, 0.37],
        rowValues: (metric) => [
          metric.file,
          metric.pairIndex,
          metric.backPage === null ? `${metric.frontPage}/-` : `${metric.frontPage}/${metric.backPage}`,
          formatNumber(metric.requiredQuantity, documentModel.language),
          formatNumber(metric.producedQuantity, documentModel.language),
          formatNumber(metric.overrun, documentModel.language),
          contributionsText(metric, documentModel.language),
        ],
        text,
        px,
      });
    }

    jpegPages.push({
      jpegBytes: await canvasToJpegBytes(canvas, jpegQuality),
      pixelWidth,
      pixelHeight,
      widthMm: size.widthMm,
      heightMm: size.heightMm,
    });
  }

  return createPdfFromJpegPages(jpegPages);
}
