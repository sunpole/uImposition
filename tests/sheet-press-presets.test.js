import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../src/config.js";
import {
  SHEET_PRESS_PRESET_KINDS,
  allocateLocalSheetPressPresetId,
  createBuiltInSheetPressPresets,
  createLocalSheetPressPreset,
  normalizeSheetPressPreset,
} from "../src/sheet-press-presets.js";

test("built-in presets expose complete sheet and press definitions", () => {
  const presets = createBuiltInSheetPressPresets();

  assert.equal(presets.length, CONFIG.sheetPresets.length);
  assert.equal(new Set(presets.map(({ id }) => id)).size, presets.length);
  assert.equal(presets.every(({ id }) => id.startsWith("builtin:")), true);
  assert.equal(presets.every(({ kind }) => kind === SHEET_PRESS_PRESET_KINDS.BUILT_IN), true);
  assert.equal(presets.every(({ sheet }) => sheet.sizeStage === "afterTrim"), true);
  assert.equal(presets.every(({ sheet }) => sheet.trim.enabled === false), true);
  assert.deepEqual(presets[0].press.marginsMm, CONFIG.defaults.pressMarginsMm);
  assert.equal(Object.isFrozen(presets), true);
  assert.equal(Object.isFrozen(presets[0].sheet.trim.sidesMm), true);
});

test("local preset ids are deterministic and collision-safe", () => {
  const existing = [
    { id: "local:heidelberg-650" },
    { id: "local:heidelberg-650-2" },
    { id: "local:preset" },
  ];

  assert.equal(
    allocateLocalSheetPressPresetId("Heidelberg 650", existing),
    "local:heidelberg-650-3",
  );
  assert.equal(
    allocateLocalSheetPressPresetId("Формат машины", existing),
    "local:preset-2",
  );
});

test("local preset normalizes uniform trim and preserves machine margins", () => {
  const preset = createLocalSheetPressPreset({
    name: "SM 74 source sheet",
    sheet: {
      width: 654,
      height: 317,
      sizeStage: "beforeTrim",
      trim: {
        enabled: true,
        mode: "uniform",
        uniformMm: 2,
        sidesMm: { left: 9, right: 8, top: 7, bottom: 6 },
      },
    },
    press: {
      marginsMm: { left: 4, right: 4, top: 2, bottom: 13 },
    },
  });

  assert.equal(preset.id, "local:sm-74-source-sheet");
  assert.equal(preset.kind, SHEET_PRESS_PRESET_KINDS.LOCAL);
  assert.equal(preset.sheet.trim.enabled, true);
  assert.deepEqual(preset.sheet.trim.sidesMm, { left: 2, right: 2, top: 2, bottom: 2 });
  assert.deepEqual(preset.press.marginsMm, { left: 4, right: 4, top: 2, bottom: 13 });
});

test("after-trim presets cannot apply a second trim reduction", () => {
  const preset = createLocalSheetPressPreset({
    name: "Working 650 × 313",
    sheet: {
      width: 650,
      height: 313,
      sizeStage: "afterTrim",
      trim: { enabled: true, mode: "uniform", uniformMm: 2 },
    },
    press: { marginsMm: CONFIG.defaults.pressMarginsMm },
  });

  assert.equal(preset.sheet.trim.enabled, false);
  assert.equal(preset.sheet.trim.uniformMm, 2);
});

test("legacy flattened preset migrates to schema version 1", () => {
  const migrated = normalizeSheetPressPreset({
    id: "legacy-machine",
    label: "Legacy machine",
    width: 720,
    height: 520,
    sizeStage: "beforeTrim",
    trimEnabled: true,
    trimUniform: false,
    trimSidesMm: { left: 1, right: 2, top: 3, bottom: 4 },
    pressMarginsMm: { left: 5, right: 6, top: 7, bottom: 8 },
  });

  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.id, "local:legacy-machine");
  assert.equal(migrated.sheet.trim.mode, "sides");
  assert.deepEqual(migrated.sheet.trim.sidesMm, { left: 1, right: 2, top: 3, bottom: 4 });
  assert.deepEqual(migrated.press.marginsMm, { left: 5, right: 6, top: 7, bottom: 8 });
});

test("preset validation rejects invalid dimensions and namespace mismatches", () => {
  assert.throws(
    () => createLocalSheetPressPreset({
      id: "builtin:not-local",
      name: "Wrong namespace",
      sheet: { width: 650, height: 313, sizeStage: "afterTrim", trim: {} },
      press: { marginsMm: CONFIG.defaults.pressMarginsMm },
    }),
    /local preset id must start with local:/,
  );

  assert.throws(
    () => createLocalSheetPressPreset({
      name: "Invalid size",
      sheet: { width: 0, height: 313, sizeStage: "afterTrim", trim: {} },
      press: { marginsMm: CONFIG.defaults.pressMarginsMm },
    }),
    /sheet.width/,
  );

  assert.throws(
    () => normalizeSheetPressPreset({ schemaVersion: 99 }),
    /Unsupported sheet\/press preset schemaVersion/,
  );
});
