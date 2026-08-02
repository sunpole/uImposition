"use strict";

function readJson(key) {
  const raw = storage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

function normalizeStoredDraft(value) {
  if (!value || value.schemaVersion !== 1 || !value.draft || typeof value.draft !== "object") {
    return emptyD3Draft();
  }
  const next = { ...emptyD3Draft() };
  Object.keys(next).forEach((key) => {
    if (key === "schemaVersion") return;
    const source = value.draft[key];
    next[key] = source === null || source === undefined ? "" : String(source);
  });
  return next;
}

function scanOrderSequence(rows) {
  return rows.reduce((maximum, row) => {
    const match = /^Заказ\s+(\d+)$/i.exec(String(row.name ?? "").trim());
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);
}

function normalizeStoredMeta(value, rows) {
  const fallback = {
    schemaVersion: D3_UI_SCHEMA_VERSION,
    nextOrderNumber: scanOrderSequence(rows) + 1,
    copySequences: {},
  };
  if (!value || value.schemaVersion !== D3_UI_SCHEMA_VERSION) return fallback;
  const nextOrderNumber = Number.isInteger(value.nextOrderNumber) && value.nextOrderNumber >= 1
    ? Math.max(value.nextOrderNumber, fallback.nextOrderNumber)
    : fallback.nextOrderNumber;
  const copySequences = value.copySequences && typeof value.copySequences === "object"
    ? Object.fromEntries(Object.entries(value.copySequences)
      .filter(([key, count]) => key.trim() && Number.isInteger(count) && count >= 2))
    : {};
  return { schemaVersion: D3_UI_SCHEMA_VERSION, nextOrderNumber, copySequences };
}

function initialiseState() {
  try {
    const loaded = applicationRepository.load();
    if (loaded) return loaded;
  } catch (error) {
    storageWarning = `Сохранённый проект повреждён и не был перезаписан: ${error.message}`;
  }

  let initial = createDefaultApplicationState();
  initial = applySheetPressPresetToApplicationState(initial, builtInPresets[0]);
  try {
    applicationRepository.save(initial);
  } catch (error) {
    storageWarning = `Не удалось сохранить новый проект: ${error.message}`;
  }
  return initial;
}

function initialiseD3State() {
  const rows = getApplicationProductRows(state).rows;
  try {
    draft = normalizeStoredDraft(readJson(D3_DRAFT_KEY));
  } catch (error) {
    draft = emptyD3Draft();
    storageWarning = storageWarning ?? `Черновик D3 повреждён и сброшен: ${error.message}`;
  }
  try {
    d3Meta = normalizeStoredMeta(readJson(D3_UI_KEY), rows);
  } catch (error) {
    d3Meta = normalizeStoredMeta(null, rows);
    storageWarning = storageWarning ?? `Служебные данные D3 повреждены и сброшены: ${error.message}`;
  }
}

function saveState() {
  try {
    state = applicationRepository.save(state);
  } catch (error) {
    storageWarning = `Автосохранение недоступно: ${error.message}`;
  }
}

function saveD3Meta() {
  try {
    storage.setItem(D3_UI_KEY, JSON.stringify(d3Meta));
  } catch (error) {
    storageWarning = `Служебные данные D3 не сохранены: ${error.message}`;
  }
}

function flushDraftSave() {
  clearTimeout(draftSaveTimer);
  try {
    storage.setItem(D3_DRAFT_KEY, JSON.stringify({ schemaVersion: 1, draft }));
  } catch (error) {
    storageWarning = `Черновик D3 не сохранён: ${error.message}`;
  }
}

function scheduleDraftSave() {
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(flushDraftSave, 150);
}

function nextAutomaticName() {
  const name = `Заказ ${d3Meta.nextOrderNumber}`;
  d3Meta = { ...d3Meta, nextOrderNumber: d3Meta.nextOrderNumber + 1 };
  saveD3Meta();
  return name;
}

function setStatus(kind, text) {
  ui.saveStatus.classList.toggle("is-working", kind === "working");
  ui.saveStatus.classList.toggle("is-error", kind === "error");
  ui.saveStatusText.textContent = text;
  ui.settingsSaveStatus.textContent = text;
}

function renderStatus() {
  if (storageWarning) {
    ui.globalMessage.hidden = false;
    ui.globalMessage.textContent = storageWarning;
  } else {
    ui.globalMessage.hidden = true;
  }

  const status = state.runtime.calculation.status;
  ui.working.hidden = status !== APPLICATION_CALCULATION_STATUSES.CALCULATING;
  if (status === APPLICATION_CALCULATION_STATUSES.CALCULATING) {
    setStatus("working", "Пересчёт и автосохранение…");
  } else if (status === APPLICATION_CALCULATION_STATUSES.ERROR) {
    setStatus("error", "Есть ошибки · сохранён последний корректный результат");
  } else if (status === APPLICATION_CALCULATION_STATUSES.DIRTY) {
    setStatus("working", "Изменения сохранены · ожидается пересчёт");
  } else if (status === APPLICATION_CALCULATION_STATUSES.READY) {
    setStatus("ready", "Проект сохранён · результат актуален");
  } else {
    setStatus("ready", "Проект сохранён локально");
  }

  const issues = activeIssues().filter((entry) => entry.blocking !== false);
  ui.calculationError.hidden = issues.length === 0;
  ui.calculationError.textContent = issues.length === 0
    ? ""
    : [...new Set(issues.map(messageForIssue))].slice(0, 3).join(" ");
}
