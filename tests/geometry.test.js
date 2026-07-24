import test from "node:test";
import assert from "node:assert/strict";
import { calculateSheetGeometry, calculateTrimmedSheet } from "../src/geometry.js";

const limits = {
  minDimensionMm: 1,
  maxDimensionMm: 2000,
  minTrimMm: 0,
  maxTrimMm: 50,
  minPressMarginMm: 0,
  maxPressMarginMm: 100,
};

test("620 × 450 before trim becomes 616 × 446 with 2 mm on every side", () => {
  const result = calculateSheetGeometry({
    width: 620,
    height: 450,
    sizeStage: "beforeTrim",
    trim: {
      enabled: true,
      sides: { left: 2, right: 2, top: 2, bottom: 2 },
    },
    pressMargins: { left: 4, right: 4, top: 2, bottom: 13 },
    limits,
  });

  assert.deepEqual(result.trimmed, { width: 616, height: 446 });
  assert.deepEqual(result.printable, { width: 608, height: 431 });
  assert.equal(result.trimApplied, true);
});

test("post-trim preset is never trimmed twice", () => {
  const result = calculateTrimmedSheet({
    width: 616,
    height: 446,
    sizeStage: "afterTrim",
    trim: {
      enabled: true,
      sides: { left: 2, right: 2, top: 2, bottom: 2 },
    },
    limits,
  });

  assert.deepEqual(result.result, { width: 616, height: 446 });
  assert.equal(result.trimApplied, false);
});

test("individual trim sides are supported", () => {
  const result = calculateTrimmedSheet({
    width: 620,
    height: 450,
    sizeStage: "beforeTrim",
    trim: {
      enabled: true,
      sides: { left: 2, right: 1, top: 0.5, bottom: 2 },
    },
    limits,
  });

  assert.deepEqual(result.result, { width: 617, height: 447.5 });
});

test("invalid trim that removes the sheet is rejected", () => {
  assert.throws(
    () =>
      calculateTrimmedSheet({
        width: 10,
        height: 10,
        sizeStage: "beforeTrim",
        trim: {
          enabled: true,
          sides: { left: 5, right: 5, top: 0, bottom: 0 },
        },
        limits,
      }),
    /no positive sheet area/,
  );
});
