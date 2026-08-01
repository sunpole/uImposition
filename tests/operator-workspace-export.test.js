import test from "node:test";
import assert from "node:assert/strict";

import {
  createDefaultApplicationState,
  selectApplicationPlan,
} from "../src/application-state.js";
import { addApplicationProductRow } from "../src/application-product-rows.js";
import { calculateOperatorWorkspace } from "../src/operator-workspace-calculation.js";
import {
  createOperatorWorkspaceExportModels,
} from "../src/operator-workspace-export.js";

function validState({ duplexPreference = "auto" } = {}) {
  return addApplicationProductRow(createDefaultApplicationState(), {
    name: "Листовка А6",
    finished: { widthMm: 105, heightMm: 148 },
    quantityPerVariant: 1000,
    variantCount: 2,
    pages: 2,
    print: {
      mode: "duplex",
      frontColors: 4,
      backColors: 4,
      duplexPreference,
    },
    bleed: { mode: "uniform", uniformMm: 0 },
    cut: { mode: "commonCut", gapMm: 0 },
    rotationPolicy: "auto",
  });
}

test("workspace export models use the actual selected production plan", () => {
  const workspace = calculateOperatorWorkspace(validState());
  const models = createOperatorWorkspaceExportModels(workspace);
  const selected = workspace.planSet.plans.find(({ id }) => id === workspace.selectedPlanId);

  assert.equal(models.selectedPlanId, selected.id);
  assert.equal(models.selectedPlan, selected);
  assert.equal(models.schemeDocument.impositionCount, selected.impositions.length);
  assert.equal(models.schemeDocument.pageCount, selected.impositions.length * 2);
  assert.equal(models.summary.schemePageCount, selected.impositions.length * 2);
  assert.equal(models.summary.duplexMode, "separateFrontBackForms");
  assert.equal(models.reportDocument.fileCount, selected.report.fileMetrics.length);
  assert.equal(models.reportDocument.pairCount, selected.report.pairMetrics.length);
  assert.match(models.files.schemes, /selected-plan|uniform-/);
  assert.match(models.files.schemes, /-schemes\.pdf$/);
  assert.match(models.files.report, /-production-report\.pdf$/);
});

test("work-and-turn exports one shared plate page per imposition", () => {
  const workspace = calculateOperatorWorkspace(validState({
    duplexPreference: "workAndTurn",
  }));
  const models = createOperatorWorkspaceExportModels(workspace);

  assert.equal(workspace.status, "ready");
  assert.equal(models.selectedPlan.duplexMode, "workAndTurn");
  assert.equal(models.schemeDocument.duplexMode, "workAndTurn");
  assert.equal(models.schemeDocument.sharedPlateForBothPasses, true);
  assert.equal(models.schemeDocument.turnAxis, "horizontal");
  assert.equal(models.schemeDocument.pageCount, models.selectedPlan.impositions.length);
  assert.equal(models.summary.schemePageCount, models.selectedPlan.impositions.length);
  assert.equal(models.summary.duplexMode, "workAndTurn");

  models.schemeDocument.pages.forEach((page, index) => {
    assert.equal(page.side, "shared");
    assert.equal(page.layout, models.selectedPlan.sharedPlates[index]);
    assert.equal(page.operation.duplexMode, "workAndTurn");
    assert.equal(page.operation.turnAxis, "horizontal");
    assert.equal(page.operation.passCount, 2);
    assert.match(page.title, /ОБЩАЯ-ФОРМА/);
  });

  const summary = models.reportDocument.sections.find(({ kind }) => kind === "summary").totals;
  assert.equal(models.reportDocument.duplexMode, "workAndTurn");
  assert.equal(summary.forms, models.selectedPlan.impositions.length);
  assert.equal(summary.backForms, 0);
  assert.equal(summary.pressPasses, summary.physicalSheets * 2);
});

test("explicit operator selection overrides recommendation for both PDF models", () => {
  const initial = calculateOperatorWorkspace(validState());
  const alternative = initial.plans.find(({ id }) => id !== initial.selectedPlanId);
  const selectedState = selectApplicationPlan(validState(), alternative.id);
  const workspace = calculateOperatorWorkspace(selectedState);
  const models = createOperatorWorkspaceExportModels(workspace);

  assert.equal(workspace.selectedPlanId, alternative.id);
  assert.equal(models.selectedPlanId, alternative.id);
  assert.equal(models.schemeDocument.pages[0].impositionId, models.selectedPlan.impositions[0].front.id);
  assert.equal(
    models.reportDocument.sections.find(({ kind }) => kind === "summary").totals,
    models.selectedPlan.report.totals,
  );
});

test("scheme document preserves validated face/back order for every separate imposition", () => {
  const models = createOperatorWorkspaceExportModels(calculateOperatorWorkspace(validState()));

  models.selectedPlan.impositions.forEach((record, index) => {
    const frontPage = models.schemeDocument.pages[index * 2];
    const backPage = models.schemeDocument.pages[index * 2 + 1];
    assert.equal(frontPage.side, "front");
    assert.equal(backPage.side, "back");
    assert.equal(frontPage.layout, record.front);
    assert.equal(backPage.layout, record.back);
    assert.equal(frontPage.impositionNumber, index + 1);
    assert.equal(backPage.impositionNumber, index + 1);
  });
});

test("invalid or incomplete workspace results cannot be exported", () => {
  const invalid = calculateOperatorWorkspace(createDefaultApplicationState());
  assert.equal(invalid.status, "invalid");
  assert.throws(
    () => createOperatorWorkspaceExportModels(invalid),
    /Only a ready operator workspace result can be exported/,
  );
  assert.throws(
    () => createOperatorWorkspaceExportModels(null),
    /calculated operator workspace result is required/,
  );
});
