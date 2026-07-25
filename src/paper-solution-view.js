import {
  PAPER_OPTIMALITY,
  PAPER_SOLUTION_KIND,
} from "./paper-minimizer.js";

function requireFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
  return number;
}

function requireReport(report) {
  if (!report || report.valid !== true || report.status !== "ready" || !report.totals) {
    throw new TypeError("A production-ready manual report is required");
  }
  return report;
}

function requireSolution(solution) {
  if (!solution || solution.kind !== PAPER_SOLUTION_KIND || solution.valid !== true) {
    throw new TypeError("A valid paper minimum solution is required");
  }
  return solution;
}

export function formatCandidatePairSummary(candidate) {
  if (!candidate || !Array.isArray(candidate.pairPositions)) {
    throw new TypeError("A candidate with pair positions is required");
  }
  return candidate.pairPositions
    .map((pair) => `${pair.file}:${pair.pairIndex}×${pair.positionCount}`)
    .join(" + ");
}

export function buildPaperSolutionViewModel({ solution, manualReport }) {
  const normalizedSolution = requireSolution(solution);
  const normalizedReport = requireReport(manualReport);
  const manual = normalizedReport.totals;
  const automatic = normalizedSolution.metrics;

  const paperSavings = requireFiniteNumber(manual.physicalSheets, "manual physicalSheets")
    - requireFiniteNumber(automatic.physicalSheets, "automatic physicalSheets");
  const paperSavingsPercent = manual.physicalSheets === 0
    ? 0
    : paperSavings / manual.physicalSheets * 100;

  const comparisonRows = Object.freeze([
    Object.freeze({ key: "physicalSheets", manual: manual.physicalSheets, automatic: automatic.physicalSheets, delta: automatic.physicalSheets - manual.physicalSheets }),
    Object.freeze({ key: "impositions", manual: manual.impositionCount, automatic: automatic.impositionCount, delta: automatic.impositionCount - manual.impositionCount }),
    Object.freeze({ key: "forms", manual: manual.forms, automatic: automatic.forms, delta: automatic.forms - manual.forms }),
    Object.freeze({ key: "pressPasses", manual: manual.pressPasses, automatic: automatic.pressPasses, delta: automatic.pressPasses - manual.pressPasses }),
    Object.freeze({ key: "pairOverrun", manual: manual.overrun, automatic: automatic.pairOverrun, delta: automatic.pairOverrun - manual.overrun }),
    Object.freeze({ key: "fileOverrun", manual: manual.fileOverrun, automatic: automatic.fileOverrun, delta: automatic.fileOverrun - manual.fileOverrun }),
  ]);

  const plannedRuns = Object.freeze(normalizedSolution.plannedRuns.map((run, index) => Object.freeze({
    index: index + 1,
    id: run.candidate.id,
    runLength: run.runLength,
    physicalSheets: run.physicalSheets,
    pairCount: run.candidate.pairCount,
    pairSummary: formatCandidatePairSummary(run.candidate),
    mergedSourceCount: run.mergedSourceCount,
  })));

  return Object.freeze({
    provenMinimum: normalizedSolution.optimality === PAPER_OPTIMALITY.PROVEN_GLOBAL_MINIMUM,
    optimality: normalizedSolution.optimality,
    paperSavings,
    paperSavingsPercent,
    manual: Object.freeze({
      physicalSheets: manual.physicalSheets,
      impositionCount: manual.impositionCount,
      forms: manual.forms,
      pressPasses: manual.pressPasses,
      pairOverrun: manual.overrun,
      fileOverrun: manual.fileOverrun,
    }),
    automatic: Object.freeze({ ...automatic }),
    proof: Object.freeze({ ...normalizedSolution.proof }),
    comparisonRows,
    plannedRuns,
  });
}
