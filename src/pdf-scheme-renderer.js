import { CONFIG } from "./config.js";
import { directionToGlyph } from "./orientation.js";
import { PDF_DOCUMENT_KINDS } from "./pdf-document-model.js";
import { createPdfFromJpegPages } from "./pdf-binary.js";

const TEXT = Object.freeze({
  ru: { run: "Тираж монтажа", positions: "позиций", validated: "Проверено" },
  en: { run: "Imposition run", positions: "positions", validated: "Validated" },
});

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

export function resolveRenderedPdfPageSize(pageSpec) {
  if (!pageSpec || typeof pageSpec !== "object") {
    throw new TypeError("pageSpec is required");
  }

  if (Number.isFinite(pageSpec.widthMm) && Number.isFinite(pageSpec.heightMm)) {
    return Object.freeze({
      widthMm: positiveNumber(pageSpec.widthMm, "pageSpec.widthMm"),
      heightMm: positiveNumber(pageSpec.heightMm, "pageSpec.heightMm"),
    });
  }

  const aspectRatio = positiveNumber(pageSpec.aspectRatio, "pageSpec.aspectRatio");
  const longSideMm = positiveNumber(CONFIG.pdf.proportionalLongSideMm, "CONFIG.pdf.proportionalLongSideMm");
  if (aspectRatio >= 1) {
    return Object.freeze({ widthMm: longSideMm, heightMm: longSideMm / aspectRatio });
  }
  return Object.freeze({ widthMm: longSideMm * aspectRatio, heightMm: longSideMm });
}

export function computeSchemeGridGeometry({
  pageWidthPx,
  pageHeightPx,
  marginPx,
  headerHeightPx,
  footerHeightPx,
  rows,
  columns,
}) {
  const availableWidth = pageWidthPx - marginPx * 2;
  const availableHeight = pageHeightPx - marginPx * 2 - headerHeightPx - footerHeightPx;
  if (availableWidth <= 0 || availableHeight <= 0) {
    throw new RangeError("PDF page has no usable scheme area");
  }

  const cellSize = Math.min(availableWidth / columns, availableHeight / rows);
  const gridWidth = cellSize * columns;
  const gridHeight = cellSize * rows;
  return Object.freeze({
    cellWidth: cellSize,
    cellHeight: cellSize,
    gridWidth,
    gridHeight,
    left: (pageWidthPx - gridWidth) / 2,
    top: marginPx + headerHeightPx + (availableHeight - gridHeight) / 2,
  });
}

function createCanvas(width, height, canvasFactory) {
  if (canvasFactory) return canvasFactory(width, height);
  if (!globalThis.document?.createElement) {
    throw new Error("Browser document is required to render PDF pages");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function fitText(ctx, text, maxWidth, initialFontPx, minimumFontPx, fontWeight) {
  let size = initialFontPx;
  do {
    ctx.font = `${fontWeight} ${size}px ${CONFIG.pdf.canvasFontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  } while (size >= minimumFontPx);
  return minimumFontPx;
}

function cellText(cell) {
  if (cell.page === null) return "-";
  return `${cell.file},${cell.page} ${directionToGlyph(cell.direction)}`;
}

function drawSchemePage(canvas, page, language, dpi) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is unavailable");

  const text = TEXT[language] ?? TEXT.ru;
  const px = (mm) => mmToPixels(mm, dpi);
  const pageWidth = canvas.width;
  const pageHeight = canvas.height;
  const margin = px(page.pageSpec.marginMm ?? CONFIG.pdf.defaultMarginMm);
  const headerHeight = px(25);
  const footerHeight = px(12);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, pageWidth, pageHeight);
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "alphabetic";

  const titleSize = Math.max(18, px(7));
  ctx.font = `700 ${titleSize}px ${CONFIG.pdf.canvasFontFamily}`;
  ctx.fillText(page.title, margin, margin + titleSize);

  const statusSize = Math.max(10, px(3.2));
  ctx.font = `700 ${statusSize}px ${CONFIG.pdf.canvasFontFamily}`;
  const statusWidth = ctx.measureText(text.validated).width;
  ctx.fillText(text.validated, pageWidth - margin - statusWidth, margin + statusSize);

  const metaSize = Math.max(10, px(3.4));
  ctx.font = `400 ${metaSize}px ${CONFIG.pdf.canvasFontFamily}`;
  const meta = `${text.run}: ${formatNumber(page.runLength, language)} · ${page.columns} × ${page.rows} · ${page.rotation}° · ${page.rows * page.columns} ${text.positions}`;
  ctx.fillStyle = "#444444";
  ctx.fillText(meta, margin, margin + titleSize + px(7));

  const geometry = computeSchemeGridGeometry({
    pageWidthPx: pageWidth,
    pageHeightPx: pageHeight,
    marginPx: margin,
    headerHeightPx: headerHeight,
    footerHeightPx: footerHeight,
    rows: page.rows,
    columns: page.columns,
  });

  const lineWidth = Math.max(1, px(0.35));
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "#111111";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(geometry.left, geometry.top, geometry.gridWidth, geometry.gridHeight);

  page.layout.cells.forEach((cell, index) => {
    const row = Math.floor(index / page.columns);
    const column = index % page.columns;
    const left = geometry.left + column * geometry.cellWidth;
    const top = geometry.top + row * geometry.cellHeight;

    ctx.strokeRect(left, top, geometry.cellWidth, geometry.cellHeight);
    const value = cellText(cell);
    const initialFont = Math.min(geometry.cellHeight * 0.24, px(4.8));
    const minimumFont = Math.max(8, px(2.2));
    const fontSize = fitText(
      ctx,
      value,
      geometry.cellWidth - px(3),
      initialFont,
      minimumFont,
      "700",
    );
    ctx.font = `700 ${fontSize}px ${CONFIG.pdf.canvasFontFamily}`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, left + geometry.cellWidth / 2, top + geometry.cellHeight / 2);
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 ${Math.max(9, px(2.8))}px ${CONFIG.pdf.canvasFontFamily}`;
  ctx.fillStyle = "#555555";
  ctx.fillText(
    `uImposition · ${page.pageNumber}`,
    margin,
    pageHeight - margin / 2,
  );
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

export async function renderSchemePdfBytes(documentModel, {
  dpi = CONFIG.pdf.renderDpi,
  jpegQuality = CONFIG.pdf.jpegQuality,
  canvasFactory = null,
} = {}) {
  if (!documentModel || documentModel.kind !== PDF_DOCUMENT_KINDS.SCHEMES) {
    throw new TypeError("A scheme PDF document model is required");
  }
  if (!Array.isArray(documentModel.pages) || documentModel.pages.length === 0) {
    throw new TypeError("The scheme document has no pages");
  }

  positiveNumber(dpi, "dpi");
  if (!Number.isFinite(jpegQuality) || jpegQuality <= 0 || jpegQuality > 1) {
    throw new RangeError("jpegQuality must be greater than 0 and at most 1");
  }

  const jpegPages = [];
  for (const page of documentModel.pages) {
    const size = resolveRenderedPdfPageSize(page.pageSpec);
    const pixelWidth = Math.max(1, Math.round(mmToPixels(size.widthMm, dpi)));
    const pixelHeight = Math.max(1, Math.round(mmToPixels(size.heightMm, dpi)));
    const canvas = createCanvas(pixelWidth, pixelHeight, canvasFactory);
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    drawSchemePage(canvas, page, documentModel.language, dpi);
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

export function downloadPdfBytes(bytes, fileName) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new TypeError("PDF bytes are required");
  }
  const safeFileName = String(fileName ?? "").trim();
  if (!safeFileName.toLowerCase().endsWith(".pdf")) {
    throw new RangeError("PDF file name must end with .pdf");
  }
  if (!globalThis.document?.createElement || !globalThis.URL?.createObjectURL) {
    throw new Error("Browser download APIs are unavailable");
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
