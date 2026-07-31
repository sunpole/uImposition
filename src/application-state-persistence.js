import { CONFIG } from "./config.js";
import {
  APPLICATION_CALCULATION_STATUSES,
  normalizeApplicationState,
} from "./application-state.js";

/**
 * Browser requests cannot survive a page reload. Persisted state therefore
 * never restores an active calculation token. A calculating snapshot becomes
 * dirty so the next controller may start a fresh calculation for the same
 * input revision.
 */
export function prepareApplicationStateForPersistence(state, config = CONFIG) {
  const normalized = normalizeApplicationState(state, config);
  const wasCalculating = normalized.runtime.calculation.status
    === APPLICATION_CALCULATION_STATUSES.CALCULATING;

  return normalizeApplicationState({
    ...normalized,
    runtime: {
      ...normalized.runtime,
      calculation: {
        ...normalized.runtime.calculation,
        status: wasCalculating
          ? APPLICATION_CALCULATION_STATUSES.DIRTY
          : normalized.runtime.calculation.status,
        activeRevision: null,
        error: wasCalculating ? null : normalized.runtime.calculation.error,
      },
    },
  }, config);
}
