import { createApplicationStateRepository } from "../src/local-state-repository.js";
import { createPricingProfile } from "../src/production-cost.js";
import { buildM3ControlReference } from "../src/control-reference.js";
import { renderSchemePairs } from "../src/scheme-renderer.js";

const repository = createApplicationStateRepository({ storage: window.localStorage });
const CONTROL_REFERENCE_KEY = "uImposition.controlReference.active.2026-08-01";

let controlReference = null;
let controlReferenceActive = false;
let rendering = false;
let refreshQueued = false;
let layoutSignature = null;

function snapshot() {
  return window.__uimpositionR3?.getSnapshot?.() ?? null;
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

function formatCost(metrics) {
  if (metrics?.estimatedTotalCost === null || metrics?.estimatedTotalCost === undefined) {
    return "без прайса";
  }
  return `${formatNumber(metrics.estimatedTotalCost, 2)} ${metrics.currency}`;
}

function ensureOldSchemeStyles() {
  if (document.querySelector("link[data-m3-control-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "../m3.css";
  link.dataset.m3ControlStyles = "true";
  document.head.append(link);
}

function injectStyles() {
  if (document.querySelector("[data-operator-review-styles]")) return;
  const style = document.createElement("style");
  style.dataset.operatorReviewStyles = "true";
  style.textContent = `
    .product-list { gap:5px!important; }
    .product-row { position:relative; padding:5px 7px!important; border-radius:8px!important; }
    .product-row__main { display:grid!important; grid-template-columns:minmax(118px,2fr) minmax(68px,.72fr) 48px 40px 40px auto!important; gap:4px!important; align-items:end!important; }
    .product-row__main .field { min-width:0; }
    .product-row__main .field span { margin-bottom:1px!important; font-size:8px!important; line-height:1!important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .product-row__main input, .product-row__main select { min-height:28px!important; height:28px!important; padding:3px 5px!important; font-size:11px!important; border-radius:5px!important; }
    .product-row__actions { align-self:end; gap:2px!important; }
    .product-row__actions .icon-button { width:27px!important; min-width:27px!important; height:28px!important; padding:0!important; }
    .product-row__details { margin:0!important; }
    .product-row__details:not([open]) { height:0; }
    .product-row__details > summary { position:absolute; right:91px; top:22px; width:27px; height:28px; display:grid; place-items:center; padding:0!important; border:0!important; border-radius:5px; background:#eef2f8; font-size:0; cursor:pointer; list-style:none; }
    .product-row__details > summary::-webkit-details-marker { display:none; }
    .product-row__details > summary::after { content:"⋯"; font-size:17px; font-weight:900; line-height:1; }
    .product-row__details[open] { height:auto; margin-top:6px!important; padding-top:6px; border-top:1px solid var(--line,#dce3ef); }
    .product-row__details[open] > summary { background:#315efb; color:#fff; }
    .product-row__details .details-grid { gap:6px!important; }
    .field-error:empty { display:none; }
    .control-reference-card { border-color:#9ab2f4!important; background:#f4f7ff!important; }
    .control-reference-card .alternative-card__badges::after { content:"Старый проверенный эталон"; display:inline-flex; min-height:23px; align-items:center; padding:2px 8px; border-radius:999px; background:#e6edff; color:#2446a8; font-size:11px; font-weight:800; }
    .control-reference-switch { white-space:nowrap; }
    .layout-sheet--old-renderer { display:block!important; width:100%!important; min-width:0!important; max-width:100%!important; padding:0!important; border:0!important; background:transparent!important; box-shadow:none!important; aspect-ratio:auto!important; overflow:visible!important; }
    .layout-sheet--old-renderer::after { display:none!important; }
    .layout-sheet--old-renderer .scheme-pairs { width:100%; min-width:0; margin:0; gap:14px; }
    .layout-sheet--old-renderer .scheme-pair { min-width:0; gap:10px; }
    .layout-sheet--old-renderer .scheme-card { min-width:0; padding:10px; border-radius:10px; }
    .layout-sheet--old-renderer .scheme-cell { min-height:42px; padding:4px 2px; font-size:clamp(.58rem,1.15vw,.82rem); }
    .control-reference-intro { margin:0 0 12px; padding:10px 12px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 16px; border:1px solid #9ab2f4; border-radius:9px; background:#f4f7ff; }
    .control-reference-intro strong { display:block; }
    .control-reference-turn { font-weight:850; white-space:nowrap; }
    .control-reference-turn b { color:#315efb; font-size:18px; }
    @media (max-width:760px) {
      .product-row__main { grid-template-columns:minmax(82px,1.35fr) minmax(54px,.68fr) 39px 33px 33px auto!important; gap:3px!important; }
      .product-row__main .field span { font-size:7px!important; }
      .product-row__main input { padding-inline:3px!important; font-size:10px!important; }
      .product-row__actions { gap:1px!important; }
      .product-row__actions .icon-button { width:23px!important; min-width:23px!important; }
      .product-row__details > summary { right:76px; width:24px; }
      .layout-sheet--old-renderer .scheme-pair { grid-template-columns:1fr; }
      .layout-sheet--old-renderer .scheme-card { padding:7px; }
      .layout-sheet--old-renderer .scheme-cell { min-height:38px; font-size:clamp(.56rem,2.25vw,.72rem); }
    }
    @media (max-width:340px) {
      .product-row { padding-inline:4px!important; }
      .product-row__main { grid-template-columns:minmax(68px,1.25fr) 49px 32px 28px 28px auto!important; gap:2px!important; }
      .product-row__actions .icon-button { width:20px!important; min-width:20px!important; font-size:10px!important; }
      .product-row__details > summary { right:66px; width:22px; }
    }
  `;
  document.head.append(style);
}

function compactProductRows() {
  document.querySelectorAll("[data-product-row]").forEach((row) => {
    if (row.dataset.compactReady === "true") return;
    const details = row.querySelector(".product-row__details");
    const grid = details?.querySelector(".details-grid");
    if (!details || !grid) return;
    ["finished.widthMm", "finished.heightMm", "variantCount"].forEach((name) => {
      const field = row.querySelector(`[data-field-wrap="${name}"]`);
      if (field) grid.prepend(field);
    });
    const summary = details.querySelector("summary");
    if (summary) {
      summary.textContent = "Размер, виды и дополнительные параметры";
      summary.title = summary.textContent;
    }
    row.dataset.compactReady = "true";
  });
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function normalizeFileName(value) {
  return String(value ?? "").replace(/^Листовка\s+/iu, "").trim();
}

function currentMatchesControlCase(controlCase) {
  const rows = snapshot()?.state?.input?.products?.filter((row) => row.enabled !== false) ?? [];
  if (rows.length !== controlCase.orders.length) return false;
  return controlCase.orders.every((order, index) => {
    const row = rows[index];
    return normalizeFileName(row?.name) === String(order.file)
      && Number(row?.quantityPerVariant) === Number(order.quantity)
      && Number(row?.pages) === Number(order.pages)
      && Number(row?.print?.frontColors) === 1
      && Number(row?.print?.backColors) === 1
      && row?.print?.duplexPreference === "separateFrontBackForms";
  });
}

function pricingProfileFromState() {
  const pricing = snapshot()?.state?.input?.pricing;
  if (!pricing || pricing.grammageGsm === null || pricing.paperPricePerKg === null || pricing.colorPlatePrice === null) {
    return null;
  }
  return createPricingProfile(pricing);
}

async function prepareControlReference() {
  if (window.localStorage.getItem(CONTROL_REFERENCE_KEY) !== "1") return null;
  const [controlCase, controlLayout] = await Promise.all([
    fetchJson("../data/control-case.json"),
    fetchJson("../data/control-layout-m3.json"),
  ]);
  if (!currentMatchesControlCase(controlCase)) return null;
  return buildM3ControlReference({
    controlCase,
    controlLayout,
    pricing: pricingProfileFromState(),
  });
}

function renderControlLayout() {
  if (!controlReferenceActive || !controlReference || rendering) return;
  const host = document.querySelector("#layoutSheet");
  if (!host) return;
  const signature = `${controlReference.id}|${controlReference.records.length}`;
  if (layoutSignature === signature && host.querySelector(".scheme-pairs")) return;

  rendering = true;
  try {
    const wrapper = document.createElement("div");
    wrapper.className = "control-reference-render";
    wrapper.dataset.layoutRenderedView = "both";
    const intro = document.createElement("div");
    intro.className = "control-reference-intro";
    intro.innerHTML = `
      <div><strong>Старый контрольный эталон</strong><span>Точный набор из data/control-layout-m3.json · 4 лица + 4 оборота = 8 форм</span></div>
      <div class="control-reference-turn"><b>→</b> лицо · <b>←</b> оборот · через короткую сторону слева направо</div>
    `;
    const pairs = document.createElement("div");
    pairs.className = "scheme-pairs";
    renderSchemePairs(pairs, controlReference.records, { language: "ru" });
    wrapper.append(intro, pairs);
    host.replaceChildren(wrapper);
    host.classList.add("layout-sheet--old-renderer");
    host.style.gridTemplateColumns = "";
    host.style.gridTemplateRows = "";
    host.style.aspectRatio = "auto";
    layoutSignature = signature;
  } finally {
    rendering = false;
  }
}

function renderReferenceCard() {
  const list = document.querySelector("#alternativesList");
  if (!list || !controlReference) return;
  let card = list.querySelector("[data-control-reference-card]");
  if (!card) {
    card = document.createElement("article");
    card.className = "alternative-card control-reference-card";
    card.dataset.controlReferenceCard = "true";
    list.append(card);
  }
  const metrics = controlReference.metrics;
  const signature = JSON.stringify({
    active: controlReferenceActive,
    sheets: metrics.physicalSheets,
    passes: metrics.pressPasses,
    cost: metrics.estimatedTotalCost,
  });
  if (card.dataset.signature === signature) return;
  card.dataset.signature = signature;
  card.classList.toggle("is-selected", controlReferenceActive);
  card.innerHTML = `
    <div class="alternative-cell alternative-cell--title">
      <div class="alternative-card__badges"></div>
      <strong>Контрольная ручная раскладка M3 · 90° · 4×4</strong>
      <span>Точный эталон из data/control-layout-m3.json</span>
    </div>
    <div class="alternative-cell"><span>Листы</span><strong>${formatNumber(metrics.physicalSheets)}</strong></div>
    <div class="alternative-cell"><span>Формы</span><strong>8</strong></div>
    <div class="alternative-cell"><span>Пластины 1+1</span><strong>8</strong></div>
    <div class="alternative-cell"><span>Прогоны</span><strong>${formatNumber(metrics.pressPasses)}</strong></div>
    <div class="alternative-cell"><span>Стоимость</span><strong>${formatCost(metrics)}</strong></div>
    <div class="alternative-action"><button class="button ${controlReferenceActive ? "" : "button--primary"}" type="button" data-control-reference-select>${controlReferenceActive ? "Показан" : "Показать 4+4"}</button></div>
  `;
}

function renderReferenceSwitch() {
  const actions = document.querySelector(".screen--layout .screen-heading__actions");
  if (!actions || !controlReference) return;
  let button = actions.querySelector("[data-control-reference-switch]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "button control-reference-switch";
    button.dataset.controlReferenceSwitch = "true";
    actions.append(button);
  }
  const text = controlReferenceActive ? "Вернуться к расчёту" : "Эталон 4 лица + 4 оборота";
  if (button.textContent !== text) button.textContent = text;
}

function renderReferenceNote() {
  const details = document.querySelector("#layoutDetails");
  if (!details || !controlReference) return;
  let note = details.querySelector("[data-control-reference-note]");
  if (!note) {
    note = document.createElement("div");
    note.className = "work-and-turn-note";
    note.dataset.controlReferenceNote = "true";
    details.prepend(note);
  }
  const signature = controlReferenceActive ? "active" : "available";
  if (note.dataset.signature === signature) return;
  note.dataset.signature = signature;
  note.innerHTML = controlReferenceActive
    ? "<strong>Показан точный прежний эталон.</strong><br>20 файлов A6, 1+1, 4 монтажа: 4 формы лица + 4 зеркальные формы оборота = 8 форм. Стрелка направления сохранена в каждой ячейке."
    : "<strong>Старый эталон доступен для сравнения.</strong><br>Он берётся напрямую из data/control-case.json и data/control-layout-m3.json.";
}

function restoreCalculatedLayout() {
  layoutSignature = null;
  const host = document.querySelector("#layoutSheet");
  host?.classList.remove("layout-sheet--old-renderer");
  window.__uimpositionAcceptanceControls?.renderLayout?.();
}

function scheduleRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    compactProductRows();
    renderReferenceCard();
    renderReferenceSwitch();
    renderReferenceNote();
    renderControlLayout();
  });
}

function attachEvents() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-control-reference-select]")) {
      controlReferenceActive = true;
      layoutSignature = null;
      window.__uimpositionAcceptanceControls?.setLayoutView?.("both");
      window.__uimpositionR3?.openScreen?.("layout");
      setTimeout(scheduleRefresh, 0);
      return;
    }
    if (event.target.closest("[data-control-reference-switch]")) {
      controlReferenceActive = !controlReferenceActive;
      if (controlReferenceActive) {
        window.__uimpositionAcceptanceControls?.setLayoutView?.("both");
        layoutSignature = null;
        setTimeout(scheduleRefresh, 0);
      } else {
        restoreCalculatedLayout();
        setTimeout(scheduleRefresh, 0);
      }
      return;
    }
    if (event.target.closest("[data-select-plan], .screen--layout .segmented button")) {
      if (controlReferenceActive) {
        controlReferenceActive = false;
        restoreCalculatedLayout();
      }
      setTimeout(scheduleRefresh, 0);
    }
  }, true);
}

async function boot() {
  ensureOldSchemeStyles();
  injectStyles();
  attachEvents();
  compactProductRows();
  try {
    controlReference = await prepareControlReference();
    controlReferenceActive = Boolean(controlReference);
    if (controlReferenceActive) window.__uimpositionAcceptanceControls?.setLayoutView?.("both");
  } catch (error) {
    console.error("M3 control reference was not prepared", error);
  }
  const shell = document.querySelector("#appShell");
  if (shell) {
    const observer = new MutationObserver(() => {
      if (!rendering) scheduleRefresh();
    });
    observer.observe(shell, { childList: true, subtree: true });
  }
  scheduleRefresh();
}

const waitForWorkspace = setInterval(() => {
  if (!window.__uimpositionR3) return;
  clearInterval(waitForWorkspace);
  boot();
}, 25);
setTimeout(() => clearInterval(waitForWorkspace), 10000);

window.__uimpositionOperatorReview = Object.freeze({
  getControlReference: () => controlReference,
  setControlReferenceActive(value) {
    controlReferenceActive = Boolean(value && controlReference);
    if (controlReferenceActive) {
      window.__uimpositionAcceptanceControls?.setLayoutView?.("both");
      layoutSignature = null;
    } else {
      restoreCalculatedLayout();
    }
    scheduleRefresh();
  },
  render: scheduleRefresh,
});
