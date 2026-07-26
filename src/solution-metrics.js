export const SOLUTION_METRICS_KIND = "solutionMetrics";

export const PRICING_STATUS = Object.freeze({
  READY: "pricing ready",
  INCOMPLETE: "pricing incomplete",
});

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new RangeError(`${label} is required`);
  return text;
}

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
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

function optionalNonNegativeNumber(value, label) {
  if (value === null || value === undefined) return null;
  return nonNegativeNumber(value, label);
}

function optionalPositiveInteger(value, label) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer when provided`);
  }
  return number;
}

function nullableCost(value, label) {
  if (value === null || value === undefined) return null;
  return nonNegativeNumber(value, label);
}

function pricingStatusFromCost(productionCost) {
  if (!productionCost) return PRICING_STATUS.INCOMPLETE;
  if (Number.isFinite(Number(productionCost.estimatedTotalCost))) return PRICING_STATUS.READY;
  return PRICING_STATUS.INCOMPLETE;
}

function normalizeProductionCost(productionCost) {
  if (!productionCost) {
    return Object.freeze({
      pricingStatus: PRICING_STATUS.INCOMPLETE,
      currency: null,
      sheetBasis: null,
      grammageGsm: null,
      paperWeightKg: null,
      paperCost: null,
      colorPlateCost: null,
      layoutFormPreparationCost: null,
      estimatedTotalCost: null,
      estimatedUnitCost: null,
    });
  }

  const pricingStatus = pricingStatusFromCost(productionCost);
  if (pricingStatus !== PRICING_STATUS.READY) {
    return Object.freeze({
      pricingStatus,
      currency: null,
      sheetBasis: null,
      grammageGsm: null,
      paperWeightKg: null,
      paperCost: null,
      colorPlateCost: null,
      layoutFormPreparationCost: null,
      estimatedTotalCost: null,
      estimatedUnitCost: null,
    });
  }

  return Object.freeze({
    pricingStatus,
    currency: requiredText(productionCost.currency, "productionCost.currency"),
    sheetBasis: requiredText(productionCost.sheetBasis, "productionCost.sheetBasis"),
    grammageGsm: nonNegativeNumber(productionCost.grammageGsm, "productionCost.grammageGsm"),
    paperWeightKg: nonNegativeNumber(productionCost.paperWeightKg, "productionCost.paperWeightKg"),
    paperCost: nonNegativeNumber(productionCost.paperCost, "productionCost.paperCost"),
    colorPlateCost: nonNegativeNumber(productionCost.colorPlateCost, "productionCost.colorPlateCost"),
    layoutFormPreparationCost: nonNegativeNumber(
      productionCost.layoutFormPreparationCost,
      "productionCost.layoutFormPreparationCost",
    ),
    estimatedTotalCost: nonNegativeNumber(productionCost.estimatedTotalCost, "productionCost.estimatedTotalCost"),
    estimatedUnitCost: nullableCost(productionCost.estimatedUnitCost, "productionCost.estimatedUnitCost"),
  });
}

export function createSolutionMetrics({
  id,
  label = id,
  source = "unknown",
  duplexMode = "separateFrontBackForms",
  physicalSheets,
  impositionCount,
  layoutForms,
  colorPlates,
  pressPasses,
  fileOverrun,
  pairOverrun,
  fileUnderproduction = 0,
  pairUnderproduction = 0,
  splitOrders = 0,
  fragmentedBlocks = 0,
  distinctOrdersPerImposition = 1,
  layoutCompactness = 0,
  orderedFinishedQuantity = null,
  productionCost = null,
} = {}) {
  const normalizedCost = normalizeProductionCost(productionCost);
  const normalized = Object.freeze({
    kind: SOLUTION_METRICS_KIND,
    id: requiredText(id, "id"),
    label: requiredText(label, "label"),
    source: requiredText(source, "source"),
    duplexMode: requiredText(duplexMode, "duplexMode"),
    physicalSheets: nonNegativeInteger(physicalSheets, "physicalSheets"),
    impositionCount: nonNegativeInteger(impositionCount, "impositionCount"),
    layoutForms: nonNegativeInteger(layoutForms, "layoutForms"),
    colorPlates: nonNegativeInteger(colorPlates, "colorPlates"),
    pressPasses: nonNegativeInteger(pressPasses, "pressPasses"),
    fileOverrun: nonNegativeInteger(fileOverrun, "fileOverrun"),
    pairOverrun: nonNegativeInteger(pairOverrun, "pairOverrun"),
    fileUnderproduction: nonNegativeInteger(fileUnderproduction, "fileUnderproduction"),
    pairUnderproduction: nonNegativeInteger(pairUnderproduction, "pairUnderproduction"),
    splitOrders: nonNegativeInteger(splitOrders, "splitOrders"),
    fragmentedBlocks: nonNegativeInteger(fragmentedBlocks, "fragmentedBlocks"),
    distinctOrdersPerImposition: nonNegativeNumber(
      distinctOrdersPerImposition,
      "distinctOrdersPerImposition",
    ),
    layoutCompactness: optionalNonNegativeNumber(layoutCompactness, "layoutCompactness"),
    orderedFinishedQuantity: optionalPositiveInteger(
      orderedFinishedQuantity,
      "orderedFinishedQuantity",
    ),
    pricingStatus: normalizedCost.pricingStatus,
    currency: normalizedCost.currency,
    sheetBasis: normalizedCost.sheetBasis,
    grammageGsm: normalizedCost.grammageGsm,
    paperWeightKg: normalizedCost.paperWeightKg,
    paperCost: normalizedCost.paperCost,
    colorPlateCost: normalizedCost.colorPlateCost,
    layoutFormPreparationCost: normalizedCost.layoutFormPreparationCost,
    estimatedTotalCost: normalizedCost.estimatedTotalCost,
    estimatedUnitCost: normalizedCost.estimatedUnitCost,
  });

  return Object.freeze({
    ...normalized,
    zeroUnderproduction: normalized.fileUnderproduction === 0 && normalized.pairUnderproduction === 0,
  });
}

export function createDecisionSolution({ id, label, metrics }) {
  if (!metrics || metrics.kind !== SOLUTION_METRICS_KIND) {
    throw new TypeError("metrics must be normalized SolutionMetrics");
  }
  if (metrics.pricingStatus !== PRICING_STATUS.READY || metrics.estimatedTotalCost === null) {
    throw new RangeError("pricing must be ready before estimatedTotalCost can enter decision ranking");
  }
  return Object.freeze({
    id: requiredText(id ?? metrics.id, "id"),
    label: requiredText(label ?? metrics.label, "label"),
    metrics: Object.freeze({
      physicalSheets: metrics.physicalSheets,
      estimatedTotalCost: metrics.estimatedTotalCost,
      layoutForms: metrics.layoutForms,
      colorPlates: metrics.colorPlates,
      fileOverrun: metrics.fileOverrun,
      pairOverrun: metrics.pairOverrun,
      pressPasses: metrics.pressPasses,
      splitOrders: metrics.splitOrders,
      impositionCount: metrics.impositionCount,
      layoutCompactness: metrics.layoutCompactness,
      distinctOrdersPerImposition: metrics.distinctOrdersPerImposition,
    }),
  });
}
