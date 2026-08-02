"use strict";

function rowFormat(row) {
  return recognizeD3Format(row.finished.widthMm, row.finished.heightMm) || "custom";
}

function rowColorfulness(row) {
  return `${row.print.frontColors}+${row.print.backColors}`;
}

function activeFormatOptions(selected) {
  const options = Object.entries(D3_STANDARD_FORMATS).map(([id, size]) => [
    id,
    `${id} · ${formatD3Decimal(size.widthMm)}×${formatD3Decimal(size.heightMm)}`,
  ]);
  options.push(["custom", "Произвольный"]);
  return options.map(([value, label]) => (
    `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`
  )).join("");
}

function activeRowMarkup(row) {
  const format = rowFormat(row);
  const disabledControl = row.enabled === false
    ? '<button class="order-action" type="button" data-row-action="toggle" title="Включить строку">○</button>'
    : "";
  return `
    <div class="order-cell order-cell--name">${disabledControl}<input data-existing-field="name" value="${escapeHtml(row.name)}" autocomplete="off" aria-label="Название"></div>
    <div class="order-cell"><select data-existing-field="format" aria-label="Формат">${activeFormatOptions(format)}</select></div>
    <div class="order-cell"><input data-existing-field="widthMm" value="${escapeHtml(formatD3Decimal(row.finished.widthMm))}" inputmode="decimal" aria-label="Ширина"></div>
    <button class="order-cell order-action order-action--swap" type="button" data-row-action="swap" title="Поменять ширину и высоту">↔</button>
    <div class="order-cell"><input data-existing-field="heightMm" value="${escapeHtml(formatD3Decimal(row.finished.heightMm))}" inputmode="decimal" aria-label="Высота"></div>
    <div class="order-cell"><input data-existing-field="colorfulness" value="${escapeHtml(rowColorfulness(row))}" list="colorfulnessOptions" aria-label="Красочность"></div>
    <div class="order-cell"><input data-existing-field="bleedMm" value="${escapeHtml(formatD3Decimal(row.bleed.uniformMm, CONFIG.d3StartPage.bleedDecimals))}" list="bleedOptions" inputmode="decimal" aria-label="Выпуск"></div>
    <div class="order-cell"><input data-existing-field="pages" value="${escapeHtml(row.pages)}" inputmode="numeric" aria-label="Страниц"></div>
    <div class="order-cell"><input data-existing-field="quantity" value="${escapeHtml(formatD3Integer(row.quantityPerVariant))}" inputmode="numeric" aria-label="Тираж"></div>
    <button class="order-cell order-action order-action--copy" type="button" data-row-action="copy" title="Копировать">⧉</button>
    <button class="order-cell order-action order-action--danger" type="button" data-row-action="delete" title="Удалить">×</button>
  `;
}

function ordinaryRowMarkup(row) {
  const format = rowFormat(row);
  const formatLabel = format === "custom"
    ? `${formatD3Decimal(row.finished.widthMm)}×${formatD3Decimal(row.finished.heightMm)}`
    : format;
  const formatSmall = format === "custom"
    ? "произвольный"
    : `${formatD3Decimal(row.finished.widthMm)}×${formatD3Decimal(row.finished.heightMm)}`;
  return `
    <div class="order-cell order-cell--name">${escapeHtml(row.name)}${row.enabled === false ? " · ОТКЛ" : ""}</div>
    <div class="order-cell">${escapeHtml(formatLabel)}<small>${escapeHtml(formatSmall)}</small></div>
    <div class="order-cell">${escapeHtml(formatD3Decimal(row.finished.widthMm))}</div>
    <div class="order-cell">↔</div>
    <div class="order-cell">${escapeHtml(formatD3Decimal(row.finished.heightMm))}</div>
    <div class="order-cell">${escapeHtml(rowColorfulness(row))}</div>
    <div class="order-cell">${escapeHtml(formatD3Decimal(row.bleed.uniformMm, CONFIG.d3StartPage.bleedDecimals))}</div>
    <div class="order-cell">${escapeHtml(row.pages)}</div>
    <div class="order-cell">${escapeHtml(formatD3Integer(row.quantityPerVariant))}</div>
    <button class="order-cell order-action order-action--copy" type="button" data-row-action="copy" title="Копировать">⧉</button>
    <button class="order-cell order-action order-action--danger" type="button" data-row-action="delete" title="Удалить">×</button>
  `;
}

function renderProducts() {
  const rows = getApplicationProductRows(state).rows;
  ui.productList.innerHTML = "";
  rows.forEach((row) => {
    const article = document.createElement("article");
    article.className = "order-grid-row order-row";
    article.classList.toggle("is-active", row.id === selectedRowId);
    article.classList.toggle("is-disabled", row.enabled === false);
    article.dataset.productRow = "true";
    article.dataset.rowId = row.id;
    article.innerHTML = row.id === selectedRowId ? activeRowMarkup(row) : ordinaryRowMarkup(row);
    ui.productList.append(article);
  });
  renderProductIssues();
}

function renderProductIssues() {
  $$("[data-product-row] [data-existing-field]", ui.productList)
    .forEach((control) => control.removeAttribute("aria-invalid"));
  activeIssues().forEach((entry) => {
    if (!entry.rowId || entry.rowId !== selectedRowId) return;
    const row = $(`[data-row-id="${CSS.escape(entry.rowId)}"]`, ui.productList);
    if (!row) return;
    const mapping = {
      "finished.widthMm": "widthMm",
      "finished.heightMm": "heightMm",
      quantityPerVariant: "quantity",
      pages: "pages",
      "print.frontColors": "colorfulness",
      "print.backColors": "colorfulness",
      "bleed.uniformMm": "bleedMm",
      name: "name",
    };
    const field = mapping[entry.field] ?? entry.field;
    $(`[data-existing-field="${CSS.escape(field)}"]`, row)?.setAttribute("aria-invalid", "true");
  });
}

function selectExistingRow(rowId) {
  if (selectedRowId === rowId) return;
  selectedRowId = rowId;
  if (draftHasContent()) clearDraft();
  else renderTopSummary();
  renderProducts();
}

function updateRow(rowId, patch) {
  try {
    state = updateApplicationProductRow(state, rowId, patch);
    saveState();
    scheduleCalculation();
    renderTopSummary();
  } catch (error) {
    storageWarning = `Строка не обновлена: ${error.message}`;
    renderStatus();
  }
}

function rowForId(rowId) {
  return getApplicationProductRows(state).rows.find(({ id }) => id === rowId) ?? null;
}
