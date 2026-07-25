import test from "node:test";
import assert from "node:assert/strict";
import {
  computeSchemeGridGeometry,
  resolveRenderedPdfPageSize,
} from "../src/pdf-scheme-renderer.js";

test("A4 and custom page specs preserve their explicit dimensions", () => {
  assert.deepEqual(resolveRenderedPdfPageSize({ widthMm: 210, heightMm: 297 }), {
    widthMm: 210,
    heightMm: 297,
  });
  assert.deepEqual(resolveRenderedPdfPageSize({ widthMm: 320, heightMm: 220 }), {
    widthMm: 320,
    heightMm: 220,
  });
});

test("sheet-proportional mode uses the configured long side", () => {
  const landscape = resolveRenderedPdfPageSize({ aspectRatio: 616 / 446 });
  assert.equal(landscape.widthMm, 297);
  assert.equal(Number(landscape.heightMm.toFixed(6)), Number((297 / (616 / 446)).toFixed(6)));

  const portrait = resolveRenderedPdfPageSize({ aspectRatio: 446 / 616 });
  assert.equal(portrait.heightMm, 297);
  assert.equal(Number(portrait.widthMm.toFixed(6)), Number((297 * (446 / 616)).toFixed(6)));
});

test("4 × 4 grid is centred and fits inside the usable page area", () => {
  const geometry = computeSchemeGridGeometry({
    pageWidthPx: 1000,
    pageHeightPx: 1400,
    marginPx: 50,
    headerHeightPx: 120,
    footerHeightPx: 60,
    rows: 4,
    columns: 4,
  });

  assert.equal(geometry.cellWidth, geometry.cellHeight);
  assert.equal(geometry.gridWidth, geometry.cellWidth * 4);
  assert.equal(geometry.gridHeight, geometry.cellHeight * 4);
  assert.ok(geometry.left >= 50);
  assert.ok(geometry.top >= 170);
  assert.ok(geometry.left + geometry.gridWidth <= 950);
  assert.ok(geometry.top + geometry.gridHeight <= 1340);
});

test("renderer geometry rejects unusable pages", () => {
  assert.throws(
    () => computeSchemeGridGeometry({
      pageWidthPx: 100,
      pageHeightPx: 100,
      marginPx: 60,
      headerHeightPx: 20,
      footerHeightPx: 20,
      rows: 4,
      columns: 4,
    }),
    /no usable scheme area/,
  );
  assert.throws(() => resolveRenderedPdfPageSize({ aspectRatio: 0 }), /positive number/);
});
