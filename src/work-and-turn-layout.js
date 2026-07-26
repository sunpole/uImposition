import { createBackLayout } from "./back-layout.js";
import { validateImposition } from "./imposition-validation.js";
import { directionForRotation, flipDirectionHorizontal } from "./orientation.js";

export const WORK_AND_TURN_AXIS = Object.freeze({
  HORIZONTAL: "horizontal",
});

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function normalizeFile(value, label = "file") {
  const file = String(value ?? "").trim();
  if (!file || file === "-") throw new RangeError(`${label} must be present and cannot be '-'`);
  return file;
}

function pairKey(file, frontPage) {
  return `${String(file)}\u0000${Number(frontPage)}`;
}

function pagePairMap(pagePairs) {
  if (!Array.isArray(pagePairs) || pagePairs.length === 0) {
    throw new TypeError("pagePairs must be a non-empty array");
  }

  const map = new Map();
  pagePairs.forEach((pair, index) => {
    const file = normalizeFile(pair?.file, `pagePairs[${index}].file`);
    const pairIndex = requirePositiveInteger(pair?.pairIndex, `pagePairs[${index}].pairIndex`);
    const frontPage = requirePositiveInteger(pair?.frontPage, `pagePairs[${index}].frontPage`);
    const backPage = requirePositiveInteger(pair?.backPage, `pagePairs[${index}].backPage`);
    if (frontPage % 2 === 0) throw new RangeError(`pagePairs[${index}].frontPage must be odd`);
    if (backPage !== frontPage + 1) {
      throw new RangeError(`pagePairs[${index}].backPage must equal frontPage + 1`);
    }
    const key = pairKey(file, frontPage);
    if (map.has(key)) throw new RangeError(`Duplicate page pair for file ${file}, page ${frontPage}`);
    map.set(key, Object.freeze({ ...pair, file, pairIndex, frontPage, backPage }));
  });
  return map;
}

function mirrorColumn(columns, column) {
  return columns - column - 1;
}

function freezeCells(cells) {
  return Object.freeze(cells.map((cell) => Object.freeze(cell)));
}

export function createWorkAndTurnPlateLayout({
  id,
  runLength,
  rows,
  columns,
  rotation,
  halfRows,
  pagePairs,
  turnAxis = WORK_AND_TURN_AXIS.HORIZONTAL,
} = {}) {
  const normalizedRows = requirePositiveInteger(rows, "rows");
  const normalizedColumns = requirePositiveInteger(columns, "columns");
  const normalizedRunLength = requirePositiveInteger(runLength, "runLength");
  if (normalizedColumns % 2 !== 0) {
    throw new RangeError("work-and-turn requires an even column count");
  }
  if (turnAxis !== WORK_AND_TURN_AXIS.HORIZONTAL) {
    throw new RangeError(`Unsupported work-and-turn axis: ${turnAxis}`);
  }
  if (!Array.isArray(halfRows) || halfRows.length !== normalizedRows) {
    throw new RangeError(`halfRows must contain exactly ${normalizedRows} rows`);
  }

  const pairs = pagePairMap(pagePairs);
  const halfColumns = normalizedColumns / 2;
  const frontDirection = directionForRotation(rotation);
  const backDirection = flipDirectionHorizontal(frontDirection);
  const cells = [];

  halfRows.forEach((descriptors, row) => {
    if (!Array.isArray(descriptors) || descriptors.length !== halfColumns) {
      throw new RangeError(`halfRows[${row}] must contain exactly ${halfColumns} pair descriptors`);
    }

    const normalizedDescriptors = descriptors.map((descriptor, column) => {
      const file = normalizeFile(descriptor?.file, `halfRows[${row}][${column}].file`);
      const frontPage = requirePositiveInteger(
        descriptor?.frontPage,
        `halfRows[${row}][${column}].frontPage`,
      );
      const pair = pairs.get(pairKey(file, frontPage));
      if (!pair) throw new RangeError(`Page pair not found for file ${file}, front page ${frontPage}`);
      return pair;
    });

    const rowCells = normalizedDescriptors.map((pair, column) => ({
      position: row * normalizedColumns + column + 1,
      row,
      column,
      file: pair.file,
      pairIndex: pair.pairIndex,
      frontPage: pair.frontPage,
      backPage: pair.backPage,
      page: pair.frontPage,
      pageRole: "front",
      direction: frontDirection,
    }));

    [...normalizedDescriptors].reverse().forEach((pair, index) => {
      const column = halfColumns + index;
      rowCells.push({
        position: row * normalizedColumns + column + 1,
        row,
        column,
        file: pair.file,
        pairIndex: pair.pairIndex,
        frontPage: pair.frontPage,
        backPage: pair.backPage,
        page: pair.backPage,
        pageRole: "back",
        direction: backDirection,
      });
    });

    cells.push(...rowCells);
  });

  const plate = Object.freeze({
    id: String(id ?? "work-and-turn"),
    side: "sharedPlate",
    duplexMode: "workAndTurn",
    runLength: normalizedRunLength,
    rows: normalizedRows,
    columns: normalizedColumns,
    rotation,
    turnAxis,
    samePlateForBothPasses: true,
    cells: freezeCells(cells),
  });

  assertValidWorkAndTurnPlateLayout({ plate, pagePairs });
  return plate;
}

export function validateWorkAndTurnPlateLayout({ plate, pagePairs } = {}) {
  const errors = [];
  let pairs;
  try {
    pairs = pagePairMap(pagePairs);
  } catch (error) {
    return Object.freeze({ valid: false, errors: Object.freeze([error.message]) });
  }

  if (!plate || plate.side !== "sharedPlate") errors.push("A shared work-and-turn plate is required");
  if (plate?.duplexMode !== "workAndTurn") errors.push("Plate duplexMode must be workAndTurn");
  if (plate?.turnAxis !== WORK_AND_TURN_AXIS.HORIZONTAL) errors.push("Only horizontal sheet turning is supported");
  if (plate?.samePlateForBothPasses !== true) errors.push("The same plate must be used for both passes");
  if (!Number.isInteger(plate?.columns) || plate.columns <= 0 || plate.columns % 2 !== 0) {
    errors.push("Plate columns must be a positive even integer");
  }
  if (!Number.isInteger(plate?.rows) || plate.rows <= 0) errors.push("Plate rows must be a positive integer");
  if (!Array.isArray(plate?.cells) || plate.cells.length !== plate.rows * plate.columns) {
    errors.push("Plate cell count does not match its grid");
  }
  if (errors.length > 0) return Object.freeze({ valid: false, errors: Object.freeze(errors) });

  const counts = new Map();
  for (let row = 0; row < plate.rows; row += 1) {
    for (let column = 0; column < plate.columns / 2; column += 1) {
      const leftIndex = row * plate.columns + column;
      const rightColumn = mirrorColumn(plate.columns, column);
      const rightIndex = row * plate.columns + rightColumn;
      const left = plate.cells[leftIndex];
      const right = plate.cells[rightIndex];
      const pair = pairs.get(pairKey(left?.file, left?.frontPage));

      if (!pair) {
        errors.push(`Plate cell ${leftIndex + 1} has no matching page pair`);
        continue;
      }
      if (right?.file !== left.file || right?.pairIndex !== left.pairIndex) {
        errors.push(`Mirrored cells ${leftIndex + 1}/${rightIndex + 1} must use the same page pair`);
      }
      if (left.page !== pair.frontPage || left.pageRole !== "front") {
        errors.push(`Left-half cell ${leftIndex + 1} must contain the front page`);
      }
      if (right?.page !== pair.backPage || right?.pageRole !== "back") {
        errors.push(`Right-half cell ${rightIndex + 1} must contain the paired back page`);
      }
      if (right?.direction !== flipDirectionHorizontal(left.direction)) {
        errors.push(`Mirrored cells ${leftIndex + 1}/${rightIndex + 1} have incompatible directions`);
      }
      if (left.row !== row || left.column !== column || right?.row !== row || right?.column !== rightColumn) {
        errors.push(`Mirrored cells ${leftIndex + 1}/${rightIndex + 1} have invalid grid coordinates`);
      }

      const key = `${pair.file}\u0000${pair.pairIndex}`;
      counts.set(key, (counts.get(key) ?? 0) + 2);
    }
  }

  counts.forEach((count, key) => {
    if (count % 2 !== 0) errors.push(`Page pair ${key} does not occupy complete mirrored pairs`);
  });

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function assertValidWorkAndTurnPlateLayout(input) {
  const validation = validateWorkAndTurnPlateLayout(input);
  if (!validation.valid) {
    throw new Error(`Invalid work-and-turn plate: ${validation.errors.join("; ")}`);
  }
  return validation;
}

export function materializeWorkAndTurnImposition({ plate, pagePairs } = {}) {
  assertValidWorkAndTurnPlateLayout({ plate, pagePairs });
  const pairs = pagePairMap(pagePairs);
  const direction = directionForRotation(plate.rotation);

  const frontCells = plate.cells.map((cell, index) => {
    const partnerColumn = mirrorColumn(plate.columns, cell.column);
    const partner = plate.cells[cell.row * plate.columns + partnerColumn];
    const pair = pairs.get(pairKey(cell.file, cell.frontPage));
    if (!pair || partner.file !== pair.file || partner.pairIndex !== pair.pairIndex) {
      throw new Error(`Cannot materialize finished pair at plate position ${index + 1}`);
    }

    return Object.freeze({
      position: index + 1,
      row: cell.row,
      column: cell.column,
      file: pair.file,
      pairIndex: pair.pairIndex,
      frontPage: pair.frontPage,
      backPage: pair.backPage,
      page: pair.frontPage,
      direction,
    });
  });

  const front = Object.freeze({
    id: String(plate.id),
    side: "front",
    runLength: plate.runLength,
    rows: plate.rows,
    columns: plate.columns,
    rotation: plate.rotation,
    cells: Object.freeze(frontCells),
  });
  const back = createBackLayout(front);
  const validation = validateImposition({ front, back, pagePairs });
  if (!validation.valid) {
    throw new Error(`Materialized work-and-turn imposition is invalid: ${validation.errors.join("; ")}`);
  }

  return Object.freeze({
    front,
    back,
    validation,
    operation: Object.freeze({
      duplexMode: "workAndTurn",
      turnAxis: plate.turnAxis,
      samePlateForBothPasses: true,
      passCount: 2,
    }),
  });
}
