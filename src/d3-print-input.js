import { CONFIG } from "./config.js";

function colorCount(value, { field, minimum }) {
  const numeric = Number(value);
  if (
    !Number.isInteger(numeric)
    || numeric < minimum
    || numeric > CONFIG.limits.maxColorUnits
  ) {
    throw new RangeError(`${field} must be an integer from ${minimum} to ${CONFIG.limits.maxColorUnits}`);
  }
  return numeric;
}

export function createD3PrintInput(frontColors, backColors, {
  duplexPreference = "auto",
} = {}) {
  const front = colorCount(frontColors, { field: "frontColors", minimum: 1 });
  const back = colorCount(backColors, { field: "backColors", minimum: 0 });
  return Object.freeze({
    mode: back === 0 ? "simplex" : "duplex",
    frontColors: front,
    backColors: back,
    duplexPreference,
  });
}
