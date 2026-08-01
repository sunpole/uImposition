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
let renderingLayout = false;

function snapshot() {
  return window.__uimpositionR3?.getSnapshot?.() ?? null;
}

function injectStyles() {
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
    .layout-cell--blank { border-style:dashed; color:var(--muted); background:#f5f7fb; }
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
    const next = replaceApplicationInput(current, {
      ...current.input,
      pricing: initialPricing,
    });
    repository.save(next);
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
  updateNavigationState();
}

function configureTopActions() {
  const actions = document.querySelector(".topbar__actions");
  const pricingButton = document.querySelector("#pricingButton");
  if (!actions || !pricingButton) return;
  pricingButton.classList.remove("button--quiet");
  pricingButton.classList.add("pricing-button");
  pricingButton.textContent = "Прайс";
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

function formatPrice(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

function updatePricingSummary() {
  const target = document.querySelector("[data-pricing-summary]");
  const pricing = snapshot()?.state?.input?.pricing ?? repository.load()?.input?.pricing;
  if (!target || !pricing) return;
  target.textContent = `${formatPrice(pricing.grammageGsm)} г/м² · бумага ${formatPrice(pricing.paperPricePerKg)} · пластина ${formatPrice(pricing.colorPlatePrice)} · форма ${formatPrice(pricing.layoutFormPreparationPrice)} ${pricing.currency}`;
}

function updateNavigationState() {
  const active = snapshot()?.state?.runtime?.activeScreen ?? "order";
  document.querySelectorAll(".topbar__nav [data-open-screen]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.openScreen === active);
  });
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
  const next = replaceApplicationInput(current, {
    ...current.input,
    objectivePreferences: { order: presetOrder(prefix) },
  });
  repository.save(next);
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
    bleed: row.bleed,
    cut: row.cut,
  });
  const first = signature(rows[0]);
  return rows.every((row) => signature(row) === first);
}

function clearObsoleteCompatibilityMessage() {
  const node = document.querySelector("#calculationError");
  if (!node || node.hidden || !enabledRowsUniform()) return;
  if (node.textContent.includes("все включённые строки должны иметь одинаковый формат")) {
    node.hidden = true;
    node.textContent = "";
  }
}

function cellsForSide(preview, side) {
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
  const sheet = document.createElement("div");
  sheet.className = "layout-pair__sheet";
  sheet.dataset.layoutRenderedView = side;
  sheet.style.setProperty("--sheet-ratio", `${geometry.trimmed.width} / ${geometry.trimmed.height}`);
  sheet.style.gridTemplateColumns = `repeat(${preview.columns}, minmax(0,1fr))`;
  sheet.style.gridTemplateRows = `repeat(${preview.rows}, minmax(0,1fr))`;
  cellsForSide(preview, side).forEach((cell, index) => {
    const node = document.createElement("div");
    node.className = "layout-cell";
    const page = cell.page ?? (side === "front" ? cell.frontPage : cell.backPage);
    if (page === null || page === undefined) node.classList.add("layout-cell--blank");
    node.dataset.layoutSide = side;
    node.dataset.layoutIndex = String(index + 1);
    node.dataset.layoutPage = page === null || page === undefined ? "blank" : String(page);
    node.innerHTML = `${cell.file}<small>${side === "front" ? "стр." : "обр."} ${page ?? "—"}</small>`;
    sheet.append(node);
  });
  return sheet;
}

function renderLayoutView() {
  if (renderingLayout) return;
  const data = snapshot();
  const preview = data?.lastValidResult?.layoutPreview;
  const geometry = data?.lastValidResult?.geometry;
  const host = document.querySelector("#layoutSheet");
  if (!preview || !geometry || !host) return;
  renderingLayout = true;
  try {
    host.innerHTML = "";
    host.classList.add("layout-sheet--custom");
    host.style.display = "block";
    host.style.gridTemplateColumns = "";
    host.style.gridTemplateRows = "";
    host.style.aspectRatio = "auto";
    if (layoutView === "front" || layoutView === "back") {
      host.append(makeSheet(preview, geometry, layoutView));
      return;
    }
    const pair = document.createElement("div");
    pair.className = "layout-pair";
    pair.dataset.layoutRenderedView = "both";
    ["front", "back"].forEach((side) => {
      const wrap = document.createElement("section");
      wrap.className = "layout-pair__side";
      wrap.innerHTML = `<h3>${side === "front" ? "Лицо" : "Оборот · зеркально"}</h3>`;
      wrap.append(makeSheet(preview, geometry, side));
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
  segmented.innerHTML = `
    <button type="button" class="is-active" data-acceptance-layout="front">Лицо</button>
    <button type="button" data-acceptance-layout="back">Оборот</button>
    <button type="button" data-acceptance-layout="both">Вместе</button>
  `;
  segmented.addEventListener("click", (event) => {
    const button = event.target.closest("[data-acceptance-layout]");
    if (!button) return;
    layoutView = button.dataset.acceptanceLayout;
    segmented.querySelectorAll("button").forEach((entry) => entry.classList.toggle("is-active", entry === button));
    renderLayoutView();
  });
}

function boot() {
  if (applyInitialPricingOnce()) return;
  injectStyles();
  injectTopNavigation();
  configureTopActions();
  injectPriorityPanel();
  injectLayoutModes();
  renderLayoutView();
  document.addEventListener("input", () => queueMicrotask(clearObsoleteCompatibilityMessage), true);
  document.addEventListener("change", () => queueMicrotask(clearObsoleteCompatibilityMessage), true);
  document.addEventListener("click", () => setTimeout(() => {
    updateNavigationState();
    updatePricingSummary();
    const host = document.querySelector("#layoutSheet");
    if (host && !host.querySelector(`[data-layout-rendered-view="${layoutView}"]`)) renderLayoutView();
  }, 0));
  const layoutHost = document.querySelector("#layoutSheet");
  const observer = new MutationObserver(() => {
    updateNavigationState();
    updatePricingSummary();
    clearObsoleteCompatibilityMessage();
    if (
      !renderingLayout
      && layoutHost
      && !layoutHost.querySelector(`[data-layout-rendered-view="${layoutView}"]`)
    ) queueMicrotask(renderLayoutView);
  });
  observer.observe(document.querySelector("#appShell"), {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "hidden"],
  });
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
