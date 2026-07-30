export const SELECTED_PLAN_TAB_IDS = Object.freeze([
  "overview",
  "schemes",
  "report",
  "files",
]);

const TAB_INDEX = new Map(SELECTED_PLAN_TAB_IDS.map((tabId, index) => [tabId, index]));

export function normalizeSelectedPlanTabId(value, fallback = "overview") {
  const normalized = String(value ?? "").trim();
  if (TAB_INDEX.has(normalized)) return normalized;
  if (!TAB_INDEX.has(fallback)) throw new RangeError(`Unknown selected-plan tab fallback: ${fallback}`);
  return fallback;
}

export function nextSelectedPlanTabId(currentTabId, key) {
  const current = normalizeSelectedPlanTabId(currentTabId);
  const currentIndex = TAB_INDEX.get(current);
  if (key === "Home") return SELECTED_PLAN_TAB_IDS[0];
  if (key === "End") return SELECTED_PLAN_TAB_IDS.at(-1);
  if (key === "ArrowRight" || key === "ArrowDown") {
    return SELECTED_PLAN_TAB_IDS[(currentIndex + 1) % SELECTED_PLAN_TAB_IDS.length];
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return SELECTED_PLAN_TAB_IDS[(currentIndex - 1 + SELECTED_PLAN_TAB_IDS.length) % SELECTED_PLAN_TAB_IDS.length];
  }
  return current;
}

export function createSelectedPlanTabState(activeTabId = "overview") {
  const active = normalizeSelectedPlanTabId(activeTabId);
  return Object.freeze({
    activeTabId: active,
    tabs: Object.freeze(SELECTED_PLAN_TAB_IDS.map((tabId) => Object.freeze({
      id: tabId,
      active: tabId === active,
      tabId: `selectedPlanTab-${tabId}`,
      panelId: `selectedPlanTabPanel-${tabId}`,
    }))),
  });
}
