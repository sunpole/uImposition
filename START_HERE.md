# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства, Codex-сессии или разработчика.  
> GitHub — единственный источник истины.

## Текущая точка

- репозиторий: `https://github.com/sunpole/uImposition`;
- актуальная ветка: `main`;
- текущий `main` после PR `#69`: `bcc9d39416d4dc0ac4cb325c07f9663a4072494c`;
- опубликованный prerelease: **`0.7.0-alpha.5` / M7.5**;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch и immutable tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- `VERSION.json` намеренно остаётся на последнем опубликованном checkpoint;
- основная программа перестройки: **Issue #64 — operator-first product rebuild**;
- R1 product reset: PR `#65`;
- R2 versioned state и sheet/press presets: PR `#66`;
- product-row foundation: PR `#69`;
- PR `#62` закрыт без merge и не является основой нового UI;
- текущий сайт остаётся временным техническим прототипом;
- обязательный продуктовый контракт: `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
- state/preset foundation: `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
- product rows: `docs/PRODUCT_ROW_MODEL.md`;
- каталог документации: `docs/README.md`;
- карта модулей: `docs/PROJECT_CATALOG.md`.

## Главное решение

Расчётное ядро, tests, lossless catalog, production reports и PDF сохраняются. Пользовательская оболочка строится заново как чистый state/render layer, а не как перестановка исторических панелей.

Целевой сценарий:

```text
выбрать или создать пресет листа/машины
→ добавить реальные виды продукции
→ получить живой согласованный перерасчёт
→ сравнить варианты по бумаге, формам и стоимости
→ выбрать монтаж
→ открыть схему
→ экспортировать PDF
```

## Что уже завершено

### R1 — новый продуктовый контракт

- старое app-shell направление остановлено;
- текущий UI признан техническим прототипом;
- PR `#62` закрыт без merge;
- новый workflow закреплён в Issue `#64` и документации.

### R2 — application state и sheet/press presets

В `main` находятся:

- `src/sheet-press-presets.js`;
- `src/application-state.js`;
- `src/application-state-persistence.js`;
- `src/local-state-repository.js`;
- versioned storage keys;
- local presets, favorite/recent ordering, migrations;
- input revisions и stale-result protection;
- interrupted calculation recovery.

Проверка R2:

- `207/207` Node tests;
- `20/20` Chromium/PDF scenarios.

### Product-row foundation

В `main` находятся:

- `src/product-row.js`;
- `src/product-row-collection.js`;
- `src/application-product-rows.js`;
- реальные finished size, тираж, variant count, pages, color, simplex/duplex, bleed, cut/gap, rotation и duplex preference;
- immutable add/duplicate/update/enable/remove/reorder operations;
- field-level issues;
- disabled non-blocking drafts;
- legacy `file | quantity | pages` migration;
- current uniform-pipeline compatibility validator;
- adapter к R2 application state.

Exact-head PR `#69`:

- `236/236` Node tests;
- `20/20` Chromium/PDF scenarios;
- no HTML/CSS/solver/PDF changes;
- merge commit `bcc9d39416d4dc0ac4cb325c07f9663a4072494c`.

## Следующий обязательный этап — R3 visual direction gate

Нельзя сразу писать новый HTML/CSS без выбранного направления.

Сначала подготовить минимум три действительно разных operator-first направления:

1. **Compact production desk** — пресеты сверху, строки продукции и живой итог в одном рабочем окне.
2. **Split workspace** — ввод слева, схема/метрики справа, варианты снизу.
3. **Table-first operator console** — максимально плотная таблица видов и результатов для опытного оператора.

Для каждого направления показать:

- desktop 1440/1024;
- mobile 390/360;
- preset switcher;
- 1 и 5 product rows;
- field error;
- calculating/ready state;
- result comparison;
- selected layout preview;
- primary action hierarchy;
- no milestone/roadmap/diagnostic panels.

После выбора одного направления — отдельный R3 implementation PR.

## Что обязательно прочитать

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
4. `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
5. `docs/PRODUCT_ROW_MODEL.md`;
6. Issue `#64`, PR `#65`, `#66`, `#69`;
7. `docs/CODEX_HANDOFF.md`;
8. `docs/README.md` и `docs/PROJECT_CATALOG.md`;
9. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
10. `docs/CURRENT_STATE.md`;
11. `docs/REMAINING_WORK.md`;
12. `docs/TECHNICAL_SPECIFICATION_RU.md`;
13. `docs/ARCHITECTURE.md`;
14. `docs/M7_6_COMPARISON_TABLE_MODEL.md`;
15. `docs/PRODUCTION_COSTING.md`;
16. последние Actions, branches, tags, Releases и issues.

## Честная граница solver

Текущий пользовательский каталог полный только внутри:

```text
один общий формат изделия
× uniform grids
× 0°/90° search
× paperMinimum/dedicatedPairForms
× separate front/back forms
× одна общая duplex-цветность
× полные front/back page pairs
```

Product rows уже могут хранить более широкий заказ, но compatibility validator честно блокирует то, что нынешний solver ещё не рассчитывает.

Не реализованы полностью:

- clean R3 workspace;
- automatic mixed-format packing;
- разные форматы/цветность в одном search;
- generalized simplex и odd-page pipeline;
- forced rotation execution;
- generalized user-driven work-and-turn;
- bounded sequences частично заполненных форм;
- heavy-search worker, progress и cancel;
- production beta matrix.

## Главные правила

- недопечатка запрещена;
- оборот не строится независимо от лица;
- рабочие цены вводит оператор;
- layout-формы и цветовые пластины не смешиваются;
- отсутствующая стоимость не равна нулю;
- допустимые варианты не скрываются;
- recommendation не заменяет selection;
- bounded search не выдаётся за globally complete;
- новый UI не строится перестановкой старого DOM;
- визуальное направление выбирается до production implementation;
- одна ветка/PR — одна измеримая цель.

## Prompt для следующей Codex-сессии

```text
Открой https://github.com/sunpole/uImposition и работай только по фактическому GitHub-состоянию. Сначала прочитай AGENTS.md, START_HERE.md, docs/OPERATOR_FIRST_PRODUCT_REBUILD.md, docs/R2_APPLICATION_STATE_AND_PRESETS.md и docs/PRODUCT_ROW_MODEL.md. R1, R2 и product-row foundation уже завершены через PR #65, #66 и #69. Не продолжай UX-0–UX-5 и не используй PR #62 как основу. Следующий этап — подготовить минимум три действительно разных визуальных направления clean R3 desktop/mobile workspace, выбрать одно и только после этого начинать HTML/CSS implementation.
```
