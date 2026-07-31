import {
  OPERATOR_WORKSPACE_EXPORT_TYPES,
  createOperatorWorkspaceExportModels,
  downloadOperatorWorkspacePdf,
} from "../src/operator-workspace-export.js";

const details = document.querySelector("#layoutDetails");
let rendering = false;
let busy = false;

function workspaceSnapshot() {
  return window.__uimpositionR3?.getSnapshot?.() ?? null;
}

function readySnapshot() {
  const snapshot = workspaceSnapshot();
  const result = snapshot?.lastValidResult ?? null;
  const currentRevision = snapshot?.state?.runtime?.inputRevision ?? null;
  const ready = Boolean(
    result
    && result.status === "ready"
    && result.revision === currentRevision,
  );
  return { snapshot, result, ready };
}

function removePlaceholder() {
  if (!details) return;
  [...details.querySelectorAll("button[disabled]")].forEach((button) => {
    if (button.textContent.includes("PDF")) button.remove();
  });
}

function exportButton(type, label, enabled) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = type === OPERATOR_WORKSPACE_EXPORT_TYPES.SCHEMES
    ? "button button--primary"
    : "button";
  button.dataset.workspacePdf = type;
  button.textContent = label;
  button.disabled = !enabled;
  return button;
}

function renderControls() {
  if (!details || rendering) return;
  rendering = true;
  try {
    removePlaceholder();
    details.querySelector("[data-workspace-export]")?.remove();
    const { result, ready } = readySnapshot();
    if (!result) return;

    const section = document.createElement("section");
    section.dataset.workspaceExport = "true";
    section.style.marginTop = "12px";
    section.style.paddingTop = "12px";
    section.style.borderTop = "1px solid var(--line)";
    section.innerHTML = `
      <p class="kicker">PDF выбранного плана</p>
      <p class="muted" data-workspace-export-status>${ready
        ? "Схемы и отчёт будут сформированы из текущего выбора оператора."
        : "Исправьте текущий ввод: экспорт предыдущей ревизии отключён."}</p>
      <div data-workspace-export-actions style="display:grid;gap:7px;margin-top:10px"></div>
    `;
    const actions = section.querySelector("[data-workspace-export-actions]");
    actions.append(
      exportButton(
        OPERATOR_WORKSPACE_EXPORT_TYPES.SCHEMES,
        "Скачать схемы PDF",
        ready && !busy,
      ),
      exportButton(
        OPERATOR_WORKSPACE_EXPORT_TYPES.REPORT,
        "Скачать отчёт PDF",
        ready && !busy,
      ),
    );
    details.append(section);
  } finally {
    rendering = false;
  }
}

async function handleExport(type) {
  if (busy) return;
  const { result, ready } = readySnapshot();
  if (!ready) {
    renderControls();
    return;
  }

  const models = createOperatorWorkspaceExportModels(result);
  const section = details.querySelector("[data-workspace-export]");
  const status = section?.querySelector("[data-workspace-export-status]");
  busy = true;
  renderControls();
  const activeStatus = details.querySelector("[data-workspace-export-status]");
  if (activeStatus) activeStatus.textContent = type === OPERATOR_WORKSPACE_EXPORT_TYPES.SCHEMES
    ? "Формируем страницы схем…"
    : "Формируем производственный отчёт…";

  try {
    const receipt = await downloadOperatorWorkspacePdf(models, type);
    const nextStatus = details.querySelector("[data-workspace-export-status]");
    if (nextStatus) nextStatus.textContent = `Скачан ${receipt.fileName} · ${receipt.byteLength.toLocaleString("ru-RU")} байт.`;
    window.dispatchEvent(new CustomEvent("uimposition:r3-pdf-download", { detail: receipt }));
  } catch (error) {
    const nextStatus = details.querySelector("[data-workspace-export-status]");
    if (nextStatus) nextStatus.textContent = `PDF не создан: ${error.message}`;
    window.dispatchEvent(new CustomEvent("uimposition:r3-pdf-error", {
      detail: { type, message: error.message },
    }));
  } finally {
    busy = false;
    setTimeout(renderControls, 0);
  }
}

details?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-workspace-pdf]");
  if (button) handleExport(button.dataset.workspacePdf);
});

if (details) {
  const observer = new MutationObserver(() => queueMicrotask(renderControls));
  observer.observe(details, { childList: true, subtree: true });
  const waitForWorkspace = setInterval(() => {
    if (!window.__uimpositionR3) return;
    clearInterval(waitForWorkspace);
    renderControls();
  }, 25);
  setTimeout(() => clearInterval(waitForWorkspace), 10000);
}

window.__uimpositionR3Export = Object.freeze({
  render: renderControls,
  download: handleExport,
  getModels: () => {
    const { result, ready } = readySnapshot();
    return ready ? createOperatorWorkspaceExportModels(result) : null;
  },
});
