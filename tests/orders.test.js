import test from "node:test";
import assert from "node:assert/strict";
import { parseOrders } from "../src/orders.js";

const limits = {
  maxOrders: 500,
  maxPagesPerFile: 10000,
  maxQuantity: 100000000,
};

test("orders are parsed and page pairs are counted", () => {
  const result = parseOrders("70 | 3500 | 3\n99 | 2100 | 2\n119 | 350 | 4", limits);

  assert.equal(result.errors.length, 0);
  assert.equal(result.summary.orderCount, 3);
  assert.equal(result.summary.printPairCount, 5);
  assert.equal(result.summary.totalQuantity, 5950);
  assert.deepEqual(
    result.orders.map((order) => order.printPairs),
    [2, 1, 2],
  );
});

test("tabs and semicolons are accepted", () => {
  const result = parseOrders("A\t100\t1\nB;200;5", limits);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(
    result.orders.map((order) => order.printPairs),
    [1, 3],
  );
});

test("invalid rows are reported without discarding valid rows", () => {
  const result = parseOrders("A | 100 | 2\nbroken\nB | -5 | 3", limits);
  assert.equal(result.orders.length, 1);
  assert.equal(result.errors.length, 2);
  assert.equal(result.errors[0].line, 2);
  assert.equal(result.errors[1].line, 3);
});
