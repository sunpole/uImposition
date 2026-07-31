import test from "node:test";
import assert from "node:assert/strict";

import {
  createDefaultApplicationState,
  replaceApplicationInput,
} from "../src/application-state.js";
import {
  createApplicationStateRepository,
  createSheetPressPresetRepository,
} from "../src/local-state-repository.js";
import {
  createBuiltInSheetPressPresets,
  createLocalSheetPressPreset,
} from "../src/sheet-press-presets.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    dump() {
      return new Map(values);
    },
  };
}

function localPreset(name, width = 650, height = 313) {
  return createLocalSheetPressPreset({
    name,
    sheet: {
      width,
      height,
      sizeStage: "afterTrim",
      trim: { enabled: false, mode: "uniform", uniformMm: 2 },
    },
    press: {
      marginsMm: { left: 4, right: 4, top: 2, bottom: 13 },
    },
  });
}

test("application repository saves, loads, exports and clears a normalized snapshot", () => {
  const storage = createMemoryStorage();
  const repository = createApplicationStateRepository({ storage, key: "project" });
  const state = replaceApplicationInput(createDefaultApplicationState(), {
    ...createDefaultApplicationState().input,
    products: [{ id: "job-a", quantity: 2500 }],
  });

  const saved = repository.save(state);
  const exported = repository.exportJson();
  const loaded = repository.load();

  assert.deepEqual(saved, state);
  assert.deepEqual(loaded, state);
  assert.equal(typeof exported, "string");
  assert.equal(Object.isFrozen(loaded), true);

  repository.clear();
  assert.equal(repository.load(), null);
});

test("application repository import migrates legacy versionless input", () => {
  const storage = createMemoryStorage();
  const repository = createApplicationStateRepository({ storage, key: "project" });
  const imported = repository.importJson(JSON.stringify({
    sheetPresetId: "616x446",
    sheetWidth: 616,
    sheetHeight: 446,
    sizeStage: "afterTrim",
    pressMarginsMm: { left: 4, right: 4, top: 2, bottom: 13 },
  }));

  assert.equal(imported.schemaVersion, 1);
  assert.equal(imported.input.selectedSheetPressPresetId, "builtin:616x446");
  assert.equal(imported.input.sheet.trim.enabled, false);
  assert.deepEqual(repository.load(), imported);
});

test("local preset repository assigns timestamps and updates one stable id", () => {
  const storage = createMemoryStorage();
  const times = [
    "2026-07-31T04:00:00.000Z",
    "2026-07-31T05:00:00.000Z",
  ];
  const repository = createSheetPressPresetRepository({
    storage,
    key: "presets",
    now: () => times.shift(),
  });

  const created = repository.save(localPreset("Machine A"));
  const updated = repository.save({
    ...created,
    sheet: { ...created.sheet, width: 651 },
  });

  assert.equal(created.id, "local:machine-a");
  assert.equal(created.metadata.createdAt, "2026-07-31T04:00:00.000Z");
  assert.equal(updated.metadata.createdAt, created.metadata.createdAt);
  assert.equal(updated.metadata.updatedAt, "2026-07-31T05:00:00.000Z");
  assert.equal(repository.list().length, 1);
  assert.equal(repository.get(created.id).sheet.width, 651);
});

test("favorites and recent use determine operator-facing list order", () => {
  const storage = createMemoryStorage();
  const times = [
    "2026-07-31T01:00:00.000Z",
    "2026-07-31T02:00:00.000Z",
    "2026-07-31T03:00:00.000Z",
    "2026-07-31T04:00:00.000Z",
  ];
  const repository = createSheetPressPresetRepository({
    storage,
    key: "presets",
    now: () => times.shift(),
  });

  const alpha = repository.save(localPreset("Alpha", 650, 313));
  const beta = repository.save(localPreset("Beta", 616, 446));
  repository.markUsed(beta.id);
  repository.setFavorite(alpha.id, true);

  const ordered = repository.list();
  assert.equal(ordered[0].id, alpha.id);
  assert.equal(ordered[0].metadata.favorite, true);
  assert.equal(ordered[1].id, beta.id);
  assert.equal(ordered[1].metadata.lastUsedAt, "2026-07-31T03:00:00.000Z");
});

test("built-in presets cannot be persisted or removed as local data", () => {
  const repository = createSheetPressPresetRepository({
    storage: createMemoryStorage(),
    key: "presets",
    now: () => "2026-07-31T04:00:00.000Z",
  });
  const builtIn = createBuiltInSheetPressPresets()[0];

  assert.throws(() => repository.save(builtIn), /Built-in presets cannot be saved/);
  assert.throws(() => repository.remove(builtIn.id), /Built-in presets cannot be removed/);
});

test("legacy array import is migrated and deterministic export is id-sorted", () => {
  const repository = createSheetPressPresetRepository({
    storage: createMemoryStorage(),
    key: "presets",
    now: () => "2026-07-31T04:00:00.000Z",
  });

  repository.importJson(JSON.stringify([
    {
      id: "z-machine",
      label: "Z machine",
      width: 716,
      height: 516,
      sizeStage: "afterTrim",
      pressMarginsMm: { left: 4, right: 4, top: 2, bottom: 13 },
    },
    {
      id: "a-machine",
      label: "A machine",
      width: 616,
      height: 446,
      sizeStage: "afterTrim",
      pressMarginsMm: { left: 4, right: 4, top: 2, bottom: 13 },
    },
  ]));

  const exported = repository.exportJson();
  const parsed = JSON.parse(exported);
  assert.equal(parsed.schemaVersion, 1);
  assert.deepEqual(parsed.presets.map(({ id }) => id), ["local:a-machine", "local:z-machine"]);

  const secondRepository = createSheetPressPresetRepository({
    storage: createMemoryStorage(),
    key: "presets-copy",
    now: () => "2026-07-31T04:00:00.000Z",
  });
  secondRepository.importJson(exported, { replace: true });
  assert.equal(secondRepository.exportJson(), exported);
});

test("remove and clear do not leave empty storage envelopes", () => {
  const storage = createMemoryStorage();
  const repository = createSheetPressPresetRepository({
    storage,
    key: "presets",
    now: () => "2026-07-31T04:00:00.000Z",
  });
  const saved = repository.save(localPreset("Temporary"));

  assert.equal(repository.remove("local:missing"), false);
  assert.equal(repository.remove(saved.id), true);
  assert.equal(repository.list().length, 0);
  assert.equal(storage.getItem("presets"), null);

  repository.save(localPreset("Again"));
  repository.clear();
  assert.equal(storage.getItem("presets"), null);
});

test("corrupted persisted data fails explicitly instead of being silently erased", () => {
  const storage = createMemoryStorage();
  storage.setItem("presets", "{broken");
  const repository = createSheetPressPresetRepository({
    storage,
    key: "presets",
    now: () => "2026-07-31T04:00:00.000Z",
  });

  assert.throws(() => repository.list(), /Invalid local preset collection JSON/);
  assert.equal(storage.getItem("presets"), "{broken");
});
