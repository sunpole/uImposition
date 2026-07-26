import test from "node:test";
import assert from "node:assert/strict";

import { calculatePlacementOptions } from "../src/geometry.js";
import { expandPagePairs } from "../src/orders.js";
import {
  PDF_PAGE_MODES,
  createProductionReportPdfDocument,
  createSchemePdfDocument,
} from "../src/pdf-document-model.js";
import { createDuplexPrintSpecification } from "../src/print-specification.js";
import { createPricingProfile } from "../src/production-cost.js";
import {
  clearUserProductionPlanSet,
  getUserProductionPlanRuntime,
  selectUserProductionPlan,
  setUserProductionPlanSet,
} from "../src/user-production-plans-runtime.js";
import { createUserUniformProductionPlanSet } from "../src/user-uniform-production-plans.js";

const sourceSheet = Object.freeze({ width: 620, height: 450 });
const placementOptions = calculatePlacementOptions({
  printable: { width: 608, height: 431 },
  product: {
    width: 105,
    height: 148,
    bleed: 0,
    spacingMode: "commonCut",
    gap: 0,
  },
});
const pagePairs = expandPagePairs([
  { file: "A", quantity: 100, pages: 2 },
  { file: "B", quantity: 100, pages: 2 },
  { file: "C", quantity: 100, pages: 2 },
]);
const printSpecification = createDuplexPrintSpecification({
  frontColors: 4,
  backColors: 1,
});
const pricing = createPricingProfile({
  currency: "BYN",
  grammageGsm: 130,
  paperPricePerKg: 4,
  colorPlatePrice: 15,
  layoutFormPreparationPrice: 2,
});

function buildPlanSet() {
  return createUserUniformProductionPlanSet({
    pagePairs,
    placementOptions,
    sourceSheet,
    printSpecification,
    pricing,
  });
}

test("selected user plan produces full scheme and report PDF document models", () => {
  clearUserProductionPlanSet();
  setUserProductionPlanSet(buildPlanSet());
  selectUserProductionPlan("uniform-r90-dedicated-pairs");

  const selected = getUserProductionPlanRuntime().selectedPlan;
  assert.ok(selected);
  assert.equal(selected.metrics.physicalSheets, 21);
  assert.equal(selected.metrics.layoutForms, 6);
  assert.equal(selected.metrics.colorPlates, 15);
  assert.equal(selected.report.valid, true);
  assert.equal(selected.report.totals.underproduction, 0);

  const schemeDocument = createSchemePdfDocument({
    records: selected.impositions,
    language: "ru",
    pageMode: PDF_PAGE_MODES.A4,
  });
  assert.equal(schemeDocument.impositionCount, 3);
  assert.equal(schemeDocument.pageCount, 6);
  assert.equal(schemeDocument.pages[0].side, "front");
  assert.equal(schemeDocument.pages[1].side, "back");
  assert.equal(schemeDocument.pages.at(-1).pageNumber, 6);

  const reportDocument = createProductionReportPdfDocument({
    report: selected.report,
    language: "ru",
    pageMode: PDF_PAGE_MODES.A4,
  });
  assert.equal(reportDocument.fileCount, 3);
  assert.equal(reportDocument.pairCount, 3);
  assert.deepEqual(reportDocument.sections.map(({ kind }) => kind), [
    "summary",
    "fileTable",
    "pairTable",
  ]);

  clearUserProductionPlanSet();
});

test("export model follows explicit operator selection rather than recommendation", () => {
  clearUserProductionPlanSet();
  const planSet = buildPlanSet();
  setUserProductionPlanSet(planSet);

  const recommendedId = planSet.catalog.recommendedId;
  assert.notEqual(recommendedId, "uniform-r90-dedicated-pairs");

  selectUserProductionPlan("uniform-r90-dedicated-pairs");
  const selected = getUserProductionPlanRuntime().selectedPlan;
  const schemeDocument = createSchemePdfDocument({
    records: selected.impositions,
    language: "en",
    pageMode: PDF_PAGE_MODES.A4,
  });

  assert.equal(selected.id, "uniform-r90-dedicated-pairs");
  assert.equal(schemeDocument.impositionCount, selected.metrics.impositionCount);
  assert.equal(schemeDocument.pageCount, selected.metrics.impositionCount * 2);
  clearUserProductionPlanSet();
});
