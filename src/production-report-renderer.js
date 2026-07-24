const TEXT = Object.freeze({
  ru: {
    title: "Производственные итоги",
    intro: "Расчёт выполнен для четырёх заданных контрольных монтажей. Тиражи монтажей являются входными значениями, а не результатом оптимизатора.",
    ready: "Недопечатки нет · отчёт проверен",
    invalid: "Отчёт заблокирован",
    empty: "Производственный отчёт появится после загрузки контрольного заказа.",
    physicalSheets: "Физическая бумага",
    forms: "Печатные формы",
    formsHint: "лицо + оборот",
    pressPasses: "Листопрогоны",
    underproduction: "Недопечатка",
    pairOverrun: "Перетираж пар",
    fileOverrun: "Перетираж файлов",
    filesTitle: "Итоги по файлам",
    pairsTitle: "Детализация по печатным парам",
    file: "Файл",
    required: "Требуется",
    produced: "Напечатано",
    completeProduced: "Готовых комплектов",
    overrun: "Перетираж",
    pairWaste: "По парам",
    status: "Статус",
    pair: "Пара",
    pages: "Страницы",
    contributions: "Вклады монтажей",
    exact: "Точно",
    over: "Перетираж",
    under: "Недопечатка",
    manualNote: "Суммарный перетираж 1450 считается по 35 печатным парам. Перетираж готовых файлов 930 считается по минимальному тиражу среди пар каждого файла.",
  },
  en: {
    title: "Production totals",
    intro: "The calculation uses the four explicit control impositions. Their run lengths are input values, not optimizer output.",
    ready: "Zero underproduction · report validated",
    invalid: "Report blocked",
    empty: "The production report appears after loading the control dataset.",
    physicalSheets: "Physical sheets",
    forms: "Printing forms",
    formsHint: "front + back",
    pressPasses: "Press passes",
    underproduction: "Underproduction",
    pairOverrun: "Pair overrun",
    fileOverrun: "File overrun",
    filesTitle: "File totals",
    pairsTitle: "Print-pair details",
    file: "File",
    required: "Required",
    produced: "Produced",
    completeProduced: "Complete sets",
    overrun: "Overrun",
    pairWaste: "Across pairs",
    status: "Status",
    pair: "Pair",
    pages: "Pages",
    contributions: "Imposition contributions",
    exact: "Exact",
    over: "Overrun",
    under: "Underproduction",
    manualNote: "Total overrun 1450 is summed across all 35 print pairs. Complete-file overrun 930 uses the minimum produced quantity across each file's pairs.",
  },
});

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function number(value, language) {
  return Number(value).toLocaleString(language === "en" ? "en-US" : "ru-RU");
}

function metricCard(label, value, id, language, hint) {
  const article = element("article", "metric");
  const labelNode = element("span", "", label);
  const valueNode = element("strong", "", number(value, language));
  valueNode.id = id;
  article.append(labelNode, valueNode);
  if (hint) article.append(element("small", "production-metric-hint", hint));
  return article;
}

function statusText(metric, text) {
  if (metric.underproduction > 0) return text.under;
  if (metric.overrun > 0) return text.over;
  return text.exact;
}

function appendCell(row, value, className = "") {
  row.append(element("td", className, value));
}

function createFileTable(report, language, text) {
  const wrap = element("div", "table-wrap");
  const table = element("table", "production-table");
  const head = element("thead");
  const headRow = element("tr");
  [text.file, text.required, text.completeProduced, text.overrun, text.pairWaste, text.status]
    .forEach((label) => headRow.append(element("th", "", label)));
  head.append(headRow);

  const body = element("tbody");
  report.fileMetrics.forEach((metric) => {
    const row = element("tr");
    row.dataset.productionFile = metric.file;
    appendCell(row, metric.file);
    appendCell(row, number(metric.requiredQuantity, language));
    appendCell(row, number(metric.producedQuantity, language));
    appendCell(row, number(metric.overrun, language));
    appendCell(row, number(metric.pairOverrun, language));
    appendCell(row, statusText(metric, text), metric.underproduction > 0 ? "is-error" : "");
    body.append(row);
  });

  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function pagesText(metric) {
  return metric.backPage === null
    ? `${metric.frontPage}/-`
    : `${metric.frontPage}/${metric.backPage}`;
}

function contributionsText(metric, language) {
  return metric.contributions
    .map((item) => `${item.impositionId}: ${item.positionCount} × ${number(item.runLength, language)} = ${number(item.producedQuantity, language)}`)
    .join("; ");
}

function createPairTable(report, language, text) {
  const wrap = element("div", "table-wrap");
  const table = element("table", "production-table production-table--pairs");
  const head = element("thead");
  const headRow = element("tr");
  [text.file, text.pair, text.pages, text.required, text.produced, text.overrun, text.contributions]
    .forEach((label) => headRow.append(element("th", "", label)));
  head.append(headRow);

  const body = element("tbody");
  report.pairMetrics.forEach((metric) => {
    const row = element("tr");
    row.dataset.productionPair = `${metric.file}-${metric.pairIndex}`;
    appendCell(row, metric.file);
    appendCell(row, number(metric.pairIndex, language));
    appendCell(row, pagesText(metric));
    appendCell(row, number(metric.requiredQuantity, language));
    appendCell(row, number(metric.producedQuantity, language));
    appendCell(row, number(metric.overrun, language));
    appendCell(row, contributionsText(metric, language), "production-contributions");
    body.append(row);
  });

  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function details(summary, content, open = false) {
  const node = element("details", "production-details");
  node.open = open;
  node.append(element("summary", "", summary), content);
  return node;
}

export function renderProductionReportEmpty(panel, { language = "ru", error = "" } = {}) {
  if (!(panel instanceof Element)) throw new TypeError("A production report panel is required");
  const text = TEXT[language] ?? TEXT.ru;
  panel.replaceChildren();

  const heading = element("div", "section-heading");
  const titleWrap = element("div");
  titleWrap.append(element("p", "section-kicker", "M4"), element("h2", "", text.title));
  const status = element("span", "status-chip", error ? text.invalid : "M4");
  status.id = "productionStatus";
  heading.append(titleWrap, status);

  panel.append(heading, element("p", error ? "error-box" : "empty-state", error || text.empty));
}

export function renderProductionReport(panel, report, { language = "ru" } = {}) {
  if (!(panel instanceof Element)) throw new TypeError("A production report panel is required");
  if (!report || !report.totals) throw new TypeError("A complete production report is required");
  const text = TEXT[language] ?? TEXT.ru;
  panel.replaceChildren();

  const heading = element("div", "section-heading");
  const titleWrap = element("div");
  titleWrap.append(element("p", "section-kicker", "M4"), element("h2", "", text.title));
  const status = element("span", "status-chip", report.valid ? text.ready : text.invalid);
  status.id = "productionStatus";
  status.classList.toggle("is-error", !report.valid);
  heading.append(titleWrap, status);

  const summary = element("div", "result-grid production-summary");
  summary.append(
    metricCard(text.physicalSheets, report.totals.physicalSheets, "productionPhysicalSheets", language),
    metricCard(text.forms, report.totals.forms, "productionForms", language, `${report.totals.frontForms} + ${report.totals.backForms} ${text.formsHint}`),
    metricCard(text.pressPasses, report.totals.pressPasses, "productionPressPasses", language),
    metricCard(text.underproduction, report.totals.underproduction, "productionUnderproduction", language),
    metricCard(text.pairOverrun, report.totals.overrun, "productionPairOverrun", language),
    metricCard(text.fileOverrun, report.totals.fileOverrun, "productionFileOverrun", language),
  );

  const note = element("div", "formula-card");
  note.append(element("p", "", text.manualNote));

  panel.append(
    heading,
    element("p", "", text.intro),
    summary,
    details(text.filesTitle, createFileTable(report, language, text), true),
    details(text.pairsTitle, createPairTable(report, language, text)),
    note,
  );
}
