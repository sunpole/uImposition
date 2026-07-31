# AGENTS.md — правила работы над uImposition

## Начало любой новой сессии

Сначала прочитать:

1. `START_HERE.md`;
2. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
3. `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
4. Issue `#64`;
5. `docs/CODEX_HANDOFF.md`;
6. `docs/README.md` и `docs/PROJECT_CATALOG.md`;
7. фактические `main`, PR, Actions, tags, Releases и issues.

Не опираться на память предыдущего чата. GitHub — единственный источник истины.

## Источники истины

Порядок приоритета:

1. фактическое состояние GitHub;
2. `START_HERE.md`;
3. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
4. Issue `#64`;
5. активный milestone-документ;
6. `docs/CODEX_HANDOFF.md`;
7. `docs/CURRENT_STATE.md`;
8. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
9. `docs/REMAINING_WORK.md`;
10. `docs/TECHNICAL_SPECIFICATION_RU.md`;
11. `docs/ARCHITECTURE.md`;
12. `src/config.js`;
13. tests и fixtures;
14. process/release/news документы.

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
- domain modules получают plain data и не читают DOM;
- UI dispatch-ит actions и render-ит state, но не содержит production formulas;
- один расчёт создаёт один согласованный snapshot;
- stale async result не перезаписывает новый input;
- ошибка draft input не уничтожает последний valid result;
- interrupted calculation после reload становится `dirty`, а не остаётся active;
- local presets и projects используют schemaVersion и migrations;
- mobile — самостоятельный сценарий `Заказ → Варианты → Схема`;
- визуальный R3 начинается только после pure product-row model и выбора направления.

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
- **207/207 Node tests**;
- **20/20 Chromium/PDF regression scenarios**.

R2 намеренно не подключён к legacy DOM.

## Следующий обязательный этап — pure product-row model

До R3 создать отдельный PR без UI и без solver changes.

Модель должна формализовать реальный вид продукции:

- stable ID;
- name/file reference;
- finished width/height;
- quantity;
- pages;
- copies/variant count;
- front/back colors;
- simplex/duplex;
- bleed;
- common/separated cut;
- gap;
- duplex strategy allowance;
- enabled state;
- optional notes;
- validation issues suitable for field-level UI.

Collection operations:

- add;
- duplicate;
- update;
- enable/disable;
- remove;
- reorder;
- stable serialization;
- migration from legacy `file,quantity,pages` rows.

Правила этого PR:

- pure JavaScript;
- immutable results;
- no DOM;
- no CSS/HTML;
- no automatic mixed-format solver;
- no production formula change;
- unit tests for every transition and migration;
- application state integration may store normalized rows, but visual rendering остаётся следующим этапом.

## После product-row model

### Visual direction gate

Подготовить несколько действительно разных направлений нового desktop/mobile workspace и выбрать одно до production implementation.

### R3

- clean entrypoint и styles;
- preset switcher;
- product rows;
- live validation;
- current uniform calculation adapter;
- последний valid result;
- без старых технических панелей.

### R4

- comparison бумага/forms/plates/passes/cost;
- operator selection;
- layout preview;
- existing PDFs.

### R5

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

- R1, R2 и следующий internal pure model могут не менять version;
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
- pure domain/state modules;
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

Preserve the validated production core and the R2 versioned state/preset foundation. Do not continue the legacy app-shell direction. The next mandatory patch is a pure immutable product-row schema and collection model with legacy migration and field-level validation, without UI or solver changes. Only after that and a visual-direction review may R3 build the clean operator-first workspace.