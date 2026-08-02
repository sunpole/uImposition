import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../src/config.js";
import {
  D3_STANDARD_FORMATS,
  createD3CopyName,
  createD3ProductInput,
  emptyD3Draft,
  formatD3Decimal,
  formatD3Integer,
  recognizeD3Format,
  validateD3Draft,
} from "../src/d3-start-page.js";

const printable = Object.freeze({ width: 608, height: 431 });

function validDraft(overrides = {}) {
  return {
    ...emptyD3Draft(),
    name: "Визитка",
    format: "custom",
    widthMm: "90",
    heightMm: "50",
    colorfulness: "4+4",
    bleedMm: "2",
    pages: "2",
    quantity: "1000",
    ...overrides,
  };
}

test("D3 uses the approved sheet, product, bleed and color configuration", () => {
  assert.deepEqual(CONFIG.sheetPresets.map(({ id }) => id), [
    "616x446", "616x466", "636x448", "646x466", "650x313",
    "716x326", "716x336", "716x516", "500x350", "450x320",
  ]);
  assert.deepEqual(Object.keys(D3_STANDARD_FORMATS), ["A4", "A5", "A6", "A7"]);
  assert.deepEqual(CONFIG.bleedPresetsMm, [0, 2, 3, 5]);
  assert.equal(CONFIG.limits.maxColorUnits, 20);
  assert.equal(CONFIG.limits.minProductDimensionMm, 0.01);
});

test("D3 recognizes standard formats only by exact dimensions in either orientation", () => {
  assert.equal(recognizeD3Format(210, 297), "A4");
  assert.equal(recognizeD3Format(297, 210), "A4");
  assert.equal(recognizeD3Format(148, 210), "A5");
  assert.equal(recognizeD3Format(105, 148), "A6");
  assert.equal(recognizeD3Format(74, 105), "A7");
  assert.equal(recognizeD3Format(209, 297), "custom");
  assert.equal(recognizeD3Format(null, 297), "");
});

test("D3 accepts decimal comma and renders no unnecessary trailing zeros", () => {
  const result = validateD3Draft(validDraft({ widthMm: "90,50", heightMm: "50.05" }), printable);

  assert.equal(result.valid, true);
  assert.equal(result.normalized.widthMm, 90.5);
  assert.equal(result.normalized.heightMm, 50.05);
  assert.equal(formatD3Decimal(90), "90");
  assert.equal(formatD3Decimal(90.5), "90,5");
  assert.equal(formatD3Decimal(90.05), "90,05");
});

test("D3 rounds product dimensions to 0.01 mm and accepts the minimum", () => {
  const rounded = validateD3Draft(validDraft({ widthMm: "90,006", heightMm: "0,01" }), printable);
  assert.equal(rounded.valid, true);
  assert.equal(rounded.normalized.widthMm, 90.01);
  assert.equal(rounded.normalized.heightMm, 0.01);

  const belowMinimum = validateD3Draft(validDraft({ heightMm: "0,004" }), printable);
  assert.equal(belowMinimum.valid, false);
  assert.ok(belowMinimum.issues.some(({ field, code }) => field === "heightMm" && code === "outOfRange"));
});

test("D3 normalizes colorfulness, supports 20+20 and rejects a zero first side", () => {
  const normalized = validateD3Draft(validDraft({ colorfulness: " 04 + 01 " }), printable);
  assert.equal(normalized.valid, true);
  assert.equal(normalized.normalized.colorfulness, "4+1");
  assert.equal(normalized.normalized.frontColors, 4);
  assert.equal(normalized.normalized.backColors, 1);

  const maximum = validateD3Draft(validDraft({ colorfulness: "20+20" }), printable);
  assert.equal(maximum.valid, true);
  assert.equal(maximum.normalized.colorfulness, "20+20");

  const zeroFront = validateD3Draft(validDraft({ colorfulness: "0+4" }), printable);
  assert.equal(zeroFront.valid, false);
  assert.ok(zeroFront.issues.some(({ field, code }) => field === "colorfulness" && code === "outOfRange"));

  const overMaximum = validateD3Draft(validDraft({ colorfulness: "21+0" }), printable);
  assert.equal(overMaximum.valid, false);
});

test("D3 rounds bleed to one decimal and clamps it to the supported range", () => {
  const rounded = validateD3Draft(validDraft({ bleedMm: "2,55" }), printable);
  assert.equal(rounded.valid, true);
  assert.equal(rounded.normalized.bleedMm, 2.6);

  const high = validateD3Draft(validDraft({ bleedMm: "40" }), printable);
  assert.equal(high.valid, true);
  assert.equal(high.normalized.bleedMm, 20);

  const low = validateD3Draft(validDraft({ bleedMm: "-2" }), printable);
  assert.equal(low.valid, true);
  assert.equal(low.normalized.bleedMm, 0);
});

test("D3 validates finished size with bleed against printable area in either orientation", () => {
  const exact = validateD3Draft(validDraft({ widthMm: "604", heightMm: "427", bleedMm: "2" }), printable);
  assert.equal(exact.valid, true);
  assert.equal(exact.normalized.fit, "direct");

  const rotated = validateD3Draft(validDraft({ widthMm: "427", heightMm: "604", bleedMm: "2" }), printable);
  assert.equal(rotated.valid, true);
  assert.equal(rotated.normalized.fit, "rotated");

  const tooWide = validateD3Draft(validDraft({ widthMm: "604,01", heightMm: "427", bleedMm: "2" }), printable);
  assert.equal(tooWide.valid, false);
  assert.ok(tooWide.issues.some(({ code }) => code === "doesNotFit"));
});

test("D3 requires positive integer pages and quantity and formats grouped quantity", () => {
  const result = validateD3Draft(validDraft({ pages: "3", quantity: "1 250 000" }), printable);
  assert.equal(result.valid, true);
  assert.equal(result.normalized.pages, 3);
  assert.equal(result.normalized.quantity, 1250000);
  assert.equal(formatD3Integer(1250000), "1 250 000");

  assert.equal(validateD3Draft(validDraft({ pages: "0" }), printable).valid, false);
  assert.equal(validateD3Draft(validDraft({ quantity: "10,5" }), printable).valid, false);
});

test("D3 builds the existing product-row input and generates a fallback name", () => {
  const result = validateD3Draft(validDraft({ name: "" }), printable);
  const product = createD3ProductInput(result, { fallbackName: "Заказ 7" });

  assert.deepEqual(product, {
    enabled: true,
    name: "Заказ 7",
    sourceFileName: null,
    finished: { widthMm: 90, heightMm: 50 },
    quantityPerVariant: 1000,
    variantCount: 1,
    pages: 2,
    print: {
      mode: "duplex",
      frontColors: 4,
      backColors: 4,
      duplexPreference: "auto",
    },
    bleed: { mode: "uniform", uniformMm: 2 },
    cut: { mode: "separated", gapMm: 0 },
    rotationPolicy: "auto",
    notes: "",
  });
});

test("D3 copy names use a persistent monotonic sequence per base name", () => {
  const first = createD3CopyName("Визитка", {});
  assert.equal(first.name, "Визитка 2");
  assert.deepEqual(first.sequences, { "Визитка": 2 });

  const second = createD3CopyName("Визитка 2", first.sequences);
  assert.equal(second.name, "Визитка 3");
  assert.deepEqual(second.sequences, { "Визитка": 3 });

  const independent = createD3CopyName("Листовка", second.sequences);
  assert.equal(independent.name, "Листовка 2");
  assert.deepEqual(independent.sequences, { "Визитка": 3, "Листовка": 2 });
});
