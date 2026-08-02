import {
  countNonEmptySimplexCandidateColumns,
  createMultiProductSimplexColumn,
} from "./multi-product-simplex-columns.js";
import { createMultiProductSeparateDuplexColumn } from "./multi-product-duplex-columns.js";
import { validateGeometryPattern } from "./geometric-pattern.js";

const DEFAULT_EPSILON = 1e-9;
const DEFAULT_MAX_CANDIDATES = 8;
const DEFAULT_MAX_VISITED_STATES = 100000;

const COLUMN_FAMILIES = Object.freeze({
  multiProductSimplexColumn: Object.freeze({
    createColumn: createMultiProductSimplexColumn,
    strategy: "singleSharedFrontFormCandidate",
  }),
  multiProductSeparateDuplexColumn: Object.freeze({
    createColumn: createMultiProductSeparateDuplexColumn,
    strategy: "separateFrontBackFormsCandidate",
  }),
});

function asPositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function asNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function asFiniteNonNegativeNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${label} must be a finite non-negative number`);
  }
  return number;
}

function asFinitePositiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a finite positive number`);
  }
  return number;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function compareCandidates(a, b) {
  if (a.reducedCost !== b.reducedCost) return a.reducedCost - b.reducedCost;
  if (a.coverageCredit !== b.coverageCredit) return b.coverageCredit - a.coverageCredit;
  if (a.occupiedPositionsPerSheet !== b.occupiedPositionsPerSheet) {
    return b.occupiedPositionsPerSheet - a.occupiedPositionsPerSheet;
  }
  if (a.activeDemandCount !== b.activeDemandCount) {
    return b.activeDemandCount - a.activeDemandCount;
  }
  return a.columnSignature.localeCompare(b.columnSignature);
}

function stateSignature(state) {
  return `${state.index}|${state.remainingCapacity}|${state.counts.join(",")}`;
}

function compareStates(a, b) {
  if (a.upperCoverageCredit !== b.upperCoverageCredit) {
    return b.upperCoverageCredit - a.upperCoverageCredit;
  }
  if (a.coverageCredit !== b.coverageCredit) return b.coverageCredit - a.coverageCredit;
  return stateSignature(a).localeCompare(stateSignature(b));
}

function normalizeExistingColumnSignatures(input = []) {
  if (!Array.isArray(input)) {
    throw new TypeError("existingColumnSignatures must be an array");
  }
  const seen = new Set();
  for (let index = 0; index < input.length; index += 1) {
    const signature = asNonEmptyString(input[index], `existingColumnSignatures[${index}]`);
    if (seen.has(signature)) throw new RangeError(`duplicate existing column signature: ${signature}`);
    seen.add(signature);
  }
  return Object.freeze([...seen].sort());
}

function normalizeFamilyAndDemands({ columnFamily, geometryPattern, demands }) {
  const definition = COLUMN_FAMILIES[columnFamily];
  if (!definition) throw new RangeError(`unsupported pricing column family: ${columnFamily}`);
  validateGeometryPattern(geometryPattern);
  if (!Array.isArray(demands) || demands.length === 0) {
    throw new RangeError("demands must be a non-empty array");
  }
  const seedCounts = demands.map((_, index) => index === 0 ? 1 : 0);
  const seedColumn = definition.createColumn({
    id: "paper-pricing-normalization-seed",
    geometryPattern,
    demands,
    allocationCounts: seedCounts,
  });
  if (seedColumn.family !== columnFamily || seedColumn.strategy !== definition.strategy) {
    throw new RangeError("pricing seed column family mismatch");
  }
  return deepFreeze({
    definition,
    demands: seedColumn.demands,
    geometryPattern: seedColumn.geometryPattern,
  });
}

function normalizeShadowPrices(demands, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("demandShadowPrices must be an object keyed by demandId");
  }
  const known = new Set(demands.map(({ demandId }) => demandId));
  for (const key of Object.keys(input)) {
    if (!known.has(key)) throw new RangeError(`unknown demand shadow price: ${key}`);
  }
  const entries = demands.map((demand) => Object.freeze({
    demandId: demand.demandId,
    shadowPrice: asFiniteNonNegativeNumber(
      input[demand.demandId],
      `demandShadowPrices.${demand.demandId}`,
    ),
  }));
  return deepFreeze({
    entries,
    values: Object.freeze(entries.map(({ shadowPrice }) => shadowPrice)),
    byDemandId: Object.freeze(Object.fromEntries(
      entries.map(({ demandId, shadowPrice }) => [demandId, shadowPrice]),
    )),
  });
}

function createSuffixMaximums(values) {
  const suffix = new Array(values.length + 1).fill(0);
  for (let index = values.length - 1; index >= 0; index -= 1) {
    suffix[index] = Math.max(values[index], suffix[index + 1]);
  }
  return Object.freeze(suffix);
}

function scoreMaterializedColumn(column, shadowPrices, sheetUnitCost, epsilon, existingSet) {
  const demandCredits = Object.freeze(column.allocation.map((entry) => {
    const shadowPrice = shadowPrices.byDemandId[entry.demandId];
    const credit = shadowPrice * entry.positionsPerSheet;
    return Object.freeze({
      demandId: entry.demandId,
      positionsPerSheet: entry.positionsPerSheet,
      shadowPrice,
      credit,
    });
  }));
  const coverageCredit = demandCredits.reduce((sum, entry) => sum + entry.credit, 0);
  const reducedCost = sheetUnitCost - coverageCredit;
  const existing = existingSet.has(column.columnSignature);
  return deepFreeze({
    column,
    columnSignature: column.columnSignature,
    allocationSignature: column.allocationSignature,
    occupiedPositionsPerSheet: column.metrics.occupiedPositionsPerSheet,
    activeDemandCount: column.metrics.activeDemandCount,
    demandCredits,
    coverageCredit,
    sheetUnitCost,
    reducedCost,
    improving: reducedCost < -epsilon,
    existing,
    eligibleForAddition: !existing && reducedCost < -epsilon,
  });
}

function createRequestSignature({
  columnFamily,
  geometryPattern,
  demands,
  shadowPrices,
  existingColumnSignatures,
  sheetUnitCost,
  epsilon,
  maxCandidates,
  maxVisitedStates,
}) {
  return [
    "paper-pricing-generator-request-v1",
    `family=${columnFamily}`,
    `geometry=${geometryPattern.structuralSignature}`,
    `demands=${demands.map(({ demandId, productId }) => `${demandId}:${productId}`).join(";")}`,
    `shadow=${shadowPrices.entries.map(({ demandId, shadowPrice }) => `${demandId}:${shadowPrice}`).join(";")}`,
    `existing=${existingColumnSignatures.join(";")}`,
    `sheetUnitCost=${sheetUnitCost}`,
    `epsilon=${epsilon}`,
    `maxCandidates=${maxCandidates}`,
    `maxVisitedStates=${maxVisitedStates}`,
  ].join("|");
}

function buildResult({
  id,
  columnFamily,
  geometryPattern,
  demands,
  demandShadowPrices,
  existingColumnSignatures,
  sheetUnitCost,
  epsilon,
  maxCandidates,
  maxVisitedStates,
}) {
  const normalizedId = asNonEmptyString(id, "id");
  const familyContext = normalizeFamilyAndDemands({ columnFamily, geometryPattern, demands });
  const shadowPrices = normalizeShadowPrices(familyContext.demands, demandShadowPrices);
  const existingSignatures = normalizeExistingColumnSignatures(existingColumnSignatures);
  const existingSet = new Set(existingSignatures);
  const normalizedSheetUnitCost = asFinitePositiveNumber(sheetUnitCost, "sheetUnitCost");
  const normalizedEpsilon = asFinitePositiveNumber(epsilon, "epsilon");
  const normalizedMaxCandidates = asPositiveInteger(maxCandidates, "maxCandidates");
  const normalizedMaxVisitedStates = asPositiveInteger(maxVisitedStates, "maxVisitedStates");
  const suffixMaximums = createSuffixMaximums(shadowPrices.values);
  const theoreticalAllocationCount = countNonEmptySimplexCandidateColumns(
    familyContext.geometryPattern.capacity,
    familyContext.demands.length,
  );

  const queue = [{
    index: 0,
    remainingCapacity: familyContext.geometryPattern.capacity,
    counts: [],
    coverageCredit: 0,
    upperCoverageCredit: familyContext.geometryPattern.capacity * suffixMaximums[0],
  }];
  const candidates = [];
  let visitedStateCount = 0;
  let materializedColumnCount = 0;
  let nonImprovingBoundPrunedStateCount = 0;
  let topCandidateBoundPrunedStateCount = 0;
  let existingImprovingColumnCount = 0;
  let truncated = false;
  let stoppedByTopCandidateProof = false;

  while (queue.length > 0) {
    queue.sort(compareStates);
    const nextState = queue[0];
    if (nextState.upperCoverageCredit <= normalizedSheetUnitCost + normalizedEpsilon) {
      nonImprovingBoundPrunedStateCount += queue.length;
      queue.length = 0;
      break;
    }
    if (candidates.length >= normalizedMaxCandidates) {
      const worstCandidate = candidates[candidates.length - 1];
      const bestPossibleReducedCost = normalizedSheetUnitCost - nextState.upperCoverageCredit;
      if (bestPossibleReducedCost > worstCandidate.reducedCost + normalizedEpsilon) {
        topCandidateBoundPrunedStateCount += queue.length;
        stoppedByTopCandidateProof = true;
        queue.length = 0;
        break;
      }
    }
    if (visitedStateCount >= normalizedMaxVisitedStates) {
      truncated = true;
      break;
    }

    const state = queue.shift();
    visitedStateCount += 1;
    if (state.index === familyContext.demands.length) {
      const occupied = state.counts.reduce((sum, value) => sum + value, 0);
      if (occupied === 0) continue;
      const column = familyContext.definition.createColumn({
        id: `${normalizedId}:${state.counts.join("-")}`,
        geometryPattern: familyContext.geometryPattern,
        demands: familyContext.demands,
        allocationCounts: state.counts,
      });
      materializedColumnCount += 1;
      const scored = scoreMaterializedColumn(
        column,
        shadowPrices,
        normalizedSheetUnitCost,
        normalizedEpsilon,
        existingSet,
      );
      if (scored.improving && scored.existing) existingImprovingColumnCount += 1;
      if (scored.eligibleForAddition) {
        candidates.push(scored);
        candidates.sort(compareCandidates);
        if (candidates.length > normalizedMaxCandidates) candidates.length = normalizedMaxCandidates;
      }
      continue;
    }

    const shadowPrice = shadowPrices.values[state.index];
    const nextIndex = state.index + 1;
    for (let count = 0; count <= state.remainingCapacity; count += 1) {
      const remainingCapacity = state.remainingCapacity - count;
      const coverageCredit = state.coverageCredit + (count * shadowPrice);
      queue.push({
        index: nextIndex,
        remainingCapacity,
        counts: [...state.counts, count],
        coverageCredit,
        upperCoverageCredit: coverageCredit + (
          remainingCapacity * suffixMaximums[nextIndex]
        ),
      });
    }
  }

  const completePricingConclusionWithinAllocationSpace = !truncated;
  const noImprovingColumnProven = completePricingConclusionWithinAllocationSpace
    && candidates.length === 0;
  const requestSignature = createRequestSignature({
    columnFamily,
    geometryPattern: familyContext.geometryPattern,
    demands: familyContext.demands,
    shadowPrices,
    existingColumnSignatures: existingSignatures,
    sheetUnitCost: normalizedSheetUnitCost,
    epsilon: normalizedEpsilon,
    maxCandidates: normalizedMaxCandidates,
    maxVisitedStates: normalizedMaxVisitedStates,
  });
  return deepFreeze({
    id: normalizedId,
    family: "paperPricingGeneratorResult",
    objective: "paperOnlyLinearRelaxation",
    columnFamily,
    columnStrategy: familyContext.definition.strategy,
    geometryPattern: familyContext.geometryPattern,
    demands: familyContext.demands,
    demandShadowPrices: shadowPrices,
    existingColumnSignatures: existingSignatures,
    sheetUnitCost: normalizedSheetUnitCost,
    epsilon: normalizedEpsilon,
    generatedCandidates: Object.freeze(candidates),
    bestImprovingCandidate: candidates[0] ?? null,
    requestSignature,
    counters: {
      visitedStateCount,
      materializedColumnCount,
      generatedCandidateCount: candidates.length,
      existingImprovingColumnCount,
      nonImprovingBoundPrunedStateCount,
      topCandidateBoundPrunedStateCount,
    },
    coverage: {
      scope: "best-first bounded allocation search on one validated geometry pattern",
      theoreticalAllocationCount: theoreticalAllocationCount.toString(),
      maxCandidates: normalizedMaxCandidates,
      maxVisitedStates: normalizedMaxVisitedStates,
      completePricingConclusionWithinAllocationSpace,
      topCandidatesProvenWithinAllocationSpace: completePricingConclusionWithinAllocationSpace,
      noImprovingColumnProven,
      allocationSpaceFullyEnumerated: !truncated
        && !stoppedByTopCandidateProof
        && nonImprovingBoundPrunedStateCount === 0,
      truncated,
      truncationReasons: truncated ? ["stateLimit"] : [],
      columnsGeneratedOnDemand: true,
      completeCatalogConstructed: false,
      admissibleCoverageCreditBoundsUsed: true,
      fixedFormCostsIncluded: false,
      fixedPlateCostsIncluded: false,
      pressSetupCostsIncluded: false,
      integerMasterSolved: false,
      dualOptimalityVerified: false,
      globalCompletenessClaimed: false,
    },
  });
}

export function validatePaperPricingGeneratorResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("result must be an object");
  }
  if (result.family !== "paperPricingGeneratorResult") {
    throw new RangeError("result.family must be paperPricingGeneratorResult");
  }
  const expected = buildResult({
    id: result.id,
    columnFamily: result.columnFamily,
    geometryPattern: result.geometryPattern,
    demands: result.demands,
    demandShadowPrices: result.demandShadowPrices?.byDemandId,
    existingColumnSignatures: result.existingColumnSignatures,
    sheetUnitCost: result.sheetUnitCost,
    epsilon: result.epsilon,
    maxCandidates: result.coverage?.maxCandidates,
    maxVisitedStates: result.coverage?.maxVisitedStates,
  });
  for (const key of [
    "objective",
    "columnFamily",
    "columnStrategy",
    "demandShadowPrices",
    "existingColumnSignatures",
    "sheetUnitCost",
    "epsilon",
    "generatedCandidates",
    "bestImprovingCandidate",
    "requestSignature",
    "counters",
    "coverage",
  ]) {
    if (JSON.stringify(result[key]) !== JSON.stringify(expected[key])) {
      throw new RangeError(`paper pricing generator ${key} mismatch`);
    }
  }
  return true;
}

export function generatePaperPricingColumns({
  id = "paper-pricing-generator",
  columnFamily,
  geometryPattern,
  demands,
  demandShadowPrices,
  existingColumnSignatures = [],
  sheetUnitCost = 1,
  epsilon = DEFAULT_EPSILON,
  maxCandidates = DEFAULT_MAX_CANDIDATES,
  maxVisitedStates = DEFAULT_MAX_VISITED_STATES,
}) {
  const result = buildResult({
    id,
    columnFamily,
    geometryPattern,
    demands,
    demandShadowPrices,
    existingColumnSignatures,
    sheetUnitCost,
    epsilon,
    maxCandidates,
    maxVisitedStates,
  });
  validatePaperPricingGeneratorResult(result);
  return result;
}
