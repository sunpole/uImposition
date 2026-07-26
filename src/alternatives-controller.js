import {
  ALTERNATIVES_RUNTIME_STATUS,
  createAlternativesRuntimeState,
  prepareAlternativesProductionState,
} from "./alternatives-runtime.js";
import {
  createDecisionProfile,
  moveDecisionObjective,
} from "./decision-profile.js";

export const ALTERNATIVES_COMMAND_EVENT = "uimposition:alternatives-command";
export const ALTERNATIVES_STATE_EVENT = "uimposition:alternatives";

export const ALTERNATIVES_COMMAND = Object.freeze({
  SET_PRIORITY: "set-priority",
  SET_REFERENCE: "set-reference",
});

let productionState = window.__uimpositionProductionState ?? { report: null, controlCase: null };
let pricingState = window.__uimpositionPricingState ?? { state: "incomplete", pricing: null };
let decisionProfile = createDecisionProfile({ id: "m7-runtime" });
let referenceSolutionId = null;
let preparedProductionState = null;
let preparedReport = null;
let runtimeState = null;

function language() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function prepareProductionOnce() {
  if (!productionState?.report || !productionState?.controlCase) {
    preparedProductionState = null;
    preparedReport = null;
    return;
  }
  if (preparedProductionState && preparedReport === productionState.report) return;
  preparedProductionState = prepareAlternativesProductionState(productionState);
  preparedReport = productionState.report;
}

function publicError(error) {
  if (!error) return null;
  return Object.freeze({
    name: String(error.name ?? "Error"),
    message: String(error.message ?? error),
  });
}

function sanitizeRuntimeState(state) {
  return Object.freeze({
    kind: state.kind ?? "alternativesRuntimeState",
    status: state.status,
    language: state.language ?? language(),
    decisionProfile: state.decisionProfile ?? decisionProfile,
    priorityObjectiveId: state.priorityObjectiveId ?? decisionProfile.objectiveOrder[0],
    referenceSolutionId: state.referenceSolutionId ?? null,
    pricingComparison: state.pricingComparison ?? null,
    alternativeSet: state.alternativeSet ?? null,
    explanations: state.explanations ?? null,
    error: publicError(state.error),
  });
}

function publish(state) {
  const publicState = sanitizeRuntimeState(state);
  window.__uimpositionAlternativesState = publicState;
  window.dispatchEvent(new CustomEvent(ALTERNATIVES_STATE_EVENT, { detail: publicState }));
  return publicState;
}

function buildAndPublish() {
  try {
    prepareProductionOnce();
  } catch (error) {
    runtimeState = Object.freeze({
      status: ALTERNATIVES_RUNTIME_STATUS.ERROR,
      language: language(),
      decisionProfile,
      priorityObjectiveId: decisionProfile.objectiveOrder[0],
      referenceSolutionId: null,
      pricingComparison: null,
      alternativeSet: null,
      explanations: null,
      error,
    });
    publish(runtimeState);
    return;
  }

  runtimeState = createAlternativesRuntimeState({
    productionState,
    preparedProductionState,
    pricingState,
    decisionProfile,
    language: language(),
    referenceSolutionId,
  });

  if (
    runtimeState.status !== ALTERNATIVES_RUNTIME_STATUS.WAITING_PRODUCTION
    && runtimeState.status !== ALTERNATIVES_RUNTIME_STATUS.ERROR
  ) {
    const referenceExists = runtimeState.explanations.entries.some(
      (entry) => entry.solutionId === referenceSolutionId,
    );
    if (!referenceExists) referenceSolutionId = runtimeState.referenceSolutionId;
  }

  publish(runtimeState);
}

function setPriority(objectiveId) {
  const normalized = String(objectiveId ?? "").trim();
  if (normalized === "estimatedTotalCost" && !runtimeState?.pricingComparison?.comparable) return;
  if (normalized !== "physicalSheets" && normalized !== "estimatedTotalCost") return;
  decisionProfile = moveDecisionObjective(decisionProfile, normalized, 0);
  referenceSolutionId = null;
  buildAndPublish();
}

function setReference(solutionId) {
  const normalized = String(solutionId ?? "").trim();
  if (!normalized || !runtimeState?.explanations?.entries.some((entry) => entry.solutionId === normalized)) {
    return;
  }
  referenceSolutionId = normalized;
  buildAndPublish();
}

window.addEventListener("uimposition:production-report", (event) => {
  productionState = event.detail ?? { report: null, controlCase: null };
  preparedProductionState = null;
  preparedReport = null;
  referenceSolutionId = null;
  buildAndPublish();
});

window.addEventListener("uimposition:pricing", (event) => {
  pricingState = event.detail ?? { state: "incomplete", pricing: null };
  if (!pricingState.pricing && decisionProfile.objectiveOrder[0] === "estimatedTotalCost") {
    decisionProfile = moveDecisionObjective(decisionProfile, "physicalSheets", 0);
    referenceSolutionId = null;
  }
  buildAndPublish();
});

window.addEventListener(ALTERNATIVES_COMMAND_EVENT, (event) => {
  const command = event.detail ?? {};
  if (command.type === ALTERNATIVES_COMMAND.SET_PRIORITY) {
    setPriority(command.objectiveId);
    return;
  }
  if (command.type === ALTERNATIVES_COMMAND.SET_REFERENCE) {
    setReference(command.solutionId);
  }
});

new MutationObserver(buildAndPublish).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["lang"],
});

buildAndPublish();
