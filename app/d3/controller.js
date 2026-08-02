"use strict";

function configureD3Choices() {
  const format = $("#draftFormat");
  format.innerHTML = '<option value="">Не выбран</option>';
  Object.entries(D3_STANDARD_FORMATS).forEach(([id, size]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${id} · ${formatD3Decimal(size.widthMm)}×${formatD3Decimal(size.heightMm)}`;
    format.append(option);
  });
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "Произвольный";
  format.append(custom);

  $("#colorfulnessOptions").innerHTML = CONFIG.d3StartPage.colorfulnessPresets
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
  $("#bleedOptions").innerHTML = CONFIG.bleedPresetsMm
    .map((value) => `<option value="${escapeHtml(formatD3Decimal(value, CONFIG.d3StartPage.bleedDecimals))}"></option>`)
    .join("");
}

function handleRowAction(action, rowId) {
  if (action === "copy") copyRow(rowId);
  if (action === "delete") deleteRow(rowId);
  if (action === "swap") swapExistingRow(rowId);
  if (action === "toggle") {
    const row = rowForId(rowId);
    if (!row) return;
    state = setApplicationProductRowEnabled(state, rowId, !row.enabled);
    saveState();
    renderProducts();
    scheduleCalculation({ immediate: true });
  }
}

function attachEvents() {
  ui.commitDraftButton.addEventListener("click", commitDraft);
  ui.draftRow.addEventListener("focusin", () => {
    if (selectedRowId === null) return;
    selectedRowId = null;
    renderProducts();
    renderTopSummary();
  });
  $("#draftSwap").addEventListener("click", swapDraftSides);
  $("#draftFormat").addEventListener("change", handleDraftFormatChange);
  $$("[data-draft-field]").forEach((control) => {
    control.addEventListener("input", syncDraftFromControls);
    control.addEventListener("blur", () => normalizeDraftField(control));
  });

  $("#customPresetSurfaceButton").addEventListener("click", showPresetDialog);
  $("#createPresetButton").addEventListener("click", showPresetDialog);
  $("#pricingButton").addEventListener("click", openPricingDialog);
  $("#addProductButton").addEventListener("click", () => {
    selectedRowId = null;
    renderProducts();
    renderTopSummary();
    closeSurfaces();
    $("#draftName").focus();
  });

  ui.presetForm.addEventListener("submit", submitPreset);
  ui.pricingForm.addEventListener("submit", submitPricing);
  $("#clearPricingButton").addEventListener("click", clearPricing);
  ui.undoDeleteButton.addEventListener("click", undoDelete);

  ui.presetList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset-id]");
    if (button) applyPreset(button.dataset.presetId);
  });

  ui.productList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-product-row]");
    if (!row) return;
    const action = event.target.closest("[data-row-action]");
    if (action) {
      event.stopPropagation();
      handleRowAction(action.dataset.rowAction, row.dataset.rowId);
      return;
    }
    selectExistingRow(row.dataset.rowId);
  });

  ui.productList.addEventListener("input", (event) => {
    if (event.target.matches("[data-existing-field]")) {
      updateExistingControl(event.target);
    }
  });
  ui.productList.addEventListener("change", (event) => {
    if (event.target.matches("select[data-existing-field]")) {
      updateExistingControl(event.target, { final: true });
    }
  });
  ui.productList.addEventListener("focusout", (event) => {
    if (event.target.matches("[data-existing-field]")) {
      updateExistingControl(event.target, { final: true });
    }
  });

  document.addEventListener("click", (event) => {
    const surfaceButton = event.target.closest("[data-surface-toggle]");
    if (surfaceButton) {
      event.preventDefault();
      toggleSurface(surfaceButton.dataset.surfaceToggle);
      return;
    }

    const screenButton = event.target.closest("[data-open-screen]");
    if (screenButton) openScreen(screenButton.dataset.openScreen);
    const mobileButton = event.target.closest("[data-mobile-screen]");
    if (mobileButton) openScreen(mobileButton.dataset.mobileScreen);
    const selectButton = event.target.closest("[data-select-plan]");
    if (selectButton) selectPlan(selectButton.dataset.selectPlan);
    const sideButton = event.target.closest("[data-layout-side]");
    if (sideButton) {
      layoutSide = sideButton.dataset.layoutSide;
      $$("[data-layout-side]").forEach((button) => button.classList.toggle("is-active", button === sideButton));
      renderLayout();
    }

    if (
      openSurfaceId
      && !event.target.closest(".top-surface")
      && !event.target.closest("[data-surface-toggle]")
    ) {
      closeSurfaces();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSurfaces();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === CONFIG.storage.applicationStateKey) {
      try {
        const loaded = applicationRepository.load();
        if (loaded) {
          state = loaded;
          selectedRowId = null;
          lastValidResult = null;
          attemptedResult = null;
          renderAll();
          scheduleCalculation({ immediate: true });
        }
      } catch (error) {
        storageWarning = error.message;
        renderStatus();
      }
    }
    if (event.key === D3_DRAFT_KEY && selectedRowId === null) {
      try {
        draft = normalizeStoredDraft(readJson(D3_DRAFT_KEY));
        setDraftControlValues();
        renderTopSummary();
      } catch {
        // The active tab keeps its valid in-memory draft.
      }
    }
  });

  window.addEventListener("beforeunload", () => {
    flushDraftSave();
    saveD3Meta();
  });
}

configureD3Choices();
state = initialiseState();
initialiseD3State();
attachEvents();
renderAll();
scheduleCalculation({ immediate: true });
