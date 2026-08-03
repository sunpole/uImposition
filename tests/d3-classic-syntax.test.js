import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const files = [
  "app/d3/runtime.js",
  "app/d3/storage.js",
  "app/d3/presets-draft.js",
  "app/d3/order-render.js",
  "app/d3/order-edit.js",
  "app/d3/results-render.js",
  "app/d3/calculation.js",
  "app/d3/controller.js",
];

test("D3 classic controller slices remain valid scripts", async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotThrow(() => new vm.Script(source, { filename: file }));
  }
});
