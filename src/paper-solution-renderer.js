import { buildPaperSolutionViewModel } from "./paper-solution-view.js";

const TEXT = Object.freeze({
  ru: {
    kicker: "M6",
    title: "Автоматический минимум бумаги",
    intro: "Программа строит допустимый вариант без недопечатки и сравнивает его с ручной контрольной раскладкой.",
    proven: "Минимум бумаги доказан",
    found: "Найден допустимый вариант",
    waiting: "Загрузите контрольный заказ, чтобы выполнить автоматический расчёт.",
    physicalSheets: "Физическая бумага",
    paperSavings: "Экономия бумаги",
    forms: "Печатные формы",
    pressPasses: "Листопрогоны",
    pairOverrun: "Перетираж пар",
    fileOverrun: "Перетираж файлов",
    comparedWithManual: "относительно ручного варианта",
    proofTitle: "Почему это минимум",
    proof: ({ required, capacity, lowerBound }) => `Нижняя граница: ceil(${required} / ${capacity}) = ${lowerBound} листов. Автоматический вариант достигает этой границы, поэтому меньше бумаги невозможно при полном ${capacity}-позиционном лице.`,
    warningTitle: "Важный производственный компромисс",
    warning: ({ manualForms, automaticForms }) => `M6 минимизирует только бумагу. Число форм выросло с ${manualForms} до ${automaticForms}; этот вариант доказывает бумажный минимум, но ещё не является рекомендуемым многокритериальным решением. Минимум форм и компромисс появятся в M7.`,
    comparisonTitle: "Сравнение с ручной раскладкой",
    metric: "Показатель",
    manual: "Ручной вариант",
    automatic: "Минимум бумаги",
    delta: "Изменение",
    plannedRuns: (count) => `Показать ${count} автоматических монтажей`,
    run: "Монтаж",
    pairs: "Пары и позиции",
    runLength: "Тираж листа",
    sources: "Объединено источников",
    keys: {
      physicalSheets: "Физическая бумага",
      impositions: "Монтажи",
      forms: "Формы",
      pressPasses: "Листопрогоны",
      pairOverrun: "Перетираж пар",
      fileOverrun: "Перетираж файлов",
    },
  },
  en: {
    kicker: "M6",
    title: "Automatic paper minimum",
    intro: "The application constructs a valid no-underproduction solution and compares it with the manual control layout.",
    proven: "Paper minimum proven",
    found: "Feasible solution found",
    waiting: "Load the control dataset to run automatic calculation.",
    physicalSheets: "Physical sheets",
    paperSavings: "Paper savings",
    forms: "Printing forms",
    pressPasses: "Press passes",
    pairOverrun: "Pair overrun",
    fileOverrun: "File overrun",
    comparedWithManual: "compared with the manual solution",
    proofTitle: "Why this is a minimum",
    proof: ({ required, capacity, lowerBound }) => `Lower bound: ceil(${required} / ${capacity}) = ${lowerBound} sheets. The automatic solution reaches this bound, so fewer sheets are impossible with a fully occupied ${capacity}-position front.`,
    warningTitle: "Important production trade-off",
    warning: ({ manualForms, automaticForms }) => `M6 minimises paper only. The form count rises from ${manualForms} to ${automaticForms}; this proves the paper minimum but is not yet the recommended multi-objective solution. Form minimisation and the production compromise begin in M7.`,
    comparisonTitle: "Comparison with the manual layout",
    metric: "Metric",
    manual: "Manual solution",
    automatic: "Paper minimum",
    delta: "Change",
    plannedRuns: (count) => `Show ${count} automatic impositions`,
    run: "Imposition",
    pairs: "Pairs and positions",
    runLength: "Sheet run",
    sources: "Merged sources",
    keys: {
      physicalSheets: "Physical sheets",
      impositions: "Impositions",
      forms: "Forms",
      pressPasses: "Press passes",
      pairOverrun: "Pair overrun",
      fileOverrun: "File overrun",
    },
  },
});

function createElement(tagName, className = "", text = undefined) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatNumber(value, language) {
  return Number(value).toLocaleString(language === "en" ? "en-US" : "ru-RU");
}

function formatDelta(value, language) {
  const number = Number(value);
  if (number === 0) return "0";
  const sign = number > 0 ? "+" : "−";
  return `${sign}${formatNumber(Math.abs(number), language)}`;
}

function metricCard(id, label, value, hint = "", accent = false) {
  const card = createElement("div", `metric${accent ? " metric--accent" : ""}`);
  const labelElement = createElement("span", "", label);
  const valueElement = createElement("strong", "", value);
  valueElement.id = id;
  card.append(labelElement, valueElement);
  if (hint) card.append(createElement("small", "paper-metric-hint", hint));
  return card;
}

function renderComparisonTable(view, text, language) {
  const wrap = createElement("div", "table-wrap");
  const table = createElement("table", "paper-comparison-table");
  table.id = "paperComparisonTable";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  [text.metric, text.manual, text.automatic, text.delta].forEach((label) => {
    headerRow.append(createElement("th", "", label));
  });
  thead.append(headerRow);
  const tbody = document.createElement("tbody");
  view.comparisonRows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.dataset.paperComparison = row.key;
    tr.append(
      createElement("td", "", text.keys[row.key] ?? row.key),
      createElement("td", "", formatNumber(row.manual, language)),
      createElement("td", "", formatNumber(row.automatic, language)),
      createElement("td", row.delta > 0 ? "paper-delta--worse" : row.delta < 0 ? "paper-delta--better" : "", formatDelta(row.delta, language)),
    );
    tbody.append(tr);
  });
  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
}

function renderRunTable(view, text, language) {
  const details = createElement("details", "paper-runs");
  details.append(createElement("summary", "", text.plannedRuns(view.plannedRuns.length)));
  const wrap = createElement("div", "table-wrap");
  const table = createElement("table", "paper-runs-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["№", text.run, text.pairs, text.runLength, text.sources].forEach((label) => {
    headerRow.append(createElement("th", "", label));
  });
  thead.append(headerRow);
  const tbody = document.createElement("tbody");
  view.plannedRuns.forEach((run) => {
    const tr = document.createElement("tr");
    tr.dataset.paperRun = run.id;
    tr.append(
      createElement("td", "", formatNumber(run.index, language)),
      createElement("td", "paper-run-id", run.id),
      createElement("td", "paper-run-pairs", run.pairSummary),
      createElement("td", "", formatNumber(run.runLength, language)),
      createElement("td", "", formatNumber(run.mergedSourceCount, language)),
    );
    tbody.append(tr);
  });
  table.append(thead, tbody);
  wrap.append(table);
  details.append(wrap);
  return details;
}

export function renderPaperSolutionEmpty(container, { language = "ru", error = "" } = {}) {
  if (!(container instanceof Element)) throw new TypeError("Paper solution container is required");
  const text = TEXT[language] ?? TEXT.ru;
  container.replaceChildren();
  const heading = createElement("div", "section-heading");
  const headingText = createElement("div");
  headingText.append(
    createElement("p", "section-kicker", text.kicker),
    createElement("h2", "", text.title),
  );
  const status = createElement("span", "status-chip", error ? error : text.waiting);
  status.id = "paperSolutionStatus";
  heading.append(headingText, status);
  container.append(heading, createElement("p", error ? "error-box" : "empty-state", error || text.waiting));
}

export function renderPaperSolution(container, solution, manualReport, { language = "ru" } = {}) {
  if (!(container instanceof Element)) throw new TypeError("Paper solution container is required");
  const text = TEXT[language] ?? TEXT.ru;
  const view = buildPaperSolutionViewModel({ solution, manualReport });
  container.replaceChildren();

  const heading = createElement("div", "section-heading");
  const headingText = createElement("div");
  headingText.append(
    createElement("p", "section-kicker", text.kicker),
    createElement("h2", "", text.title),
  );
  const status = createElement("span", "status-chip", view.provenMinimum ? text.proven : text.found);
  status.id = "paperSolutionStatus";
  heading.append(headingText, status);

  const summary = createElement("div", "result-grid paper-summary");
  summary.append(
    metricCard("paperOptimalSheets", text.physicalSheets, formatNumber(view.automatic.physicalSheets, language), text.comparedWithManual, true),
    metricCard("paperSavings", text.paperSavings, `${formatNumber(view.paperSavings, language)} (${view.paperSavingsPercent.toFixed(2)}%)`), text.comparedWithManual),
    metricCard("paperOptimalForms", text.forms, formatNumber(view.automatic.forms, language)),
    metricCard("paperOptimalPressPasses", text.pressPasses, formatNumber(view.automatic.pressPasses, language)),
    metricCard("paperOptimalPairOverrun", text.pairOverrun, formatNumber(view.automatic.pairOverrun, language)),
    metricCard("paperOptimalFileOverrun", text.fileOverrun, formatNumber(view.automatic.fileOverrun, language)),
  );

  const proof = createElement("div", "formula-card paper-proof");
  proof.id = "paperOptimalProof";
  proof.append(
    createElement("strong", "", text.proofTitle),
    createElement("p", "", text.proof({
      required: formatNumber(view.proof.totalRequiredPairQuantity, language),
      capacity: formatNumber(view.proof.outputPerPhysicalSheet, language),
      lowerBound: formatNumber(view.proof.paperLowerBound, language),
    })),
  );

  const warning = createElement("div", "paper-warning");
  warning.append(
    createElement("strong", "", text.warningTitle),
    createElement("p", "", text.warning({
      manualForms: formatNumber(view.manual.forms, language),
      automaticForms: formatNumber(view.automatic.forms, language),
    })),
  );

  container.append(
    heading,
    createElement("p", "", text.intro),
    summary,
    proof,
    warning,
    createElement("h3", "paper-comparison-heading", text.comparisonTitle),
    renderComparisonTable(view, text, language),
    renderRunTable(view, text, language),
  );
}
