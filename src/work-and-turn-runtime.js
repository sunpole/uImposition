import {
  DUPLEX_SEARCH_MODES,
  DUPLEX_STRATEGIES,
  selectDuplexAlternatives,
} from "./duplex-strategies.js";
import { createWorkAndTurnControlComparison } from "./work-and-turn-control-case.js";

export const WORK_AND_TURN_STATE_EVENT = "uimposition:work-and-turn";

export const WORK_AND_TURN_RUNTIME_STATUS = Object.freeze({
  READY: "ready",
  READY_WITHOUT_PRICING: "readyWithoutPricing",
  ERROR: "error",
});

function pricingFromState(pricingState) {
  if (!pricingState?.pricing) return null;
  if (pricingState.state !== "ready" && pricingState.state !== "costReady") return null;
  return pricingState.pricing;
}

function publicMetrics(metrics) {
  return Object.freeze({
    id: metrics.id,
    label: metrics.label,
    duplexMode: metrics.duplexMode,
    physicalSheets: metrics.physicalSheets,
    impositionCount: metrics.impositionCount,
    layoutForms: metrics.layoutForms,
    colorPlates: metrics.colorPlates,
    pressPasses: metrics.pressPasses,
    fileUnderproduction: metrics.fileUnderproduction,
    pairUnderproduction: metrics.pairUnderproduction,
    fileOverrun: metrics.fileOverrun,
    pairOverrun: metrics.pairOverrun,
    pricingStatus: metrics.pricingStatus,
    currency: metrics.currency,
    paperCost: metrics.paperCost,
    colorPlateCost: metrics.colorPlateCost,
    layoutFormPreparationCost: metrics.layoutFormPreparationCost,
    estimatedTotalCost: metrics.estimatedTotalCost,
    zeroUnderproduction: metrics.zeroUnderproduction,
  });
}

function publicSavings(savings) {
  return Object.freeze({
    physicalSheets: savings.physicalSheets,
    pressPasses: savings.pressPasses,
    layoutForms: savings.layoutForms,
    colorPlates: savings.colorPlates,
    paperCost: savings.paperCost,
    colorPlateCost: savings.colorPlateCost,
    layoutFormPreparationCost: savings.layoutFormPreparationCost,
    estimatedTotalCost: savings.estimatedTotalCost,
  });
}

function publicPlatePreview(plate) {
  return Object.freeze({
    rows: plate.rows,
    columns: plate.columns,
    rotation: plate.rotation,
    turnAxis: plate.turnAxis,
    samePlateForBothPasses: plate.samePlateForBothPasses,
    cells: Object.freeze(plate.cells.map((cell) => Object.freeze({
      position: cell.position,
      row: cell.row,
      column: cell.column,
      file: cell.file,
      page: cell.page,
      pageRole: cell.pageRole,
      direction: cell.direction,
    }))),
  });
}

function compareMetrics(left, right) {
  const objectives = ["physicalSheets", "layoutForms", "colorPlates", "pressPasses"];
  for (const objective of objectives) {
    if (left[objective] !== right[objective]) return left[objective] - right[objective];
  }
  if (left.estimatedTotalCost !== null && right.estimatedTotalCost !== null) {
    if (left.estimatedTotalCost !== right.estimatedTotalCost) {
      return left.estimatedTotalCost - right.estimatedTotalCost;
    }
  }
  return left.id.localeCompare(right.id);
}

export function prepareWorkAndTurnRuntime({ pricingState = null } = {}) {
  const pricing = pricingFromState(pricingState);
  const comparison = createWorkAndTurnControlComparison({
    pricing,
    searchMode: DUPLEX_SEARCH_MODES.COMPARE_BOTH,
  });

  return Object.freeze({
    status: pricing
      ? WORK_AND_TURN_RUNTIME_STATUS.READY
      : WORK_AND_TURN_RUNTIME_STATUS.READY_WITHOUT_PRICING,
    pricingReady: Boolean(pricing),
    controlCase: Object.freeze({
      id: comparison.controlCase.id,
      product: comparison.controlCase.product,
      colorMode: comparison.controlCase.colorMode,
      quantityPerFile: comparison.controlCase.quantityPerFile,
      printableArea: comparison.controlCase.printableArea,
      grid: comparison.controlCase.grid,
      runLength: comparison.controlCase.runLength,
      files: comparison.controlCase.files,
    }),
    alternativesByStrategy: Object.freeze(Object.fromEntries(
      Object.entries(comparison.alternativesByStrategy).map(([strategy, metrics]) => [
        strategy,
        publicMetrics(metrics),
      ]),
    )),
    savings: publicSavings(comparison.savings),
    operation: Object.freeze({ ...comparison.operation }),
    platePreview: publicPlatePreview(comparison.plate),
  });
}

export function createWorkAndTurnRuntimeState({
  prepared,
  searchMode = DUPLEX_SEARCH_MODES.COMPARE_BOTH,
} = {}) {
  if (!prepared || !prepared.alternativesByStrategy) {
    throw new TypeError("A prepared work-and-turn runtime is required");
  }

  const alternatives = selectDuplexAlternatives({
    searchMode,
    alternatives: prepared.alternativesByStrategy,
  });
  const recommended = [...alternatives].sort(compareMetrics)[0];

  return Object.freeze({
    status: prepared.status,
    pricingReady: prepared.pricingReady,
    searchMode,
    recommendedStrategy: recommended.duplexMode,
    controlCase: prepared.controlCase,
    alternatives,
    savings: prepared.savings,
    operation: prepared.operation,
    platePreview: prepared.platePreview,
  });
}

export function createWorkAndTurnErrorState(error, searchMode = DUPLEX_SEARCH_MODES.COMPARE_BOTH) {
  return Object.freeze({
    status: WORK_AND_TURN_RUNTIME_STATUS.ERROR,
    pricingReady: false,
    searchMode,
    recommendedStrategy: null,
    controlCase: null,
    alternatives: Object.freeze([]),
    savings: null,
    operation: null,
    platePreview: null,
    error: Object.freeze({ message: String(error?.message ?? error ?? "Unknown work-and-turn error") }),
  });
}

export { DUPLEX_SEARCH_MODES, DUPLEX_STRATEGIES };
