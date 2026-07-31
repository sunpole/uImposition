# AGENTS.md — правила работы над uImposition

## Начало любой новой сессии

Сначала прочитать:

1. `START_HERE.md`;
2. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
3. `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
4. `docs/PRODUCT_ROW_MODEL.md`;
5. Issue `#64`;
6. `docs/CODEX_HANDOFF.md`;
7. `docs/README.md` и `docs/PROJECT_CATALOG.md`;
8. фактические `main`, PR, Actions, tags, Releases и issues.

Не опираться на память предыдущего чата. GitHub — единственный источник истины.

## Источники истины

Порядок приоритета:

1. фактическое состояние GitHub;
2. `START_HERE.md`;
3. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
4. Issue `#64`;
5. активный milestone-документ;
6. `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
7. `docs/PRODUCT_ROW_MODEL.md`;
8. `docs/CODEX_HANDOFF.md`;
9. `docs/CURRENT_STATE.md`;
10. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
11. `docs/REMAINING_WORK.md`;
12. `docs/TECHNICAL_SPECIFICATION_RU.md`;
13. `docs/ARCHITECTURE.md`;
14. `src/config.js`;
15. tests и fixtures;
16. process/release/news документы.

`docs/UI_UX_APPLICATION_REDESIGN.md` и PR `#62` — superseded-история. Они не задают новый UI.

При расхождении документации и кода расхождение фиксируется и исправляется, а не скрывается.

## GitHub-only разработка

- отдельная ветка на одну измеримую цель;
- draft PR;
- exact-head GitHub Actions;
- реальный Chromium для пользовательских изменений;
- merge только проверенного head;
- терминал может дополнять проверку, но не заменяет GitHub evidence;
- важный результат сохраняется как code, test, document, issue или artifact.

## Неприкосновенные производственные правила

- не менять формулы молча;
- не добавлять магические числа вне config;
- не строить оборот независимо от лица;
- недопечатка запрещена;
- feasible не равен proven minimum;
- bounded/truncated search не называется глобально полным;
- допустимые планы не удаляются из catalog data;
- filters/sort меняют view, а не планы;
- recommendation не заменяет operator selection;
- отсутствующая стоимость не превращается в ноль;
- layout forms и color plates не смешиваются;
- machine compatibility подтверждает оператор;
- новый расчётный модуль получает pure API и unit tests;
- русский пользовательский текст имеет профессиональную английскую версию.

## Operator-first product layer

- текущий сайт — технический прототип;
- не переставлять legacy DOM как основу новой оболочки;
- не лечить архитектуру очередным CSS override;
- milestone, roadmap, diagnostics и evidence не входят в основной workflow;
- новый UI использует versioned application state из R2;
- product input использует product-row/collection model из PR `#69`;
- domain modules получают plain data и не читают DOM;
- UI dispatch-ит actions и render-ит state, но не содержит production formulas;
- один расчёт создаёт один согласованный snapshot;
- stale async result не перезаписывает новый input;
- ошибка draft input не уничтожает последний valid result;
- disabled invalid product row сохраняется, но не блокирует активный заказ;
- interrupted calculation после reload становится `dirty`, а не остаётся active;
- local presets и projects используют schemaVersion и migrations;
- mobile — самостоятельный сценарий `Заказ → Варианты → Схема`;
- production implementation R3 начинается только после выбора визуального направления.

## Завершённые этапы rebuild

### R0

Старое UI-направление остановлено, PR `#62` закрыт без merge.

### R1

Operator-first contract объединён через PR `#65`.

### R2

PR `#66` добавил:

- `sheet-press-presets.js`;
- `application-state.js`;
- `application-state-persistence.js`;
- `local-state-repository.js`;
- versioned storage keys;
- migrations;
- `207/207` Node tests;
- `20/20` Chromium/PDF regression scenarios.

### Product-row foundation

PR `#69` добавил:

- `product-row.js`;
- `product-row-collection.js`;
- `application-product-rows.js`;
- реальную schema вида продукции;
- field-level validation;
- immutable collection operations;
- disabled non-blocking drafts;
- legacy migration;
- current uniform compatibility boundary;
- application-state revisions;
- `236/236` Node tests;
- `20/20` Chromium/PDF regression scenarios.

R2 и product-row foundation намеренно не подключены к legacy DOM.

## Следующий обязательный этап — R3 visual direction gate

До production HTML/CSS подготовить минимум три действительно разных направления:

1. `Compact production desk`;
2. `Split workspace`;
3. `Table-first operator console`.

Каждое направление должно показать:

- desktop 1440 и 1024;
- mobile 390 и 360;
- preset switcher;
- один и пять product rows;
- field-level error;
- calculating/ready states;
- comparison бумага/forms/plates/passes/cost;
- selected layout preview;
- primary/secondary action hierarchy;
- отсутствие milestone/roadmap/debug панелей.

Перед идеацией и redesign использовать Product Design context workflow. Решение должно быть зафиксировано в issue/document before production implementation.

Запрещено:

- начинать R3 с копирования `index.html`;
- переносить существующие панели как готовые компоненты;
- выбирать направление только по красоте без рабочего сценария;
- смешивать visual exploration, production implementation и новый solver в одном PR.

## R3 — после выбора направления

Отдельный implementation PR:

- новый clean entrypoint;
- отдельная чистая CSS-система;
- preset switcher;
- product rows;
- field-level validation;
- live calculation controller;
- last valid result;
- current uniform-pipeline adapter;
- самостоятельный mobile flow;
- desktop/mobile Chromium evidence.

## R4

- comparison бумага/forms/plates/passes/cost;
- operator selection;
- layout preview;
- existing PDFs.

## R5

Mixed-format/multi-product solver расширяется отдельными bounded plan-family с limits, progress/cancel и validation.

## Правила патча

- одна ветка/PR — одна цель;
- сначала pure model/tests, затем runtime/UI;
- не смешивать persistence, visual redesign, solver и release packaging;
- не ослаблять validation ради зелёного теста;
- draft PR остаётся draft до exact-head checks;
- пользовательский patch получает desktop/mobile Chromium evidence;
- merge выполнять только immutable проверенного head.

## Version и release

- internal pure foundation и visual exploration могут не менять version;
- version меняется только для законченного публикуемого checkpoint;
- при version change синхронизируются все version sources, visible version и screenshot assertions;
- каждый опубликованный patch получает recovery branch, immutable tag и GitHub Release/prerelease;
- release получает patchnote, реальный focused image, uNews payload и permanent evidence archive;
- нельзя утверждать Release без настоящей Release card и проверенных assets;
- опубликованный tag не перемещается.

## История и evidence

- полезные historical files, tests, workflows, screenshots и evidence не удалять без отдельной причины;
- старый UI можно сохранять как regression/reference;
- AI image не доказывает работу функции;
- screenshot не содержит secrets, cookies, private data или local paths;
- Telegram отправляется только через uNews.

## Предпочтительная технология

- HTML/CSS/JavaScript ES modules;
- без обязательного build step;
- pure domain/state/product modules;
- versioned plain-data state;
- deterministic actions/reducer-style updates;
- Node built-in tests;
- Playwright Chromium evidence;
- GitHub Pages;
- небольшие модули с одной ответственностью;
- Web Worker только для реально тяжёлого search.

## Формат отчёта агента

Сообщить:

1. исходную branch/version/commit;
2. измеримую цель;
3. изменённые файлы и решения;
4. фактические tests и Actions;
5. artifact IDs/digests;
6. screenshot evidence, если UI менялся;
7. сохранённые invariants и оставшиеся boundaries;
8. version/release status;
9. PR, exact head и merge commit.

---

## English summary

R1, R2 and the product-row foundation are complete. Preserve the validated production core and do not return to the legacy app-shell direction. The next mandatory gate is visual exploration of at least three genuinely different operator-first desktop/mobile workspaces. Select and document one direction before implementing R3. The production UI must consume the versioned application state and product-row collection, not rearrange the legacy DOM.