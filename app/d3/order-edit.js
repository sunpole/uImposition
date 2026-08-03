"use strict";

function updateExistingControl(control, { final = false } = {}) {
  const rowNode = control.closest("[data-product-row]");
  const row = rowForId(rowNode?.dataset.rowId);
  if (!row) return;
  const field = control.dataset.existingField;
  control.removeAttribute("aria-invalid");

  if (field === "name") {
    const name = control.value.trim();
    if (!name && final) {
      const generated = nextAutomaticName();
      control.value = generated;
      updateRow(row.id, { name: generated });
    } else {
      updateRow(row.id, { name: control.value });
    }
    return;
  }

  if (field === "format") {
    const size = D3_STANDARD_FORMATS[control.value];
    if (size) {
      updateRow(row.id, { finished: { widthMm: size.widthMm, heightMm: size.heightMm } });
      renderProducts();
    }
    return;
  }

  if (field === "widthMm" || field === "heightMm") {
    const normalized = control.value.trim().replace(",", ".");
    updateRow(row.id, { finished: { [field]: normalized === "" ? null : normalized } });
    if (final) {
      const next = rowForId(row.id);
      control.value = formatD3Decimal(next?.finished?.[field]);
      const formatControl = $(`[data-row-id="${CSS.escape(row.id)}"] [data-existing-field="format"]`, ui.productList);
      if (formatControl && next) formatControl.value = rowFormat(next);
    }
    return;
  }

  if (field === "colorfulness") {
    const validation = validateD3Draft({
      name: row.name,
      format: rowFormat(row),
      widthMm: row.finished.widthMm,
      heightMm: row.finished.heightMm,
      colorfulness: control.value,
      bleedMm: row.bleed.uniformMm,
      pages: row.pages,
      quantity: row.quantityPerVariant,
    }, printableArea());
    if (validation.normalized.frontColors === null) {
      control.setAttribute("aria-invalid", "true");
      return;
    }
    control.value = validation.normalized.colorfulness;
    updateRow(row.id, {
      print: createD3PrintInput(
        validation.normalized.frontColors,
        validation.normalized.backColors,
        { duplexPreference: row.print.duplexPreference },
      ),
    });
    return;
  }

  if (field === "bleedMm") {
    const validation = validateD3Draft({
      name: row.name,
      format: rowFormat(row),
      widthMm: row.finished.widthMm,
      heightMm: row.finished.heightMm,
      colorfulness: rowColorfulness(row),
      bleedMm: control.value,
      pages: row.pages,
      quantity: row.quantityPerVariant,
    }, printableArea());
    if (validation.normalized.bleedMm === null) {
      control.setAttribute("aria-invalid", "true");
      return;
    }
    control.value = formatD3Decimal(validation.normalized.bleedMm, 1);
    updateRow(row.id, {
      bleed: { mode: "uniform", uniformMm: validation.normalized.bleedMm },
      cut: {
        mode: validation.normalized.bleedMm > 0 ? "separated" : "commonCut",
        gapMm: 0,
      },
    });
    return;
  }

  if (field === "pages" || field === "quantity") {
    const compact = control.value.replace(/\s+/g, "");
    const target = field === "pages" ? "pages" : "quantityPerVariant";
    updateRow(row.id, { [target]: compact === "" ? null : compact });
    if (final) {
      const next = rowForId(row.id);
      control.value = field === "quantity"
        ? formatD3Integer(next?.quantityPerVariant)
        : String(next?.pages ?? "");
    }
  }
}

function swapExistingRow(rowId) {
  const row = rowForId(rowId);
  if (!row) return;
  updateRow(rowId, {
    finished: {
      widthMm: row.finished.heightMm,
      heightMm: row.finished.widthMm,
    },
  });
  renderProducts();
}

function commitDraft() {
  if (selectedRowId !== null) return;
  const validation = currentDraftValidation();
  if (!validation.valid) {
    renderTopSummary();
    return;
  }
  const fallbackName = validation.normalized.name || nextAutomaticName();
  try {
    const beforeIds = new Set(getApplicationProductRows(state).rows.map(({ id }) => id));
    state = addApplicationProductRow(state, createD3ProductInput(validation, { fallbackName }));
    const added = getApplicationProductRows(state).rows.find(({ id }) => !beforeIds.has(id));
    if (added) state = moveApplicationProductRow(state, added.id, 0);
    saveState();
    selectedRowId = null;
    clearDraft();
    renderProducts();
    scheduleCalculation({ immediate: true });
    $("#draftName").focus();
  } catch (error) {
    storageWarning = `Заказ не добавлен: ${error.message}`;
    renderStatus();
  }
}

function copyRow(rowId) {
  const rows = getApplicationProductRows(state).rows;
  const sourceIndex = rows.findIndex(({ id }) => id === rowId);
  const source = rows[sourceIndex];
  if (!source) return;
  try {
    const naming = createD3CopyName(source.name, d3Meta.copySequences);
    d3Meta = { ...d3Meta, copySequences: naming.sequences };
    saveD3Meta();
    const beforeIds = new Set(rows.map(({ id }) => id));
    state = addApplicationProductRow(state, { ...source, id: undefined, name: naming.name });
    const added = getApplicationProductRows(state).rows.find(({ id }) => !beforeIds.has(id));
    if (added) {
      state = moveApplicationProductRow(state, added.id, sourceIndex + 1);
      selectedRowId = added.id;
    }
    clearDraft();
    saveState();
    renderProducts();
    scheduleCalculation({ immediate: true });
  } catch (error) {
    storageWarning = `Копия не создана: ${error.message}`;
    renderStatus();
  }
}

function hideUndoBar() {
  clearTimeout(undoTimer);
  ui.undoBar.hidden = true;
  undoSnapshot = null;
}

function showUndoBar() {
  clearTimeout(undoTimer);
  ui.undoBar.hidden = false;
  undoTimer = setTimeout(hideUndoBar, UNDO_WINDOW_MS);
}

function deleteRow(rowId) {
  const rows = getApplicationProductRows(state).rows;
  const index = rows.findIndex(({ id }) => id === rowId);
  if (index < 0) return;
  undoSnapshot = {
    rows,
    deletedRowId: rowId,
    deletedIndex: index,
  };
  state = removeApplicationProductRow(state, rowId);
  selectedRowId = null;
  clearDraft();
  saveState();
  renderProducts();
  showUndoBar();
  scheduleCalculation({ immediate: true });
}

function undoDelete() {
  if (!undoSnapshot) return;
  state = replaceApplicationProductRows(state, {
    schemaVersion: 1,
    rows: undoSnapshot.rows,
  });
  selectedRowId = undoSnapshot.deletedRowId;
  saveState();
  clearTimeout(undoTimer);
  ui.undoBar.hidden = true;
  undoSnapshot = null;
  renderProducts();
  renderTopSummary();
  scheduleCalculation({ immediate: true });
}
