import { expandPagePairs } from "./orders.js";
import { createFrontLayout } from "./front-layout.js";
import { createBackLayout } from "./back-layout.js";
import { validateImposition } from "./imposition-validation.js";
import { buildProductionReport } from "./production-report.js";
import { createDuplexPrintSpecification } from "./print-specification.js";
import { createProductionReportSolutionMetrics } from "./production-solution-metrics.js";

export const CONTROL_REFERENCE_KIND = "m3ControlReference";
export const CONTROL_REFERENCE_ID = "control-manual-reference";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function requireControlCase(controlCase) {
  if (!controlCase || !Array.isArray(controlCase.orders) || controlCase.orders.length === 0) {
    throw new TypeError("The M3 control case is required");
  }
  return controlCase;
}

function requireControlLayout(controlLayout) {
  if (!controlLayout || !Array.isArray(controlLayout.layouts) || controlLayout.layouts.length === 0) {
    throw new TypeError("The M3 control layout is required");
  }
  return controlLayout;
}

function productionStructure(records) {
  const filesToForms = new Map();
  let distinctOrderTotal = 0;
  records.forEach(({ front }, index) => {
    const files = new Set(front.cells.map(({ file }) => file));
    distinctOrderTotal += files.size;
    files.forEach((file) => {
      const forms = filesToForms.get(file) ?? new Set();
      forms.add(index);
      filesToForms.set(file, forms);
    });
  });
  return deepFreeze({
    splitOrders: [...filesToForms.values()].filter((forms) => forms.size > 1).length,
    distinctOrdersPerImposition: distinctOrderTotal / records.length,
  });
}

export function buildM3ControlReference({
  controlCase,
  controlLayout,
  pricing = null,
} = {}) {
  const normalizedCase = requireControlCase(controlCase);
  const normalizedLayout = requireControlLayout(controlLayout);
  const pagePairs = expandPagePairs(normalizedCase.orders);
  const records = normalizedLayout.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    if (!validation.valid) {
      throw new Error(`M3 control layout ${layout.id} is invalid: ${validation.errors.join("; ")}`);
    }
    return deepFreeze({ front, back, validation });
  });
  const report = buildProductionReport({
    pagePairs,
    impositions: records,
    duplexMode: normalizedCase.duplexMode,
  });
  const expected = normalizedCase.manualReference;
  if (
    !report.valid
    || report.totals.impositionCount !== expected.impositions
    || report.totals.frontForms !== expected.impositions
    || report.totals.backForms !== expected.impositions
    || report.totals.forms !== expected.plates
    || report.totals.physicalSheets !== expected.physicalSheets
    || report.totals.pressPasses !== expected.pressPasses
  ) {
    throw new Error("The M3 control reference does not match its verified totals");
  }

  const structure = productionStructure(records);
  const printSpecification = createDuplexPrintSpecification({ frontColors: 1, backColors: 1 });
  const metrics = createProductionReportSolutionMetrics({
    report,
    sourceSheet: normalizedCase.sheet,
    pricing,
    printSpecification,
    id: CONTROL_REFERENCE_ID,
    label: "Контрольная ручная раскладка M3",
    source: "control-reference/m3",
    layoutCompactness: 1,
    distinctOrdersPerImposition: structure.distinctOrdersPerImposition,
    splitOrders: structure.splitOrders,
    fragmentedBlocks: 0,
  });

  return deepFreeze({
    kind: CONTROL_REFERENCE_KIND,
    id: CONTROL_REFERENCE_ID,
    label: "Контрольная ручная раскладка M3",
    status: normalizedLayout.status,
    controlCase: normalizedCase,
    controlLayout: normalizedLayout,
    pagePairs,
    records,
    report,
    metrics,
    printSpecification,
    structure,
    turnMode: normalizedCase.turnMode,
  });
}
