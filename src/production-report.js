import { validateImposition } from "./imposition-validation.js";
import {
  DUPLEX_MODES,
  calculateFileMetrics,
  calculatePairMetrics,
  calculateRunMetrics,
} from "./production-metrics.js";
import {
  assertProductionReady as assertReady,
  validateProductionReport,
} from "./production-validation.js";

function validateExplicitImpositions(impositions, pagePairs) {
  if (!Array.isArray(impositions) || impositions.length === 0) {
    throw new TypeError("impositions must be a non-empty array");
  }

  return Object.freeze(impositions.map((record, index) => {
    if (!record?.front || !record?.back) {
      throw new TypeError(`impositions[${index}] must contain front and back layouts`);
    }

    const validation = validateImposition({
      front: record.front,
      back: record.back,
      pagePairs,
    });
    if (!validation.valid) {
      throw new Error(
        `Imposition ${record.front.id ?? index + 1} is invalid: ${validation.errors.join("; ")}`,
      );
    }

    return Object.freeze({
      impositionId: String(record.front.id),
      valid: true,
      errors: Object.freeze([]),
    });
  }));
}

export function buildProductionReport({
  pagePairs,
  impositions,
  duplexMode = DUPLEX_MODES.SEPARATE_FRONT_BACK_FORMS,
}) {
  if (!Array.isArray(pagePairs) || pagePairs.length === 0) {
    throw new TypeError("pagePairs must be a non-empty array");
  }

  const impositionValidations = validateExplicitImpositions(impositions, pagePairs);
  const fronts = impositions.map((record) => record.front);
  const pairMetrics = calculatePairMetrics({ pagePairs, fronts });
  const fileMetrics = calculateFileMetrics(pairMetrics);
  const runMetrics = calculateRunMetrics({ impositions, duplexMode });

  const totals = Object.freeze({
    pairCount: pairMetrics.length,
    fileCount: fileMetrics.length,
    impositionCount: runMetrics.impositionCount,
    requiredPairQuantity: pairMetrics.reduce((sum, metric) => sum + metric.requiredQuantity, 0),
    producedPairQuantity: pairMetrics.reduce((sum, metric) => sum + metric.producedQuantity, 0),
    underproduction: pairMetrics.reduce((sum, metric) => sum + metric.underproduction, 0),
    overrun: pairMetrics.reduce((sum, metric) => sum + metric.overrun, 0),
    requiredFileQuantity: fileMetrics.reduce((sum, metric) => sum + metric.requiredQuantity, 0),
    producedCompleteFileQuantity: fileMetrics.reduce((sum, metric) => sum + metric.producedQuantity, 0),
    fileUnderproduction: fileMetrics.reduce((sum, metric) => sum + metric.underproduction, 0),
    fileOverrun: fileMetrics.reduce((sum, metric) => sum + metric.overrun, 0),
    physicalSheets: runMetrics.physicalSheets,
    frontForms: runMetrics.frontForms,
    backForms: runMetrics.backForms,
    forms: runMetrics.forms,
    pressPasses: runMetrics.pressPasses,
  });

  const reportCore = Object.freeze({
    schemaVersion: 1,
    duplexMode,
    pairMetrics,
    fileMetrics,
    runMetrics,
    totals,
    impositionValidations,
  });
  const validation = validateProductionReport(reportCore);

  return Object.freeze({
    ...reportCore,
    status: validation.valid ? "ready" : "invalid",
    valid: validation.valid,
    errors: validation.errors,
    validation,
  });
}

export function assertProductionReady(report) {
  return assertReady(report);
}
