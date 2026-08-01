let refreshQueued = false;

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

function injectStyles() {
  if (document.querySelector("[data-control-reference-details-styles]")) return;
  const style = document.createElement("style");
  style.dataset.controlReferenceDetailsStyles = "true";
  style.textContent = `
    #layoutDetails.is-control-reference > :not([data-control-reference-metrics]) { display:none!important; }
    .control-reference-metrics { display:grid; gap:10px; }
    .control-reference-metrics h2 { margin:0; }
    .control-reference-metrics__lead { margin:0; line-height:1.45; }
    .control-reference-metrics .metric-list { margin:0; }
    .control-reference-metrics__warning { margin:0; padding:9px 10px; border:1px solid #e7c46d; border-radius:8px; background:#fff8e3; font-size:11px; line-height:1.4; }
  `;
  document.head.append(style);
}

function referenceIsActive() {
  return Boolean(document.querySelector("#layoutSheet .control-reference-render"));
}

function referenceData() {
  return window.__uimpositionOperatorReview?.getControlReference?.() ?? null;
}

function metricRow(label, value) {
  return `<li><span>${label}</span><strong>${value}</strong></li>`;
}

function renderActiveDetails(details, reference) {
  details.classList.add("is-control-reference");
  let section = details.querySelector("[data-control-reference-metrics]");
  if (!section) {
    section = document.createElement("section");
    section.className = "control-reference-metrics";
    section.dataset.controlReferenceMetrics = "true";
    details.prepend(section);
  }

  const metrics = reference.metrics;
  const report = reference.report;
  const signature = JSON.stringify({
    sheets: metrics.physicalSheets,
    forms: metrics.layoutForms,
    plates: metrics.colorPlates,
    passes: metrics.pressPasses,
    pairOverrun: metrics.pairOverrun,
    fileOverrun: metrics.fileOverrun,
    underproduction: report.totals.underproduction,
  });
  if (section.dataset.signature === signature) return;
  section.dataset.signature = signature;
  section.innerHTML = `
    <p class="kicker">Старый проверенный эталон</p>
    <h2>Контрольная ручная раскладка M3</h2>
    <p class="control-reference-metrics__lead">20 файлов A6 · чёрно-белая печать 1+1 · 4 монтажа · 4 формы лица + 4 зеркальные формы оборота.</p>
    <ul class="metric-list">
      ${metricRow("Физические листы", formatNumber(metrics.physicalSheets))}
      ${metricRow("Layout-формы", `${formatNumber(metrics.layoutForms)} (4 + 4)`)}
      ${metricRow("Цветовые пластины", `${formatNumber(metrics.colorPlates)} при 1+1`)}
      ${metricRow("Листопрогоны", formatNumber(metrics.pressPasses))}
      ${metricRow("Перетираж пар", formatNumber(metrics.pairOverrun))}
      ${metricRow("Перетираж готовых файлов", formatNumber(metrics.fileOverrun))}
      ${metricRow("Недопечатка", formatNumber(report.totals.underproduction))}
    </ul>
    <p class="control-reference-metrics__warning">Показатели относятся только к сохранённому эталону из GitHub. Для возврата к автоматически рассчитанному варианту нажмите «Вернуться к расчёту».</p>
  `;
}

function renderInactiveDetails(details) {
  details.classList.remove("is-control-reference");
  details.querySelector("[data-control-reference-metrics]")?.remove();
}

function refresh() {
  refreshQueued = false;
  const details = document.querySelector("#layoutDetails");
  if (!details) return;
  const active = referenceIsActive();
  const reference = referenceData();
  if (active && reference) renderActiveDetails(details, reference);
  else renderInactiveDetails(details);

  const exportToolbar = document.querySelector("[data-workspace-export]");
  if (exportToolbar) exportToolbar.hidden = active;
}

function scheduleRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(refresh);
}

function boot() {
  injectStyles();
  const shell = document.querySelector("#appShell");
  if (shell) {
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(shell, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
  }
  document.addEventListener("click", () => setTimeout(scheduleRefresh, 0), true);
  scheduleRefresh();
}

const wait = setInterval(() => {
  if (!window.__uimpositionOperatorReview) return;
  clearInterval(wait);
  boot();
}, 25);
setTimeout(() => clearInterval(wait), 10000);
