import {
  replaceApplicationInput,
  setApplicationActiveScreen,
} from "../src/application-state.js";
import { addApplicationProductRow } from "../src/application-product-rows.js";
import { createApplicationStateRepository } from "../src/local-state-repository.js";
import { expandPagePairs } from "../src/orders.js";
import { createFrontLayout } from "../src/front-layout.js";
import { createBackLayout } from "../src/back-layout.js";
import { buildProductionReport } from "../src/production-report.js";
import { createDuplexPrintSpecification } from "../src/print-specification.js";
import { createPricingProfile } from "../src/production-cost.js";
import { createProductionReportSolutionMetrics } from "../src/production-solution-metrics.js";

const repository = createApplicationStateRepository({ storage: window.localStorage });
const CONTROL_REFERENCE_KEY = "uImposition.controlReference.active.2026-08-01";
const CONTROL_REFERENCE_ID = "control-manual-reference";

let controlReference = null;
let controlReferenceActive = false;
let renderQueued = false;
let renderingGallery = false;

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

function injectStyles() {
  if (document.querySelector("[data-operator-review-styles]")) return;
  const style = document.createElement("style");
  style.dataset.operatorReviewStyles = "true";
  style.textContent = `
    .product-row { position:relative; padding:5px 7px!important; border-radius:8px!important; }
    .product-row__main { display:grid!important; grid-template-columns:minmax(118px,2fr) minmax(72px,.75fr) 54px 42px 42px auto!important; gap:4px!important; align-items:end!important; }
    .product-row__main .field { min-width:0; }
    .product-row__main .field span { margin-bottom:1px!important; font-size:8px!important; line-height:1!important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .product-row__main input, .product-row__main select { min-height:28px!important; height:28px!important; padding:3px 5px!important; font-size:11px!important; border-radius:5px!important; }
    .product-row__actions { gap:2px!important; align-self:end; }
    .product-row__actions .icon-button { width:28px!important; height:28px!important; min-width:28px!important; }
    .product-row__details { margin:0!important; }
    .product-row__details:not([open]) { height:0; }
    .product-row__details > summary { position:absolute; right:94px; top:22px; width:28px; height:28px; display:grid; place-items:center; padding:0!important; border:0!important; border-radius:5px; background:var(--surface-soft,#f2f5fa); font-size:0; cursor:pointer; list-style:none; }
    .product-row__details > summary::-webkit-details-marker { display:none; }
    .product-row__details > summary::after { content:"⋯"; font-size:17px; font-weight:900; line-height:1; }
    .product-row__details[open] { margin-top:6px!important; padding-top:6px; border-top:1px solid var(--line,#dce3ef); }
    .product-row__details[open] > summary { background:var(--primary,#315efb); color:#fff; }
    .product-row__details .details-grid { gap:6px!important; }
    .product-row [data-compact-secondary="true"] { display:flex; }
    .field-error:empty { display:none; }
    .control-reference-card { border-color:#9ab2f4!important; background:#f4f7ff!important; }
    .control-reference-card .alternative-card__badges::after { content:"Старый проверенный эталон"; display:inline-flex; min-height:23px; align-items:center; padding:2px 8px; border-radius:999px; background:#e6edff; color:#2446a8; font-size:11px; font-weight:800; }
    .control-reference-switch { white-space:nowrap; }
    .layout-gallery { width:100%; min-width:0; display:grid; gap:14px; }
    .layout-gallery__intro { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; justify-content:space-between; padding:10px 12px; border:1px solid var(--line-strong,#cbd5e5); border-radius:9px; background:#f7f9fd; }
    .layout-gallery__intro strong { display:block; }
    .layout-gallery__forms { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .layout-gallery__form { min-width:0; }
    .layout-gallery__form > h3 { margin:0 0 6px; font-size:13px; }
    .layout-gallery__pair { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .review-sheet { position:relative; display:grid; width:100%; min-width:0; max-width:100%; aspect-ratio:var(--sheet-ratio); gap:2px; padding:clamp(6px,1.6vw,16px) clamp(6px,1.6vw,16px) clamp(21px,3vw,32px); border:1px solid var(--line-strong,#cbd5e5); background:#fff; overflow:hidden; }
    .review-sheet--back { border-style:dashed; }
    .review-sheet .layout-cell { min-width:0; padding:2px; font-size:clamp(7px,1.3vw,11px); line-height:1.05; }
    .review-sheet .layout-cell small { margin-top:2px; font-size:clamp(6px,1vw,9px); }
    .review-sheet__turn { position:absolute; left:5px; right:5px; bottom:3px; display:flex; align-items:center; justify-content:center; gap:5px; min-width:0; font-size:clamp(7px,1vw,10px); font-weight:800; color:#36445f; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .review-sheet__turn b { font-size:clamp(14px,2vw,20px); line-height:1; color:#315efb; }
    @media (max-width:760px) {
      .product-list { gap:4px!important; }
      .product-row__main { grid-template-columns:minmax(86px,1.4fr) minmax(60px,.7fr) 42px 36px 36px auto!important; }
      .product-row__main .field span { font-size:7px!important; }
      .product-row__main input { padding-inline:3px!important; font-size:10px!important; }
      .product-row__actions .icon-button { width:25px!important; min-width:25px!important; height:28px!important; }
      .product-row__details > summary { right:82px; }
      .layout-gallery__forms, .layout-gallery__pair { grid-template-columns:1fr; }
      .layout-gallery__intro { align-items:flex-start; }
    }
    @media (max-width:360px) {
      .product-row { padding-inline:4px!important; }
      .product-row__main { grid-template-columns:minmax(72px,1.3fr) 55px 38px 32px 32px auto!important; gap:2px!important; }
      .product-row__actions { gap:1px!important; }
      .product-row__actions .icon-button { width:22px!important; min-width:22px!important; padding:0!important; font-size:11px!important; }
      .product-row__details > summary { right:70px; width:24px; }
    }
  `;
  document.head.append(style);
}

function compactProductRows() {
  document.querySelectorAll("[data-product-row]").forEach((row) => {
    if (row.dataset.compactReady === "true") return;
    const detailsGrid = row.querySelector(".details-grid");
    const details = row.querySelector(".product-row__details");
    if (!detailsGrid || !details) return;
    ["finished.widthMm", "finished.heightMm", "variantCount"].forEach((fieldName) => {
      const field = row.querySelector(`[data-field-wrap="${fieldName}"]`);
      if (!field) return;
      field.dataset.compactSecondary = "true";
      detailsGrid.prepend(field);
    });
    const summary = details.querySelector("summary");
    if (summary) {
      summary.textContent = "Размер, виды и дополнительные параметры";
      summary.title = "Размер, виды и дополнительные параметры";
    }
    row.dataset.compactReady = "true";
  });
}

function controlRow(controlCase, order) {
  return {
    name: String(order.file),
    sourceFileName: null,
    finished: {
      widthMm: order.width ?? controlCase.product.width,
      heightMm: order.height ?? controlCase.product.height,
    },
    quantityPerVariant: order.quantity,
    variantCount: 1,
    pages: order.pages,
    print: {
      mode: "duplex",
      frontColors: 1,
      backColors: 1,
      duplexPreference: "separateFrontBackForms",
    },
    bleed: {
      mode: "uniform",
      uniformMm: order.bleed ?? 0,
      sidesMm: {
        left: order.bleed ?? 0,
        right: order.bleed ?? 0,
        top: order.bleed ?? 0,
        bottom: order.bleed ?? 0,
      },
    },
    cut: (order.bleed ?? 0) === 0
      ? { mode: "commonCut", gapMm: 0 }
      : { mode: "separated", gapMm: 0 },
    rotationPolicy: "auto",
    notes: "Контрольный заказ M3 · 1+1",
  };
}

function controlSheetInput(controlCase, currentInput) {
  const trim = controlCase.sheet.trim;
  return {
    ...currentInput,
    selectedSheetPressPresetId: null,
    sheet: {
      width: controlCase.sheet.width,
      height: controlCase.sheet.height,
      sizeStage: controlCase.sheet.sizeStage,
      trim: {
        enabled: trim.enabled,
        mode: "sides",
        uniformMm: 0,
        sidesMm: {
          left: trim.left,
          right: trim.right,
          top: trim.top,
          bottom: trim.bottom,
        },
      },
    },
    press: {
      marginsMm: { ...controlCase.sheet.pressMargins },
    },
    products: [],
  };
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
  return response.json();
}

async function activateControlExample() {
  const status = document.querySelector("[data-txt-import-controls] + .txt-import-status")
    ?? document.querySelector(".txt-import-status");
  if (status) {
    status.hidden = false;
    status.textContent = "Загружаем старый контрольный заказ 1+1 и эталон 4+4 формы…";
  }
  try {
    const controlCase = await loadJson("../data/control-case.json");
    const current = repository.load();
    if (!current) throw new Error("Текущий проект не найден в локальном хранилище.");
    let next = replaceApplicationInput(current, controlSheetInput(controlCase, current.input));
    controlCase.orders.forEach((order) => {
      next = addApplicationProductRow(next, controlRow(controlCase, order));
    });
    next = setApplicationActiveScreen(next, "layout");
    repository.save(next);
    window.localStorage.setItem(CONTROL_REFERENCE_KEY, "1");
    window.location.reload();
  } catch (error) {
    if (status) status.textContent = `Контрольный заказ не загружен: ${error.message}`;
  }
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
      && Number(row?.print?.backColors) === 1;
  });
}

function pricingProfileFromState() {
  const pricing = snapshot()?.state?.input?.pricing;
  if (!pricing || pricing.grammageGsm === null || pricing.paperPricePerKg === null || pricing.colorPlatePrice === null) {
    return null;
  }
  return createPricingProfile(pricing);
}

function referenceStructure(impositions) {
  const filesToForms = new Map();
  let distinctOrderTotal = 0;
  impositions.forEach(({ front }, index) => {
    const files = new Set(front.cells.map(({ file }) => file));
    distinctOrderTotal += files.size;
    files.forEach((file) => {
      const forms = filesToForms.get(file) ?? new Set();
      forms.add(index);
      filesToForms.set(file, forms);
    });
  });
  return {
    splitOrders: [...filesToForms.values()].filter((forms) => forms.size > 1).length,
    distinctOrdersPerImposition: distinctOrderTotal / impositions.length,
  };
}

async function buildControlReference() {
  const [controlCase, controlLayout] = await Promise.all([
    loadJson("../data/control-case.json"),
    loadJson("../data/control-layout-m3.json"),
  ]);
  if (!currentMatchesControlCase(controlCase)) return null;

  const pagePairs = expandPagePairs(controlCase.orders);
  const impositions = controlLayout.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    return Object.freeze({ front, back: createBackLayout(front) });
  });
  const report = buildProductionReport({
    pagePairs,
    impositions,
    duplexMode: "separateFrontBackForms",
  });
  if (
    !report.valid
    || report.totals.impositionCount !== 4
    || report.totals.frontForms !== 4
    || report.totals.backForms !== 4
    || report.totals.forms !== 8
  ) {
    throw new Error("Старый контрольный эталон не подтвердил 4 лица + 4 оборота.");
  }

  const structure = referenceStructure(impositions);
  const printSpecification = createDuplexPrintSpecification({ frontColors: 1, backColors: 1 });
  const metrics = createProductionReportSolutionMetrics({
    report,
    sourceSheet: {
      width: controlCase.sheet.width,
      height: controlCase.sheet.height,
    },
    pricing: pricingProfileFromState(),
    printSpecification,
    id: CONTROL_REFERENCE_ID,
    label: "Контрольная ручная раскладка M3",
    source: "control-reference/m3",
    layoutCompactness: 1,
    distinctOrdersPerImposition: structure.distinctOrdersPerImposition,
    splitOrders: structure.splitOrders,
    fragmentedBlocks: 0,
  });

  return Object.freeze({
    id: CONTROL_REFERENCE_ID,
    label: "Контрольная ручная раскладка M3",
    family: "controlManualReference",
    duplexMode: "separateFrontBackForms",
    grid: Object.freeze({ rotation: 90, rows: 4, columns: 4, capacity: 16 }),
    impositions: Object.freeze(impositions),
    report,
    metrics,
    controlCase,
  });
}

function turnInstruction(geometry) {
  const width = Number(geometry?.trimmed?.width ?? geometry?.source?.width ?? 1);
  const height = Number(geometry?.trimmed?.height ?? geometry?.source?.height ?? 1);
  return width >= height
    ? { icon: "↔", label: "через короткую сторону · слева направо" }
    : { icon: "↕", label: "через короткую сторону · сверху вниз" };
}

function cellNode(cell, side, index) {
  const node = document.createElement("div");
  node.className = "layout-cell";
  const page = cell.page ?? (side === "front" ? cell.frontPage : cell.backPage);
  if (page === null || page === undefined) node.classList.add("layout-cell--blank");
  node.dataset.layoutSide = side;
  node.dataset.layoutIndex = String(index + 1);
  node.dataset.layoutPage = page === null || page === undefined ? "blank" : String(page);
  node.innerHTML = `${cell.file}<small>${side === "front" ? "стр." : "обр."} ${page ?? "—"}</small>`;
  return node;
}

function sheetNode(layout, side, geometry, instruction) {
  const sheet = document.createElement("div");
  sheet.className = `review-sheet${side === "back" ? " review-sheet--back" : ""}`;
  sheet.dataset.reviewSide = side;
  sheet.style.setProperty("--sheet-ratio", `${geometry.trimmed.width} / ${geometry.trimmed.height}`);
  sheet.style.gridTemplateColumns = `repeat(${layout.columns},minmax(0,1fr))`;
  sheet.style.gridTemplateRows = `repeat(${layout.rows},minmax(0,1fr))`;
  layout.cells.forEach((cell, index) => sheet.append(cellNode(cell, side, index)));
  const turn = document.createElement("div");
  turn.className = "review-sheet__turn";
  turn.innerHTML = `<b>${instruction.icon}</b><span>${instruction.label}</span>`;
  sheet.append(turn);
  return sheet;
}

function layoutView() {
  const button = document.querySelector(".screen--layout .segmented button.is-active");
  return button?.dataset.acceptanceLayout ?? button?.dataset.layoutSide ?? "front";
}

function activePlanData() {
  if (controlReferenceActive && controlReference) {
    return {
      id: controlReference.id,
      label: controlReference.label,
      impositions: controlReference.impositions,
      sharedPlates: [],
      metrics: controlReference.metrics,
      reference: true,
    };
  }
  const data = snapshot()?.lastValidResult;
  const plan = data?.planSet?.plans?.find(({ id }) => id === data.selectedPlanId) ?? null;
  if (!plan) return null;
  return {
    id: plan.id,
    label: plan.label,
    impositions: plan.impositions,
    sharedPlates: plan.sharedPlates ?? [],
    metrics: plan.metrics,
    reference: false,
  };
}

function formHeading(index, count, side) {
  const sideLabel = side === "front" ? "лицо" : side === "back" ? "оборот · зеркально" : "общая форма";
  return `Форма ${index + 1} из ${count} · ${sideLabel}`;
}

function singleForm(layout, side, index, count, geometry, instruction) {
  const section = document.createElement("section");
  section.className = "layout-gallery__form";
  const heading = document.createElement("h3");
  heading.textContent = formHeading(index, count, side);
  section.append(heading, sheetNode(layout, side, geometry, instruction));
  return section;
}

function pairForm(record, index, count, geometry, instruction) {
  const section = document.createElement("section");
  section.className = "layout-gallery__form";
  const heading = document.createElement("h3");
  heading.textContent = `Монтаж ${index + 1} из ${count} · лицо + зеркальный оборот`;
  const pair = document.createElement("div");
  pair.className = "layout-gallery__pair";
  pair.append(
    singleForm(record.front, "front", index, count, geometry, instruction),
    singleForm(record.back, "back", index, count, geometry, instruction),
  );
  section.append(heading, pair);
  return section;
}

function renderGallery() {
  if (renderingGallery) return;
  const host = document.querySelector("#layoutSheet");
  const geometry = snapshot()?.lastValidResult?.geometry;
  const plan = activePlanData();
  if (!host || !geometry || !plan?.impositions?.length) return;

  const view = layoutView();
  const signature = `${plan.id}|${view}|${plan.impositions.length}|${controlReferenceActive}`;
  if (host.dataset.reviewGallerySignature === signature && host.querySelector(".layout-gallery")) return;

  renderingGallery = true;
  try {
    const instruction = turnInstruction(geometry);
    const gallery = document.createElement("div");
    gallery.className = "layout-gallery";
    gallery.dataset.layoutRenderedView = view;

    const intro = document.createElement("div");
    intro.className = "layout-gallery__intro";
    intro.innerHTML = `
      <div><strong>${plan.reference ? "Контрольный эталон" : "Полный набор форм выбранного варианта"}</strong><span>${plan.label}</span></div>
      <div><strong>${plan.reference ? "4 лица + 4 оборота = 8 форм" : `${plan.metrics.layoutForms} форм`}</strong><span>${instruction.icon} ${instruction.label}</span></div>
    `;
    gallery.append(intro);

    const forms = document.createElement("div");
    forms.className = "layout-gallery__forms";
    const count = plan.impositions.length;
    if (view === "shared" && plan.sharedPlates.length > 0) {
      plan.sharedPlates.forEach((plate, index) => {
        const shared = {
          ...plate,
          cells: plate.cells.map((cell) => ({ ...cell, frontPage: cell.page, backPage: cell.page })),
        };
        forms.append(singleForm(shared, "front", index, plan.sharedPlates.length, geometry, instruction));
      });
    } else if (view === "back") {
      plan.impositions.forEach((record, index) => forms.append(
        singleForm(record.back, "back", index, count, geometry, instruction),
      ));
    } else if (view === "both") {
      plan.impositions.forEach((record, index) => forms.append(
        pairForm(record, index, count, geometry, instruction),
      ));
    } else {
      plan.impositions.forEach((record, index) => forms.append(
        singleForm(record.front, "front", index, count, geometry, instruction),
      ));
    }
    gallery.append(forms);

    host.classList.add("layout-sheet--custom");
    host.style.display = "block";
    host.style.aspectRatio = "auto";
    host.replaceChildren(gallery);
    host.dataset.reviewGallerySignature = signature;
  } finally {
    renderingGallery = false;
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
  card.classList.toggle("is-selected", controlReferenceActive);
  card.innerHTML = `
    <div class="alternative-cell alternative-cell--title">
      <div class="alternative-card__badges"></div>
      <strong>Контрольная ручная раскладка M3 · 90° · 4×4</strong>
      <span>Эталон прежнего интерфейса, не заявлен как глобальный optimum</span>
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
  const host = document.querySelector(".screen--layout .screen-heading__actions");
  if (!host || !controlReference) return;
  let button = host.querySelector("[data-control-reference-switch]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "button control-reference-switch";
    button.dataset.controlReferenceSwitch = "true";
    host.append(button);
  }
  button.textContent = controlReferenceActive ? "Вернуться к рассчитанному" : "Эталон 4+4 формы";
}

function renderReferenceDetails() {
  const details = document.querySelector("#layoutDetails");
  if (!details || !controlReference) return;
  let note = details.querySelector("[data-control-reference-note]");
  if (!note) {
    note = document.createElement("div");
    note.className = "work-and-turn-note";
    note.dataset.controlReferenceNote = "true";
    details.prepend(note);
  }
  note.innerHTML = controlReferenceActive
    ? `<strong>Показан старый контрольный эталон.</strong><br>20 файлов A6, чёрно-белая печать 1+1, 4 монтажа: 4 формы лица + 4 зеркальные формы оборота. Всего 8 форм.`
    : `<strong>Доступен старый контрольный эталон.</strong><br>Он позволяет сравнить новый расчёт с прежней проверенной ручной раскладкой на 8 форм.`;
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => {
    renderQueued = false;
    compactProductRows();
    renderReferenceCard();
    renderReferenceSwitch();
    renderReferenceDetails();
    renderGallery();
  });
}

async function initialiseControlReference() {
  if (window.localStorage.getItem(CONTROL_REFERENCE_KEY) !== "1") return;
  try {
    controlReference = await buildControlReference();
    controlReferenceActive = Boolean(controlReference);
    scheduleRender();
  } catch (error) {
    console.error("Control reference was not prepared", error);
  }
}

function attachEvents() {
  document.addEventListener("click", (event) => {
    const example = event.target.closest("[data-txt-import-controls] button");
    if (example?.textContent.trim() === "Пример: 20 видов") {
      event.preventDefault();
      event.stopImmediatePropagation();
      activateControlExample();
      return;
    }

    if (event.target.closest("[data-control-reference-select]")) {
      controlReferenceActive = true;
      window.__uimpositionR3?.openScreen?.("layout");
      scheduleRender();
      return;
    }
    if (event.target.closest("[data-control-reference-switch]")) {
      controlReferenceActive = !controlReferenceActive;
      scheduleRender();
      return;
    }
    if (event.target.closest("[data-select-plan]")) {
      controlReferenceActive = false;
      scheduleRender();
      return;
    }
    if (event.target.closest(".screen--layout .segmented button")) {
      setTimeout(scheduleRender, 0);
    }
  }, true);
}

function boot() {
  injectStyles();
  attachEvents();
  compactProductRows();
  initialiseControlReference();
  const shell = document.querySelector("#appShell");
  if (shell) {
    const observer = new MutationObserver(() => {
      if (!renderingGallery) scheduleRender();
    });
    observer.observe(shell, { childList: true, subtree: true });
  }
  scheduleRender();
}

const waitForWorkspace = setInterval(() => {
  if (!window.__uimpositionR3) return;
  clearInterval(waitForWorkspace);
  boot();
}, 25);
setTimeout(() => clearInterval(waitForWorkspace), 10000);

window.__uimpositionOperatorReview = Object.freeze({
  activateControlExample,
  getControlReference: () => controlReference,
  setControlReferenceActive(value) {
    controlReferenceActive = Boolean(value && controlReference);
    scheduleRender();
  },
  render: scheduleRender,
});
