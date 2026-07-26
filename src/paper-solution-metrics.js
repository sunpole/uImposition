import { calculateProductionCost } from "./production-cost.js";
import { PAPER_SOLUTION_KIND } from "./paper-minimizer.js";
import { createSolutionMetrics } from "./solution-metrics.js";
import {
  analyzeImpositionOrderDistribution,
  distributionRowsFromPaperSolution,
} from "./imposition-distribution.js";
import { DEFAULT_COLOR_PLATES_PER_LAYOUT_FORM } from "./production-solution-metrics.js";

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

function requirePaperSolution(solution) {
  if (!solution || solution.kind !== PAPER_SOLUTION_KIND || solution.valid !== true) {
    throw new TypeError("A valid paper minimum solution is required");
  }
  if (!solution.metrics || !Array.isArray(solution.fileMetrics) || solution.fileMetrics.length === 0) {
    throw new TypeError("paper solution metrics and fileMetrics are required");
  }
  return solution;
}

function summarizeFiles(fileMetrics) {
  const seen = new Set();
  let orderedFinishedQuantity = 0;
  let fileUnderproduction = 0;

  fileMetrics.forEach((metric, index) => {
    const file = String(metric?.file ?? "").trim();
    if (!file) throw new RangeError(`fileMetrics[${index}].file is required`);
    if (seen.has(file)) throw new RangeError(`Duplicate paper solution file metric: ${file}`);
    seen.add(file);
    orderedFinishedQuantity += nonNegativeInteger(
      metric.requiredQuantity,
      `fileMetrics[${index}].requiredQuantity`,
    );
    fileUnderproduction += nonNegativeInteger(
      metric.underproduction,
      `fileMetrics[${index}].underproduction`,
    );
  });

  return Object.freeze({ orderedFinishedQuantity, fileUnderproduction });
}

export function createPaperSolutionMetrics({
  solution,
  sourceSheet,
  pricing = null,
  id = "paper-minimum",
  label = "Paper minimum",
  source = "paper-minimizer",
  layoutCompactness = null,
  colorsPerLayoutForm = DEFAULT_COLOR_PLATES_PER_LAYOUT_FORM,
} = {}) {
  const normalizedSolution = requirePaperSolution(solution);
  const metrics = normalizedSolution.metrics;
  const layoutForms = nonNegativeInteger(metrics.forms, "solution.metrics.forms");
  const colorPlates = layoutForms * nonNegativeInteger(
    colorsPerLayoutForm,
    "colorsPerLayoutForm",
  );
  const fileSummary = summarizeFiles(normalizedSolution.fileMetrics);
  const distribution = analyzeImpositionOrderDistribution(
    distributionRowsFromPaperSolution(normalizedSolution),
  );
  const physicalSheets = nonNegativeInteger(
    metrics.physicalSheets,
    "solution.metrics.physicalSheets",
  );

  const productionCost = pricing
    ? calculateProductionCost({
      sourceSheet: {
        width: positiveNumber(sourceSheet?.width, "sourceSheet.width"),
        height: positiveNumber(sourceSheet?.height, "sourceSheet.height"),
      },
      physicalSheets,
      colorPlates,
      layoutForms,
      orderedFinishedQuantity: fileSummary.orderedFinishedQuantity,
      pricing,
    })
    : null;

  return createSolutionMetrics({
    id,
    label,
    source,
    duplexMode: normalizedSolution.duplexMode,
    physicalSheets,
    impositionCount: nonNegativeInteger(
      metrics.impositionCount,
      "solution.metrics.impositionCount",
    ),
    layoutForms,
    colorPlates,
    pressPasses: nonNegativeInteger(metrics.pressPasses, "solution.metrics.pressPasses"),
    fileOverrun: nonNegativeInteger(metrics.fileOverrun, "solution.metrics.fileOverrun"),
    pairOverrun: nonNegativeInteger(metrics.pairOverrun, "solution.metrics.pairOverrun"),
    fileUnderproduction: fileSummary.fileUnderproduction,
    pairUnderproduction: nonNegativeInteger(
      metrics.remainingPairQuantity,
      "solution.metrics.remainingPairQuantity",
    ),
    splitOrders: distribution.splitOrders,
    fragmentedBlocks: distribution.fragmentedBlocks,
    distinctOrdersPerImposition: distribution.distinctOrdersPerImposition,
    layoutCompactness,
    orderedFinishedQuantity: fileSummary.orderedFinishedQuantity,
    productionCost,
  });
}
