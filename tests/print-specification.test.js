import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePrintPlateMetrics,
  createDuplexPrintSpecification,
} from "../src/print-specification.js";

test("4+4 means two side layouts and eight color plates per imposition", () => {
  const specification = createDuplexPrintSpecification({
    frontColors: 4,
    backColors: 4,
  });
  const oneImposition = calculatePrintPlateMetrics({
    impositionCount: 1,
    specification,
  });

  assert.equal(specification.label, "4+4");
  assert.equal(specification.duplex, true);
  assert.equal(specification.printedSideCount, 2);
  assert.equal(specification.layoutFormCountPerImposition, 2);
  assert.equal(specification.colorPlateCountPerImposition, 8);
  assert.deepEqual(oneImposition, {
    impositionCount: 1,
    colorMode: "4+4",
    printedSideCount: 2,
    layoutForms: 2,
    frontColorPlates: 4,
    backColorPlates: 4,
    colorPlates: 8,
  });
});

test("three A5 impositions in 4+4 use six side layouts and twenty-four color plates", () => {
  const specification = createDuplexPrintSpecification({ frontColors: 4, backColors: 4 });
  const metrics = calculatePrintPlateMetrics({ impositionCount: 3, specification });

  assert.equal(metrics.layoutForms, 6);
  assert.equal(metrics.frontColorPlates, 12);
  assert.equal(metrics.backColorPlates, 12);
  assert.equal(metrics.colorPlates, 24);
});

test("one-sided and invalid color specifications remain explicit", () => {
  const specification = createDuplexPrintSpecification({ frontColors: 4, backColors: 0 });
  assert.equal(specification.label, "4+0");
  assert.equal(specification.duplex, false);
  assert.equal(specification.printedSideCount, 1);
  assert.equal(specification.layoutFormCountPerImposition, 1);
  assert.equal(specification.colorPlateCountPerImposition, 4);

  assert.throws(
    () => createDuplexPrintSpecification({ frontColors: 0, backColors: 0 }),
    /At least one printed side/,
  );
  assert.throws(
    () => createDuplexPrintSpecification({ frontColors: 4.5, backColors: 4 }),
    /frontColors must be a non-negative integer/,
  );
  assert.throws(
    () => calculatePrintPlateMetrics({ impositionCount: 0, specification }),
    /impositionCount must be a positive integer/,
  );
});
