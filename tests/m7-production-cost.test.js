import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateProductionCost,
  calculateSheetAreaM2,
  calculateSheetWeightKg,
  createPricingProfile,
} from "../src/production-cost.js";

const decisionCases = JSON.parse(
  readFileSync(new URL("../data/m7-decision-cases.json", import.meta.url), "utf8"),
);
const example = decisionCases.illustrativePricing;

function pricing() {
  return createPricingProfile({
    currency: example.currency,
    grammageGsm: example.grammageGsm,
    paperPricePerKg: example.paperPricePerKg,
    colorPlatePrice: example.colorPlatePrice,
    layoutFormPreparationPrice: example.layoutFormPreparationPrice,
  });
}

test("620 by 450 mm at 130 gsm weighs 0.03627 kg per source sheet", () => {
  assert.equal(calculateSheetAreaM2({ widthMm: 620, heightMm: 450 }), 0.279);
  assert.equal(
    calculateSheetWeightKg({ widthMm: 620, heightMm: 450, grammageGsm: 130 }),
    0.03627,
  );
});

test("manual compact control solution produces the expected BYN cost breakdown", () => {
  const expected = example.manualCompact;
  const result = calculateProductionCost({
    sourceSheet: example.sourceSheet,
    physicalSheets: expected.physicalSheets,
    colorPlates: expected.colorPlates,
    layoutForms: expected.layoutForms,
    orderedFinishedQuantity: example.orderedFinishedQuantity,
    pricing: pricing(),
  });

  assert.equal(result.currency, "BYN");
  assert.equal(result.sheetBasis, "source");
  assert.equal(result.sheetAreaM2, 0.279);
  assert.equal(result.sheetWeightKg, 0.03627);
  assert.equal(result.paperWeightKg, expected.expectedPaperWeightKg);
  assert.equal(result.paperCost, expected.expectedPaperCost);
  assert.equal(result.colorPlateCost, expected.expectedColorPlateCost);
  assert.equal(result.layoutFormPreparationCost, 0);
  assert.equal(result.estimatedTotalCost, expected.expectedTotalCost);
  assert.equal(result.estimatedUnitCost, 0.033277899);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.sourceSheet));
});

test("paper minimum can use less paper but cost much more because of color plates", () => {
  const manual = calculateProductionCost({
    sourceSheet: example.sourceSheet,
    physicalSheets: example.manualCompact.physicalSheets,
    colorPlates: example.manualCompact.colorPlates,
    layoutForms: example.manualCompact.layoutForms,
    pricing: pricing(),
  });
  const paperMinimum = calculateProductionCost({
    sourceSheet: example.sourceSheet,
    physicalSheets: example.paperMinimum.physicalSheets,
    colorPlates: example.paperMinimum.colorPlates,
    layoutForms: example.paperMinimum.layoutForms,
    pricing: pricing(),
  });

  assert.equal(paperMinimum.paperWeightKg, example.paperMinimum.expectedPaperWeightKg);
  assert.equal(paperMinimum.paperCost, example.paperMinimum.expectedPaperCost);
  assert.equal(paperMinimum.colorPlateCost, example.paperMinimum.expectedColorPlateCost);
  assert.equal(paperMinimum.estimatedTotalCost, example.paperMinimum.expectedTotalCost);
  assert.ok(paperMinimum.physicalSheets < manual.physicalSheets);
  assert.ok(paperMinimum.paperCost < manual.paperCost);
  assert.ok(paperMinimum.estimatedTotalCost > manual.estimatedTotalCost);
  assert.ok(Math.abs(
    paperMinimum.estimatedTotalCost - manual.estimatedTotalCost - 6226.9428,
  ) < 1e-9);
});

test("optional preparation price is included separately from physical plates", () => {
  const profile = createPricingProfile({
    currency: "BYN",
    grammageGsm: 150,
    paperPricePerKg: 5,
    colorPlatePrice: 12,
    layoutFormPreparationPrice: 3,
  });
  const result = calculateProductionCost({
    sourceSheet: { width: 620, height: 450 },
    physicalSheets: 1000,
    colorPlates: 8,
    layoutForms: 2,
    orderedFinishedQuantity: 4000,
    pricing: profile,
  });

  assert.equal(result.paperWeightKg, 41.85);
  assert.equal(result.paperCost, 209.25);
  assert.equal(result.colorPlateCost, 96);
  assert.equal(result.layoutFormPreparationCost, 6);
  assert.equal(result.estimatedTotalCost, 311.25);
  assert.equal(result.estimatedUnitCost, 0.0778125);
});

test("pricing and production inputs reject missing or misleading values", () => {
  assert.throws(
    () => createPricingProfile({
      currency: "BYN",
      grammageGsm: 0,
      paperPricePerKg: 4,
      colorPlatePrice: 15,
    }),
    /grammageGsm must be positive/,
  );
  assert.throws(
    () => createPricingProfile({
      currency: "руб",
      grammageGsm: 130,
      paperPricePerKg: 4,
      colorPlatePrice: 15,
    }),
    /three-letter ISO-style code/,
  );
  assert.throws(
    () => calculateProductionCost({
      sourceSheet: { width: 0, height: 450 },
      physicalSheets: 100,
      colorPlates: 2,
      layoutForms: 2,
      pricing: pricing(),
    }),
    /sourceSheet.width must be positive/,
  );
  assert.throws(
    () => calculateProductionCost({
      sourceSheet: { width: 620, height: 450 },
      physicalSheets: 100.5,
      colorPlates: 2,
      layoutForms: 2,
      pricing: pricing(),
    }),
    /physicalSheets must be a non-negative integer/,
  );
});
