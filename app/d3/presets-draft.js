"use strict";

function allPresets() {
  let locals = [];
  try {
    locals = presetRepository.list();
  } catch (error) {
    storageWarning = `Локальные пресеты не прочитаны: ${error.message}`;
  }
  return [...builtInPresets, ...locals];
}

function presetVisibleSize(preset) {
  const sheet = preset.sheet;
  if (sheet.sizeStage === "afterTrim" || !sheet.trim.enabled) {
    return { width: sheet.width, height: sheet.height };
  }
  const sides = sheet.trim.mode === "uniform"
    ? {
      left: sheet.trim.uniformMm,
      right: sheet.trim.uniformMm,
      top: sheet.trim.uniformMm,
      bottom: sheet.trim.uniformMm,
    }
    : sheet.trim.sidesMm;
  return {
    width: sheet.width - sides.left - sides.right,
    height: sheet.height - sides.top - sides.bottom,
  };
}

function renderPresets() {
  ui.presetList.innerHTML = "";
  const selectedId = state.input.selectedSheetPressPresetId;
  allPresets().forEach((preset) => {
    const visible = presetVisibleSize(preset);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `preset-button${preset.kind === "local" ? " is-local" : ""}`;
    button.classList.toggle("is-active", preset.id === selectedId);
    button.dataset.presetId = preset.id;
    button.textContent = `${formatD3Decimal(visible.width)}×${formatD3Decimal(visible.height)}`;
    button.title = preset.name;
    ui.presetList.append(button);
  });

  const geometry = currentSheetGeometry();
  ui.currentPresetText.textContent = geometry
    ? `${formatD3Decimal(geometry.trimmed.width)}×${formatD3Decimal(geometry.trimmed.height)}`
    : "Лист";
}

function renderSheetFacts() {
  const geometry = currentSheetGeometry();
  if (!geometry) {
    ui.sheetFacts.innerHTML = '<div class="sheet-fact"><span>Лист</span><strong>Проверьте пресет</strong></div>';
    return;
  }
  const margins = geometry.pressMargins;
  ui.sheetFacts.innerHTML = `
    <div class="sheet-fact"><span>Исходный</span><strong>${number(geometry.source.width)}×${number(geometry.source.height)}</strong></div>
    <div class="sheet-fact"><span>После зачистки</span><strong>${number(geometry.trimmed.width)}×${number(geometry.trimmed.height)}</strong></div>
    <div class="sheet-fact"><span>Печать</span><strong>${number(geometry.printable.width)}×${number(geometry.printable.height)}</strong></div>
    <div class="sheet-fact"><span>Поля Л/П/В/Н</span><strong>${number(margins.left)}/${number(margins.right)}/${number(margins.top)}/${number(margins.bottom)}</strong></div>
  `;
}

function currentDraftValidation() {
  return validateD3Draft(draft, printableArea());
}

function renderTopSummary() {
  const rows = getApplicationProductRows(state).rows;
  ui.liveJobs.textContent = String(rows.length);
  const currentPlan = isCurrentResult() ? lastValidResult?.selectedPlan : null;
  ui.livePlates.textContent = currentPlan ? number(currentPlan.metrics.colorPlates, 0) : "—";
  ui.liveSheets.textContent = currentPlan ? number(currentPlan.metrics.physicalSheets, 0) : "—";

  const validation = currentDraftValidation();
  ui.draftRow.classList.toggle("is-active", selectedRowId === null);
  ui.commitDraftButton.disabled = !validation.valid || selectedRowId !== null;
  ui.draftMessage.classList.toggle("is-ready", validation.valid && selectedRowId === null);
  ui.draftMessage.classList.toggle("is-error", !validation.valid && selectedRowId === null && draftHasContent());
  if (selectedRowId !== null) {
    ui.draftMessage.textContent = "Выбрана существующая строка. Верхний черновик очищен.";
  } else if (validation.valid) {
    ui.draftMessage.textContent = "Заказ готов. Нажмите + в верхней панели.";
  } else if (draftHasContent()) {
    ui.draftMessage.textContent = [...new Set(validation.issues.map((entry) => DRAFT_ISSUE_TEXT[entry.code] ?? entry.code))].join(" ");
  } else {
    ui.draftMessage.textContent = "";
  }
}

function setDraftControlValues() {
  $("#draftName").value = draft.name;
  $("#draftFormat").value = draft.format;
  $("#draftWidth").value = draft.widthMm;
  $("#draftHeight").value = draft.heightMm;
  $("#draftColorfulness").value = draft.colorfulness;
  $("#draftBleed").value = draft.bleedMm;
  $("#draftPages").value = draft.pages;
  $("#draftQuantity").value = draft.quantity;
}

function clearDraft({ persist = true } = {}) {
  draft = emptyD3Draft();
  setDraftControlValues();
  if (persist) flushDraftSave();
  renderTopSummary();
}

function syncDraftFromControls() {
  draft = {
    ...emptyD3Draft(),
    name: $("#draftName").value,
    format: $("#draftFormat").value,
    widthMm: $("#draftWidth").value,
    heightMm: $("#draftHeight").value,
    colorfulness: $("#draftColorfulness").value,
    bleedMm: $("#draftBleed").value,
    pages: $("#draftPages").value,
    quantity: $("#draftQuantity").value,
  };
  const recognized = recognizeD3Format(draft.widthMm, draft.heightMm);
  if (recognized) {
    draft.format = recognized;
    $("#draftFormat").value = recognized;
  }
  scheduleDraftSave();
  renderTopSummary();
}

function normalizeDraftField(control) {
  const validation = currentDraftValidation();
  const field = control.dataset.draftField;
  if ((field === "widthMm" || field === "heightMm") && validation.normalized[field] !== null) {
    control.value = formatD3Decimal(validation.normalized[field]);
  }
  if (field === "colorfulness" && validation.normalized.frontColors !== null) {
    control.value = validation.normalized.colorfulness;
  }
  if (field === "bleedMm" && validation.normalized.bleedMm !== null) {
    control.value = formatD3Decimal(validation.normalized.bleedMm, 1);
  }
  if (field === "pages" && validation.normalized.pages !== null) {
    control.value = String(validation.normalized.pages);
  }
  if (field === "quantity" && validation.normalized.quantity !== null) {
    control.value = formatD3Integer(validation.normalized.quantity);
  }
  syncDraftFromControls();
}

function handleDraftFormatChange() {
  const format = $("#draftFormat").value;
  const size = D3_STANDARD_FORMATS[format];
  if (size) {
    $("#draftWidth").value = formatD3Decimal(size.widthMm);
    $("#draftHeight").value = formatD3Decimal(size.heightMm);
  }
  syncDraftFromControls();
}

function swapDraftSides() {
  const width = $("#draftWidth").value;
  $("#draftWidth").value = $("#draftHeight").value;
  $("#draftHeight").value = width;
  syncDraftFromControls();
}

function draftHasContent() {
  return ["name", "format", "widthMm", "heightMm", "colorfulness", "bleedMm", "pages", "quantity"]
    .some((key) => String(draft[key] ?? "").trim());
}
