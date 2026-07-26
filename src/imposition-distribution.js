function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text || text === "-") throw new RangeError(`${label} is required`);
  return text;
}

function normalizeRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new TypeError("impositions must be a non-empty array");
  }
  const ids = new Set();
  return Object.freeze(rows.map((row, index) => {
    const id = requiredText(row?.id, `impositions[${index}].id`);
    if (ids.has(id)) throw new RangeError(`Duplicate imposition id: ${id}`);
    ids.add(id);
    if (!Array.isArray(row?.files) || row.files.length === 0) {
      throw new TypeError(`impositions[${index}].files must be a non-empty array`);
    }
    const files = Object.freeze(row.files.map((file, fileIndex) => (
      requiredText(file, `impositions[${index}].files[${fileIndex}]`)
    )));
    return Object.freeze({ id, files });
  }));
}

export function analyzeImpositionOrderDistribution(impositions) {
  const rows = normalizeRows(impositions);
  const appearances = new Map();
  let distinctOrdersPerImposition = 0;

  rows.forEach((row) => {
    const uniqueFiles = new Set(row.files);
    distinctOrdersPerImposition = Math.max(distinctOrdersPerImposition, uniqueFiles.size);
    uniqueFiles.forEach((file) => {
      if (!appearances.has(file)) appearances.set(file, []);
      appearances.get(file).push(row.id);
    });
  });

  const appearancesByFile = Object.freeze(Object.fromEntries(
    [...appearances.entries()]
      .sort(([left], [right]) => left.localeCompare(right, "en", { numeric: true }))
      .map(([file, impositionIds]) => [file, Object.freeze([...impositionIds])]),
  ));
  const appearanceCounts = [...appearances.values()].map((ids) => ids.length);

  return Object.freeze({
    impositionCount: rows.length,
    orderCount: appearances.size,
    distinctOrdersPerImposition,
    splitOrders: appearanceCounts.filter((count) => count > 1).length,
    fragmentedBlocks: appearanceCounts.reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    appearancesByFile,
  });
}

export function distributionRowsFromProductionImpositions(impositions) {
  if (!Array.isArray(impositions) || impositions.length === 0) {
    throw new TypeError("production impositions must be a non-empty array");
  }
  return Object.freeze(impositions.map((record, index) => {
    const front = record?.front;
    const id = requiredText(front?.id, `impositions[${index}].front.id`);
    if (!Array.isArray(front?.cells) || front.cells.length === 0) {
      throw new TypeError(`impositions[${index}].front.cells must be a non-empty array`);
    }
    return Object.freeze({
      id,
      files: Object.freeze(front.cells.map((cell, cellIndex) => (
        requiredText(cell?.file, `impositions[${index}].front.cells[${cellIndex}].file`)
      ))),
    });
  }));
}

export function distributionRowsFromPaperSolution(solution) {
  if (!Array.isArray(solution?.plannedRuns) || solution.plannedRuns.length === 0) {
    throw new TypeError("paper solution plannedRuns must be a non-empty array");
  }
  return Object.freeze(solution.plannedRuns.map((run, index) => {
    const candidate = run?.candidate;
    const id = requiredText(candidate?.id, `plannedRuns[${index}].candidate.id`);
    if (!Array.isArray(candidate?.pairPositions) || candidate.pairPositions.length === 0) {
      throw new TypeError(`plannedRuns[${index}].candidate.pairPositions must be a non-empty array`);
    }
    return Object.freeze({
      id,
      files: Object.freeze(candidate.pairPositions.map((position, positionIndex) => (
        requiredText(
          position?.file,
          `plannedRuns[${index}].candidate.pairPositions[${positionIndex}].file`,
        )
      ))),
    });
  }));
}
