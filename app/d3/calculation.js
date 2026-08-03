"use strict";

function scheduleCalculation({ immediate = false } = {}) {
  clearTimeout(calculationTimer);
  state = {
    ...state,
    runtime: {
      ...state.runtime,
      calculation: {
        ...state.runtime.calculation,
        status: APPLICATION_CALCULATION_STATUSES.DIRTY,
        activeRevision: null,
        error: null,
      },
    },
  };
  renderStatus();
  renderTopSummary();
  calculationTimer = setTimeout(runCalculation, immediate ? 0 : 150);
}

function runCalculation() {
  const request = createOperatorWorkspaceCalculationRequest(state);
  state = request.inputState;
  const sequence = ++calculationSequence;
  renderStatus();
  setTimeout(() => {
    const resolution = resolveOperatorWorkspaceCalculation({
      currentState: state,
      request,
      previousValidResult: lastValidResult,
    });
    if (sequence !== calculationSequence && resolution.stale) return;
    state = resolution.state;
    attemptedResult = resolution.attemptedResult ?? attemptedResult;
    lastValidResult = resolution.lastValidResult ?? lastValidResult;
    saveState();
    renderResults();
  }, 24);
}

function applyPreset(id) {
  const preset = allPresets().find((entry) => entry.id === id);
  if (!preset) return;
  state = applySheetPressPresetToApplicationState(state, preset);
  if (preset.kind === "local") {
    try {
      presetRepository.markUsed(preset.id);
    } catch (error) {
      storageWarning = error.message;
    }
  }
  saveState();
  renderPresets();
  renderSheetFacts();
  renderTopSummary();
  closeSurfaces();
  scheduleCalculation({ immediate: true });
}

function openScreen(screen) {
  state = setApplicationActiveScreen(state, screen);
  saveState();
  renderScreens();
  closeSurfaces();
  if (screen === APPLICATION_SCREEN_IDS.LAYOUT) renderLayout();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectPlan(id) {
  if (!lastValidResult || !isCurrentResult()) return;
  state = selectApplicationPlan(state, id);
  saveState();
  const result = calculateOperatorWorkspace(state);
  if (result.status === "ready") {
    lastValidResult = result;
    attemptedResult = result;
    renderResults();
  }
}

function showPresetDialog() {
  closeSurfaces();
  ui.presetDialogError.hidden = true;
  ui.presetDialog.showModal();
}

function submitPreset(event) {
  event.preventDefault();
  const data = new FormData(ui.presetForm);
  try {
    const existing = presetRepository.list();
    const trim = Number(data.get("trim"));
    const preset = createLocalSheetPressPreset({
      name: data.get("name"),
      sheet: {
        width: data.get("width"),
        height: data.get("height"),
        sizeStage: "beforeTrim",
        trim: {
          enabled: trim > 0,
          mode: "uniform",
          uniformMm: trim,
        },
      },
      press: {
        marginsMm: {
          left: data.get("marginLeft"),
          right: data.get("marginRight"),
          top: data.get("marginTop"),
          bottom: data.get("marginBottom"),
        },
      },
      metadata: {},
    }, { existingPresets: existing });
    const saved = presetRepository.save(preset);
    state = applySheetPressPresetToApplicationState(state, saved);
    saveState();
    ui.presetDialog.close();
    renderPresets();
    renderSheetFacts();
    renderTopSummary();
    scheduleCalculation({ immediate: true });
  } catch (error) {
    ui.presetDialogError.hidden = false;
    ui.presetDialogError.textContent = error.message;
  }
}

function pricingValue(form, name) {
  const value = form.elements[name].value;
  return value === "" ? null : Number(value);
}

function openPricingDialog() {
  closeSurfaces();
  const pricing = state.input.pricing;
  ["grammageGsm", "paperPricePerKg", "colorPlatePrice", "layoutFormPreparationPrice"].forEach((name) => {
    ui.pricingForm.elements[name].value = pricing[name] ?? "";
  });
  ui.pricingDialog.showModal();
}

function submitPricing(event) {
  event.preventDefault();
  state = replaceApplicationInput(state, {
    ...state.input,
    pricing: {
      currency: "BYN",
      grammageGsm: pricingValue(ui.pricingForm, "grammageGsm"),
      paperPricePerKg: pricingValue(ui.pricingForm, "paperPricePerKg"),
      colorPlatePrice: pricingValue(ui.pricingForm, "colorPlatePrice"),
      layoutFormPreparationPrice: pricingValue(ui.pricingForm, "layoutFormPreparationPrice") ?? 0,
    },
  });
  saveState();
  ui.pricingDialog.close();
  scheduleCalculation({ immediate: true });
}

function clearPricing() {
  ["grammageGsm", "paperPricePerKg", "colorPlatePrice", "layoutFormPreparationPrice"].forEach((name) => {
    ui.pricingForm.elements[name].value = "";
  });
  submitPricing(new Event("submit", { cancelable: true }));
}

function setOpenSurface(surfaceId) {
  openSurfaceId = surfaceId;
  $$(".top-surface").forEach((surface) => {
    surface.hidden = surface.id !== surfaceId;
  });
  $$("[data-surface-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", String(button.dataset.surfaceToggle === surfaceId));
  });
}

function closeSurfaces() {
  setOpenSurface(null);
}

function toggleSurface(surfaceId) {
  setOpenSurface(openSurfaceId === surfaceId ? null : surfaceId);
}

function publishDebugSnapshot() {
  window.__uimpositionR3 = Object.freeze({
    getSnapshot: () => ({
      state,
      lastValidResult,
      attemptedResult,
      layoutSide,
      d3: {
        draft,
        meta: d3Meta,
        selectedRowId,
        openSurfaceId,
      },
    }),
    recalculate: () => scheduleCalculation({ immediate: true }),
    openScreen,
    d3: {
      commitDraft,
      selectRow: selectExistingRow,
      copyRow,
      deleteRow,
      undoDelete,
    },
  });
}
