export const DUPLEX_MODES = Object.freeze({
  SEPARATE_FRONT_BACK_FORMS: "separateFrontBackForms",
});

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return value;
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function normalizeFile(value, label = "file") {
  const file = String(value ?? "").trim();
  if (!file || file === "-") {
    throw new RangeError(`${label} must be present and cannot be '-'`);
  }
  return file;
}

export function productionPairKey(file, pairIndex) {
  return `${normalizeFile(file)}\u0000${requirePositiveInteger(Number(pairIndex), "pairIndex")}`;
}

function normalizePagePair(pair, index) {
  const file = normalizeFile(pair?.file, `pagePairs[${index}].file`);
  const pairIndex = requirePositiveInteger(Number(pair?.pairIndex), `pagePairs[${index}].pairIndex`);
  const quantity = requirePositiveInteger(Number(pair?.quantity), `pagePairs[${index}].quantity`);
  const frontPage = requirePositiveInteger(Number(pair?.frontPage), `pagePairs[${index}].frontPage`);
  if (frontPage % 2 === 0) {
    throw new RangeError(`pagePairs[${index}].frontPage must be odd`);
  }

  const backPage = pair?.backPage === null
    ? null
    : requirePositiveInteger(Number(pair?.backPage), `pagePairs[${index}].backPage`);
  if (backPage !== null && backPage !== frontPage + 1) {
    throw new RangeError(`pagePairs[${index}].backPage must equal frontPage + 1 or null`);
  }

  return { file, pairIndex, quantity, frontPage, backPage };
}

function normalizeFront(front, index) {
  if (!front || front.side !== "front") {
    throw new TypeError(`fronts[${index}] must be a front layout`);
  }

  const id = String(front.id ?? "").trim();
  if (!id) throw new RangeError(`fronts[${index}].id is required`);

  const runLength = requirePositiveInteger(Number(front.runLength), `fronts[${index}].runLength`);
  const rows = requirePositiveInteger(Number(front.rows), `fronts[${index}].rows`);
  const columns = requirePositiveInteger(Number(front.columns), `fronts[${index}].columns`);
  if (!Array.isArray(front.cells) || front.cells.length !== rows * columns) {
    throw new RangeError(`fronts[${index}] cell count does not match its grid`);
  }

  return { ...front, id, runLength, rows, columns };
}

export function calculatePairMetrics({ pagePairs, fronts }) {
  if (!Array.isArray(pagePairs) || pagePairs.length === 0) {
    throw new TypeError("pagePairs must be a non-empty array");
  }
  if (!Array.isArray(fronts) || fronts.length === 0) {
    throw new TypeError("fronts must be a non-empty array");
  }

  const mutableMetrics = pagePairs.map((pair, index) => {
    const normalized = normalizePagePair(pair, index);
    return {
      ...normalized,
      requiredQuantity: normalized.quantity,
      producedQuantity: 0,
      underproduction: 0,
      overrun: 0,
      contributions: [],
    };
  });

  const metricByKey = new Map();
  mutableMetrics.forEach((metric) => {
    const key = productionPairKey(metric.file, metric.pairIndex);
    if (metricByKey.has(key)) {
      throw new RangeError(`Duplicate page pair: file ${metric.file}, pair ${metric.pairIndex}`);
    }
    metricByKey.set(key, metric);
  });

  const seenImpositionIds = new Set();
  fronts.forEach((frontInput, frontIndex) => {
    const front = normalizeFront(frontInput, frontIndex);
    if (seenImpositionIds.has(front.id)) {
      throw new RangeError(`Duplicate imposition id: ${front.id}`);
    }
    seenImpositionIds.add(front.id);

    const positionsByPair = new Map();
    front.cells.forEach((cell, cellIndex) => {
      const key = productionPairKey(cell?.file, Number(cell?.pairIndex));
      const metric = metricByKey.get(key);
      if (!metric) {
        throw new RangeError(
          `Unknown pair in imposition ${front.id}, position ${cellIndex + 1}: ${cell?.file}/${cell?.pairIndex}`,
        );
      }
      if (cell.frontPage !== metric.frontPage || cell.backPage !== metric.backPage) {
        throw new RangeError(
          `Page-pair mismatch in imposition ${front.id}, position ${cellIndex + 1}`,
        );
      }
      positionsByPair.set(key, (positionsByPair.get(key) ?? 0) + 1);
    });

    positionsByPair.forEach((positionCount, key) => {
      const metric = metricByKey.get(key);
      const producedQuantity = positionCount * front.runLength;
      metric.producedQuantity += producedQuantity;
      metric.contributions.push(Object.freeze({
        impositionId: front.id,
        positionCount,
        runLength: front.runLength,
        producedQuantity,
      }));
    });
  });

  return Object.freeze(mutableMetrics.map((metric) => {
    const underproduction = Math.max(0, metric.requiredQuantity - metric.producedQuantity);
    const overrun = Math.max(0, metric.producedQuantity - metric.requiredQuantity);
    return Object.freeze({
      file: metric.file,
      pairIndex: metric.pairIndex,
      frontPage: metric.frontPage,
      backPage: metric.backPage,
      requiredQuantity: metric.requiredQuantity,
      producedQuantity: metric.producedQuantity,
      underproduction,
      overrun,
      contributions: Object.freeze(metric.contributions),
    });
  }));
}

export function calculateFileMetrics(pairMetrics) {
  if (!Array.isArray(pairMetrics) || pairMetrics.length === 0) {
    throw new TypeError("pairMetrics must be a non-empty array");
  }

  const groups = new Map();
  pairMetrics.forEach((metric, index) => {
    const file = normalizeFile(metric?.file, `pairMetrics[${index}].file`);
    const requiredQuantity = requirePositiveInteger(
      Number(metric?.requiredQuantity),
      `pairMetrics[${index}].requiredQuantity`,
    );
    const producedQuantity = requireNonNegativeInteger(
      Number(metric?.producedQuantity),
      `pairMetrics[${index}].producedQuantity`,
    );

    if (!groups.has(file)) groups.set(file, []);
    groups.get(file).push({ ...metric, file, requiredQuantity, producedQuantity });
  });

  return Object.freeze([...groups.entries()].map(([file, pairs]) => {
    const requiredQuantity = pairs[0].requiredQuantity;
    if (pairs.some((pair) => pair.requiredQuantity !== requiredQuantity)) {
      throw new RangeError(`All print pairs for file ${file} must have the same required quantity`);
    }

    const producedQuantities = pairs.map((pair) => pair.producedQuantity);
    const producedQuantity = Math.min(...producedQuantities);
    const maximumPairQuantity = Math.max(...producedQuantities);
    const underproduction = Math.max(0, requiredQuantity - producedQuantity);
    const overrun = Math.max(0, producedQuantity - requiredQuantity);

    return Object.freeze({
      file,
      pairCount: pairs.length,
      requiredQuantity,
      producedQuantity,
      maximumPairQuantity,
      unevenPairProduction: maximumPairQuantity - producedQuantity,
      underproduction,
      overrun,
      pairUnderproduction: pairs.reduce((sum, pair) => sum + Number(pair.underproduction ?? 0), 0),
      pairOverrun: pairs.reduce((sum, pair) => sum + Number(pair.overrun ?? 0), 0),
    });
  }));
}

export function calculateRunMetrics({ impositions, duplexMode = DUPLEX_MODES.SEPARATE_FRONT_BACK_FORMS }) {
  if (!Array.isArray(impositions) || impositions.length === 0) {
    throw new TypeError("impositions must be a non-empty array");
  }
  if (duplexMode !== DUPLEX_MODES.SEPARATE_FRONT_BACK_FORMS) {
    throw new RangeError(`Unsupported duplex mode: ${duplexMode}`);
  }

  const ids = new Set();
  const impositionMetrics = impositions.map((record, index) => {
    const front = normalizeFront(record?.front, index);
    const back = record?.back;
    if (!back || back.side !== "back") {
      throw new TypeError(`impositions[${index}].back must be a back layout`);
    }
    if (String(back.id) !== front.id) {
      throw new RangeError(`Front/back id mismatch for imposition ${front.id}`);
    }
    if (Number(back.runLength) !== front.runLength) {
      throw new RangeError(`Front/back run-length mismatch for imposition ${front.id}`);
    }
    if (ids.has(front.id)) throw new RangeError(`Duplicate imposition id: ${front.id}`);
    ids.add(front.id);

    return Object.freeze({
      impositionId: front.id,
      runLength: front.runLength,
      physicalSheets: front.runLength,
      frontForms: 1,
      backForms: 1,
      forms: 2,
      pressPasses: front.runLength * 2,
    });
  });

  const physicalSheets = impositionMetrics.reduce((sum, metric) => sum + metric.physicalSheets, 0);
  const frontForms = impositionMetrics.length;
  const backForms = impositionMetrics.length;

  return Object.freeze({
    duplexMode,
    impositionCount: impositionMetrics.length,
    physicalSheets,
    frontForms,
    backForms,
    forms: frontForms + backForms,
    pressPasses: physicalSheets * 2,
    impositions: Object.freeze(impositionMetrics),
  });
}
