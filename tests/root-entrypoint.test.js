import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("root entrypoint redirects to the current operator application", () => {
  assert.match(rootHtml, /url=\.\/app\//);
  assert.match(rootHtml, /window\.location\.replace\(target\.href\)/);
  assert.match(rootHtml, /href="\.\/app\/"/);
});

test("root entrypoint no longer loads the archived legacy UI", () => {
  assert.doesNotMatch(rootHtml, /styles\.css/);
  assert.doesNotMatch(rootHtml, /src\/app\.js/);
  assert.doesNotMatch(rootHtml, /src\/m3-demo\.js/);
});
