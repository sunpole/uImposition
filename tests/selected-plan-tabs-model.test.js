import assert from "node:assert/strict";
import test from "node:test";

import {
  SELECTED_PLAN_TAB_IDS,
  createSelectedPlanTabState,
  nextSelectedPlanTabId,
  normalizeSelectedPlanTabId,
} from "../src/selected-plan-tabs-model.js";

test("selected plan uses four focused workspaces", () => {
  assert.deepEqual(SELECTED_PLAN_TAB_IDS, ["overview", "schemes", "report", "files"]);
});

test("unknown tabs fall back to overview", () => {
  assert.equal(normalizeSelectedPlanTabId("missing"), "overview");
  assert.equal(normalizeSelectedPlanTabId(" report "), "report");
});

test("arrow keys wrap across selected-plan tabs", () => {
  assert.equal(nextSelectedPlanTabId("overview", "ArrowLeft"), "files");
  assert.equal(nextSelectedPlanTabId("files", "ArrowRight"), "overview");
  assert.equal(nextSelectedPlanTabId("schemes", "ArrowDown"), "report");
  assert.equal(nextSelectedPlanTabId("report", "ArrowUp"), "schemes");
});

test("home/end and state IDs support accessible tab wiring", () => {
  assert.equal(nextSelectedPlanTabId("report", "Home"), "overview");
  assert.equal(nextSelectedPlanTabId("overview", "End"), "files");

  const state = createSelectedPlanTabState("schemes");
  assert.equal(state.activeTabId, "schemes");
  assert.equal(state.tabs.filter(({ active }) => active).length, 1);
  assert.equal(state.tabs.find(({ active }) => active).panelId, "selectedPlanTabPanel-schemes");
});
