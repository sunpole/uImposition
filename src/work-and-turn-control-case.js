import { createBackLayout } from "./back-layout.js";
import {
  DUPLEX_SEARCH_MODES,
  DUPLEX_STRATEGIES,
  selectDuplexAlternatives,
} from "./duplex-strategies.js";
import { createFrontLayout } from "./front-layout.js";
import { buildProductionReport } from "./production-report.js";
import { createProductionReportSolutionMetrics } from "./production-solution-metrics.js";
import {
  createWorkAndTurnPlateLayout,
  materializeWorkAndTurnImposition,
} from "./work-and-turn-layout.js";

export const WORK_AND_TURN_CONTROL_CASE = Object.freeze({
  id: "m7-4-a6-four-orders-1plus1",
  product: Object.freeze({ width: 105, height: 148, pages: 2 }),
  colorMode: "1+1",
  quantityPerFile: 4000,
  sourceSheet: Object.freeze({ width: 620, height: 450 }),
  printableArea: Object.freeze({ width: 608, height: 431 }),
  grid: Object.freeze({ rows: 4, columns: 4, rotation: 90, capacity: 16 }),
  runLength: 1000,
  files: Object.freeze(["A", "B", "C", "D"]),
});

function controlPagePairs() {
  return Object.freeze(WORK_AND_TURN_CONTROL_CASE.files.map((file) => Object.freeze({
    file,
    pairIndex: 1,
    quantity: WORK_AND_TURN_CONTROL_CASE.quantityPerFile,
    frontPage: 1,
    backPage: 2,
  })));
}

function compactness() {
  const { product, printableArea, grid } = WORK_AND_TURN_CONTROL_CASE;
  return grid.capacity * product.width * product.height / (printableArea.width * printableArea.height);
}

function createSeparateRecord(pagePairs) {
  const { grid, runLength, files } = WORK_AND_TURN_CONTROL_CASE;
  const front = createFrontLayout({
    id: "m7-4-separate-front-back",
    runLength,
    rows: grid.rows,
    columns: grid.columns,
    rotation: grid.rotation,
    blocks: files.map((file) => ({ file, frontPage: 1, count: 4 })),
    pagePairs,
  });
  const back = createBackLayout(front);
  return Object.freeze({ front, back });
}

function createWorkAndTurnRecord(pagePairs) {
  const { grid, runLength } = WORK_AND_TURN_CONTROL_CASE;
  const halfRows = [
    [{ file: "A", frontPage: 1 }, { file: "B", frontPage: 1 }],
    [{ file: "C", frontPage: 1 }, { file: "D", frontPage: 1 }],
    [{ file: "A", frontPage: 1 }, { file: "B", frontPage: 1 }],
    [{ file: "C", frontPage: 1 }, { file: "D", frontPage: 1 }],
  ];
  const plate = createWorkAndTurnPlateLayout({
    id: "m7-4-work-and-turn",
    runLength,
    rows: grid.rows,
    columns: grid.columns,
    rotation: grid.rotation,
    halfRows,
    pagePairs,
  });
  const imposition = materializeWorkAndTurnImposition({ plate, pagePairs });
  return Object.freeze({ plate, imposition });
}

function createMetrics({ report, pricing, id, label, source }) {
  return createProductionReportSolutionMetrics({
    report,
    sourceSheet: WORK_AND_TURN_CONTROL_CASE.sourceSheet,
    pricing,
    id,
    label,
    source,
    layoutCompactness: compactness(),
    distinctOrdersPerImposition: 4,
    splitOrders: 0,
    fragmentedBlocks: 4,
    colorsPerLayoutForm: 1,
  });
}

function assertExpectedControlResult({ separate, workAndTurn }) {
  const expectedCommon = Object.freeze({
    physicalSheets: 1000,
    pressPasses: 2000,
    fileUnderproduction: 0,
    pairUnderproduction: 0,
    fileOverrun: 0,
    pairOverrun: 0,
  });

  Object.entries(expectedCommon).forEach(([key, expected]) => {
    if (separate[key] !== expected) {
      throw new Error(`Separate control metric ${key} must equal ${expected}; received ${separate[key]}`);
    }
    if (workAndTurn[key] !== expected) {
      throw new Error(`Work-and-turn control metric ${key} must equal ${expected}; received ${workAndTurn[key]}`);
    }
  });

  if (separate.layoutForms !== 2 || workAndTurn.layoutForms !== 1) {
    throw new Error("Control case must reduce layout forms from 2 to 1");
  }
  if (separate.colorPlates !== 2 || workAndTurn.colorPlates !== 1) {
    throw new Error("Control case must reduce 1+1 color plates from 2 to 1");
  }
}

function comparisonSavings(separate, workAndTurn) {
  const moneyReady = separate.estimatedTotalCost !== null && workAndTurn.estimatedTotalCost !== null;
  return Object.freeze({
    physicalSheets: separate.physicalSheets - workAndTurn.physicalSheets,
    pressPasses: separate.pressPasses - workAndTurn.pressPasses,
    layoutForms: separate.layoutForms - workAndTurn.layoutForms,
    colorPlates: separate.colorPlates - workAndTurn.colorPlates,
    paperCost: moneyReady ? separate.paperCost - workAndTurn.paperCost : null,
    colorPlateCost: moneyReady ? separate.colorPlateCost - workAndTurn.colorPlateCost : null,
    layoutFormPreparationCost: moneyReady
      ? separate.layoutFormPreparationCost - workAndTurn.layoutFormPreparationCost
      : null,
    estimatedTotalCost: moneyReady
      ? separate.estimatedTotalCost - workAndTurn.estimatedTotalCost
      : null,
  });
}

export function createWorkAndTurnControlComparison({
  pricing = null,
  searchMode = DUPLEX_SEARCH_MODES.COMPARE_BOTH,
} = {}) {
  const pagePairs = controlPagePairs();
  const separateRecord = createSeparateRecord(pagePairs);
  const workAndTurnRecord = createWorkAndTurnRecord(pagePairs);

  const separateReport = buildProductionReport({
    pagePairs,
    impositions: [separateRecord],
    duplexMode: DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS,
  });
  const workAndTurnReport = buildProductionReport({
    pagePairs,
    impositions: [workAndTurnRecord.imposition],
    duplexMode: DUPLEX_STRATEGIES.WORK_AND_TURN,
  });

  const separate = createMetrics({
    report: separateReport,
    pricing,
    id: "a6-separate-front-back",
    label: "Separate front/back forms",
    source: "m7-4-control-separate",
  });
  const workAndTurn = createMetrics({
    report: workAndTurnReport,
    pricing,
    id: "a6-work-and-turn",
    label: "Work-and-turn shared plate",
    source: "m7-4-control-work-and-turn",
  });
  assertExpectedControlResult({ separate, workAndTurn });

  const alternativesByStrategy = Object.freeze({
    [DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS]: separate,
    [DUPLEX_STRATEGIES.WORK_AND_TURN]: workAndTurn,
  });

  return Object.freeze({
    controlCase: WORK_AND_TURN_CONTROL_CASE,
    searchMode,
    pagePairs,
    plate: workAndTurnRecord.plate,
    operation: workAndTurnRecord.imposition.operation,
    reports: Object.freeze({
      [DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS]: separateReport,
      [DUPLEX_STRATEGIES.WORK_AND_TURN]: workAndTurnReport,
    }),
    alternativesByStrategy,
    alternatives: selectDuplexAlternatives({ searchMode, alternatives: alternativesByStrategy }),
    savings: comparisonSavings(separate, workAndTurn),
  });
}
