import test from "node:test";
import assert from "node:assert/strict";

import {
  DUPLEX_SEARCH_MODES,
  DUPLEX_STRATEGIES,
  selectDuplexAlternatives,
} from "../src/duplex-strategies.js";
import { createPricingProfile } from "../src/production-cost.js";
import {
  WORK_AND_TURN_CONTROL_CASE,
  createWorkAndTurnControlComparison,
} from "../src/work-and-turn-control-case.js";
import {
  createWorkAndTurnPlateLayout,
  materializeWorkAndTurnImposition,
  validateWorkAndTurnPlateLayout,
} from "../src/work-and-turn-layout.js";

function pagePairs() {
  return WORK_AND_TURN_CONTROL_CASE.files.map((file) => ({
    file,
    pairIndex: 1,
    quantity: 4000,
    frontPage: 1,
    backPage: 2,
  }));
}

function plateInput() {
  return {
    id: "test-work-and-turn",
    runLength: 1000,
    rows: 4,
    columns: 4,
    rotation: 90,
    halfRows: [
      [{ file: "A", frontPage: 1 }, { file: "B", frontPage: 1 }],
      [{ file: "C", frontPage: 1 }, { file: "D", frontPage: 1 }],
      [{ file: "A", frontPage: 1 }, { file: "B", frontPage: 1 }],
      [{ file: "C", frontPage: 1 }, { file: "D", frontPage: 1 }],
    ],
    pagePairs: pagePairs(),
  };
}

test("work-and-turn plate mirrors every front page to its paired back page", () => {
  const plate = createWorkAndTurnPlateLayout(plateInput());
  const validation = validateWorkAndTurnPlateLayout({ plate, pagePairs: pagePairs() });

  assert.equal(validation.valid, true, validation.errors.join("; "));
  assert.equal(plate.cells.length, 16);
  assert.equal(plate.samePlateForBothPasses, true);
  assert.equal(plate.turnAxis, "horizontal");

  for (let row = 0; row < plate.rows; row += 1) {
    for (let column = 0; column < plate.columns / 2; column += 1) {
      const left = plate.cells[row * plate.columns + column];
      const right = plate.cells[row * plate.columns + (plate.columns - column - 1)];
      assert.equal(left.file, right.file);
      assert.equal(left.pairIndex, right.pairIndex);
      assert.equal(left.page, 1);
      assert.equal(right.page, 2);
      assert.equal(left.pageRole, "front");
      assert.equal(right.pageRole, "back");
    }
  }
});

test("work-and-turn validation rejects a broken mirrored page pair", () => {
  const plate = createWorkAndTurnPlateLayout(plateInput());
  const cells = plate.cells.map((cell) => ({ ...cell }));
  cells[3].file = "B";
  const broken = { ...plate, cells };
  const validation = validateWorkAndTurnPlateLayout({ plate: broken, pagePairs: pagePairs() });

  assert.equal(validation.valid, false);
  assert.match(validation.errors.join("; "), /same page pair|matching page pair/);
});

test("materialized work-and-turn imposition passes the existing duplex validator", () => {
  const plate = createWorkAndTurnPlateLayout(plateInput());
  const materialized = materializeWorkAndTurnImposition({ plate, pagePairs: pagePairs() });

  assert.equal(materialized.validation.valid, true);
  assert.equal(materialized.front.cells.length, 16);
  assert.equal(materialized.back.cells.length, 16);
  assert.equal(materialized.operation.samePlateForBothPasses, true);
  assert.equal(materialized.operation.passCount, 2);
});

test("A6 control case keeps paper and passes equal while reducing forms and plates", () => {
  const comparison = createWorkAndTurnControlComparison();
  const separate = comparison.alternativesByStrategy[DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS];
  const workAndTurn = comparison.alternativesByStrategy[DUPLEX_STRATEGIES.WORK_AND_TURN];

  assert.equal(comparison.alternatives.length, 2);
  assert.equal(comparison.reports[DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS].valid, true);
  assert.equal(comparison.reports[DUPLEX_STRATEGIES.WORK_AND_TURN].valid, true);

  assert.equal(separate.physicalSheets, 1000);
  assert.equal(workAndTurn.physicalSheets, 1000);
  assert.equal(separate.pressPasses, 2000);
  assert.equal(workAndTurn.pressPasses, 2000);
  assert.equal(separate.layoutForms, 2);
  assert.equal(workAndTurn.layoutForms, 1);
  assert.equal(separate.colorPlates, 2);
  assert.equal(workAndTurn.colorPlates, 1);
  assert.equal(separate.zeroUnderproduction, true);
  assert.equal(workAndTurn.zeroUnderproduction, true);

  comparison.reports[DUPLEX_STRATEGIES.WORK_AND_TURN].fileMetrics.forEach((metric) => {
    assert.equal(metric.requiredQuantity, 4000);
    assert.equal(metric.producedQuantity, 4000);
    assert.equal(metric.underproduction, 0);
    assert.equal(metric.overrun, 0);
  });
});

test("duplex search modes expose only the operator-approved strategies", () => {
  const both = createWorkAndTurnControlComparison({ searchMode: DUPLEX_SEARCH_MODES.COMPARE_BOTH });
  const separateOnly = createWorkAndTurnControlComparison({ searchMode: DUPLEX_SEARCH_MODES.SEPARATE_ONLY });
  const workAndTurnOnly = createWorkAndTurnControlComparison({ searchMode: DUPLEX_SEARCH_MODES.WORK_AND_TURN_ONLY });

  assert.deepEqual(both.alternatives.map((item) => item.duplexMode), [
    DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS,
    DUPLEX_STRATEGIES.WORK_AND_TURN,
  ]);
  assert.deepEqual(separateOnly.alternatives.map((item) => item.duplexMode), [
    DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS,
  ]);
  assert.deepEqual(workAndTurnOnly.alternatives.map((item) => item.duplexMode), [
    DUPLEX_STRATEGIES.WORK_AND_TURN,
  ]);

  assert.throws(() => selectDuplexAlternatives({
    searchMode: DUPLEX_SEARCH_MODES.WORK_AND_TURN_ONLY,
    alternatives: {
      [DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS]: separateOnly.alternatives[0],
    },
  }), /unavailable/);
});

test("operator pricing shows the exact saving of one plate and one preparation", () => {
  const pricing = createPricingProfile({
    currency: "BYN",
    grammageGsm: 130,
    paperPricePerKg: 4,
    colorPlatePrice: 15,
    layoutFormPreparationPrice: 5,
  });
  const comparison = createWorkAndTurnControlComparison({ pricing });
  const separate = comparison.alternativesByStrategy[DUPLEX_STRATEGIES.SEPARATE_FRONT_BACK_FORMS];
  const workAndTurn = comparison.alternativesByStrategy[DUPLEX_STRATEGIES.WORK_AND_TURN];

  assert.equal(separate.paperCost, workAndTurn.paperCost);
  assert.equal(comparison.savings.physicalSheets, 0);
  assert.equal(comparison.savings.pressPasses, 0);
  assert.equal(comparison.savings.layoutForms, 1);
  assert.equal(comparison.savings.colorPlates, 1);
  assert.equal(comparison.savings.paperCost, 0);
  assert.equal(comparison.savings.colorPlateCost, 15);
  assert.equal(comparison.savings.layoutFormPreparationCost, 5);
  assert.equal(comparison.savings.estimatedTotalCost, 20);
});

test("work-and-turn rejects an asymmetric odd-column grid", () => {
  assert.throws(() => createWorkAndTurnPlateLayout({
    ...plateInput(),
    columns: 3,
  }), /even column count/);
});
