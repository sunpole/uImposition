import { flipDirectionHorizontal } from "./orientation.js";

function pairKey(file, frontPage) {
  return `${String(file)}\u0000${frontPage}`;
}

export function validateImposition({ front, back, pagePairs }) {
  const errors = [];
  const pairMap = new Map(
    (pagePairs ?? []).map((pair) => [pairKey(pair.file, pair.frontPage), pair]),
  );

  if (!front || front.side !== "front") errors.push("Front layout is missing or invalid");
  if (!back || back.side !== "back") errors.push("Back layout is missing or invalid");
  if (errors.length > 0) return { valid: false, errors };

  const expectedCount = front.rows * front.columns;
  if (front.cells.length !== expectedCount) errors.push("Front cell count does not match the grid");
  if (back.cells.length !== expectedCount) errors.push("Back cell count does not match the front grid");
  if (front.rows !== back.rows || front.columns !== back.columns) errors.push("Front and back grids differ");

  front.cells.forEach((cell, index) => {
    if (!cell.file || cell.file === "-") errors.push(`Front cell ${index + 1} has no file`);
    if (!Number.isInteger(cell.frontPage) || cell.frontPage % 2 === 0) {
      errors.push(`Front cell ${index + 1} does not contain an odd front page`);
    }
    if (cell.page !== cell.frontPage) errors.push(`Front cell ${index + 1} page mismatch`);

    const pair = pairMap.get(pairKey(cell.file, cell.frontPage));
    if (!pair) {
      errors.push(`Front cell ${index + 1} has no matching page pair`);
    } else if (pair.backPage !== cell.backPage || pair.pairIndex !== cell.pairIndex) {
      errors.push(`Front cell ${index + 1} page-pair data mismatch`);
    }
  });

  for (let row = 0; row < front.rows; row += 1) {
    for (let column = 0; column < front.columns; column += 1) {
      const frontIndex = row * front.columns + (front.columns - column - 1);
      const backIndex = row * back.columns + column;
      const source = front.cells[frontIndex];
      const mirrored = back.cells[backIndex];

      if (!source || !mirrored) continue;
      if (mirrored.file !== source.file) errors.push(`Back cell ${backIndex + 1} file mismatch`);
      if (mirrored.pairIndex !== source.pairIndex) errors.push(`Back cell ${backIndex + 1} pair mismatch`);
      if (mirrored.frontPage !== source.frontPage) errors.push(`Back cell ${backIndex + 1} front-page mismatch`);
      if (mirrored.backPage !== source.backPage || mirrored.page !== source.backPage) {
        errors.push(`Back cell ${backIndex + 1} back-page mismatch`);
      }
      if (mirrored.direction !== flipDirectionHorizontal(source.direction)) {
        errors.push(`Back cell ${backIndex + 1} direction mismatch`);
      }
      if (mirrored.row !== row || mirrored.column !== column) {
        errors.push(`Back cell ${backIndex + 1} grid coordinate mismatch`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidImposition(input) {
  const result = validateImposition(input);
  if (!result.valid) {
    throw new Error(`Invalid imposition: ${result.errors.join("; ")}`);
  }
  return result;
}
