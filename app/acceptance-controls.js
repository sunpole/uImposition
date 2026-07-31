import { CONFIG } from "../src/config.js";
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

let layoutView = "front";
let renderingLayout = false;

function snapshot() {
  return window.__uimpositionR3?.getSnapshot?.() ?? null;
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    @media (min-width: 1100px) {
      .workspace { width: min(1840px, 100%); padding-left: 14px; padding-right: 14px; }
      .global-message { width: min(1800px, calc(100% - 28px)); }
      .order-grid { grid-template-columns: minmax(0, 1fr) minmax(300px, 360px); }
    }
    .topbar__nav { display:flex; gap:4px; align-items:center; }
    .topbar__nav button { min-height:34px; padding:6px 11px; border:1px solid transparent; border-radius:7px; color:#bfc9da; background:transparent; font-weight:750; }
    .topbar__nav button:hover, .topbar__nav button.is-active { color:#fff; background:rgba(255,255,255,.1); }
    .priority-panel { margin:0 0 14px; padding:12px 14px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .priority-panel__label { min-width:180px; }
    .priority-panel__buttons { display:flex; flex-wrap:wrap; gap:7px; }
    .priority-panel__buttons button { min-height:34px; }
    .layout-pair { width:100%; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .layout-pair__side { min-width:0; }
    .layout-pair__side h3 { margin:0 0 7px; }
    .layout-pair__sheet { display:grid; width:100%; aspect-ratio:var(--sheet-ratio); border:1px solid var(--line-strong); background:#fff; }
    @media (max-width: 820px) { .topbar__nav { display:none; } .layout-pair { grid-template-columns:1fr; } }
    @media (min-height: 850px) and (min-width: 1200px) {
      .workspace { padding-top:12px; padding-bottom:20px; }
      .preset-panel { margin-bottom:10px; }
      .quick-comparison { margin-top:10px; }
      .panel-heading { padding-top:13px; padding-bottom:10px; }
    }
  `;
  document.head.append(style);
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

function orderedCells(preview, side) {
  const source = [...preview.cells];
  if (side !== "back") return source;
  const rows = [];
  for (let row = 0; row < preview.rows; row += 1) {
    rows.push(source.slice(row * preview.columns, (row + 1) * preview.columns).reverse());
  }
  return rows.flat();
}

function makeSheet(preview, geometry, side) {
  const sheet = document.createElement("div");
  sheet.className = "layout-pair__sheet";
  sheet.style.setProperty("--sheet-ratio", `${geometry.trimmed.width} / ${geometry.trimmed.height}`);
  sheet.style.gridTemplateColumns = `repeat(${preview.columns}, minmax(0,1fr))`;
  sheet.style.gridTemplateRows = `repeat(${preview.rows}, minmax(0,1fr))`;
  orderedCells(preview, side).forEach((cell) => {
    const node = document.createElement("div");
    node.className = "layout-cell";
    const page = side === "front" ? cell.frontPage : cell.backPage;
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
    if (layoutView === "front") return;
    host.innerHTML = "";
    host.style.display = "block";
    if (layoutView === "back") {
      host.append(makeSheet(preview, geometry, "back"));
      return;
    }
    const pair = document.createElement("div");
    pair.className = "layout-pair";
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
    if (layoutView === "front") window.__uimpositionR3?.openScreen?.("layout");
    setTimeout(renderLayoutView, 0);
  });
}

function boot() {
  injectStyles();
  injectTopNavigation();
  injectPriorityPanel();
  injectLayoutModes();
  document.addEventListener("input", () => queueMicrotask(clearObsoleteCompatibilityMessage), true);
  document.addEventListener("change", () => queueMicrotask(clearObsoleteCompatibilityMessage), true);
  document.addEventListener("click", () => setTimeout(() => {
    updateNavigationState();
    if (layoutView !== "front") renderLayoutView();
  }, 0));
  const layoutHost = document.querySelector("#layoutSheet");
  const observer = new MutationObserver((mutations) => {
    updateNavigationState();
    clearObsoleteCompatibilityMessage();
    const hasExternalLayoutMutation = mutations.some(({ target }) => !layoutHost?.contains(target));
    if (layoutView !== "front" && hasExternalLayoutMutation) queueMicrotask(renderLayoutView);
  });
  observer.observe(document.querySelector("#appShell"), { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
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
});
