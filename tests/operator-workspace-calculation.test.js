import test from "node:test";
import assert from "node:assert/strict";

import {
  createDefaultApplicationState,
  replaceApplicationInput,
} from "../src/application-state.js";
import {
  addApplicationProductRow,
  updateApplicationProductRow,
} from "../src/application-product-rows.js";
import {
  calculateOperatorWorkspace,
  createOperatorWorkspaceCalculationRequest,
  resolveOperatorWorkspaceCalculation,
} from "../src/operator-workspace-calculation.js";

function validState({ pages = 2, duplexPreference = "auto" } = {}) {
  return addApplicationProductRow(createDefaultApplicationState(), {
    name: "Листовка А6",
    finished: { widthMm: 105, heightMm: 148 },
    quantityPerVariant: 1000,
    variantCount: 2,
    pages,
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

test("operator workspace builds real uniform plans from application product rows", () => {
  const result = calculateOperatorWorkspace(validState());

  assert.equal(result.status, "ready");
  assert.equal(result.summary.enabledRowCount, 1);
  assert.equal(result.summary.variantCount, 2);
  assert.equal(result.pagePairs.length, 2);
  assert.equal(result.plans.length, 5);
  assert.ok(result.plans.some(({ recommended }) => recommended));
  assert.equal(result.selectedPlanId, result.plans.find(({ recommended }) => recommended).id);
  assert.equal(result.layoutPreview.cells.length, result.layoutPreview.capacity);
  assert.equal(result.layoutPreview.frontCells.length, result.layoutPreview.capacity);
  assert.equal(result.layoutPreview.backCells.length, result.layoutPreview.capacity);
  assert.equal(result.layoutPreview.rows * result.layoutPreview.columns, result.layoutPreview.capacity);
  assert.equal(result.geometry.source.width, 620);
  assert.equal(result.geometry.trimmed.width, 616);
  assert.equal(result.geometry.printable.width, 608);
  assert.equal(result.pricingReady, false);
  assert.equal(result.selectedPlan.metrics.estimatedTotalCost, null);
});

test("operator duplex preference filters actual plan families", () => {
  const separate = calculateOperatorWorkspace(validState({
    duplexPreference: "separateFrontBackForms",
  }));
  assert.equal(separate.status, "ready");
  assert.equal(separate.plans.length, 4);
  assert.equal(separate.plans.every(({ duplexMode }) => (
    duplexMode === "separateFrontBackForms"
  )), true);

  const workAndTurn = calculateOperatorWorkspace(validState({
    duplexPreference: "workAndTurn",
  }));
  assert.equal(workAndTurn.status, "ready");
  assert.equal(workAndTurn.plans.length, 1);
  assert.equal(workAndTurn.selectedPlan.duplexMode, "workAndTurn");
  assert.equal(workAndTurn.layoutPreview.duplexMode, "workAndTurn");
  assert.equal(workAndTurn.layoutPreview.sharedPlate.samePlateForBothPasses, true);
  assert.equal(workAndTurn.layoutPreview.sharedPlate.turnAxis, "horizontal");
  assert.equal(
    workAndTurn.layoutPreview.sharedPlate.cells.length,
    workAndTurn.layoutPreview.capacity,
  );
});

test("forced work-and-turn rejects an odd-page technical blank", () => {
  const result = calculateOperatorWorkspace(validState({
    pages: 3,
    duplexPreference: "workAndTurn",
  }));

  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some(({ code }) => (
    code === "uniformPipelineWorkAndTurnRequiresCompletePagePairs"
  )));
  assert.equal(result.planSet, null);
});

test("workspace preview exposes the core horizontal mirror: 1 2 3 4 becomes 4 3 2 1", () => {
  const preview = calculateOperatorWorkspace(validState()).layoutPreview;

  for (let row = 0; row < preview.rows; row += 1) {
    for (let column = 0; column < preview.columns; column += 1) {
      const back = preview.backCells[(row * preview.columns) + column];
      const mirroredFront = preview.frontCells[
        (row * preview.columns) + (preview.columns - column - 1)
      ];
      assert.equal(back.file, mirroredFront.file);
      assert.equal(back.pairIndex, mirroredFront.pairIndex);
      assert.equal(back.frontPage, mirroredFront.frontPage);
      assert.equal(back.backPage, mirroredFront.backPage);
      assert.equal(back.page, mirroredFront.backPage);
    }
  }
});

test("operator workspace calculates cost only after a complete pricing profile exists", () => {
  const base = validState();
  const priced = replaceApplicationInput(base, {
    ...base.input,
    pricing: {
      currency: "BYN",
      grammageGsm: 130,
      paperPricePerKg: 4.2,
      colorPlatePrice: 12,
      layoutFormPreparationPrice: 5,
    },
  });
  const result = calculateOperatorWorkspace(priced);

  assert.equal(result.status, "ready");
  assert.equal(result.pricingReady, true);
  assert.ok(result.plans.every(({ metrics }) => metrics.estimatedTotalCost !== null));
  assert.ok(result.selectedPlan.metrics.estimatedTotalCost > 0);
});

test("invalid current draft keeps the previous valid workspace result", () => {
  const base = validState();
  const firstRequest = createOperatorWorkspaceCalculationRequest(base);
  const first = resolveOperatorWorkspaceCalculation({
    currentState: firstRequest.inputState,
    request: firstRequest,
  });
  assert.equal(first.result.status, "ready");
  assert.equal(first.state.runtime.calculation.status, "ready");

  const invalid = updateApplicationProductRow(first.state, "product:1", { pages: 0 });
  const invalidRequest = createOperatorWorkspaceCalculationRequest(invalid);
  const second = resolveOperatorWorkspaceCalculation({
    currentState: invalidRequest.inputState,
    request: invalidRequest,
    previousValidResult: first.lastValidResult,
  });

  assert.equal(second.stale, false);
  assert.equal(second.state.runtime.calculation.status, "error");
  assert.equal(second.result, first.lastValidResult);
  assert.equal(second.lastValidResult, first.lastValidResult);
  assert.equal(second.attemptedResult.status, "invalid");
  assert.ok(second.attemptedResult.issues.some(({ code, field }) => (
    code === "outOfRange" && field === "pages"
  )));
});

test("a stale request cannot replace a newer input revision", () => {
  const base = validState();
  const request = createOperatorWorkspaceCalculationRequest(base);
  const newer = updateApplicationProductRow(request.inputState, "product:1", {
    quantityPerVariant: 1200,
  });
  const marker = Object.freeze({ kind: "previous-valid-result" });
  const resolved = resolveOperatorWorkspaceCalculation({
    currentState: newer,
    request,
    previousValidResult: marker,
  });

  assert.equal(resolved.stale, true);
  assert.equal(resolved.state.runtime.inputRevision, newer.runtime.inputRevision);
  assert.equal(resolved.result, marker);
  assert.equal(resolved.lastValidResult, marker);
});

test("unequal side bleeds are stored but rejected by the current uniform calculation adapter", () => {
  const state = updateApplicationProductRow(validState(), "product:1", {
    bleed: {
      mode: "sides",
      sidesMm: { left: 2, right: 2, top: 3, bottom: 3 },
    },
    cut: { mode: "separated", gapMm: 0 },
  });
  const result = calculateOperatorWorkspace(state);

  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some(({ code }) => code === "uniformCalculationRequiresEqualBleedSides"));
  assert.equal(result.planSet, null);
});

test("operator selection remains selected while the plan still exists", () => {
  const initial = calculateOperatorWorkspace(validState());
  const alternative = initial.plans.find(({ id }) => id !== initial.selectedPlanId);
  const state = validState();
  const selectedState = {
    ...state,
    runtime: {
      ...state.runtime,
      selectedPlanId: alternative.id,
    },
  };
  const result = calculateOperatorWorkspace(selectedState);

  assert.equal(result.selectedPlanId, alternative.id);
  assert.equal(result.selectedPlan.id, alternative.id);
  assert.equal(result.layoutPreview.planId, alternative.id);
});
