# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства, Codex-сессии или разработчика.  
> GitHub — единственный источник истины.

## Текущая точка

- репозиторий: `https://github.com/sunpole/uImposition`;
- актуальная ветка: `main`;
- текущий `main` после PR `#66`: `1180ff5de008662db63b07d6b973af4f772326ed`;
- опубликованный prerelease: **`0.7.0-alpha.5` / M7.5**;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch и immutable tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- `VERSION.json` намеренно остаётся на последнем опубликованном checkpoint;
- основная программа перестройки: **Issue #64 — operator-first product rebuild**;
- R1 product reset объединён через PR `#65`;
- R2 versioned application state и sheet/press presets объединены через PR `#66`;
- PR `#62` закрыт без merge и не является основой нового UI;
- текущий сайт остаётся временным техническим прототипом;
- новый обязательный продуктовый контракт: `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
- R2 foundation: `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
- полный каталог документации: `docs/README.md`;
- карта каталогов и модулей: `docs/PROJECT_CATALOG.md`.

## Важное решение от 31 июля 2026

Расчётное ядро, tests, lossless catalog, production reports и PDF сохраняются. Пользовательская оболочка строится заново как чистый state/render layer, а не как перестановка исторических панелей.

Главный целевой сценарий:

```text
выбрать или создать пресет листа/машины
→ добавить реальные виды продукции
→ получить живой согласованный перерасчёт
→ сравнить варианты по бумаге, формам и стоимости
→ выбрать монтаж
→ открыть схему
→ экспортировать PDF
```

## Что завершено в R2

В `main` уже находятся:

- `src/sheet-press-presets.js` — complete built-in/local sheet and press presets;
- `src/application-state.js` — immutable versioned project/input/runtime state;
- `src/application-state-persistence.js` — recovery interrupted calculation as `dirty`;
- `src/local-state-repository.js` — local project and preset repositories;
- versioned storage keys;
- legacy migrations;
- deterministic JSON import/export;
- favorite/recent local presets;
- stale calculation result guards;
- **207/207 Node tests**;
- **20/20 Chromium/PDF regression scenarios**.

R2 не подключён к старому DOM намеренно. Это фундамент нового интерфейса, а не ещё один patch старой страницы.

## Следующий обязательный этап

Перед визуальным R3 нужен отдельный pure model для реальной строки продукции.

Следующий кодовый PR должен определить и проверить:

- стабильный ID вида продукции;
- название/файл;
- готовую ширину и высоту;
- тираж;
- количество страниц;
- количество одинаковых видов/файлов;
- цветность лица и оборота;
- simplex/duplex;
- выпуск;
- общий/раздельный рез и gap;
- допустимую технологию оборота;
- enabled/disabled состояние;
- add/duplicate/update/remove/reorder operations;
- миграцию старого `file,quantity,pages` ввода;
- JSON-safe immutable rows;
- validation, пригодную для field-level ошибок будущего UI.

Этот этап не должен менять solver или создавать визуальную форму в том же PR.

После product-row model нужно подготовить и выбрать визуальное направление R3, затем построить чистый workspace на R2 state.

## Что обязательно прочитать

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
4. `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
5. Issue `#64` и последние PR;
6. `docs/CODEX_HANDOFF.md` — существующее расчётное ядро и release process;
7. `docs/README.md` и `docs/PROJECT_CATALOG.md`;
8. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
9. `docs/CURRENT_STATE.md`;
10. `docs/REMAINING_WORK.md`;
11. `docs/TECHNICAL_SPECIFICATION_RU.md`;
12. `docs/ARCHITECTURE.md`;
13. `docs/M7_6_COMPARISON_TABLE_MODEL.md`;
14. `docs/PRODUCTION_COSTING.md`;
15. `docs/TEST_PLAN.md`;
16. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
17. последние Actions, branches, tags, Releases и issues.

## Что уже работает и сохраняется

### Базовый расчёт

- произвольный лист;
- зачистка и непечатные поля как разные этапы;
- произвольный единый формат изделия;
- выпуск, общий/раздельный рез и зазор;
- fitting uniform grids `0°/90°`;
- page pairs;
- front/back materialization и validation;
- production report;
- PDF схем и отчёта;
- operator pricing и BYN-себестоимость.

### Пользовательский production pipeline

- две проверенные uniform plan-family на fitting orientation;
- lossless-каталог всех найденных допустимых планов;
- Pareto/recommended/dominated как метки, а не удаление;
- явный выбор любого плана;
- реальные схемы, production report и PDF выбранного плана;
- полный порядок из 11 целей;
- reranking без повторной генерации layouts/reports;
- pure M7.6 comparison-table model.

### Новый product foundation

- versioned application state;
- built-in/local sheet and press presets;
- localStorage repositories через dependency injection;
- migrations и deterministic serialization;
- input revisions и stale-result protection.

## Честная текущая граница solver

Пользовательский каталог полный только внутри:

```text
один общий формат изделия
× uniform grids
× 0°/90°
× paperMinimum/dedicatedPairForms
× separate front/back forms
× одна общая duplex-цветность
× полные front/back page pairs
```

Это ещё не общий solver сложных многовидовых монтажей.

Не реализованы полностью:

- разные форматы изделий в одном search;
- mixed rotations;
- bounded sequences частично заполненных форм;
- общий user-driven work-and-turn search;
- окончательная product-row model и её UI;
- односторонние и нечётные работы в общем pipeline;
- визуальный новый R3 workspace;
- heavy-search worker, progress и cancel;
- production beta matrix.

## Порядок R0–R5

### R0 — завершён

Старое UI-направление остановлено, PR `#62` закрыт без merge.

### R1 — завершён

Новый operator-first product contract объединён через PR `#65`.

### R2 — завершён

Versioned application state, sheet/press presets и local repositories объединены через PR `#66`.

### Product-row foundation — следующий

Отдельная pure schema реального вида продукции и collection operations.

### R3 — после выбора визуального направления

- clean workspace;
- preset switcher;
- product rows;
- live validation/calculation snapshot;
- старые технические панели не переносятся.

### R4

- paper/forms/cost comparison;
- operator selection;
- preview;
- существующие PDF.

### R5

Сложные multi-product/mixed-format solver families отдельными bounded PR.

## Главные правила

- недопечатка всегда запрещена;
- оборот не строится независимо от лица;
- рабочие цены вводит оператор;
- layout-формы и цветовые пластины не смешиваются;
- отсутствующая стоимость не равна нулю;
- допустимые варианты не скрываются;
- recommendation не заменяет selection;
- ограниченный search не выдаётся за глобально полный;
- новый UI не строится перестановкой старого DOM;
- одна ветка/PR — одна измеримая цель;
- каждый пользовательский патч получает exact-head checks и реальное Chromium evidence.

## Prompt для следующей Codex-сессии

```text
Открой https://github.com/sunpole/uImposition и работай только по фактическому GitHub-состоянию. Сначала прочитай AGENTS.md, START_HERE.md, docs/OPERATOR_FIRST_PRODUCT_REBUILD.md и docs/R2_APPLICATION_STATE_AND_PRESETS.md, затем Issue #64 и PR #65/#66. Не продолжай старый UX-0–UX-5 и не используй PR #62 как основу. Следующий этап — отдельная pure product-row schema и collection operations с unit-тестами, без визуального UI и без изменения production formulas. После неё подготовь визуальные направления R3.
```
