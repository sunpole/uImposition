# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Version checkpoint / Версия проекта: 0.7.0-alpha.5</strong></p>
<p align="center"><strong>M7.5 · пользовательские production plans, выбор, экспорт и приоритеты</strong></p>
<p align="center"><strong><a href="START_HERE.md">Начать здесь / Start here</a> · <a href="docs/README.md">Документация / Documentation</a> · <a href="docs/PROJECT_CATALOG.md">Каталог проекта / Project catalog</a></strong></p>

## Назначение

uImposition — статический браузерный калькулятор и планировщик монтажей для листовой офсетной печати.

Программа должна:

- принимать реальные параметры листа, изделия и заказов;
- показывать, что технологически возможно в заданных условиях;
- сохранять все допустимые варианты внутри явно описанного search scope;
- не скрывать дорогие, доминируемые или убыточные решения;
- считать бумагу, формы, цветовые пластины, прогоны, перетираж и себестоимость;
- позволять оператору менять цели и выбирать решение самостоятельно;
- выдавать реальные схемы, production report и PDF выбранного плана;
- никогда не принимать недопечатку.

## Текущая точка разработки

- GitHub: `https://github.com/sunpole/uImposition`;
- GitHub Pages: `https://sunpole.github.io/uImposition/`;
- функциональный baseline M7.5: merge commit PR `#46` `009451cce94d5cde05ee72305f30447aa65a646c`;
- опубликованный prerelease: `0.7.0-alpha.5` / M7.5;
- release commit, recovery branch и immutable tag: `195d6496a291095a69cc9089a64154561ffbb1fa`, `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- publication merge commit: `546f637a25b51f72706ebbe7346acb2df9819af8`;
- функциональность объединена через PR `#44`, `#45`, `#46`;
- version/publication объединены через PR `#49`, `#50`;
- следующий milestone: M7.6 / `0.7.0-alpha.6`;
- полный handoff: [`docs/CODEX_HANDOFF.md`](docs/CODEX_HANDOFF.md).

## Что работает

### M1–M6

- произвольные форматы листов;
- зачистка и непечатные поля как отдельные этапы;
- A4/A5/A6 и произвольный единый формат изделия;
- выпуск, общий/раздельный рез и gap;
- fitting grids `0°/90°`;
- точные последовательные page pairs;
- validated front и derived mirrored back;
- physical sheets, layout forms, color plates и press passes;
- underproduction/overrun;
- production report;
- отдельные PDF schemes/report;
- bounded candidate generation;
- доказанный paper minimum `3305` листов для контрольного набора;
- production regression fixtures.

### M7.1–M7.3

- 11 optimization objectives;
- immutable hard constraints;
- lexicographic ranking;
- operator pricing и guarded cost;
- `SolutionMetrics`;
- strict Pareto frontier;
- materially different alternatives;
- RU/EN explanations и component deltas;
- sanitized alternatives runtime/UI.

### M7.4 — опубликовано

- separate front/back forms;
- work-and-turn control model;
- horizontal axis;
- symmetric shared form;
- mirrored front/back validation;
- independent production report;
- strategy modes;
- forms/plates comparison;
- focused Chromium evidence.

### M7.5 / `0.7.0-alpha.5` — опубликовано

#### Пользовательские production plans

- пользовательские orders/page pairs подключены к production pipeline;
- fitting orientations `0°/90°`;
- plan-family `paperMinimum` и `dedicatedPairForms`;
- front/back materialization и validation каждого плана;
- independent production report;
- dynamic BYN cost;
- lossless catalog;
- `All / Pareto / Recommended / Dominated` как view filters.

#### Выбор и экспорт

- явный выбор любого плана;
- recommendation не заменяет selection;
- реальные schemes выбранного плана;
- dynamic file/pair production report;
- PDF schemes;
- PDF report;
- compact desktop/mobile details view.

#### Приоритеты оператора

- полный порядок 11 целей;
- presets `По умолчанию / Бумага / Стоимость / Формы / Прогоны / Перетираж`;
- стрелки для desktop/mobile;
- drag-and-drop на desktop;
- preference сохраняется при пересчёте;
- reranking использует те же plan-объекты;
- layouts/reports не генерируются заново;
- PR `#46`: `173/173` tests, Chromium/PDF success, visual desktop/mobile review.

## Честная граница текущего пользовательского solver

Каталог полный только внутри:

```text
один общий формат изделия
× uniform grid
× fitting rotation 0°/90°
× paperMinimum/dedicatedPairForms
× separate front/back forms
× одна общая duplex-цветность
× полные front/back page pairs
```

Это ещё не глобальный перебор всех технологически возможных монтажей.

Пока не реализованы полностью:

- общий user-driven automatic work-and-turn;
- vertical turn axis;
- automatic mixed-format packing;
- mixed rotations `0° + 90°` на одном листе;
- индивидуальные параметры каждой order row;
- односторонние/нечётные работы;
- тетрадный/фальцевальный спуск;
- profit/loss и margin;
- project persistence/import/export;
- heavy search worker, progress/cancel/time limits;
- финальная comparison table `Только различия`;
- полный beta/RC audit.

## Следующий порядок

1. Реализовать M7.6 отдельными небольшими патчами, начав с pure comparison-table model и tests.
2. Добавить компактную lossless comparison table без regeneration при сортировке/фильтрах.
3. После M7.6 расширять search space отдельными plan-family патчами.
4. Затем mixed-format, full order rows, persistence, profitability и heavy-search worker.

## Контрольные решения

### M7.3 — бумага против стоимости

| Вариант | Листы | Layout-формы | Пластины | Evidence cost |
|---|---:|---:|---:|---:|
| Compact manual | 3395 | 8 | 32 | 972,55 BYN |
| Paper minimum | 3305 | 112 | 448 | 7199,49 BYN |

При evidence-профиле `620×450 мм`, `130 г/м²`, `4 BYN/кг` и `15 BYN` за цветовую пластину minimum paper экономит `90` листов, но дороже на `6226,94 BYN`. Это не рабочий default.

### M7.4 — separate против work-and-turn

Четыре разных A6, 2 страницы, `1+1`, по `4000`:

| Метрика | Separate | Work-and-turn |
|---|---:|---:|
| Листы | 1000 | 1000 |
| Прогоны | 2000 | 2000 |
| Layout-формы | 2 | 1 |
| Пластины | 2 | 1 |
| Недопечатка | 0 | 0 |
| Перетираж | 0 | 0 |

### M7.5 — paper-first против cost-first

Три двухстраничных A6 по `100`, цветность `4+1`:

- paper-focused: `20` листов;
- dedicated pairs: `21` лист, меньше forms/plates и `240,05 BYN` при evidence-прайсе;
- оба остаются доступными;
- recommendation меняется вместе с objective order;
- выбранный оператором plan не подменяется.

## Документация

- [Полный каталог документации](docs/README.md)
- [Карта каталогов и модулей проекта](docs/PROJECT_CATALOG.md)
- [Начать здесь](START_HERE.md)
- [Codex handoff](docs/CODEX_HANDOFF.md)
- [Текущее состояние](docs/CURRENT_STATE.md)
- [Остаток до 1.0](docs/REMAINING_WORK.md)
- [Архитектура](docs/ARCHITECTURE.md)
- [Полное ТЗ RU](docs/TECHNICAL_SPECIFICATION_RU.md)
- [Full specification EN](docs/TECHNICAL_SPECIFICATION_EN.md)
- [M7.4 work-and-turn](docs/M7_4_WORK_AND_TURN.md)
- [M7.5 user production plans](docs/M7_5_USER_UNIFORM_PRODUCTION_PLANS.md)
- [M7.5 selection/export](docs/M7_5_USER_PLAN_SELECTION_EXPORT.md)
- [M7.5 objective editor](docs/M7_5_OBJECTIVE_PRIORITY_EDITOR.md)
- [Production costing](docs/PRODUCTION_COSTING.md)
- [Configuration](docs/CONFIG_REFERENCE.md)
- [Test plan](docs/TEST_PLAN.md)
- [Screenshot/PDF automation](docs/SCREENSHOT_AUTOMATION.md)

## Development model

```text
feature branch
→ draft PR
→ exact-head tests
→ Chromium/PDF evidence
→ visual review
→ merge
→ version checkpoint
→ patchnote + uNews/Telegram
→ permanent evidence archive
→ recovery/v{version}
→ immutable tag
→ GitHub prerelease/release with verified assets
```

GitHub is the source of truth. A local terminal is optional and cannot be the only evidence.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
