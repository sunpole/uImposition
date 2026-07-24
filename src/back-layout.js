import { flipDirectionHorizontal } from "./orientation.js";

export function createBackLayout(frontLayout) {
  if (!frontLayout || frontLayout.side !== "front") {
    throw new TypeError("A completed front layout is required");
  }

  const { id, runLength, rows, columns, rotation, cells } = frontLayout;
  if (!Array.isArray(cells) || cells.length !== rows * columns) {
    throw new RangeError("Front layout cell count does not match its grid");
  }

  const backCells = [];
  for (let row = 0; row < rows; row += 1) {
    const rowStart = row * columns;
    const sourceRow = cells.slice(rowStart, rowStart + columns);

    for (let column = 0; column < columns; column += 1) {
      const sourceCell = sourceRow[columns - column - 1];
      backCells.push(Object.freeze({
        position: backCells.length + 1,
        row,
        column,
        file: sourceCell.file,
        pairIndex: sourceCell.pairIndex,
        frontPage: sourceCell.frontPage,
        backPage: sourceCell.backPage,
        page: sourceCell.backPage,
        direction: flipDirectionHorizontal(sourceCell.direction),
      }));
    }
  }

  return Object.freeze({
    id: String(id),
    side: "back",
    runLength,
    rows,
    columns,
    rotation,
    cells: Object.freeze(backCells),
  });
}
