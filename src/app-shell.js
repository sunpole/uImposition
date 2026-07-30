import {
  APP_SCREEN_IDS,
  createAppShellNavigationState,
  normalizeAppScreenId,
} from "./app-shell-model.js";
import {
  getUserProductionPlanRuntime,
  subscribeUserProductionPlanRuntime,
} from "./user-production-plans-runtime.js";

const TEXT = Object.freeze({
  ru: Object.freeze({
    project: "Новый расчёт",
    diagnostics: "Диагностика",
    objectives: "Цели",
    close: "Закрыть",
    back: "Назад",
    order: "Заказ",
    check: "Проверка",
    alternatives: "Варианты",
    selected: "План",
    export: "Экспорт",
    orderTitle: "Параметры заказа",
    orderIntro: "Лист, изделие, файлы, цветность и рабочий прайс.",
    checkTitle: "Проверка данных",
    checkIntro: "Геометрия, вместимость, пары страниц и готовность к расчёту.",
    alternativesTitle: "Варианты производства",
    alternativesIntro: "Все допустимые планы текущей области поиска остаются доступными.",
    selectedTitle: "Выбранный план",
    selectedIntro: "Схемы, производственный отчёт и последствия выбора оператора.",
    exportTitle: "Экспорт",
    exportIntro: "PDF схем и производственного отчёта выбранного плана.",
    waiting: "Ожидает",
    attention: "Нужно заполнить",
    ready: "Готово",
    summary: "Сводка расчёта",
    printable: "Печатная область",
    files: "Файлов",
    variants: "Вариантов",
    selection: "Выбран",
    none: "не выбран",
    pricing: "Прайс",
    pricingReady: "готов",
    pricingMissing: "не заполнен",
    review: "Проверить данные",
    showAlternatives: "К вариантам",
    openSelected: "Открыть план",
    selectPlan: "Сначала выберите план",
    openExport: "К экспорту",
    workflowStatusEmpty: "Заполните заказ и проверьте исходные данные.",
    workflowStatusPlans: "Варианты рассчитаны. Выберите производственный план.",
    workflowStatusSelected: "План выбран. Проверьте схемы и экспорт.",
    exactPairs: "Точные пары страниц",
    objectivesTitle: "Цели оптимизации",
    objectivesIntro: "Приоритеты меняют рекомендацию, но не удаляют варианты и не заменяют выбор оператора.",
    diagnosticsTitle: "Техническая диагностика",
    diagnosticsIntro: "Контрольные M3–M7 панели сохранены для разработки и доказательств, но исключены из основного рабочего потока.",
    noExport: "Сначала выберите производственный план.",
    noPanel: "Раздел пока недоступен.",
    menuLabel: "Открыть техническую диагностику",
    objectivesLabel: "Открыть цели оптимизации",
  }),
  en: Object.freeze({
    project: "Untitled calculation",
    diagnostics: "Diagnostics",
    objectives: "Objectives",
    close: "Close",
    back: "Back",
    order: "Order",
    check: "Review",
    alternatives: "Variants",
    selected: "Plan",
    export: "Export",
    orderTitle: "Order parameters",
    orderIntro: "Sheet, product, files, colors and production pricing.",
    checkTitle: "Input review",
    checkIntro: "Geometry, capacity, page pairs and calculation readiness.",
    alternativesTitle: "Production variants",
    alternativesIntro: "Every feasible plan inside the current search scope remains available.",
    selectedTitle: "Selected plan",
    selectedIntro: "Schemes, production report and consequences of the operator choice.",
    exportTitle: "Export",
    exportIntro: "Scheme and production-report PDFs for the selected plan.",
    waiting: "Waiting",
    attention: "Needs input",
    ready: "Ready",
    summary: "Calculation summary",
    printable: "Printable area",
    files: "Files",
    variants: "Variants",
    selection: "Selected",
    none: "none",
    pricing: "Pricing",
    pricingReady: "ready",
    pricingMissing: "missing",
    review: "Review inputs",
    showAlternatives: "View variants",
    openSelected: "Open plan",
    selectPlan: "Select a plan first",
    openExport: "Open export",
    workflowStatusEmpty: "Complete the order and review the source data.",
    workflowStatusPlans: "Variants are ready. Select a production plan.",
    workflowStatusSelected: "A plan is selected. Review schemes and export.",
    exactPairs: "Exact page pairs",
    objectivesTitle: "Optimization objectives",
    objectivesIntro: "Priorities change the recommendation but never delete variants or replace operator selection.",
    diagnosticsTitle: "Technical diagnostics",
    diagnosticsIntro: "Control M3–M7 panels remain available for development evidence but are removed from the primary workflow.",
    noExport: "Select a production plan first.",
    noPanel: "This section is not available yet.",
    menuLabel: "Open technical diagnostics",
    objectivesLabel: "Open optimization objectives",
  }),
});

const SCREEN_COPY = Object.freeze({
  order: Object.freeze({ title: "orderTitle", intro: "orderIntro" }),
  check: Object.freeze({ title: "checkTitle", intro: "checkIntro" }),
  alternatives: Object.freeze({ title: "alternativesTitle", intro: "alternativesIntro" }),
  selected: Object.freeze({ title: "selectedTitle", intro: "selectedIntro" }),
  export: Object.freeze({ title: "exportTitle", intro: "exportIntro" }),
});

const ACTION_LABELS = Object.freeze({
  review: "review",
  alternatives: "showAlternatives",
  selected: "openSelected",
  selectPlan: "selectPlan",
  export: "openExport",
});

const query = new URLSearchParams(window.location.search);
const controlEvidenceMode = query.get("demo") === "control";

if (controlEvidenceMode) {
  document.body.classList.add("app-diagnostics-evidence-mode");
} else {
  initializeApplicationShell();
}

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

function screenFromHash() {
  const raw = window.location.hash.replace(/^#/, "");
  return normalizeAppScreenId(raw || "order");
}

function initializeApplicationShell() {
  const originalHero = document.querySelector(".hero");
  const originalWorkspace = document.querySelector(".workspace");
  const originalFooter = document.querySelector("body > footer");
  const settingsPanel = document.querySelector("#settingsPanel");
  const ordersPanel = document.querySelector(".orders-panel");
  const geometryPanel = document.querySelector("#geometryResults");
  const placementPanel = document.querySelector("#placementResults");
  const pagePairsPanel = document.querySelector(".page-pairs-panel");
  const alternativesPanel = document.querySelector("#userProductionPlans");
  const selectedPanel = document.querySelector("#selectedUserPlanDetails");

  if (!originalHero || !originalWorkspace || !settingsPanel) {
    console.warn("Application shell could not find the required legacy containers.");
    return;
  }

  let runtimeSnapshot = getUserProductionPlanRuntime();
  let activeScreenId = screenFromHash();
  let summaryTimer = null;
  let movingExport = false;

  const root = element("div", "app-shell");
  root.id = "applicationShell";

  const appHeader = element("header", "app-header");
  const brand = originalHero.querySelector(".brand") ?? element("a", "brand", "uImposition");
  brand.classList.add("app-brand");
  const project = element("div", "app-project");
  const projectLabel = element("strong", "app-project__name");
  const projectStatus = element("span", "app-project__status");
  project.append(projectLabel, projectStatus);

  const headerActions = element("div", "app-header__actions");
  const objectivesButton = element("button", "app-header-button");
  objectivesButton.type = "button";
  objectivesButton.id = "appObjectivesButton";
  const diagnosticsButton = element("button", "app-header-button app-header-button--icon", "⋯");
  diagnosticsButton.type = "button";
  diagnosticsButton.id = "appDiagnosticsButton";
  const languageButton = document.querySelector("#languageButton");
  if (languageButton) languageButton.classList.add("app-language-button");
  headerActions.append(objectivesButton);
  if (languageButton) headerActions.append(languageButton);
  headerActions.append(diagnosticsButton);
  appHeader.append(brand, project, headerActions);

  const appBody = element("div", "app-body");
  const navigation = element("nav", "app-navigation");
  navigation.setAttribute("aria-label", "Application workflow");
  const workspace = element("main", "app-workspace");
  const screenMap = new Map();

  APP_SCREEN_IDS.forEach((screenId, index) => {
    const button = element("button", "app-navigation__item");
    button.type = "button";
    button.dataset.appScreenTarget = screenId;
    const number = element("span", "app-navigation__number", String(index + 1));
    const copy = element("span", "app-navigation__copy");
    const label = element("strong", "app-navigation__label");
    const status = element("small", "app-navigation__status");
    copy.append(label, status);
    button.append(number, copy);
    navigation.append(button);

    const section = element("section", "app-screen");
    section.dataset.appScreen = screenId;
    section.tabIndex = -1;
    const heading = element("div", "app-screen__heading");
    const headingCopy = element("div");
    const title = element("h1", "app-screen__title");
    const intro = element("p", "app-screen__intro");
    headingCopy.append(title, intro);
    heading.append(headingCopy);
    const body = element("div", "app-screen__body");
    section.append(heading, body);
    workspace.append(section);
    screenMap.set(screenId, { section, body, title, intro, button, label, status });
  });

  const summary = element("aside", "app-summary");
  const summaryTitle = element("h2", "app-summary__title");
  const summaryGrid = element("dl", "app-summary__grid");
  const summaryValues = {};
  ["printable", "files", "variants", "selection", "pricing"].forEach((key) => {
    const row = element("div", "app-summary__row");
    const term = element("dt", "app-summary__term");
    const value = element("dd", "app-summary__value");
    term.dataset.summaryLabel = key;
    value.dataset.summaryValue = key;
    row.append(term, value);
    summaryGrid.append(row);
    summaryValues[key] = value;
  });
  summary.append(summaryTitle, summaryGrid);

  const actionBar = element("div", "app-action-bar");
  const workflowStatus = element("p", "app-action-bar__status");
  workflowStatus.id = "appWorkflowStatus";
  workflowStatus.setAttribute("role", "status");
  workflowStatus.setAttribute("aria-live", "polite");
  const actionButtons = element("div", "app-action-bar__buttons");
  const backButton = element("button", "app-button app-button--secondary");
  backButton.type = "button";
  backButton.id = "appBackButton";
  const primaryButton = element("button", "app-button app-button--primary");
  primaryButton.type = "button";
  primaryButton.id = "appPrimaryButton";
  actionButtons.append(backButton, primaryButton);
  actionBar.append(workflowStatus, actionButtons);

  const diagnosticsDrawer = createDrawer("appDiagnosticsDrawer");
  const diagnosticsHeading = createDrawerHeading();
  const diagnosticsTitle = element("h2");
  const diagnosticsIntro = element("p", "app-drawer__intro");
  diagnosticsHeading.copy.append(diagnosticsTitle, diagnosticsIntro);
  diagnosticsDrawer.panel.append(diagnosticsHeading.header);
  const diagnosticsBody = element("div", "app-drawer__body");
  diagnosticsDrawer.panel.append(diagnosticsBody);

  const objectivesDrawer = createDrawer("appObjectivesDrawer");
  const objectivesHeading = createDrawerHeading();
  const objectivesTitle = element("h2");
  const objectivesIntro = element("p", "app-drawer__intro");
  objectivesHeading.copy.append(objectivesTitle, objectivesIntro);
  objectivesDrawer.panel.append(objectivesHeading.header);
  const objectivesBody = element("div", "app-drawer__body");
  objectivesDrawer.panel.append(objectivesBody);

  const exportHost = element("div", "app-export-host");
  exportHost.id = "appExportHost";

  appBody.append(navigation, workspace, summary);
  root.append(appHeader, appBody, actionBar, diagnosticsDrawer.backdrop, objectivesDrawer.backdrop);
  document.body.insertBefore(root, originalHero);
  document.body.classList.add("app-shell-ready");

  originalHero.hidden = true;
  originalWorkspace.hidden = true;
  if (originalFooter) originalFooter.hidden = true;

  settingsPanel.classList.remove("is-collapsed");
  settingsPanel.classList.add("app-order-settings");
  settingsPanel.querySelector("#settingsToggle")?.setAttribute("aria-expanded", "true");

  appendOrPlaceholder(screenMap.get("order").body, settingsPanel);
  appendOrPlaceholder(screenMap.get("order").body, ordersPanel);
  appendOrPlaceholder(screenMap.get("check").body, geometryPanel);
  appendOrPlaceholder(screenMap.get("check").body, placementPanel);

  if (pagePairsPanel) {
    const details = element("details", "app-secondary-details");
    const summaryNode = element("summary", "app-secondary-details__summary");
    summaryNode.dataset.appText = "exactPairs";
    details.append(summaryNode, pagePairsPanel);
    screenMap.get("check").body.append(details);
  }

  appendOrPlaceholder(screenMap.get("alternatives").body, alternativesPanel);
  appendOrPlaceholder(screenMap.get("selected").body, selectedPanel);
  screenMap.get("export").body.append(exportHost);

  moveObjectiveEditor(objectivesBody);

  [...originalWorkspace.children].forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) diagnosticsBody.append(node);
  });

  const diagnosticsEmpty = element("p", "app-empty-state");
  if (diagnosticsBody.children.length === 0) diagnosticsBody.append(diagnosticsEmpty);

  function createDrawer(id) {
    const backdrop = element("div", "app-drawer-backdrop");
    backdrop.id = `${id}Backdrop`;
    backdrop.hidden = true;
    const panel = element("aside", "app-drawer");
    panel.id = id;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.tabIndex = -1;
    backdrop.append(panel);
    return { backdrop, panel };
  }

  function createDrawerHeading() {
    const header = element("div", "app-drawer__heading");
    const copy = element("div");
    const closeButton = element("button", "app-button app-button--secondary");
    closeButton.type = "button";
    closeButton.dataset.closeDrawer = "";
    header.append(copy, closeButton);
    return { header, copy, closeButton };
  }

  function appendOrPlaceholder(container, node) {
    if (node) {
      container.append(node);
      return;
    }
    const placeholder = element("p", "app-empty-state");
    placeholder.dataset.appText = "noPanel";
    container.append(placeholder);
  }

  function moveObjectiveEditor(container) {
    const editor = document.querySelector("#userObjectivePriorityEditor");
    if (!editor) {
      const placeholder = element("p", "app-empty-state");
      placeholder.dataset.appText = "noPanel";
      container.append(placeholder);
      return;
    }

    const movable = [editor];
    let previous = editor.previousElementSibling;
    while (previous && (
      previous.classList.contains("settings-section-title")
      || previous.classList.contains("user-objective-priority-divider")
    )) {
      movable.unshift(previous);
      if (previous.classList.contains("user-objective-priority-divider")) break;
      previous = previous.previousElementSibling;
    }
    movable.forEach((node) => container.append(node));
  }

  function openDrawer(drawer) {
    drawer.backdrop.hidden = false;
    document.body.classList.add("app-drawer-open");
    drawer.panel.focus();
  }

  function closeDrawer(drawer, returnFocus) {
    drawer.backdrop.hidden = true;
    if (diagnosticsDrawer.backdrop.hidden && objectivesDrawer.backdrop.hidden) {
      document.body.classList.remove("app-drawer-open");
    }
    returnFocus?.focus();
  }

  diagnosticsButton.addEventListener("click", () => openDrawer(diagnosticsDrawer));
  objectivesButton.addEventListener("click", () => openDrawer(objectivesDrawer));
  diagnosticsDrawer.backdrop.addEventListener("click", (event) => {
    if (event.target === diagnosticsDrawer.backdrop) closeDrawer(diagnosticsDrawer, diagnosticsButton);
  });
  objectivesDrawer.backdrop.addEventListener("click", (event) => {
    if (event.target === objectivesDrawer.backdrop) closeDrawer(objectivesDrawer, objectivesButton);
  });
  diagnosticsHeading.closeButton.addEventListener("click", () => closeDrawer(diagnosticsDrawer, diagnosticsButton));
  objectivesHeading.closeButton.addEventListener("click", () => closeDrawer(objectivesDrawer, objectivesButton));

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!diagnosticsDrawer.backdrop.hidden) closeDrawer(diagnosticsDrawer, diagnosticsButton);
    if (!objectivesDrawer.backdrop.hidden) closeDrawer(objectivesDrawer, objectivesButton);
  });

  navigation.addEventListener("click", (event) => {
    const button = event.target.closest("[data-app-screen-target]");
    if (!button || button.disabled) return;
    activateScreen(button.dataset.appScreenTarget, { focus: true });
  });

  backButton.addEventListener("click", () => {
    const state = navigationState();
    if (state.previousScreenId) activateScreen(state.previousScreenId, { focus: true });
  });

  primaryButton.addEventListener("click", () => {
    const action = navigationState().primaryAction;
    if (action?.targetScreenId && !action.disabled) {
      activateScreen(action.targetScreenId, { focus: true });
    }
  });

  window.addEventListener("hashchange", () => {
    activateScreen(screenFromHash(), { focus: false, updateHash: false });
  });

  document.addEventListener("input", scheduleSummary, true);
  document.addEventListener("change", scheduleSummary, true);
  window.addEventListener("uimposition:pricing", scheduleSummary);

  const languageObserver = new MutationObserver(() => renderShell());
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  if (selectedPanel) {
    const selectedObserver = new MutationObserver(() => syncExportSection());
    selectedObserver.observe(selectedPanel, { childList: true, subtree: true });
  }

  subscribeUserProductionPlanRuntime((snapshot) => {
    runtimeSnapshot = snapshot;
    syncExportSection();
    const state = navigationState();
    if (state.activeScreenId !== activeScreenId) activeScreenId = state.activeScreenId;
    renderShell();
  });

  function navigationState() {
    return createAppShellNavigationState({
      activeScreenId,
      hasPlans: Boolean(runtimeSnapshot.planSet),
      selectedPlanId: runtimeSnapshot.selectedPlanId,
    });
  }

  function activateScreen(screenId, { focus = false, updateHash = true } = {}) {
    activeScreenId = normalizeAppScreenId(screenId);
    const state = navigationState();
    activeScreenId = state.activeScreenId;
    renderShell();
    if (updateHash) history.replaceState(null, "", `#${activeScreenId}`);
    if (focus) screenMap.get(activeScreenId)?.section.focus({ preventScroll: false });
  }

  function scheduleSummary() {
    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(renderShell, 0);
  }

  function syncExportSection() {
    if (movingExport) return;
    const exportSection = selectedPanel?.querySelector(".selected-plan-export") ?? null;
    if (exportSection) {
      movingExport = true;
      exportHost.replaceChildren(exportSection);
      movingExport = false;
      return;
    }
    if (!runtimeSnapshot.selectedPlanId) renderExportPlaceholder();
  }

  function renderExportPlaceholder() {
    const placeholder = element("p", "app-empty-state", t("noExport"));
    exportHost.replaceChildren(placeholder);
  }

  function renderWorkflowStatus(state) {
    if (state.hasSelection) return t("workflowStatusSelected");
    if (state.hasPlans) return t("workflowStatusPlans");
    return t("workflowStatusEmpty");
  }

  function renderShell() {
    const state = navigationState();
    activeScreenId = state.activeScreenId;

    projectLabel.textContent = t("project");
    projectStatus.textContent = `v${document.querySelector("[data-project-version]")?.textContent ?? "0.7.0-alpha.5"}`;
    objectivesButton.textContent = t("objectives");
    objectivesButton.setAttribute("aria-label", t("objectivesLabel"));
    diagnosticsButton.setAttribute("aria-label", t("menuLabel"));

    summaryTitle.textContent = t("summary");
    Object.keys(summaryValues).forEach((key) => {
      const term = summaryGrid.querySelector(`[data-summary-label='${key}']`);
      if (term) term.textContent = t(key);
    });

    summaryValues.printable.textContent = document.querySelector("#printableResult")?.textContent?.trim() || "—";
    summaryValues.files.textContent = document.querySelector("#orderCount")?.textContent?.trim() || "0";
    summaryValues.variants.textContent = String(runtimeSnapshot.planSet?.catalog?.summary?.feasibleSolutionCount ?? 0);
    summaryValues.selection.textContent = runtimeSnapshot.selectedPlan?.label ?? t("none");
    const pricingState = window.__uimpositionPricingState?.state;
    summaryValues.pricing.textContent = pricingState === "ready" || pricingState === "costReady"
      ? t("pricingReady")
      : t("pricingMissing");

    state.screens.forEach((screenState) => {
      const entry = screenMap.get(screenState.id);
      const copy = SCREEN_COPY[screenState.id];
      entry.label.textContent = t(screenState.id);
      entry.status.textContent = t(screenState.status);
      entry.button.disabled = !screenState.enabled;
      entry.button.classList.toggle("is-active", screenState.active);
      entry.button.dataset.status = screenState.status;
      if (screenState.active) entry.button.setAttribute("aria-current", "step");
      else entry.button.removeAttribute("aria-current");
      entry.section.hidden = !screenState.active;
      entry.title.textContent = t(copy.title);
      entry.intro.textContent = t(copy.intro);
    });

    backButton.textContent = t("back");
    backButton.disabled = !state.previousScreenId;
    workflowStatus.textContent = renderWorkflowStatus(state);
    const action = state.primaryAction;
    primaryButton.hidden = !action;
    if (action) {
      primaryButton.textContent = t(ACTION_LABELS[action.id]);
      primaryButton.disabled = action.disabled;
    }

    objectivesTitle.textContent = t("objectivesTitle");
    objectivesIntro.textContent = t("objectivesIntro");
    diagnosticsTitle.textContent = t("diagnosticsTitle");
    diagnosticsIntro.textContent = t("diagnosticsIntro");
    diagnosticsHeading.closeButton.textContent = t("close");
    objectivesHeading.closeButton.textContent = t("close");
    root.querySelectorAll("[data-app-text]").forEach((node) => {
      node.textContent = t(node.dataset.appText);
    });
    if (!runtimeSnapshot.selectedPlanId && exportHost.children.length === 0) renderExportPlaceholder();
  }

  renderExportPlaceholder();
  activateScreen(activeScreenId, { focus: false, updateHash: false });
}
