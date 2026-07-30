export const APP_SCREEN_IDS = Object.freeze([
  "order",
  "check",
  "alternatives",
  "selected",
  "export",
]);

const SCREEN_INDEX = new Map(APP_SCREEN_IDS.map((screenId, index) => [screenId, index]));

export function normalizeAppScreenId(value, fallback = "order") {
  const normalized = String(value ?? "").trim();
  if (SCREEN_INDEX.has(normalized)) return normalized;
  if (!SCREEN_INDEX.has(fallback)) throw new RangeError(`Unknown fallback screen: ${fallback}`);
  return fallback;
}

function screenStatus(screenId, { hasPlans, hasSelection }) {
  if (screenId === "order" || screenId === "check") {
    return hasPlans ? "ready" : "attention";
  }
  if (screenId === "alternatives") {
    return hasPlans ? "ready" : "waiting";
  }
  return hasSelection ? "ready" : "waiting";
}

function screenEnabled(screenId, { hasSelection }) {
  if (screenId === "selected" || screenId === "export") return hasSelection;
  return true;
}

function primaryAction(activeScreenId, { hasSelection }) {
  if (activeScreenId === "order") {
    return Object.freeze({ id: "review", targetScreenId: "check", disabled: false });
  }
  if (activeScreenId === "check") {
    return Object.freeze({ id: "alternatives", targetScreenId: "alternatives", disabled: false });
  }
  if (activeScreenId === "alternatives") {
    return Object.freeze({
      id: hasSelection ? "selected" : "selectPlan",
      targetScreenId: hasSelection ? "selected" : null,
      disabled: !hasSelection,
    });
  }
  if (activeScreenId === "selected") {
    return Object.freeze({ id: "export", targetScreenId: "export", disabled: false });
  }
  return null;
}

export function createAppShellNavigationState({
  activeScreenId = "order",
  hasPlans = false,
  selectedPlanId = null,
} = {}) {
  const hasSelection = Boolean(String(selectedPlanId ?? "").trim());
  const normalizedActive = normalizeAppScreenId(activeScreenId);
  const activeEnabled = screenEnabled(normalizedActive, { hasSelection });
  const resolvedActive = activeEnabled ? normalizedActive : hasPlans ? "alternatives" : "order";
  const activeIndex = SCREEN_INDEX.get(resolvedActive);

  const screens = APP_SCREEN_IDS.map((screenId, index) => Object.freeze({
    id: screenId,
    index,
    active: screenId === resolvedActive,
    enabled: screenEnabled(screenId, { hasSelection }),
    status: screenStatus(screenId, { hasPlans, hasSelection }),
  }));

  const previous = screens
    .slice(0, activeIndex)
    .reverse()
    .find((screen) => screen.enabled) ?? null;

  return Object.freeze({
    activeScreenId: resolvedActive,
    hasPlans: Boolean(hasPlans),
    hasSelection,
    selectedPlanId: hasSelection ? String(selectedPlanId).trim() : null,
    screens: Object.freeze(screens),
    previousScreenId: previous?.id ?? null,
    primaryAction: primaryAction(resolvedActive, { hasSelection }),
  });
}
