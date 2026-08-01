import test from "node:test";
import assert from "node:assert/strict";

import {
  createSimpleProductRowsTxtTemplate,
  looksLikeExtendedProductRowsTxt,
  parseSimpleProductRowsTxt,
} from "../src/simple-product-row-txt.js";

const baseRow = Object.freeze({
  finished: { widthMm: 105, heightMm: 148 },
  print: {
    mode: "duplex",
    frontColors: 4,
    backColors: 1,
    duplexPreference: "auto",
  },
  bleed: {
    mode: "uniform",
    uniformMm: 0,
    sidesMm: { left: 0, right: 0, top: 0, bottom: 0 },
  },
  cut: { mode: "commonCut", gapMm: 0 },
  rotationPolicy: "auto",
});

test("simple TXT accepts name, quantity, pages and optional variants", () => {
  const result = parseSimpleProductRowsTxt(`
# comment
название;тираж;страницы;виды
Листовка 70;3500;3;1
Листовка 25;1500;2;4
`, { baseRow });

  assert.equal(result.valid, true);
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows[0].finished, baseRow.finished);
  assert.deepEqual(result.rows[0].print, baseRow.print);
  assert.equal(result.rows[0].quantityPerVariant, 3500);
  assert.equal(result.rows[0].pages, 3);
  assert.equal(result.rows[1].variantCount, 4);
});

test("simple TXT defaults pages and variants while keeping the base production settings", () => {
  const result = parseSimpleProductRowsTxt("Листовка A;1000", { baseRow });

  assert.equal(result.valid, true);
  assert.equal(result.rows[0].pages, 2);
  assert.equal(result.rows[0].variantCount, 1);
  assert.equal(result.rows[0].print.backColors, 1);
  assert.equal(result.rows[0].cut.mode, "commonCut");
});

test("simple TXT reports exact line errors without applying partial input", () => {
  const result = parseSimpleProductRowsTxt("Листовка A;abc;3\n;500;2", { baseRow });

  assert.equal(result.valid, false);
  assert.equal(result.rows.length, 0);
  assert.ok(result.issues.some(({ line, field }) => line === 1 && field === "тираж"));
  assert.ok(result.issues.some(({ line, field }) => line === 2 && field === "название"));
});

test("template is simple while the legacy fourteen-column format remains detectable", () => {
  const template = createSimpleProductRowsTxtTemplate();
  assert.match(template, /название;тираж;страницы;виды/);
  assert.equal(looksLikeExtendedProductRowsTxt(template), false);
  assert.equal(
    looksLikeExtendedProductRowsTxt("name;width_mm;height_mm;quantity;variants;pages;front_colors;back_colors;bleed_mm;cut_mode;gap_mm;rotation;duplex_preference;notes"),
    true,
  );
});
