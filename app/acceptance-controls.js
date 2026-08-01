import { replaceApplicationInput } from "../src/application-state.js";
import { createApplicationStateRepository } from "../src/local-state-repository.js";

const repository = createApplicationStateRepository({ storage: window.localStorage });
const screenLabels = Object.freeze({ order: "Заказ", alternatives: "Варианты", layout: "Схема" });
const objectiveIds = Object.freeze([
  "physicalSheets",
  "estimatedTotalCost",
  "layoutForms",
  "colorPlates",
  "fileOverrun",
  "pairOverrun",
  "pressPasses",
  "splitOrders",
  "impositionCount",
  "layoutCompactness",
  "distinctOrdersPerImposition",
]);
const priorityPresets = Object.freeze({
  paper: ["physicalSheets"],
  cost: ["estimatedTotalCost"],
  forms: ["layoutForms", "colorPlates", "impositionCount"],
  passes: ["pressPasses", "physicalSheets"],
  overrun: ["fileOverrun", "pairOverrun"],
  compact: ["layoutCompactness", "distinctOrdersPerImposition"],
});
const initialPricing = Object.freeze({
  currency: "BYN",
  grammageGsm: 80,
  paperPricePerKg: 2.5,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 3,
});
const pricingMigrationKey = "uImposition.pricingDefaultsApplied.2026-08-01";

let layoutView = "front";
let renderedPlanId = null;
let renderingLayout = false;
let refreshQueued = false;

function snapshot() {
  return window.__uimpositionR3?.getSnapshot?.() ?? null;
}

function setText(node, value) {
  if (!node) return false;
  const text = String(value ?? "");
  if (node.textContent === text) return false;
  node.textContent = text;
  return true;
}

function injectStyles() {
  if (document.querySelector("[data-acceptance-styles]")) return;
  const style = document.createElement("style");
  style.dataset.acceptanceStyles = "true";
  style.textContent = `
    html, body, .app-shell { max-width:100%; overflow-x:clip; }
    @media (min-width:1100px) {
      .workspace { width:min(1840px,100%); padding-left:14px; padding-right:14px; }
      .global-message { width:min(1800px,calc(100% - 28px)); }
      .order-grid { grid-template-columns:minmax(0,1fr) minmax(300px,360px); }
    }
    .topbar__nav { display:flex; gap:4px; align-items:center; }
    .topbar__nav button { min-height:34px; padding:6px 11px; border:1px solid transparent; border-radius:7px; color:#bfc9da; background:transparent; font-weight:750; }
    .topbar__nav button:hover, .topbar__nav button.is-active { color:#fff; background:rgba(255,255,255,.1); }
    .topbar__actions { align-items:center; flex-wrap:wrap; }
    .topbar__actions .pricing-button { display:inline-flex; justify-content:center; color:#172033; border-color:#fff; background:#fff; }
    .pricing-summary { max-width:360px; color:#bfc9da; font-size:10px; line-height:1.25; text-align:right; white-space:normal; }
    .priority-panel { margin:0 0 14px; padding:12px 14px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .priority-panel__label { min-width:180px; }
    .priority-panel__buttons { display:flex; flex-wrap:wrap; gap:7px; }
    .priority-panel__buttons button { min-height:34px; }
    .layout-sheet--custom { width:100%!important; min-width:0!important; max-width:100%!important; padding:0!important; border:0!important; background:transparent!important; box-shadow:none!important; aspect-ratio:auto!important; overflow:visible!important; }
    .layout-sheet--custom::after { display:none!important; }
    .layout-pair { width:100%; min-width:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .layout-pair__side { min-width:0; max-width:100%; }
    .layout-pair__side h3 { margin:0 0 7px; }
    .layout-pair__sheet { display:grid; width:100%; min-width:0; max-width:100%; aspect-ratio:var(--sheet-ratio); gap:3px; padding:clamp(5px,1.6vw,18px) clamp(5px,1.6vw,18px) clamp(12px,2.6vw,32px); border:1px solid var(--line-strong); background:#fff; overflow:hidden; }
    .layout-pair__sheet[data-layout-rendered-view="shared"] { border-width:2px; }
    .layout-cell--blank { border-style:dashed; color:var(--muted); background:#f5f7fb; }
    .work-and-turn-note { margin:12px 0 0; padding:10px 12px; border:1px solid var(--line-strong); border-radius:9px; background:#f7f9fd; line-height:1.45; }
    .alternative-card[data-duplex-mode="workAndTurn"] .alternative-card__badges::after { content:"Свой оборот"; display:inline-flex; align-items:center; min-height:23px; padding:2px 8px; border-radius:999px; background:#e9f7ef; color:#17643a; font-size:11px; font-weight:800; }
    @media (max-width:860px) {
      .topbar { height:auto!important; min-height:56px; flex-wrap:wrap; gap:7px 10px; padding:7px 10px; }
      .brand { flex:1 1 auto; }
      .topbar__nav { display:none; }
      .topbar__actions { order:3; flex:1 1 100%; width:100%; margin-left:0!important; display:grid!important; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:6px; }
      .topbar__actions .button, .topbar__actions .button--quiet { display:inline-flex!important; width:100%; min-width:0; justify-content:center; }
      .pricing-summary { grid-column:1 / -1; max-width:none; text-align:center; }
      .layout-workspace { display:block; min-width:0; }
      .layout-canvas { width:100%; min-width:0; min-height:0!important; padding:8px!important; overflow:hidden!important; }
      .layout-sheet, .layout-pair__sheet { width:100%!important; min-width:0!important; max-width:100%!important; }
      .layout-pair { grid-template-columns:1fr; gap:10px; }
      .layout-details { position:static; margin-top:10px; }
    }
    @media (max-width:520px) {
      .workspace { width:100%; max-width:100%; }
      .layout-cell { padding:1px; font-size:clamp(6px,2.15vw,9px); line-height:1.05; }
      .layout-cell small { margin-top:1px; font-size:clamp(5px,1.85vw,8px); }
      .layout-pair__sheet { gap:1px; padding:4px 4px 14px; }
      .priority-panel__label { min-width:0; width:100%; }
      .priority-panel__buttons { display:grid; width:100%; grid-template-columns:1fr 1fr; }
      .screen--layout .segmented { flex-wrap:wrap; }
    }
    @media (max-width:340px) {
      .topbar { padding-inline:7px; }
      .topbar__actions .button { padding-inline:6px; font-size:10px; }
      .pricing-summary { font-size:9px; }
    }
    @media (min-height:850px) and (min-width:1200px) {
      .workspace { padding-top:12px; padding-bottom:20px; }
      .preset-panel { margin-bottom:10px; }
      .quick-comparison { margin-top:10px; }
      .panel-heading { padding-top:13px; padding-bottom:10px; }
    }
  `;
  document.head.append(style);
}

function pricingIsEmpty(pricing) {
  return pricing?.grammageGsm === null
    && pricing?.paperPricePerKg === null
    && pricing?.colorPlatePrice === null
    && (pricing?.layoutFormPreparationPrice === null || pricing?.layoutFormPreparationPrice === 0);
}

function applyInitialPricingOnce() {
  try {
    if (window.localStorage.getItem(pricingMigrationKey)) return false;
    const current = repository.load();
    if (!current) return false;
    window.localStorage.setItem(pricingMigrationKey, "1");
    if (!pricingIsEmpty(current.input.pricing)) return false;
    repository.save(replaceApplicationInput(current, {
      ...current.input,
      pricing: initialPricing,
    }));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

function injectTopNavigation() {
  const topbar = document.querySelector(".topbar");
  const actions = document.querySelector(".topbar__actions");
  if (!topbar || !actions || topbar.querySelector(".topbar__nav")) return;
  const nav = document.createElement("nav");
  nav.className = "topbar__nav";
  nav.setAttribute("aria-label", "Рабочие экраны");
  Object.entries(screenLabels).forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.openScreen = id;
    button.textContent = label;
    nav.append(button);
  });
  topbar.insertBefore(nav, actions);
}

function updateNavigationState() {
  const active = snapshot()?.state?.runtime?.activeScreen ?? "order";
  document.querySelectorAll(".topbar__nav [data-open-screen]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.openScreen === active);
  });
}

function formatPrice(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

function updatePricingSummary() {
  const target = document.querySelector("[data-pricing-summary]");
  const pricing = snapshot()?.state?.input?.pricing ?? repository.load()?.input?.pricing;
  if (!target || !pricing) return;
  setText(
    target,
    `${formatPrice(pricing.grammageGsm)} г/м² · бумага ${formatPrice(pricing.paperPricePerKg)} · пластина ${formatPrice(pricing.colorPlatePrice)} · форма ${formatPrice(pricing.layoutFormPreparationPrice)} ${pricing.currency}`,
  );
}

function configureTopActions() {
  const actions = document.querySelector(".topbar__actions");
  const pricingButton = document.querySelector("#pricingButton");
  if (!actions || !pricingButton) return;
  pricingButton.classList.remove("button--quiet");
  pricingButton.classList.add("pricing-button");
  setText(pricingButton, "Прайс");
  pricingButton.title = "Редактировать рабочий прайс";
  let summary = actions.querySelector("[data-pricing-summary]");
  if (!summary) {
    summary = document.createElement("span");
    summary.className = "pricing-summary";
    summary.dataset.pricingSummary = "true";
    actions.prepend(summary);
  }
  updatePricingSummary();
}

function presetOrder(prefix) {
  const prefixSet = new Set(prefix);
  return [...prefix, ...objectiveIds.filter((id) => !prefixSet.has(id))];
}

function applyPriority(id) {
  const prefix = priorityPresets[id];
  if (!prefix) return;
  const current = repository.load();
  if (!current) return;
  repository.save(replaceApplicationInput(current, {
    ...current.input,
    objectivePreferences: { order: presetOrder(prefix) },
  }));
  window.location.reload();
}

function injectPriorityPanel() {
  const quick = document.querySelector(".quick-comparison");
  if (!quick || document.querySelector(".priority-panel")) return;
  const panel = document.createElement("section");
  panel.className = "priority-panel panel";
  panel.innerHTML = `
    <div class="priority-panel__label">
      <p class="kicker">Приоритет расчёта</p>
      <strong>Что важнее оператору</strong>
    </div>
    <div class="priority-panel__buttons">
      <button class="button" type="button" data-priority="paper">Меньше листов</button>
      <button class="button" type="button" data-priority="cost">Меньше денег</button>
      <button class="button" type="button" data-priority="forms">Меньше форм</button>
      <button class="button" type="button" data-priority="passes">Меньше прогонов</button>
      <button class="button" type="button" data-priority="overrun">Меньше перетиража</button>
      <button class="button" type="button" data-priority="compact">Плотнее монтаж</button>
    </div>
  `;
  quick.parentNode.insertBefore(panel, quick);
  panel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-priority]");
    if (button) applyPriority(button.dataset.priority);
  });
}

function enabledRowsUniform() {
  const rows = snapshot()?.state?.input?.products?.filter((row) => row.enabled !== false) ?? [];
  if (rows.length < 2) return true;
  const signature = (row) => JSON.stringify({
    finished: row.finished,
    frontColors: row.print?.frontColors,
    backColors: row.print?.backColors,
    duplexPreference: row.print?.duplexPreference,
    bleed: row.bleed,
    cut: row.cut,
  });
  const first = signature(rows[0]);
  return rows.every((row) => signature(row) === first);
}

function normalizeCalculationMessage() {
  const node = document.querySelector("#calculationError");
  if (!node || node.hidden) return;
  if (
    enabledRowsUniform()
    && node.textContent.includes("все включённые строки должны иметь одинаковый формат")
  ) {
    node.hidden = true;
    setText(node, "");
    return;
  }
  if (node.textContent.includes("uniformPipelineWorkAndTurnRequiresCompletePagePairs")) {
    setText(node, "Свой оборот требует чётное число страниц: каждая страница лица должна иметь реальную оборотную пару.");
  } else if (node.textContent.includes("duplexPreferenceUnavailable")) {
    setText(node, "Свой оборот недоступен для текущей сетки. Нужна подходящая ориентация с чётным числом колонок.");
  }
}

function planTitle(plan) {
  if (!plan) return "";
  const family = plan.family === "paperMinimum"
    ? "Минимум бумаги"
    : plan.family === "workAndTurnDedicatedPairs"
      ? "Свой оборот · общая форма"
      : "Раздельные формы лица и оборота";
  return `${family} · ${plan.grid.rotation}° · ${plan.grid.columns}×${plan.grid.rows}`;
}

function decorateWorkAndTurnUi() {
  const result = snapshot()?.lastValidResult;
  if (!result) return;
  const plans = new Map(result.plans.map((plan) => [plan.id, plan]));

  document.querySelectorAll("#alternativesList [data-plan-id]").forEach((card) => {
    const plan = plans.get(card.dataset.planId);
    if (!plan) return;
    if (card.dataset.duplexMode !== plan.duplexMode) card.dataset.duplexMode = plan.duplexMode;
    setText(card.querySelector(".alternative-cell--title strong"), planTitle(plan));
  });

  const selected = plans.get(result.selectedPlanId);
  if (selected) {
    setText(document.querySelector(".summary-hero > span"), planTitle(selected));
    setText(document.querySelector("#layoutDetails h2"), planTitle(selected));
  }

  const scope = document.querySelector("#scopeNote");
  if (scope) {
    const scopeText = result.scope?.workAndTurnExcludedByTechnicalBlank
      ? "Полный lossless-набор внутри текущей области. Свой оборот исключён: заказ содержит технически пустую оборотную страницу."
      : result.scope?.workAndTurnEvaluated
        ? "Полный lossless-набор внутри текущей области. Свой оборот рассчитан для подходящих сеток с чётным числом колонок: одна общая форма, горизонтальный переворот, два прогона. Произвольный mixed work-and-turn не заявлен."
        : "Полный lossless-набор внутри текущей области. Для своего оборота не найдено подходящей сетки с чётным числом колонок.";
    setText(scope, scopeText);
  }

  const details = document.querySelector("#layoutDetails");
  if (details && selected?.duplexMode === "workAndTurn") {
    let note = details.querySelector("[data-work-and-turn-note]");
    if (!note) {
      note = document.createElement("div");
      note.className = "work-and-turn-note";
      note.dataset.workAndTurnNote = "true";
      details.append(note);
    }
    setText(
      note,
      "Свой оборот: одна общая форма печатает обе стороны после горизонтального переворота листа. Лицо и оборот ниже служат контролем готового изделия.",
    );
  } else {
    details?.querySelector("[data-work-and-turn-note]")?.remove();
  }
}

function cellsForSide(preview, side) {
  if (side === "shared") return preview.sharedPlate?.cells ?? [];
  if (side === "back") {
    if (Array.isArray(preview.backCells)) return preview.backCells;
    const source = [...(preview.frontCells ?? preview.cells ?? [])];
    const rows = [];
    for (let row = 0; row < preview.rows; row += 1) {
      rows.push(source.slice(row * preview.columns, (row + 1) * preview.columns).reverse());
    }
    return rows.flat();
  }
  return preview.frontCells ?? preview.cells ?? [];
}

function makeSheet(preview, geometry, side) {
  const source = side === "shared" ? preview.sharedPlate : preview;
  const rows = source?.rows ?? preview.rows;
  const columns = source?.columns ?? preview.columns;
  const sheet = document.createElement("div");
  sheet.className = "layout-pair__sheet";
  sheet.dataset.layoutRenderedView = side;
  sheet.style.setProperty("--sheet-ratio", `${geometry.trimmed.width} / ${geometry.trimmed.height}`);
  sheet.style.gridTemplateColumns = `repeat(${columns}, minmax(0,1fr))`;
  sheet.style.gridTemplateRows = `repeat(${rows}, minmax(0,1fr))`;

  cellsForSide(preview, side).forEach((cell, index) => {
    const node = document.createElement("div");
    node.className = "layout-cell";
    const page = cell.page ?? (side === "front" ? cell.frontPage : cell.backPage);
    if (page === null || page === undefined) node.classList.add("layout-cell--blank");
    node.dataset.layoutSide = side;
    node.dataset.layoutIndex = String(index + 1);
    node.dataset.layoutPage = page === null || page === undefined ? "blank" : String(page);
    const prefix = side === "shared"
      ? cell.pageRole === "back" ? "обр." : "лицо"
      : side === "front" ? "стр." : "обр.";
    node.innerHTML = `${cell.file}<small>${prefix} ${page ?? "—"}</small>`;
    sheet.append(node);
  });
  return sheet;
}

function availableModes(preview) {
  return preview?.duplexMode === "workAndTurn" && preview?.sharedPlate
    ? [["shared", "Общая форма"], ["front", "Лицо"], ["back", "Оборот"], ["both", "Вместе"]]
    : [["front", "Лицо"], ["back", "Оборот"], ["both", "Вместе"]];
}

function syncLayoutModes(preview) {
  const segmented = document.querySelector(".screen--layout .segmented");
  if (!segmented) return;
  const modes = availableModes(preview);
  const allowed = new Set(modes.map(([id]) => id));
  if (!allowed.has(layoutView)) layoutView = modes[0][0];
  const key = modes.map(([id]) => id).join("|");
  if (segmented.dataset.modeKey !== key) {
    segmented.dataset.modeKey = key;
    segmented.innerHTML = modes.map(([id, label]) => (
      `<button type="button" data-acceptance-layout="${id}">${label}</button>`
    )).join("");
  }
  segmented.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.acceptanceLayout === layoutView);
  });
}

function renderLayoutView() {
  if (renderingLayout) return;
  const data = snapshot();
  const preview = data?.lastValidResult?.layoutPreview;
  const geometry = data?.lastValidResult?.geometry;
  const host = document.querySelector("#layoutSheet");
  if (!preview || !geometry || !host) return;

  if (renderedPlanId !== preview.planId) {
    renderedPlanId = preview.planId;
    layoutView = preview.duplexMode === "workAndTurn" && preview.sharedPlate ? "shared" : "front";
  }

  renderingLayout = true;
  try {
    syncLayoutModes(preview);
    host.replaceChildren();
    host.classList.add("layout-sheet--custom");
    host.style.display = "block";
    host.style.gridTemplateColumns = "";
    host.style.gridTemplateRows = "";
    host.style.aspectRatio = "auto";

    if (["shared", "front", "back"].includes(layoutView)) {
      host.append(makeSheet(preview, geometry, layoutView));
      return;
    }

    const pair = document.createElement("div");
    pair.className = "layout-pair";
    pair.dataset.layoutRenderedView = "both";
    ["front", "back"].forEach((side) => {
      const wrap = document.createElement("section");
      wrap.className = "layout-pair__side";
      const heading = document.createElement("h3");
      heading.textContent = side === "front" ? "Лицо" : "Оборот · зеркально";
      wrap.append(heading, makeSheet(preview, geometry, side));
      pair.append(wrap);
    });
    host.append(pair);
  } finally {
    renderingLayout = false;
  }
}

function injectLayoutModes() {
  const segmented = document.querySelector(".screen--layout .segmented");
  if (!segmented || segmented.dataset.acceptanceReady) return;
  segmented.dataset.acceptanceReady = "true";
  segmented.addEventListener("click", (event) => {
    const button = event.target.closest("[data-acceptance-layout]");
    if (!button) return;
    layoutView = button.dataset.acceptanceLayout;
    renderLayoutView();
  });
  syncLayoutModes(snapshot()?.lastValidResult?.layoutPreview);
}

function refreshUi() {
  refreshQueued = false;
  updateNavigationState();
  updatePricingSummary();
  normalizeCalculationMessage();
  decorateWorkAndTurnUi();
  const host = document.querySelector("#layoutSheet");
  if (host && !host.querySelector(`[data-layout-rendered-view="${layoutView}"]`)) {
    renderLayoutView();
  }
}

function scheduleRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(refreshUi);
}

function boot() {
  if (applyInitialPricingOnce()) return;
  injectStyles();
  injectTopNavigation();
  configureTopActions();
  injectPriorityPanel();
  injectLayoutModes();
  renderLayoutView();
  decorateWorkAndTurnUi();

  document.addEventListener("input", scheduleRefresh, true);
  document.addEventListener("change", scheduleRefresh, true);
  document.addEventListener("click", () => setTimeout(scheduleRefresh, 0));

  const shell = document.querySelector("#appShell");
  if (shell) {
    const observer = new MutationObserver(() => {
      if (!renderingLayout) scheduleRefresh();
    });
    observer.observe(shell, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "hidden"],
    });
  }
}

const timer = setInterval(() => {
  if (!window.__uimpositionR3) return;
  clearInterval(timer);
  boot();
}, 25);
setTimeout(() => clearInterval(timer), 10000);

window.__uimpositionAcceptanceControls = Object.freeze({
  applyPriority,
  setLayoutView(value) {
    layoutView = value;
    renderLayoutView();
  },
  renderLayout: renderLayoutView,
});
