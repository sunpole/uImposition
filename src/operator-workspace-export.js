import { CONFIG } from "./config.js";
import {
  PDF_PAGE_MODES,
  createProductionReportPdfDocument,
  createSchemePdfDocument,
} from "./pdf-document-model.js";
import {
  downloadPdfBytes,
  renderSchemePdfBytes,
} from "./pdf-scheme-renderer.js";
import { renderProductionReportPdfBytes } from "./pdf-report-renderer.js";
import { OPERATOR_WORKSPACE_CALCULATION_KIND } from "./operator-workspace-calculation.js";

export const OPERATOR_WORKSPACE_EXPORT_KIND = "operatorWorkspaceExport";
export const OPERATOR_WORKSPACE_EXPORT_TYPES = Object.freeze({
  SCHEMES: "schemes",
  REPORT: "report",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function requireReadyWorkspaceResult(value) {
  if (!value || value.kind !== OPERATOR_WORKSPACE_CALCULATION_KIND) {
    throw new TypeError("A calculated operator workspace result is required");
  }
  if (value.status !== "ready") {
    throw new Error("Only a ready operator workspace result can be exported");
  }
  if (!value.planSet || !Array.isArray(value.planSet.plans)) {
    throw new TypeError("The workspace result does not contain a production plan set");
  }
  const selectedPlan = value.planSet.plans.find(({ id }) => id === value.selectedPlanId) ?? null;
  if (!selectedPlan) {
    throw new RangeError(`Selected workspace plan is unavailable: ${value.selectedPlanId}`);
  }
  if (!Array.isArray(selectedPlan.impositions) || selectedPlan.impositions.length === 0) {
    throw new TypeError("The selected plan does not contain validated impositions");
  }
  if (!selectedPlan.report || selectedPlan.report.valid !== true || selectedPlan.report.status !== "ready") {
    throw new TypeError("The selected plan does not contain a production-ready report");
  }
  return selectedPlan;
}

function safeFileToken(value) {
  const token = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return token || "selected-plan";
}

export function createOperatorWorkspaceExportModels(workspaceResult, {
  language = CONFIG.app.defaultLanguage,
  schemePageMode = PDF_PAGE_MODES.A4,
  reportPageMode = PDF_PAGE_MODES.A4,
} = {}) {
  const selectedPlan = requireReadyWorkspaceResult(workspaceResult);
  const planToken = safeFileToken(selectedPlan.id);
  const schemeDocument = createSchemePdfDocument({
    records: selectedPlan.impositions,
    language,
    pageMode: schemePageMode,
    sheetSize: {
      widthMm: workspaceResult.geometry.trimmed.width,
      heightMm: workspaceResult.geometry.trimmed.height,
    },
  });
  const reportDocument = createProductionReportPdfDocument({
    report: selectedPlan.report,
    language,
    pageMode: reportPageMode,
  });

  return deepFreeze({
    kind: OPERATOR_WORKSPACE_EXPORT_KIND,
    revision: workspaceResult.revision,
    selectedPlanId: selectedPlan.id,
    selectedPlan,
    schemeDocument,
    reportDocument,
    files: {
      schemes: `uImposition-${planToken}-schemes.pdf`,
      report: `uImposition-${planToken}-production-report.pdf`,
    },
    summary: {
      impositionCount: selectedPlan.impositions.length,
      schemePageCount: schemeDocument.pageCount,
      fileCount: selectedPlan.report.fileMetrics.length,
      pairCount: selectedPlan.report.pairMetrics.length,
    },
  });
}

export async function renderOperatorWorkspacePdfBytes(exportModels, type, options = {}) {
  if (!exportModels || exportModels.kind !== OPERATOR_WORKSPACE_EXPORT_KIND) {
    throw new TypeError("Operator workspace export models are required");
  }
  if (type === OPERATOR_WORKSPACE_EXPORT_TYPES.SCHEMES) {
    return renderSchemePdfBytes(exportModels.schemeDocument, options);
  }
  if (type === OPERATOR_WORKSPACE_EXPORT_TYPES.REPORT) {
    return renderProductionReportPdfBytes(exportModels.reportDocument, options);
  }
  throw new RangeError(`Unsupported operator workspace export type: ${type}`);
}

export async function downloadOperatorWorkspacePdf(exportModels, type, options = {}) {
  const bytes = await renderOperatorWorkspacePdfBytes(exportModels, type, options);
  const fileName = type === OPERATOR_WORKSPACE_EXPORT_TYPES.SCHEMES
    ? exportModels.files.schemes
    : type === OPERATOR_WORKSPACE_EXPORT_TYPES.REPORT
      ? exportModels.files.report
      : null;
  if (!fileName) throw new RangeError(`Unsupported operator workspace export type: ${type}`);
  downloadPdfBytes(bytes, fileName);
  return deepFreeze({
    type,
    fileName,
    byteLength: bytes.length,
    selectedPlanId: exportModels.selectedPlanId,
  });
}
