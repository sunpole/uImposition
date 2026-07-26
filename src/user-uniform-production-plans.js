import { createBackLayout } from "./back-layout.js";
import { buildFeasibleSolutionCatalog } from "./feasible-solution-catalog.js";
import { createFrontLayout } from "./front-layout.js";
import {
  createFrontLayoutInputFromCandidate,
  createImpositionCandidate,
  createInitialDemandState,
} from "./imposition-candidate.js";
import { validateImposition } from "./imposition-validation.js";
import {
  DEFAULT_OBJECTIVE_ORDER,
  OPTIMIZATION_OBJECTIVE_IDS,
} from "./optimization-objectives.js";
import {
  materializePaperSolution,
  minimizePhysicalPaper,
} from "./paper-minimizer.js";
import { PRINT_SPECIFICATION_KIND } from "./print-specification.js";
import { buildProductionReport } from "./production-report.js";
import { createProductionReportSolutionMetrics } from "./production-solution-metrics.js";

export const USER_UNIFORM_PRODUCTION_PLAN_SET_KIND = "userUniformProductionPlanSet";
export const USER_UNIFORM_PRODUCTION_PLAN_KIND = "userUniformProductionPlan";

export const USER_UNIFORM_PLAN_FAMILY = Object.freeze({
  PAPER_MINIMUM: "paperMinimum",
  DEDICATED_PAIR_FORMS: "dedicatedPairForms",
});

const SUPPORTED_FAMILIES = Object.freeze([
  USER_UNIFORM_PLAN_FAMILY.PAPER_MINIMUM,
  USER_UNIFORM_PLAN_FAMILY.DEDICATED_PAIR_FORMS,
]);

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function requirePositiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive number`);
  }
  return number;
}

function requirePagePairs(pagePairs) {
  if (!Array.isArray(pagePairs) || pagePairs.length === 0) {
    throw new TypeError("pagePairs must be a non-empty array");
  }
  createInitialDemandState(pagePairs);
  return pagePairs;
}

function requireSourceSheet(sourceSheet) {
  return Object.freeze({
    width: requirePositiveNumber(sourceSheet?.width, "sourceSheet.width"),
    height: requirePositiveNumber(sourceSheet?.height, "sourceSheet.height"),
  });
}

function requireDuplexPrintSpecification(printSpecification) {
  if (!printSpecification || printSpecification.kind !== PRINT_SPECIFICATION_KIND) {
    throw new TypeError("A print specification is required");
  }
  if (printSpecification.frontColors <= 0 || printSpecification.backColors <= 0) {
    throw new RangeError("User uniform production plans currently require colors on both sides");
  }
  return printSpecification;
}

function normalizeOrientationCandidates(placementOptions) {
  if (!placementOptions || !Array.isArray(placementOptions.candidates)) {
    throw new TypeError("placementOptions with uniform-grid candidates is required");
  }

  const seen = new Set();
  const candidates = placementOptions.candidates
    .filter((candidate) => Number(candidate?.positions) > 0)
    .map((candidate, index) => {
      const rotation = Number(candidate.rotation);
      if (![0, 90].includes(rotation)) {
        throw new RangeError(`placementOptions.candidates[${index}].rotation must be 0 or 90`);
      }
      if (seen.has(rotation)) throw new RangeError(`Duplicate placement rotation: ${rotation}`);
      seen.add(rotation);
      const rows = requirePositiveInteger(candidate.rows, `placementOptions.candidates[${index}].rows`);
      const columns = requirePositiveInteger(
        candidate.columns,
        `placementOptions.candidates[${index}].columns`,
      );
      const capacity = rows * columns;
      if (capacity !== Number(candidate.positions)) {
        throw new RangeError(`Placement rotation ${rotation} positions do not match rows × columns`);
      }
      return Object.freeze({
        rotation,
        rows,
        columns,
        capacity,
        coveragePercent: Number(candidate.coveragePercent ?? 0),
        unused: Object.freeze({
          width: Number(candidate.unused?.width ?? 0),
          height: Number(candidate.unused?.height ?? 0),
        }),
      });
    });

  if (candidates.length === 0) {
    throw new RangeError("The product does not fit in either supported uniform-grid orientation");
  }
  return Object.freeze(candidates);
}

function materializeRunDescriptors({ runDescriptors, pagePairs }) {
  return Object.freeze(runDescriptors.map(({ candidate, runLength }) => {
    const front = createFrontLayout({
      ...createFrontLayoutInputFromCandidate(candidate, runLength),
      pagePairs,
    });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    if (!validation.valid) {
      throw new Error(`Generated imposition ${front.id} failed validation: ${validation.errors.join("; ")}`);
    }
    return Object.freeze({ front, back, validation });
  }));
}

function productionStructure(runDescriptors) {
  const filesToRuns = new Map();
  const pairsToRuns = new Map();
  let distinctOrderTotal = 0;

  runDescriptors.forEach(({ candidate }, runIndex) => {
    const files = new Set(candidate.pairPositions.map(({ file }) => file));
    distinctOrderTotal += files.size;
    files.forEach((file) => {
      const runs = filesToRuns.get(file) ?? new Set();
      runs.add(runIndex);
      filesToRuns.set(file, runs);
    });
    candidate.pairPositions.forEach((position) => {
      const runs = pairsToRuns.get(position.key) ?? new Set();
      runs.add(runIndex);
      pairsToRuns.set(position.key, runs);
    });
  });

  return Object.freeze({
    splitOrders: [...filesToRuns.values()].filter((runs) => runs.size > 1).length,
    fragmentedBlocks: [...pairsToRuns.values()].reduce(
      (sum, runs) => sum + Math.max(0, runs.size - 1),
      0,
    ),
    distinctOrdersPerImposition: runDescriptors.length > 0
      ? distinctOrderTotal / runDescriptors.length
      : 0,
  });
}

function dedicatedPairRunDescriptors({ pagePairs, grid, idPrefix }) {
  const demandState = createInitialDemandState(pagePairs);
  return Object.freeze(demandState.rows.map((row, index) => {
    const candidate = createImpositionCandidate({
      id: `${idPrefix}-PAIR-${String(index + 1).padStart(4, "0")}`,
      rows: grid.rows,
      columns: grid.columns,
      rotation: grid.rotation,
      pagePairs,
      blocks: [{
        file: row.file,
        frontPage: row.frontPage,
        count: grid.capacity,
      }],
    });
    return Object.freeze({
      candidate,
      runLength: Math.ceil(row.requiredQuantity / grid.capacity),
    });
  }));
}

function createPlan({
  id,
  label,
  family,
  grid,
  pagePairs,
  runDescriptors,
  records,
  sourceSheet,
  pricing,
  printSpecification,
  proof,
}) {
  const report = buildProductionReport({ pagePairs, impositions: records });
  if (!report.valid || report.totals.underproduction !== 0 || report.totals.fileUnderproduction !== 0) {
    throw new Error(`Generated plan ${id} is not production ready`);
  }

  const structure = productionStructure(runDescriptors);
  const metrics = createProductionReportSolutionMetrics({
    report,
    sourceSheet,
    pricing,
    printSpecification,
    id,
    label,
    source: `user-uniform/${family}`,
    layoutCompactness: 1,
    distinctOrdersPerImposition: structure.distinctOrdersPerImposition,
    splitOrders: structure.splitOrders,
    fragmentedBlocks: structure.fragmentedBlocks,
  });

  return Object.freeze({
    kind: USER_UNIFORM_PRODUCTION_PLAN_KIND,
    id,
    label,
    family,
    grid,
    printSpecification,
    runDescriptors,
    impositions: records,
    report,
    metrics,
    structure,
    proof,
  });
}

function paperMinimumPlan({ pagePairs, grid, sourceSheet, pricing, printSpecification }) {
  const id = `uniform-r${grid.rotation}-paper-minimum`;
  const paperSolution = minimizePhysicalPaper({
    pagePairs,
    rows: grid.rows,
    columns: grid.columns,
    rotation: grid.rotation,
    idPrefix: `USER-R${grid.rotation}-PAPER`,
  });
  const runDescriptors = Object.freeze(paperSolution.plannedRuns.map(({ candidate, runLength }) => Object.freeze({
    candidate,
    runLength,
  })));
  const records = materializePaperSolution({ solution: paperSolution, pagePairs });

  return createPlan({
    id,
    label: `Paper minimum · ${grid.rotation}° · ${grid.columns}×${grid.rows}`,
    family: USER_UNIFORM_PLAN_FAMILY.PAPER_MINIMUM,
    grid,
    pagePairs,
    runDescriptors,
    records,
    sourceSheet,
    pricing,
    printSpecification,
    proof: Object.freeze({
      type: paperSolution.optimality,
      paperLowerBound: paperSolution.proof.paperLowerBound,
      lowerBoundReached: paperSolution.proof.lowerBoundReached,
      explanation: paperSolution.proof.explanation,
    }),
  });
}

function dedicatedPairPlan({ pagePairs, grid, sourceSheet, pricing, printSpecification }) {
  const id = `uniform-r${grid.rotation}-dedicated-pairs`;
  const runDescriptors = dedicatedPairRunDescriptors({
    pagePairs,
    grid,
    idPrefix: `USER-R${grid.rotation}-DEDICATED`,
  });
  const records = materializeRunDescriptors({ runDescriptors, pagePairs });

  return createPlan({
    id,
    label: `Dedicated pair forms · ${grid.rotation}° · ${grid.columns}×${grid.rows}`,
    family: USER_UNIFORM_PLAN_FAMILY.DEDICATED_PAIR_FORMS,
    grid,
    pagePairs,
    runDescriptors,
    records,
    sourceSheet,
    pricing,
    printSpecification,
    proof: Object.freeze({
      type: "constructedFeasible",
      completeWithinFamily: true,
      explanation: "Each page pair receives a full dedicated form and the shortest integer run that satisfies its quantity.",
    }),
  });
}

function activeObjectiveIds(pricing) {
  const ids = pricing
    ? [...OPTIMIZATION_OBJECTIVE_IDS]
    : OPTIMIZATION_OBJECTIVE_IDS.filter((id) => id !== "estimatedTotalCost");
  return Object.freeze(ids);
}

function activeObjectiveOrder(pricing, objectiveOrder) {
  const requested = Array.isArray(objectiveOrder) && objectiveOrder.length > 0
    ? objectiveOrder
    : DEFAULT_OBJECTIVE_ORDER;
  return Object.freeze(requested.filter((id) => pricing || id !== "estimatedTotalCost"));
}

/**
 * Builds real, independently validated production plans from the user's current
 * uniform product, page pairs, printable geometry and explicit duplex colors.
 *
 * The current requested search space is intentionally finite and transparent:
 * every fitting 0°/90° uniform grid × two complete plan families. The returned
 * catalog is exhaustive inside that declared family set, but never claims a
 * global enumeration of all possible imposition sequences or mixed layouts.
 */
export function createUserUniformProductionPlanSet({
  pagePairs,
  placementOptions,
  sourceSheet,
  printSpecification,
  pricing = null,
  objectiveOrder = DEFAULT_OBJECTIVE_ORDER,
} = {}) {
  const normalizedPagePairs = requirePagePairs(pagePairs);
  const grids = normalizeOrientationCandidates(placementOptions);
  const normalizedSourceSheet = requireSourceSheet(sourceSheet);
  const normalizedPrintSpecification = requireDuplexPrintSpecification(printSpecification);

  const plans = Object.freeze(grids.flatMap((grid) => [
    paperMinimumPlan({
      pagePairs: normalizedPagePairs,
      grid,
      sourceSheet: normalizedSourceSheet,
      pricing,
      printSpecification: normalizedPrintSpecification,
    }),
    dedicatedPairPlan({
      pagePairs: normalizedPagePairs,
      grid,
      sourceSheet: normalizedSourceSheet,
      pricing,
      printSpecification: normalizedPrintSpecification,
    }),
  ]));

  const objectiveIds = activeObjectiveIds(pricing);
  const normalizedObjectiveOrder = activeObjectiveOrder(pricing, objectiveOrder);
  const catalog = buildFeasibleSolutionCatalog(
    plans.map((plan) => Object.freeze({
      id: plan.id,
      label: plan.label,
      family: plan.family,
      grid: plan.grid,
      metrics: plan.metrics,
    })),
    {
      objectiveIds,
      objectiveOrder: normalizedObjectiveOrder,
      searchCoverage: {
        theoreticalCandidateCount: grids.length * SUPPORTED_FAMILIES.length,
        evaluatedCandidateCount: plans.length,
      },
    },
  );

  return Object.freeze({
    kind: USER_UNIFORM_PRODUCTION_PLAN_SET_KIND,
    pagePairCount: normalizedPagePairs.length,
    grids,
    supportedFamilies: SUPPORTED_FAMILIES,
    printSpecification: normalizedPrintSpecification,
    pricingReady: Boolean(pricing),
    plans,
    catalog,
    scope: Object.freeze({
      uniformProductOnly: true,
      rotations: Object.freeze(grids.map(({ rotation }) => rotation)),
      mixedRotationsEvaluated: false,
      mixedFormatsEvaluated: false,
      workAndTurnEvaluated: false,
      completeWithinDeclaredFamilies: true,
      globalCompletenessClaimed: false,
    }),
  });
}
