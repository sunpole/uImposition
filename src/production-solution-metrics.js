import { DUPLEX_STRATEGIES } from "./duplex-strategies.js";
import { calculateProductionCost } from "./production-cost.js";
import { createSolutionMetrics } from "./solution-metrics.js";

export const DEFAULT_COLOR_PLATES_PER_LAYOUT_FORM = 4;

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive number`);
  }
  return number;
}

function optionalNonNegativeNumber(value, label) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative number when provided`);
  }
  return number;
}

function reportTotals(report) {
  if (!report?.totals) throw new TypeError("A production report with totals is required");
  return report.totals;
}

export function calculateColorPlatesForReport(report, {
  colorsPerLayoutForm = DEFAULT_COLOR_PLATES_PER_LAYOUT_FORM,
} = {}) {
  const totals = reportTotals(report);
  const layoutForms = nonNegativeInteger(totals.forms, "report.totals.forms");
  const colors = nonNegativeInteger(colorsPerLayoutForm, "colorsPerLayoutForm");
  return layoutForms * colors;
}

function productionShape({ totals, duplexMode, printSpecification, colorsPerLayoutForm }) {
  const layoutForms = nonNegativeInteger(totals.forms, "report.totals.forms");
  const pressPasses = nonNegativeInteger(totals.pressPasses, "report.totals.pressPasses");

  if (!printSpecification) {
    return Object.freeze({
      layoutForms,
      colorPlates: calculateColorPlatesForReport({ totals }, { colorsPerLayoutForm }),
      pressPasses,
      colorMode: null,
    });
  }

  const frontForms = nonNegativeInteger(totals.frontForms, "report.totals.frontForms");
  const backForms = nonNegativeInteger(totals.backForms, "report.totals.backForms");
  const frontColors = nonNegativeInteger(printSpecification.frontColors, "printSpecification.frontColors");
  const backColors = nonNegativeInteger(printSpecification.backColors, "printSpecification.backColors");

  if (duplexMode === DUPLEX_STRATEGIES.WORK_AND_TURN) {
    return Object.freeze({
      layoutForms,
      colorPlates: layoutForms * Math.max(frontColors, backColors),
      pressPasses,
      colorMode: printSpecification.label,
    });
  }

  return Object.freeze({
    layoutForms,
    colorPlates: frontForms * frontColors + backForms * backColors,
    pressPasses,
    colorMode: printSpecification.label,
  });
}

export function createProductionReportSolutionMetrics({
  report,
  sourceSheet,
  pricing = null,
  id = "production-report-current",
  label = "Production report",
  source = "production-report",
  layoutCompactness = null,
  distinctOrdersPerImposition = 1,
  splitOrders = 0,
  fragmentedBlocks = 0,
  colorsPerLayoutForm = DEFAULT_COLOR_PLATES_PER_LAYOUT_FORM,
  printSpecification = null,
} = {}) {
  const totals = reportTotals(report);
  const physicalSheets = nonNegativeInteger(totals.physicalSheets, "report.totals.physicalSheets");
  const shape = productionShape({
    totals,
    duplexMode: report.duplexMode,
    printSpecification,
    colorsPerLayoutForm,
  });
  const fileOverrun = nonNegativeInteger(totals.fileOverrun, "report.totals.fileOverrun");
  const pairOverrun = nonNegativeInteger(totals.overrun, "report.totals.overrun");
  const fileUnderproduction = nonNegativeInteger(totals.fileUnderproduction, "report.totals.fileUnderproduction");
  const pairUnderproduction = nonNegativeInteger(totals.underproduction, "report.totals.underproduction");
  const orderedFinishedQuantity = nonNegativeInteger(
    totals.requiredFileQuantity,
    "report.totals.requiredFileQuantity",
  );

  const productionCost = pricing
    ? calculateProductionCost({
      sourceSheet: {
        width: positiveNumber(sourceSheet?.width, "sourceSheet.width"),
        height: positiveNumber(sourceSheet?.height, "sourceSheet.height"),
      },
      physicalSheets,
      colorPlates: shape.colorPlates,
      layoutForms: shape.layoutForms,
      orderedFinishedQuantity,
      pricing,
    })
    : null;

  return createSolutionMetrics({
    id,
    label,
    source,
    duplexMode: report.duplexMode,
    physicalSheets,
    impositionCount: nonNegativeInteger(totals.impositionCount, "report.totals.impositionCount"),
    layoutForms: shape.layoutForms,
    colorPlates: shape.colorPlates,
    pressPasses: shape.pressPasses,
    fileOverrun,
    pairOverrun,
    fileUnderproduction,
    pairUnderproduction,
    splitOrders: nonNegativeInteger(splitOrders, "splitOrders"),
    fragmentedBlocks: nonNegativeInteger(fragmentedBlocks, "fragmentedBlocks"),
    distinctOrdersPerImposition: optionalNonNegativeNumber(
      distinctOrdersPerImposition,
      "distinctOrdersPerImposition",
    ) ?? 1,
    layoutCompactness,
    orderedFinishedQuantity,
    productionCost,
  });
}
