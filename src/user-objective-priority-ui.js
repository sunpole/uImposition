import {
  HARD_CONSTRAINTS,
  getOptimizationObjective,
} from "./optimization-objectives.js";
import {
  USER_OBJECTIVE_PRESETS,
  moveUserObjectiveBy,
} from "./user-objective-priority.js";
import {
  applyUserProductionObjectivePreset,
  rerankUserProductionPlans,
  subscribeUserProductionPlanRuntime,
} from "./user-production-plans-runtime.js";

const TEXT = Object.freeze({
  ru: Object.freeze({
    title: "Приоритеты решения",
    subtitle: "Что важнее оператору",
    waiting: "Введите корректный заказ. После построения вариантов здесь появятся все доступные цели.",
    hint: "Порядок применяется лексикографически: первая различающаяся цель решает, какой вариант рекомендован. Варианты не удаляются.",
    paperFirst: "Бумага",
    costFirst: "Стоимость",
    formsFirst: "Формы",
    passesFirst: "Прогоны",
    overrunFirst: "Перетираж",
    presetHint: "Быстрые режимы",
    activeOrder: "Порядок целей",
    hardConstraints: "Жёсткие ограничения — не перемещаются",
    minimize: "меньше лучше",
    maximize: "больше лучше",
    moveUp: "Поднять",
    moveDown: "Опустить",
    dragHint: "На компьютере строку можно перетащить. На телефоне используйте стрелки.",
    rankingReady: "Ранжирование готово",
    reused: "готовых планов использовано повторно",
    regenerated: "планов построено заново",
    recommended: "рекомендован",
    unchanged: "Порядок уже применён",
    error: "Не удалось изменить приоритеты",
    pricingNeeded: "Сначала введите рабочий прайс",
  }),
  en: Object.freeze({
    title: "Decision priorities",
    subtitle: "What matters to the operator",
    waiting: "Enter a valid order. Every active objective will appear after alternatives are built.",
    hint: "The order is lexicographic: the first differing objective decides the recommendation. Alternatives are never deleted.",
    paperFirst: "Paper",
    costFirst: "Cost",
    formsFirst: "Forms",
    passesFirst: "Passes",
    overrunFirst: "Overrun",
    presetHint: "Quick modes",
    activeOrder: "Objective order",
    hardConstraints: "Hard constraints — fixed",
    minimize: "lower is better",
    maximize: "higher is better",
    moveUp: "Move up",
    moveDown: "Move down",
    dragHint: "Drag rows with a mouse. Use arrow buttons on mobile.",
    rankingReady: "Ranking ready",
    reused: "generated plans reused",
    regenerated: "plans regenerated",
    recommended: "recommended",
    unchanged: "Order already applied",
    error: "Could not change priorities",
    pricingNeeded: "Enter production pricing first",
  }),
});

const PRESETS = Object.freeze([
  Object.freeze({ id: USER_OBJECTIVE_PRESETS.PAPER_FIRST, label: "paperFirst" }),
  Object.freeze({ id: USER_OBJECTIVE_PRESETS.COST_FIRST, label: "costFirst", requires: "estimatedTotalCost" }),
  Object.freeze({ id: USER_OBJECTIVE_PRESETS.FORMS_FIRST, label: "formsFirst" }),
  Object.freeze({ id: USER_OBJECTIVE_PRESETS.PASSES_FIRST, label: "passesFirst" }),
  Object.freeze({ id: USER_OBJECTIVE_PRESETS.OVERRUN_FIRST, label: "overrunFirst" }),
]);

let snapshot = Object.freeze({ ready: false, planSet: null });
let draggedObjectiveId = null;
let message = "";
let messageIsError = false;

const $ = (selector) => document.querySelector(selector);

function language() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function t(key) {
  return TEXT[language()][key] ?? TEXT.ru[key] ?? key;
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function ensureStylesheet() {
  if ($('link[data-user-objective-priority-styles]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "user-objective-priority.css";
  link.setAttribute("data-user-objective-priority-styles", "");
  document.head.append(link);
}

function ensureEditor() {
  const existing = $("#userObjectivePriorityEditor");
  if (existing) return existing;
  const settings = $(".settings-panel__content");
  if (!settings) throw new Error("Settings panel content not found");

  const divider = element("div", "settings-divider user-objective-priority-divider");
  const titleRu = element("h2", "settings-section-title", TEXT.ru.title);
  titleRu.dataset.lang = "ru";
  const titleEn = element("h2", "settings-section-title", TEXT.en.title);
  titleEn.dataset.lang = "en";
  titleEn.hidden = language() !== "en";
  const editor = element("section", "user-objective-priority");
  editor.id = "userObjectivePriorityEditor";

  const pricing = $("#pricingControls");
  const pricingTitle = pricing?.previousElementSibling;
  const anchor = pricingTitle?.previousElementSibling?.classList.contains("settings-divider")
    ? pricingTitle.previousElementSibling
    : pricingTitle ?? pricing;
  if (anchor) {
    settings.insertBefore(divider, anchor);
    settings.insertBefore(titleRu, anchor);
    settings.insertBefore(titleEn, anchor);
    settings.insertBefore(editor, anchor);
  } else {
    settings.append(divider, titleRu, titleEn, editor);
  }
  return editor;
}

function objectiveLabel(objectiveId) {
  const objective = getOptimizationObjective(objectiveId);
  return objective.label[language()] ?? objective.label.ru;
}

function directionLabel(objectiveId) {
  return getOptimizationObjective(objectiveId).direction === "maximize"
    ? t("maximize")
    : t("minimize");
}

function setMessage(text, error = false) {
  message = text;
  messageIsError = error;
}

function rankingMessage(planSet) {
  const reranking = planSet?.reranking;
  if (!reranking) return t("rankingReady");
  const count = planSet.catalog.summary.feasibleSolutionCount;
  return `${count} ${t("reused")} · ${reranking.regeneratedPlanCount} ${t("regenerated")} · ${t("recommended")}: ${reranking.recommendedId}`;
}

function applyOrder(order) {
  try {
    const current = snapshot.planSet?.catalog?.objectiveOrder ?? [];
    if (current.length === order.length && current.every((id, index) => id === order[index])) {
      setMessage(t("unchanged"));
      render();
      return;
    }
    const next = rerankUserProductionPlans(order);
    setMessage(rankingMessage(next.planSet));
  } catch (error) {
    console.error(error);
    setMessage(`${t("error")}: ${error.message}`, true);
    render();
  }
}

function applyPreset(presetId) {
  try {
    const next = applyUserProductionObjectivePreset(presetId);
    setMessage(rankingMessage(next.planSet));
  } catch (error) {
    console.error(error);
    setMessage(
      error.message.includes("inactive objective") ? t("pricingNeeded") : `${t("error")}: ${error.message}`,
      true,
    );
    render();
  }
}

function presetButtons(planSet) {
  const wrapper = element("div", "objective-preset-grid");
  const active = new Set(planSet.catalog.objectiveIds);
  PRESETS.forEach((preset) => {
    const button = element("button", "objective-preset-button", t(preset.label));
    button.type = "button";
    button.dataset.objectivePreset = preset.id;
    const unavailable = preset.requires && !active.has(preset.requires);
    button.disabled = Boolean(unavailable);
    if (unavailable) button.title = t("pricingNeeded");
    button.addEventListener("click", () => applyPreset(preset.id));
    wrapper.append(button);
  });
  return wrapper;
}

function moveObjective(objectiveId, offset) {
  try {
    const current = snapshot.planSet.catalog.objectiveOrder;
    const next = moveUserObjectiveBy(snapshot.planSet, current, objectiveId, offset);
    applyOrder(next);
  } catch (error) {
    console.error(error);
    setMessage(`${t("error")}: ${error.message}`, true);
    render();
  }
}

function reorderByDrop(targetObjectiveId) {
  if (!draggedObjectiveId || draggedObjectiveId === targetObjectiveId) return;
  const order = [...snapshot.planSet.catalog.objectiveOrder];
  const from = order.indexOf(draggedObjectiveId);
  const to = order.indexOf(targetObjectiveId);
  if (from < 0 || to < 0) return;
  order.splice(from, 1);
  order.splice(to, 0, draggedObjectiveId);
  applyOrder(order);
}

function objectiveRow(objectiveId, index, count) {
  const row = element("li", "objective-priority-row");
  row.dataset.objectiveId = objectiveId;
  row.draggable = Boolean(window.matchMedia?.("(pointer: fine)")?.matches);

  const handle = element("span", "objective-priority-handle", "⋮⋮");
  handle.setAttribute("aria-hidden", "true");
  const position = element("span", "objective-priority-position", String(index + 1));
  const copy = element("span", "objective-priority-copy");
  copy.append(
    element("strong", "", objectiveLabel(objectiveId)),
    element("small", "", directionLabel(objectiveId)),
  );

  const actions = element("span", "objective-priority-actions");
  const up = element("button", "objective-move-button", "↑");
  const down = element("button", "objective-move-button", "↓");
  up.type = "button";
  down.type = "button";
  up.disabled = index === 0;
  down.disabled = index === count - 1;
  up.dataset.moveObjective = objectiveId;
  up.dataset.offset = "-1";
  down.dataset.moveObjective = objectiveId;
  down.dataset.offset = "1";
  up.setAttribute("aria-label", `${t("moveUp")}: ${objectiveLabel(objectiveId)}`);
  down.setAttribute("aria-label", `${t("moveDown")}: ${objectiveLabel(objectiveId)}`);
  up.addEventListener("click", () => moveObjective(objectiveId, -1));
  down.addEventListener("click", () => moveObjective(objectiveId, 1));
  actions.append(up, down);

  row.append(handle, position, copy, actions);
  row.addEventListener("dragstart", (event) => {
    draggedObjectiveId = objectiveId;
    row.classList.add("is-dragging");
    event.dataTransfer?.setData("text/plain", objectiveId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  });
  row.addEventListener("dragend", () => {
    draggedObjectiveId = null;
    row.classList.remove("is-dragging");
  });
  row.addEventListener("dragover", (event) => {
    if (!draggedObjectiveId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  });
  row.addEventListener("drop", (event) => {
    event.preventDefault();
    reorderByDrop(objectiveId);
    draggedObjectiveId = null;
  });
  return row;
}

function hardConstraintList() {
  const list = element("ul", "hard-constraint-list");
  HARD_CONSTRAINTS.forEach((constraint) => {
    list.append(element("li", "", constraint.label[language()] ?? constraint.label.ru));
  });
  const details = element("details", "objective-hard-constraints");
  details.append(element("summary", "", t("hardConstraints")), list);
  return details;
}

function renderWaiting(editor) {
  editor.replaceChildren(
    element("p", "user-objective-priority__subtitle", t("subtitle")),
    element("p", "hint", t("waiting")),
    hardConstraintList(),
  );
}

function render() {
  const editor = ensureEditor();
  const planSet = snapshot.planSet;
  if (!planSet) {
    renderWaiting(editor);
    return;
  }

  const order = planSet.catalog.objectiveOrder;
  const status = element(
    "p",
    `objective-priority-status${messageIsError ? " is-error" : ""}`,
    message || rankingMessage(planSet),
  );
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const list = element("ol", "objective-priority-list");
  order.forEach((objectiveId, index) => {
    list.append(objectiveRow(objectiveId, index, order.length));
  });

  editor.replaceChildren(
    element("p", "user-objective-priority__subtitle", t("subtitle")),
    element("p", "hint user-objective-priority__hint", t("hint")),
    element("p", "objective-priority-label", t("presetHint")),
    presetButtons(planSet),
    element("p", "objective-priority-label", t("activeOrder")),
    list,
    element("p", "hint objective-drag-hint", t("dragHint")),
    status,
    hardConstraintList(),
  );
}

function refreshLanguage() {
  message = "";
  messageIsError = false;
  render();
}

ensureStylesheet();
ensureEditor();
subscribeUserProductionPlanRuntime((nextSnapshot) => {
  snapshot = nextSnapshot;
  if (snapshot.planSet?.reranking) setMessage(rankingMessage(snapshot.planSet));
  render();
});
new MutationObserver(refreshLanguage).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["lang"],
});
