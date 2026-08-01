import { renderSchemePairs } from "../src/scheme-renderer.js";

let rendering = false;
let refreshQueued = false;
let allFormsSignature = null;

function snapshot() {
  return window.__uimpositionR3?.getSnapshot?.() ?? null;
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
    .all-generated-forms-panel { margin-top:14px; padding:12px; }
    .all-generated-forms-panel[hidden] { display:none!important; }
    .all-generated-forms-panel .scheme-pairs { width:100%; min-width:0; max-height:72vh; margin:0; padding-right:4px; gap:14px; overflow:auto; overscroll-behavior:contain; }
    .all-generated-forms-panel .scheme-pair { min-width:0; gap:10px; }
    .all-generated-forms-panel .scheme-card { min-width:0; padding:10px; border-radius:10px; }
    .all-generated-forms-panel .scheme-cell { min-height:42px; padding:4px 2px; font-size:clamp(.58rem,1.15vw,.82rem); }
    .all-selected-forms-intro { margin:0 0 12px; padding:10px 12px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 16px; border:1px solid #9ab2f4; border-radius:9px; background:#f4f7ff; }
    .all-selected-forms-intro strong { display:block; }
    .all-selected-forms-intro__turn { font-weight:850; white-space:nowrap; }
    .all-selected-forms-intro__turn b { color:#315efb; font-size:18px; }
    @media (max-width:760px) {
      .product-row__main { grid-template-columns:minmax(82px,1.35fr) minmax(54px,.68fr) 39px 33px 33px auto!important; gap:3px!important; }
      .product-row__main .field span { font-size:7px!important; }
      .product-row__main input { padding-inline:3px!important; font-size:10px!important; }
      .product-row__actions { gap:1px!important; }
      .product-row__actions .icon-button { width:23px!important; min-width:23px!important; }
      .product-row__details > summary { right:76px; width:24px; }
      .all-generated-forms-panel { padding:8px; }
      .all-generated-forms-panel .scheme-pairs { max-height:68vh; }
      .all-generated-forms-panel .scheme-pair { grid-template-columns:1fr; }
      .all-generated-forms-panel .scheme-card { padding:7px; }
      .all-generated-forms-panel .scheme-cell { min-height:38px; font-size:clamp(.56rem,2.25vw,.72rem); }
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

function ensureSchemeStyles() {
  if (document.querySelector("link[data-generated-scheme-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "../m3.css";
  link.dataset.generatedSchemeStyles = "true";
  document.head.append(link);
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

function currentLayoutMode() {
  const active = document.querySelector(".screen--layout .segmented button.is-active");
  return active?.dataset.acceptanceLayout ?? active?.dataset.layoutSide ?? "front";
}

function selectedGeneratedPlan() {
  const result = snapshot()?.lastValidResult;
  if (!result?.planSet?.plans?.length || !result.selectedPlanId) return null;
  return result.planSet.plans.find(({ id }) => id === result.selectedPlanId) ?? null;
}

function ensureAllFormsHost() {
  const screen = document.querySelector(".screen--layout");
  const workspace = screen?.querySelector(".layout-workspace");
  if (!screen || !workspace) return null;
  let host = screen.querySelector("[data-all-generated-forms-host]");
  if (host) return host;
  host = document.createElement("section");
  host.className = "all-generated-forms-panel panel";
  host.dataset.allGeneratedFormsHost = "true";
  host.hidden = true;
  workspace.after(host);
  return host;
}

function hideAllSelectedForms() {
  const host = document.querySelector("[data-all-generated-forms-host]");
  if (host) host.hidden = true;
}

function renderAllSelectedForms() {
  const host = ensureAllFormsHost();
  const data = snapshot()?.lastValidResult;
  const plan = selectedGeneratedPlan();
  if (!host || currentLayoutMode() !== "both" || !data || !plan?.impositions?.length) {
    hideAllSelectedForms();
    return;
  }

  const signature = `${data.revision}|${plan.id}|${plan.impositions.length}`;
  host.hidden = false;
  if (allFormsSignature === signature && host.querySelector(".all-generated-forms")) return;

  rendering = true;
  try {
    const wrapper = document.createElement("div");
    wrapper.className = "all-generated-forms";
    wrapper.dataset.generatedImpositionCount = String(plan.impositions.length);

    const intro = document.createElement("div");
    intro.className = "all-selected-forms-intro";
    intro.innerHTML = `
      <div><strong>Все формы выбранного рассчитанного варианта</strong><span>${plan.label} · ${plan.impositions.length} монтажей · найдено программой из текущих тиражей</span></div>
      <div class="all-selected-forms-intro__turn"><b>→</b> лицо · <b>←</b> оборот</div>
    `;

    const pairs = document.createElement("div");
    pairs.className = "scheme-pairs";
    renderSchemePairs(pairs, plan.impositions, { language: "ru" });
    wrapper.append(intro, pairs);
    host.replaceChildren(wrapper);
    allFormsSignature = signature;
  } finally {
    rendering = false;
  }
}

function scheduleRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    compactProductRows();
    renderAllSelectedForms();
  });
}

function attachEvents() {
  document.addEventListener("click", (event) => {
    const mode = event.target.closest(".screen--layout .segmented button");
    if (mode) {
      if ((mode.dataset.acceptanceLayout ?? mode.dataset.layoutSide) !== "both") hideAllSelectedForms();
      setTimeout(scheduleRefresh, 0);
      return;
    }
    if (event.target.closest("[data-select-plan]")) {
      allFormsSignature = null;
      setTimeout(scheduleRefresh, 0);
    }
  }, true);
}

function boot() {
  ensureSchemeStyles();
  injectStyles();
  attachEvents();
  compactProductRows();
  ensureAllFormsHost();
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
  render: scheduleRefresh,
  getSelectedGeneratedPlan: selectedGeneratedPlan,
});
