# R2 — versioned application state and sheet/press presets

Статус: **активный pure-code foundation**.  
Основная программа: [`OPERATOR_FIRST_PRODUCT_REBUILD.md`](OPERATOR_FIRST_PRODUCT_REBUILD.md), Issue `#64`.

## 1. Цель

R2 создаёт данные и storage-контракт для нового operator-first интерфейса, не создавая сам интерфейс и не меняя production formulas.

После R2 новый UI сможет:

- показывать встроенные sheet/press presets;
- создавать локальные пользовательские presets;
- хранить избранные и недавно использованные presets;
- применять preset одним согласованным изменением application state;
- сохранять и восстанавливать versioned project state;
- не принимать запоздавший расчёт для уже изменившегося ввода.

## 2. Новые модули

### `src/sheet-press-presets.js`

Pure model полного пресета листа и машины.

Schema version 1:

```text
preset
├── schemaVersion
├── id                  builtin:* | local:*
├── kind                builtIn | local
├── name
├── sheet
│   ├── width
│   ├── height
│   ├── sizeStage       beforeTrim | afterTrim
│   └── trim
│       ├── enabled
│       ├── mode        uniform | sides
│       ├── uniformMm
│       └── sidesMm
├── press
│   └── marginsMm
└── metadata
    ├── favorite
    ├── createdAt
    ├── updatedAt
    └── lastUsedAt
```

Правила:

- built-in IDs используют namespace `builtin:`;
- local IDs используют namespace `local:`;
- local ID allocation детерминирован и добавляет numeric suffix при конфликте;
- post-trim preset не применяет повторную зачистку;
- dimensions, trim и margins проходят limits из `CONFIG`;
- legacy flattened preset автоматически мигрируется в schema v1;
- результат глубоко immutable.

### `src/application-state.js`

Pure versioned state нового product layer.

Schema version 1:

```text
applicationState
├── schemaVersion
├── project
│   ├── id
│   ├── name
│   ├── createdAt
│   └── updatedAt
├── input
│   ├── selectedSheetPressPresetId
│   ├── sheet
│   ├── press
│   ├── products[]
│   ├── pricing
│   └── objectivePreferences
└── runtime
    ├── inputRevision
    ├── calculation
    │   ├── status
    │   ├── activeRevision
    │   ├── lastCompletedRevision
    │   ├── lastValidRevision
    │   └── error
    ├── selectedPlanId
    └── activeScreen
```

Поддержанные transitions:

- default state;
- normalization/migration;
- deterministic serialization/deserialization;
- complete input replacement;
- atomic sheet/press preset application;
- begin/complete/fail calculation;
- plan selection;
- active screen change.

При изменении production input:

- `inputRevision` увеличивается;
- calculation становится `dirty`;
- активный request сбрасывается;
- stale selected plan сбрасывается;
- последний valid revision сохраняется.

При завершении расчёта результат принимается только если его revision совпадает одновременно с active revision и текущим input revision. Запоздавший результат не изменяет state.

`products[]` в R2 хранится как JSON-safe массив без окончательной product-row schema. Полная модель строки продукции является отдельным следующим pure patch или частью подготовленного R3 model этапа; R2 не фиксирует преждевременно поля сложного mixed-format заказа.

### `src/local-state-repository.js`

Storage adapters с dependency injection.

`createApplicationStateRepository`:

- `load`;
- `save`;
- `clear`;
- deterministic JSON export/import;
- version migration через application-state model.

`createSheetPressPresetRepository`:

- `list`;
- `get`;
- `save`;
- `remove`;
- `markUsed`;
- `setFavorite`;
- `clear`;
- deterministic collection export/import;
- migration legacy array → collection schema v1.

Repository принимает любой объект с `getItem/setItem/removeItem`, поэтому одинаково работает с browser `localStorage` и memory storage в Node tests.

Corrupted storage не удаляется молча: чтение завершается явной ошибкой, чтобы будущий UI мог предложить recovery/export.

## 3. Storage keys

В `CONFIG.storage` добавлены:

```text
applicationStateKey: uImposition.project.v1
sheetPressPresetsKey: uImposition.sheetPressPresets.v1
```

Старый `projectKey: uImposition.m2.project` сохраняется для будущей явной migration/recovery и не переиспользуется молча.

## 4. Что R2 не делает

- не меняет `index.html`;
- не меняет CSS;
- не подключает state к legacy `src/app.js`;
- не создаёт визуальный preset switcher;
- не создаёт product-row UI;
- не меняет geometry, solver, production metrics, costing или PDF;
- не сохраняет generated layouts/reports в localStorage;
- не выпускает новую версию.

Это намеренная граница: persistence/state и visual redesign не смешиваются.

## 5. Проверки

### Preset model

- complete built-in presets;
- unique namespaces;
- deterministic collision-safe IDs;
- uniform/sides trim normalization;
- no duplicate trim after `afterTrim`;
- legacy migration;
- invalid dimensions/namespaces rejected.

### Application state

- complete immutable default;
- deterministic round-trip JSON;
- legacy migration;
- atomic preset application;
- input revision invalidation;
- current-only calculation completion;
- stale result ignored;
- last valid revision preserved after errors;
- unsafe JSON values rejected.

### Repositories

- project save/load/import/export/clear;
- preset timestamps and stable IDs;
- favorites/recent ordering;
- built-ins cannot be persisted/deleted as local;
- deterministic id-sorted export;
- merge/replace import;
- no empty storage envelope;
- corrupted storage remains recoverable.

## 6. Следующий этап

После merge R2 нельзя сразу переносить старый DOM.

Следующая работа:

1. определить и утвердить полную pure product-row schema;
2. подготовить три визуальных направления нового workspace;
3. выбрать одно направление;
4. только затем реализовать R3 clean workspace поверх R2 state.

R3 должен использовать новые modules как единственный источник пользовательского состояния, а существующее расчётное ядро — как dependency.

---

## English summary

R2 adds a pure, versioned foundation for the operator-first rebuild: complete sheet/press preset objects, deterministic local preset IDs, immutable application state, input-revision calculation guards, and dependency-injected local storage repositories with explicit migrations and recovery-safe errors. It does not modify the current UI or production formulas. The next UI must consume this state rather than rearranging the legacy DOM.