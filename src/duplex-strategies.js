export const DUPLEX_STRATEGIES = Object.freeze({
  SEPARATE_FRONT_BACK_FORMS: "separateFrontBackForms",
  WORK_AND_TURN: "workAndTurn",
});

export const DUPLEX_SEARCH_MODES = Object.freeze({
  SEPARATE_ONLY: "separateOnly",
  COMPARE_BOTH: "compareBoth",
  WORK_AND_TURN_ONLY: "workAndTurnOnly",
});

const STRATEGIES_BY_SEARCH_MODE = Object.freeze({
  [DUPLEX_SEARCH_MODES.SEPARATE_ONLY]: Object.freeze([
    DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS,
  ]),
  [DUPLEX_SEARCH_MODES.COMPARE_BOTH]: Object.freeze([
    DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS,
    DUPLEX_STRATEGIES.WORK_AND_TURN,
  ]),
  [DUPLEX_SEARCH_MODES.WORK_AND_TURN_ONLY]: Object.freeze([
    DUPLEX_STRATEGIES.WORK_AND_TURN,
  ]),
});

export function duplexStrategiesForSearchMode(searchMode) {
  const strategies = STRATEGIES_BY_SEARCH_MODE[searchMode];
  if (!strategies) throw new RangeError(`Unsupported duplex search mode: ${searchMode}`);
  return strategies;
}

export function selectDuplexAlternatives({
  searchMode = DUPLEX_SEARCH_MODES.COMPARE_BOTH,
  alternatives,
} = {}) {
  if (!alternatives || typeof alternatives !== "object") {
    throw new TypeError("alternatives must be an object keyed by duplex strategy");
  }

  const selected = duplexStrategiesForSearchMode(searchMode).map((strategy) => {
    const alternative = alternatives[strategy];
    if (!alternative) {
      throw new RangeError(`Required duplex alternative is unavailable: ${strategy}`);
    }
    if (alternative.duplexMode !== strategy) {
      throw new RangeError(`Alternative duplexMode does not match strategy ${strategy}`);
    }
    return alternative;
  });

  return Object.freeze(selected);
}
