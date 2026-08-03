import { CONFIG } from "../src/config.js";
import {
  APPLICATION_CALCULATION_STATUSES,
  APPLICATION_SCREEN_IDS,
  applySheetPressPresetToApplicationState,
  createDefaultApplicationState,
  replaceApplicationInput,
  selectApplicationPlan,
  setApplicationActiveScreen,
} from "../src/application-state.js";
import {
  addApplicationProductRow,
  getApplicationProductRows,
  moveApplicationProductRow,
  removeApplicationProductRow,
  replaceApplicationProductRows,
  setApplicationProductRowEnabled,
  updateApplicationProductRow,
} from "../src/application-product-rows.js";
import {
  createApplicationStateRepository,
  createSheetPressPresetRepository,
} from "../src/local-state-repository.js";
import {
  createBuiltInSheetPressPresets,
  createLocalSheetPressPreset,
} from "../src/sheet-press-presets.js";
import {
  calculateOperatorWorkspace,
  createOperatorWorkspaceCalculationRequest,
  resolveOperatorWorkspaceCalculation,
} from "../src/operator-workspace-calculation.js";
import { calculateSheetGeometry } from "../src/geometry.js";
import { createD3PrintInput } from "../src/d3-print-input.js";
import {
  D3_STANDARD_FORMATS,
  createD3CopyName,
  createD3ProductInput,
  emptyD3Draft,
  formatD3Decimal,
  formatD3Integer,
  recognizeD3Format,
  validateD3Draft,
} from "../src/d3-start-page.js";

window.__uimpositionD3Deps = Object.freeze({
  CONFIG,
  APPLICATION_CALCULATION_STATUSES,
  APPLICATION_SCREEN_IDS,
  applySheetPressPresetToApplicationState,
  createDefaultApplicationState,
  replaceApplicationInput,
  selectApplicationPlan,
  setApplicationActiveScreen,
  addApplicationProductRow,
  getApplicationProductRows,
  moveApplicationProductRow,
  removeApplicationProductRow,
  replaceApplicationProductRows,
  setApplicationProductRowEnabled,
  updateApplicationProductRow,
  createApplicationStateRepository,
  createSheetPressPresetRepository,
  createBuiltInSheetPressPresets,
  createLocalSheetPressPreset,
  calculateOperatorWorkspace,
  createOperatorWorkspaceCalculationRequest,
  resolveOperatorWorkspaceCalculation,
  calculateSheetGeometry,
  createD3PrintInput,
  D3_STANDARD_FORMATS,
  createD3CopyName,
  createD3ProductInput,
  emptyD3Draft,
  formatD3Decimal,
  formatD3Integer,
  recognizeD3Format,
  validateD3Draft,
});

const scripts = [
  "./d3/runtime.js",
  "./d3/storage.js",
  "./d3/presets-draft.js",
  "./d3/order-render.js",
  "./d3/order-edit.js",
  "./d3/results-render.js",
  "./d3/calculation.js",
  "./d3/controller.js",
];

for (const source of scripts) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Не удалось загрузить ${source}`));
    document.head.append(script);
  });
}
