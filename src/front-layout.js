import { directionForRotation } from "./orientation.js";

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
}

function findPagePair(pagePairs, file, frontPage) {
  const pair = pagePairs.find(
    (item) => String(item.file) === String(file) && item.frontPage === frontPage,
  );
  if (!pair) {
    throw new RangeError(`Page pair not found for file ${file}, front page ${frontPage}`);
  }
  return pair;
}

export function createFrontLayout({
  id,
  runLength,
  rows,
  columns,
  rotation,
  blocks,
  pagePairs,
}) {
  requirePositiveInteger(rows, "rows");
  requirePositiveInteger(columns, "columns");
  requirePositiveInteger(runLength, "runLength");

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new TypeError("blocks must be a non-empty array");
  }
  if (!Array.isArray(pagePairs)) {
    throw new TypeError("pagePairs must be an array");
  }

  const direction = directionForRotation(rotation);
  const capacity = rows * columns;
  const cells = [];

  for (const block of blocks) {
    const file = String(block.file ?? "").trim();
    const frontPage = Number(block.frontPage);
    const count = Number(block.count);

    if (!file || file === "-") {
      throw new RangeError("Front-side file identifier must be present and cannot be '-'");
    }
    if (!Number.isInteger(frontPage) || frontPage <= 0 || frontPage % 2 === 0) {
      throw new RangeError(`Front page for file ${file} must be a positive odd integer`);
    }
    requirePositiveInteger(count, `count for file ${file}`);

    const pair = findPagePair(pagePairs, file, frontPage);
    for (let index = 0; index < count; index += 1) {
      const positionIndex = cells.length;
      cells.push({
        position: positionIndex + 1,
        row: Math.floor(positionIndex / columns),
        column: positionIndex % columns,
        file,
        pairIndex: pair.pairIndex,
        frontPage: pair.frontPage,
        backPage: pair.backPage,
        page: pair.frontPage,
        direction,
      });
    }
  }

  if (cells.length !== capacity) {
    throw new RangeError(`Front layout requires exactly ${capacity} cells; received ${cells.length}`);
  }

  return Object.freeze({
    id: String(id),
    side: "front",
    runLength,
    rows,
    columns,
    rotation,
    cells: Object.freeze(cells.map((cell) => Object.freeze(cell))),
  });
}
