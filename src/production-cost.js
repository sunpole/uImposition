export const PRODUCTION_COST_KIND = "productionCost";
export const PRICING_PROFILE_KIND = "pricingProfile";

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
  return number;
}

function positiveNumber(value, label) {
  const number = finiteNumber(value, label);
  if (number <= 0) throw new RangeError(`${label} must be positive`);
  return number;
}

function nonNegativeNumber(value, label) {
  const number = finiteNumber(value, label);
  if (number < 0) throw new RangeError(`${label} must be non-negative`);
  return number;
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function optionalPositiveInteger(value, label) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer when provided`);
  }
  return number;
}

function currencyCode(value) {
  const currency = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new RangeError("currency must be a three-letter ISO-style code");
  }
  return currency;
}

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function createPricingProfile({
  currency = "BYN",
  grammageGsm,
  paperPricePerKg,
  colorPlatePrice,
  layoutFormPreparationPrice = 0,
} = {}) {
  return Object.freeze({
    kind: PRICING_PROFILE_KIND,
    currency: currencyCode(currency),
    grammageGsm: positiveNumber(grammageGsm, "grammageGsm"),
    paperPricePerKg: nonNegativeNumber(paperPricePerKg, "paperPricePerKg"),
    colorPlatePrice: nonNegativeNumber(colorPlatePrice, "colorPlatePrice"),
    layoutFormPreparationPrice: nonNegativeNumber(
      layoutFormPreparationPrice,
      "layoutFormPreparationPrice",
    ),
  });
}

export function calculateSheetAreaM2({ widthMm, heightMm }) {
  const width = positiveNumber(widthMm, "widthMm");
  const height = positiveNumber(heightMm, "heightMm");
  return round(width * height / 1_000_000, 9);
}

export function calculateSheetWeightKg({ widthMm, heightMm, grammageGsm }) {
  const areaM2 = calculateSheetAreaM2({ widthMm, heightMm });
  const grammage = positiveNumber(grammageGsm, "grammageGsm");
  return round(areaM2 * grammage / 1000, 9);
}

export function calculateProductionCost({
  sourceSheet,
  physicalSheets,
  colorPlates,
  layoutForms,
  orderedFinishedQuantity = null,
  pricing,
}) {
  if (!pricing || pricing.kind !== PRICING_PROFILE_KIND) {
    throw new TypeError("A pricing profile is required");
  }

  const widthMm = positiveNumber(sourceSheet?.width, "sourceSheet.width");
  const heightMm = positiveNumber(sourceSheet?.height, "sourceSheet.height");
  const normalizedPhysicalSheets = nonNegativeInteger(physicalSheets, "physicalSheets");
  const normalizedColorPlates = nonNegativeInteger(colorPlates, "colorPlates");
  const normalizedLayoutForms = nonNegativeInteger(layoutForms, "layoutForms");
  const normalizedOrderedQuantity = optionalPositiveInteger(
    orderedFinishedQuantity,
    "orderedFinishedQuantity",
  );

  const sheetAreaM2 = calculateSheetAreaM2({ widthMm, heightMm });
  const sheetWeightKg = calculateSheetWeightKg({
    widthMm,
    heightMm,
    grammageGsm: pricing.grammageGsm,
  });
  const paperWeightKg = round(sheetWeightKg * normalizedPhysicalSheets, 6);
  const paperCost = round(paperWeightKg * pricing.paperPricePerKg, 6);
  const colorPlateCost = round(normalizedColorPlates * pricing.colorPlatePrice, 6);
  const layoutFormPreparationCost = round(
    normalizedLayoutForms * pricing.layoutFormPreparationPrice,
    6,
  );
  const estimatedTotalCost = round(
    paperCost + colorPlateCost + layoutFormPreparationCost,
    6,
  );
  const estimatedUnitCost = normalizedOrderedQuantity === null
    ? null
    : round(estimatedTotalCost / normalizedOrderedQuantity, 9);

  return Object.freeze({
    kind: PRODUCTION_COST_KIND,
    currency: pricing.currency,
    sheetBasis: "source",
    sourceSheet: Object.freeze({ width: widthMm, height: heightMm }),
    sheetAreaM2,
    grammageGsm: pricing.grammageGsm,
    sheetWeightKg,
    physicalSheets: normalizedPhysicalSheets,
    paperWeightKg,
    paperPricePerKg: pricing.paperPricePerKg,
    paperCost,
    colorPlates: normalizedColorPlates,
    colorPlatePrice: pricing.colorPlatePrice,
    colorPlateCost,
    layoutForms: normalizedLayoutForms,
    layoutFormPreparationPrice: pricing.layoutFormPreparationPrice,
    layoutFormPreparationCost,
    estimatedTotalCost,
    orderedFinishedQuantity: normalizedOrderedQuantity,
    estimatedUnitCost,
  });
}
