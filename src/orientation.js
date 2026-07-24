export const DIRECTIONS = Object.freeze({
  UP: "up",
  RIGHT: "right",
  DOWN: "down",
  LEFT: "left",
});

const DIRECTION_GLYPHS = Object.freeze({
  [DIRECTIONS.UP]: "↑",
  [DIRECTIONS.RIGHT]: "→",
  [DIRECTIONS.DOWN]: "↓",
  [DIRECTIONS.LEFT]: "←",
});

export function directionForRotation(rotation) {
  if (rotation === 0) return DIRECTIONS.UP;
  if (rotation === 90) return DIRECTIONS.RIGHT;
  throw new RangeError("rotation must be 0 or 90 degrees");
}

export function flipDirectionHorizontal(direction) {
  if (direction === DIRECTIONS.RIGHT) return DIRECTIONS.LEFT;
  if (direction === DIRECTIONS.LEFT) return DIRECTIONS.RIGHT;
  if (direction === DIRECTIONS.UP || direction === DIRECTIONS.DOWN) return direction;
  throw new RangeError(`Unknown direction: ${direction}`);
}

export function directionToGlyph(direction) {
  const glyph = DIRECTION_GLYPHS[direction];
  if (!glyph) throw new RangeError(`Unknown direction: ${direction}`);
  return glyph;
}
