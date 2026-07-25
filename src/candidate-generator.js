import { CONFIG } from "./config.js";
import {
  IMPOSITION_CANDIDATE_KIND,
  createImpositionCandidate,
  createInitialDemandState,
} from "./imposition-candidate.js";
import { productionPairKey } from "./production-metrics.js";

export const CANDIDATE_GENERATION_RESULT_KIND = "candidateGenerationResult";

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function requireNonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return number;
}

function normalizeFile(value, label = "file") {
  const file = String(value ?? "").trim();
  if (!file || file === "-") {
    throw new RangeError(`${label} must be present and cannot be '-'`);
  }
  return file;
}

function binomialBigInt(n, k) {
  const normalizedN = requireNonNegativeInteger(n, "n");
  let normalizedK = requireNonNegativeInteger(k, "k");
  if (normalizedK > normalizedN) return 0n;
  normalizedK = Math.min(normalizedK, normalizedN - normalizedK);
  let result = 1n;
  for (let index = 1; index <= normalizedK; index += 1) {
    result = result * BigInt(normalizedN - normalizedK + index) / BigInt(index);
  }
  return result;
}

function safeBigIntToNumber(value, label) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`${label} exceeds Number.MAX_SAFE_INTEGER`);
  }
  return Number(value);
}

function* combinations(items, size, startIndex = 0, prefix = []) {
  if (prefix.length === size) {
    yield prefix;
    return;
  }
  const required = size - prefix.length;
  for (let index = startIndex; index <= items.length - required; index += 1) {
    yield* combinations(items, size, index + 1, [...prefix, items[index]]);
  }
}

function* positiveCompositions(total, partCount, prefix = []) {
  if (partCount === 1) {
    yield [...prefix, total];
    return;
  }
  const maximumFirst = total - (partCount - 1);
  for (let first = 1; first <= maximumFirst; first += 1) {
    yield* positiveCompositions(total - first, partCount - 1, [...prefix, first]);
  }
}

function normalizePairSelection(pagePairs, selectedPairRefs) {
  const demandState = createInitialDemandState(pagePairs);
  const allPairs = demandState.rows.map((row) => Object.freeze({
    key: row.key,
    file: row.file,
    pairIndex: row.pairIndex,
    frontPage: row.frontPage,
    backPage: row.backPage,
  }));
  const byKey = new Map(allPairs.map((pair) => [pair.key, pair]));

  if (selectedPairRefs === null || selectedPairRefs === undefined) {
    return Object.freeze(allPairs);
  }
  if (!Array.isArray(selectedPairRefs) || selectedPairRefs.length === 0) {
    throw new TypeError("selectedPairRefs must be a non-empty array when provided");
  }

  const seen = new Set();
  const selected = selectedPairRefs.map((reference, index) => {
    const file = normalizeFile(reference?.file, `selectedPairRefs[${index}].file`);
    const pairIndex = requirePositiveInteger(
      reference?.pairIndex,
      `selectedPairRefs[${index}].pairIndex`,
    );
    const key = productionPairKey(file, pairIndex);
    const pair = byKey.get(key);
    if (!pair) {
      throw new RangeError(`Unknown selected pair: file ${file}, pair ${pairIndex}`);
    }
    if (seen.has(key)) {
      throw new RangeError(`Duplicate selected pair: file ${file}, pair ${pairIndex}`);
    }
    seen.add(key);
    return pair;
  });

  return Object.freeze(selected);
}

export function candidateProductionSignature(candidate) {
  if (!candidate || candidate.kind !== IMPOSITION_CANDIDATE_KIND) {
    throw new TypeError("An imposition candidate is required");
  }
  const pairs = candidate.pairPositions
    .map((pair) => [pair.file, pair.pairIndex, pair.positionCount])
    .sort((left, right) => {
      const fileOrder = String(left[0]).localeCompare(String(right[0]), "en", { numeric: true });
      return fileOrder || left[1] - right[1];
    });
  return JSON.stringify([
    candidate.rows,
    candidate.columns,
    candidate.rotation,
    pairs,
  ]);
}

export function countCandidateSpace({
  selectedPairCount,
  capacity,
  minDistinctPairs = CONFIG.optimizer.candidateGeneration.minDistinctPairs,
  maxDistinctPairs = CONFIG.optimizer.candidateGeneration.maxDistinctPairs,
}) {
  const pairCount = requirePositiveInteger(selectedPairCount, "selectedPairCount");
  const normalizedCapacity = requirePositiveInteger(capacity, "capacity");
  const normalizedMin = requirePositiveInteger(minDistinctPairs, "minDistinctPairs");
  const requestedMax = requirePositiveInteger(maxDistinctPairs, "maxDistinctPairs");
  const effectiveMax = Math.min(requestedMax, pairCount, normalizedCapacity);
  if (normalizedMin > effectiveMax) {
    throw new RangeError("minDistinctPairs exceeds the available pair or position count");
  }

  let total = 0n;
  for (let distinct = normalizedMin; distinct <= effectiveMax; distinct += 1) {
    const pairSubsets = binomialBigInt(pairCount, distinct);
    const allocations = binomialBigInt(normalizedCapacity - 1, distinct - 1);
    total += pairSubsets * allocations;
  }
  return safeBigIntToNumber(total, "candidate space");
}

export function generateImpositionCandidates({
  pagePairs,
  rows,
  columns,
  rotation,
  selectedPairRefs = null,
  minDistinctPairs = CONFIG.optimizer.candidateGeneration.minDistinctPairs,
  maxDistinctPairs = CONFIG.optimizer.candidateGeneration.maxDistinctPairs,
  maxCandidates = CONFIG.optimizer.candidateGeneration.maxCandidates,
  idPrefix = CONFIG.optimizer.candidateGeneration.idPrefix,
}) {
  const normalizedRows = requirePositiveInteger(rows, "rows");
  const normalizedColumns = requirePositiveInteger(columns, "columns");
  const capacity = normalizedRows * normalizedColumns;
  const normalizedMin = requirePositiveInteger(minDistinctPairs, "minDistinctPairs");
  const requestedMax = requirePositiveInteger(maxDistinctPairs, "maxDistinctPairs");
  const normalizedLimit = requirePositiveInteger(maxCandidates, "maxCandidates");
  const prefix = String(idPrefix ?? "").trim();
  if (!prefix) throw new RangeError("idPrefix is required");

  const selectedPairs = normalizePairSelection(pagePairs, selectedPairRefs);
  const effectiveMax = Math.min(requestedMax, selectedPairs.length, capacity);
  if (normalizedMin > effectiveMax) {
    throw new RangeError("minDistinctPairs exceeds the available pair or position count");
  }

  const theoreticalCandidateCount = countCandidateSpace({
    selectedPairCount: selectedPairs.length,
    capacity,
    minDistinctPairs: normalizedMin,
    maxDistinctPairs: effectiveMax,
  });
  const generatedTarget = Math.min(theoreticalCandidateCount, normalizedLimit);
  const idDigits = Math.max(4, String(generatedTarget).length);
  const candidates = [];
  const signatures = new Set();

  generation:
  for (let distinct = normalizedMin; distinct <= effectiveMax; distinct += 1) {
    for (const pairCombination of combinations(selectedPairs, distinct)) {
      for (const counts of positiveCompositions(capacity, distinct)) {
        if (candidates.length >= normalizedLimit) break generation;
        const blocks = pairCombination.map((pair, index) => ({
          file: pair.file,
          frontPage: pair.frontPage,
          count: counts[index],
        }));
        const candidate = createImpositionCandidate({
          id: `${prefix}-${String(candidates.length + 1).padStart(idDigits, "0")}`,
          rows: normalizedRows,
          columns: normalizedColumns,
          rotation,
          blocks,
          pagePairs,
        });
        const signature = candidateProductionSignature(candidate);
        if (signatures.has(signature)) {
          throw new Error(`Duplicate generated candidate signature: ${signature}`);
        }
        signatures.add(signature);
        candidates.push(candidate);
      }
    }
  }

  const frozenCandidates = Object.freeze(candidates);
  const truncated = theoreticalCandidateCount > frozenCandidates.length;
  return Object.freeze({
    kind: CANDIDATE_GENERATION_RESULT_KIND,
    rows: normalizedRows,
    columns: normalizedColumns,
    rotation: Number(rotation),
    capacity,
    selectedPairCount: selectedPairs.length,
    minDistinctPairs: normalizedMin,
    maxDistinctPairs: effectiveMax,
    theoreticalCandidateCount,
    candidateCount: frozenCandidates.length,
    truncatedCandidateCount: theoreticalCandidateCount - frozenCandidates.length,
    truncated,
    completeWithinRequestedSpace: !truncated,
    candidates: frozenCandidates,
  });
}
