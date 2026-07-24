import { CONFIG } from "./config.js";
import { expandPagePairs } from "./orders.js";
import { createFrontLayout } from "./front-layout.js";
import { createBackLayout } from "./back-layout.js";
import { validateImposition } from "./imposition-validation.js";
import { renderSchemePairs } from "./scheme-renderer.js";

const state = { records: null, loadSequence: 0 };

function language() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function ensureStylesheet() {
  if (document.querySelector('link[data-m3-styles]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "m3.css";
  link.dataset.m3Styles = "";
  document.head.append(link);
}

function ensurePanel() {
  const existing = document.querySelector("#impositionResults");
  if (existing) return existing;

  const panel = document.createElement("section");
  panel.id = "impositionResults";
  panel.className = "panel imposition-panel";
  panel.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="section-kicker">M3</p>
        <h2 data-lang="ru">Лицо и зеркальный оборот</h2>
        <h2 data-lang="en" hidden>Front and mirrored back</h2>
      </div>
      <span id="impositionStatus" class="status-chip"></span>
    </div>
    <p data-lang="ru">Контрольная раскладка создаёт четыре лицевые формы по 16 позиций. Каждый оборот автоматически выводится из соответствующего лица зеркалированием колонок.</p>
    <p data-lang="en" hidden>The control layout creates four 16-position front forms. Every back form is derived automatically from its front by mirroring columns.</p>
    <p id="impositionEmpty" class="empty-state"></p>
    <p id="impositionError" class="error-box" hidden></p>
    <div id="impositionSchemes" class="scheme-pairs"></div>
    <div class="formula-card">
      <p data-lang="ru"><strong>Важно:</strong> это ручная контрольная раскладка для проверки M3, а не доказанный глобальный минимум бумаги.</p>
      <p data-lang="en" hidden><strong>Important:</strong> this is a manual M3 control layout, not a proven global paper minimum.</p>
    </div>`;

  const roadmap = document.querySelector(".roadmap-panel");
  const workspace = document.querySelector(".workspace");
  if (!workspace) throw new Error("Workspace container not found");
  workspace.insertBefore(panel, roadmap ?? null);
  return panel;
}

const panel = ensurePanel();
ensureStylesheet();

const ui = {
  status: panel.querySelector("#impositionStatus"),
  empty: panel.querySelector("#impositionEmpty"),
  error: panel.querySelector("#impositionError"),
  schemes: panel.querySelector("#impositionSchemes"),
  loadControlCase: document.querySelector("#loadControlCase"),
  clearOrders: document.querySelector("#clearOrders"),
  ordersInput: document.querySelector("#ordersInput"),
  settingsPanel: document.querySelector("#settingsPanel"),
};

function syncLanguageContent() {
  const current = language();
  panel.querySelectorAll("[data-lang]").forEach((element) => {
    element.hidden = element.dataset.lang !== current;
  });
  if (state.records) {
    renderSchemePairs(ui.schemes, state.records, { language: current });
    ui.status.textContent = current === "ru" ? "4 лица · 4 оборота · проверено" : "4 fronts · 4 backs · validated";
  } else if (!ui.error.hidden) {
    ui.status.textContent = current === "ru" ? "Ошибка M3" : "M3 error";
  } else {
    ui.status.textContent = current === "ru" ? "Загрузите контрольный заказ" : "Load the control dataset";
    ui.empty.textContent = current === "ru"
      ? "Схемы появятся после загрузки контрольного заказа."
      : "Schemes appear after loading the control dataset.";
  }
}

function clearControlLayouts() {
  state.loadSequence += 1;
  state.records = null;
  ui.schemes.replaceChildren();
  ui.error.hidden = true;
  syncLanguageContent();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

function buildRecords(layoutData, pagePairs) {
  if (!Array.isArray(layoutData.layouts) || layoutData.layouts.length === 0) {
    throw new TypeError("M3 control layout does not contain layouts");
  }

  return layoutData.layouts.map((layout) => {
    const front = createFrontLayout({ ...layout, pagePairs });
    const back = createBackLayout(front);
    const validation = validateImposition({ front, back, pagePairs });
    if (!validation.valid) {
      throw new Error(`Layout ${layout.id}: ${validation.errors.join("; ")}`);
    }
    return { front, back, validation };
  });
}

async function loadControlLayouts() {
  const sequence = ++state.loadSequence;
  const current = language();
  ui.status.textContent = current === "ru" ? "Проверка схем…" : "Validating schemes…";
  ui.empty.textContent = "";
  ui.error.hidden = true;

  try {
    const [controlCase, layoutData] = await Promise.all([
      fetchJson(CONFIG.demo.controlCaseUrl),
      fetchJson(CONFIG.demo.controlLayoutUrl),
    ]);
    const pagePairs = expandPagePairs(controlCase.orders ?? []);
    const records = buildRecords(layoutData, pagePairs);
    if (sequence !== state.loadSequence) return;

    state.records = records;
    renderSchemePairs(ui.schemes, records, { language: current });
    ui.status.textContent = current === "ru" ? "4 лица · 4 оборота · проверено" : "4 fronts · 4 backs · validated";
  } catch (error) {
    if (sequence !== state.loadSequence) return;
    console.error(error);
    state.records = null;
    ui.schemes.replaceChildren();
    ui.status.textContent = current === "ru" ? "Ошибка M3" : "M3 error";
    ui.error.textContent = error.message;
    ui.error.hidden = false;
  }
}

ui.loadControlCase?.addEventListener("click", loadControlLayouts);
ui.clearOrders?.addEventListener("click", clearControlLayouts);
ui.ordersInput?.addEventListener("input", clearControlLayouts);
ui.settingsPanel?.addEventListener("input", clearControlLayouts);
ui.settingsPanel?.addEventListener("change", clearControlLayouts);

new MutationObserver(syncLanguageContent).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["lang"],
});

syncLanguageContent();
if (new URLSearchParams(location.search).get(CONFIG.demo.queryParameter) === "control") {
  loadControlLayouts();
}
