import test from "node:test";
import assert from "node:assert/strict";

import { createD3PrintInput } from "../src/d3-start-page.js";

test("D3 print input switches between simplex and duplex from back colors", () => {
  assert.deepEqual(createD3PrintInput(4, 0), {
    mode: "simplex",
    frontColors: 4,
    backColors: 0,
    duplexPreference: "auto",
  });

  assert.deepEqual(createD3PrintInput(4, 4, {
    duplexPreference: "separateFrontBackForms",
  }), {
    mode: "duplex",
    frontColors: 4,
    backColors: 4,
    duplexPreference: "separateFrontBackForms",
  });
});

test("D3 print input rejects unsupported color counts", () => {
  assert.throws(() => createD3PrintInput(0, 4), /frontColors/);
  assert.throws(() => createD3PrintInput(4, 21), /backColors/);
});
