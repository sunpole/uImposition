import {
  createDecisionProfile,
  explainSolutionPreference,
  moveDecisionObjective,
  rankSolutions,
} from "./decision-profile.js";
import { getOptimizationObjective } from "./optimization-objectives.js";

const DEMO_ID = "decision-profile";

const SOLUTIONS = Object.freeze([
  Object.freeze({
    id: "paper-minimum",
    name: Object.freeze({ ru: "Минимум бумаги", en: "Paper minimum" }),
    metrics: Object.freeze({
      physicalSheets: 3305,
      layoutForms: 112,
      colorPlates: 448,
      fileOverrun: 0,
      pairOverrun: 10,
      pressPasses: 6610,
      splitOrders: 20,
      impositionCount: 56,
      layoutCompactness: 0.45,
      distinctOrdersPerImposition: 2,
    }),
  }),
  Object.freeze({
    id: "manual-compact",
    name: Object.freeze({ ru: "Компактный ручной", en: "Compact manual" }),
    metrics: Object.freeze({
      physicalSheets: 3395,
      layoutForms: 8,
      colorPlates: 32,
      fileOverrun: 930,
      pairOverrun: 1450,
      pressPasses: 6790,
      splitOrders: 0,
      impositionCount: 4,
      layoutCompactness: 0.95,
      distinctOrdersPerImposition: 8,
    }),
  }),
]);

const TEXT = Object.freeze({
  ru: {
    kicker: "M7.1",
    title: "Порядок целей меняет рекомендацию",
    intro: "Оба варианта допустимы и не имеют недопечатки. Меняется только порядок целей — программа мгновенно выбирает другой вариант без повторной генерации раскладок.",
    hard: "Жёсткие ограничения не перемещаются: недопечатка 0, валидная геометрия, правильные лицо/оборот и производственный отчёт.",
    raiseForms: "Поднять формы выше бумаги",
    raisePaper: "Вернуть бумагу на первое место",
    winner: "Рекомендуемый вариант",
    sheets: "Листы",
    forms: "Layout-формы",
    reason: "Решающий приоритет",
    order: "Текущая иерархия",
    comparison: "Два неизменных варианта",
    firstFour: "Первые четыре цели определяют основное решение; остальные применяются при равенстве.",
  },
  en: {
    kicker: "M7.1",
    title: "Objective order changes the recommendation",
    intro: "Both solutions are valid and have zero underproduction. Only the objective order changes, so the application selects another solution instantly without regenerating layouts.",
    hard: "Hard constraints cannot move: zero underproduction, valid geometry, correct front/back mapping, and a validated production report.",
    raiseForms: "Move forms above paper",
    raisePaper: "Return paper to first place",
    winner: "Recommended solution",
    sheets: "Sheets",
    forms: "Side-layout forms",
    reason: "Deciding objective",
    order: "Current hierarchy",
    comparison: "Two unchanged solutions",
    firstFour: "The first four objectives determine the main choice; later objectives break ties.",
  },
});

function language() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function locale() {
  return language() === "en" ? "en-US" : "ru-RU";
}

function formatNumber(value) {
  return Number(value).toLocaleString(locale());
}

function ensureStylesheet() {
  if (document.querySelector("link[data-m7-decision-demo-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "m7-decision-demo.css";
  link.setAttribute("data-m7-decision-demo-styles", "");
  document.head.append(link);
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function createPanel() {
  const panel = element("section", "panel decision-demo");
  panel.id = "decisionProfileDemo";
  panel.innerHTML = `
    <div class="section-heading decision-demo__heading">
      <div>
        <p class="section-kicker" id="decisionDemoKicker"></p>
        <h2 id="decisionDemoTitle"></h2>
      </div>
      <span class="status-chip" id="decisionDemoStatus">M7.1</span>
    </div>
    <p id="decisionDemoIntro"></p>
    <div class="decision-demo__hard" id="decisionDemoHard"></div>
    <div class="decision-demo__layout">
      <div class="decision-demo__priority-panel">
        <div class="decision-demo__subheading">
          <h3 id="decisionOrderTitle"></h3>
          <button type="button" class="button" id="decisionPriorityToggle"></button>
        </div>
        <ol class="decision-demo__order" id="decisionObjectiveOrder"></ol>
        <p class="hint" id="decisionOrderHint"></p>
      </div>
      <div class="decision-demo__winner" id="decisionWinnerCard">
        <span id="decisionWinnerLabel"></span>
        <strong id="decisionWinnerName"></strong>
        <div class="decision-demo__winner-metrics">
          <div><span id="decisionWinnerSheetsLabel"></span><b id="decisionWinnerSheets"></b></div>
          <div><span id="decisionWinnerFormsLabel"></span><b id="decisionWinnerForms"></b></div>
        </div>
        <p><span id="decisionReasonLabel"></span>: <strong id="decisionReason"></strong></p>
      </div>
    </div>
    <h3 id="decisionComparisonTitle"></h3>
    <div class="decision-demo__solutions" id="decisionSolutionComparison"></div>
  `;
  return panel;
}

function solutionCard(solution, recommended, text) {
  const card = element("article", `decision-demo__solution${recommended ? " is-recommended" : ""}`);
  card.dataset.solutionId = solution.id;
  const name = element("strong", "", solution.name[language()]);
  const metrics = element("div", "decision-demo__solution-metrics");
  metrics.append(
    element("span", "", `${text.sheets}: ${formatNumber(solution.metrics.physicalSheets)}`),
    element("span", "", `${text.forms}: ${formatNumber(solution.metrics.layoutForms)}`),
  );
  card.append(name, metrics);
  return card;
}

function startDemo() {
  if (new URLSearchParams(location.search).get("demo") !== DEMO_ID) return;
  ensureStylesheet();
  const workspace = document.querySelector(".workspace");
  if (!workspace) throw new Error("Workspace container not found");

  const panel = createPanel();
  workspace.prepend(panel);
  let profile = createDecisionProfile({ id: "operator" });

  const ui = {
    kicker: panel.querySelector("#decisionDemoKicker"),
    title: panel.querySelector("#decisionDemoTitle"),
    intro: panel.querySelector("#decisionDemoIntro"),
    hard: panel.querySelector("#decisionDemoHard"),
    orderTitle: panel.querySelector("#decisionOrderTitle"),
    toggle: panel.querySelector("#decisionPriorityToggle"),
    order: panel.querySelector("#decisionObjectiveOrder"),
    orderHint: panel.querySelector("#decisionOrderHint"),
    winnerLabel: panel.querySelector("#decisionWinnerLabel"),
    winnerName: panel.querySelector("#decisionWinnerName"),
    winnerSheetsLabel: panel.querySelector("#decisionWinnerSheetsLabel"),
    winnerSheets: panel.querySelector("#decisionWinnerSheets"),
    winnerFormsLabel: panel.querySelector("#decisionWinnerFormsLabel"),
    winnerForms: panel.querySelector("#decisionWinnerForms"),
    reasonLabel: panel.querySelector("#decisionReasonLabel"),
    reason: panel.querySelector("#decisionReason"),
    comparisonTitle: panel.querySelector("#decisionComparisonTitle"),
    comparison: panel.querySelector("#decisionSolutionComparison"),
  };

  function render() {
    const currentLanguage = language();
    const text = TEXT[currentLanguage];
    const ranked = rankSolutions(SOLUTIONS, profile);
    const winner = ranked[0].solution;
    const other = ranked[1].solution;
    const explanation = explainSolutionPreference(winner, other, profile);
    const formsFirst = profile.objectiveOrder[0] === "layoutForms";

    ui.kicker.textContent = text.kicker;
    ui.title.textContent = text.title;
    ui.intro.textContent = text.intro;
    ui.hard.textContent = text.hard;
    ui.orderTitle.textContent = text.order;
    ui.toggle.textContent = formsFirst ? text.raisePaper : text.raiseForms;
    ui.orderHint.textContent = text.firstFour;
    ui.winnerLabel.textContent = text.winner;
    ui.winnerName.textContent = winner.name[currentLanguage];
    ui.winnerSheetsLabel.textContent = text.sheets;
    ui.winnerSheets.textContent = formatNumber(winner.metrics.physicalSheets);
    ui.winnerFormsLabel.textContent = text.forms;
    ui.winnerForms.textContent = formatNumber(winner.metrics.layoutForms);
    ui.reasonLabel.textContent = text.reason;
    ui.reason.textContent = getOptimizationObjective(explanation.objectiveId).label[currentLanguage];
    ui.comparisonTitle.textContent = text.comparison;

    ui.order.replaceChildren();
    profile.objectiveOrder.forEach((objectiveId, index) => {
      const objective = getOptimizationObjective(objectiveId);
      const item = element("li", index < 4 ? "is-primary" : "");
      item.dataset.objectiveId = objectiveId;
      item.append(
        element("span", "decision-demo__priority-number", String(index + 1)),
        element("span", "", objective.label[currentLanguage]),
      );
      ui.order.append(item);
    });

    ui.comparison.replaceChildren(
      ...SOLUTIONS.map((solution) => solutionCard(solution, solution.id === winner.id, text)),
    );
    panel.dataset.winner = winner.id;
    panel.dataset.firstObjective = profile.objectiveOrder[0];
  }

  ui.toggle.addEventListener("click", () => {
    const target = profile.objectiveOrder[0] === "layoutForms" ? "physicalSheets" : "layoutForms";
    profile = moveDecisionObjective(profile, target, 0);
    render();
  });

  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  render();
}

startDemo();
