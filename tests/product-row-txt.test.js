import test from "node:test";
import assert from "node:assert/strict";

import {
  PRODUCT_ROW_TXT_COLUMNS,
  createProductRowsTxtTemplate,
  parseProductRowsTxt,
} from "../src/product-row-txt.js";

test("TXT template is parseable and preserves asymmetric 4+1 colors", () => {
  const template = createProductRowsTxtTemplate();
  const result = parseProductRowsTxt(template);

  assert.equal(result.valid, true);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].print.frontColors, 4);
  assert.equal(result.rows[0].print.backColors, 1);
  assert.equal(result.rows[0].print.mode, "duplex");
});

test("TXT parser accepts multiple independent asymmetric duplex rows", () => {
  const text = [
    PRODUCT_ROW_TXT_COLUMNS.join(";"),
    "A6 4+1;105;148;1000;1;2;4;1;0;commonCut;0;auto;auto;front heavy",
    "A6 1+4;105;148;2000;2;2;1;4;0;commonCut;0;auto;auto;back heavy",
  ].join("\n");
  const result = parseProductRowsTxt(text);

  assert.equal(result.valid, true);
  assert.equal(result.rows.length, 2);
  assert.deepEqual(
    result.rows.map(({ print }) => [print.frontColors, print.backColors]),
    [[4, 1], [1, 4]],
  );
});

test("TXT parser is atomic and returns no rows when any row is invalid", () => {
  const text = [
    PRODUCT_ROW_TXT_COLUMNS.join(";"),
    "Good;105;148;1000;1;2;4;4;0;commonCut;0;auto;auto;ok",
    "Broken;105;148;wrong;1;2;4;1;0;commonCut;0;auto;auto;bad quantity",
  ].join("\n");
  const result = parseProductRowsTxt(text);

  assert.equal(result.valid, false);
  assert.deepEqual(result.rows, []);
  assert.ok(result.issues.some(({ line, field }) => line === 3 && field === "quantity"));
});

test("TXT parser rejects reordered or incomplete headers", () => {
  const result = parseProductRowsTxt("name;width_mm\nA6;105");

  assert.equal(result.valid, false);
  assert.equal(result.rows.length, 0);
  assert.equal(result.issues[0].code, "invalidHeader");
});

test("TXT parser reports column count with source line", () => {
  const result = parseProductRowsTxt([
    PRODUCT_ROW_TXT_COLUMNS.join(";"),
    "A6;105;148",
  ].join("\n"));

  assert.equal(result.valid, false);
  assert.equal(result.rows.length, 0);
  assert.equal(result.issues[0].line, 2);
  assert.equal(result.issues[0].field, "row");
});
