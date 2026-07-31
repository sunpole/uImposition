# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства, Codex-сессии или разработчика.  
> GitHub — единственный источник истины.

## Текущая точка

- репозиторий: `https://github.com/sunpole/uImposition`;
- актуальная ветка: `main`;
- текущий `main` после PR `#61`: `0eaf7f075ed28e74e629a206017a8073ae1f8498`;
- опубликованный prerelease: **`0.7.0-alpha.5` / M7.5**;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch и immutable tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- publication merge commit: `546f637a25b51f72706ebbe7346acb2df9819af8`;
- `VERSION.json` пока намеренно остаётся на опубликованном M7.5 checkpoint;
- расчётная M7.6 comparison model и UX-3 comparison workspace уже объединены, но ещё не выпущены отдельным release checkpoint;
- PR `#62` с дальнейшей перестановкой старых панелей **не объединять**;
- основная активная задача: **Issue #64 — operator-first product rebuild**;
- новый обязательный продуктовый контракт: `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
- полный каталог документации: `docs/README.md`;
- карта каталогов и модулей: `docs/PROJECT_CATALOG.md`.

## Важное решение от 31 июля 2026

Текущий пользовательский интерфейс признаётся временным техническим прототипом.

Работа UX-0–UX-5 показала, что перестановка исторических DOM-панелей и добавление CSS overrides не создают логичное производственное приложение. Расчётное ядро, tests, lossless catalog, production reports и PDF сохраняются. Пользовательская оболочка строится заново как чистый state/render layer.

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

Следующий кодовый патч после документационного R1 — **R2: pure application-state and sheet/press preset foundation**, без нового визуального UI в том же PR.

## Что обязательно прочитать

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
4. Issue `#64` и активный rebuild PR;
5. `docs/CODEX_HANDOFF.md` — существующее расчётное ядро и release process;
6. `docs/README.md` и `docs/PROJECT_CATALOG.md`;
7. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
8. `docs/CURRENT_STATE.md`;
9. `docs/REMAINING_WORK.md`;
10. `docs/TECHNICAL_SPECIFICATION_RU.md`;
11. `docs/ARCHITECTURE.md`;
12. `docs/M7_6_COMPARISON_TABLE_MODEL.md`;
13. `docs/PRODUCTION_COSTING.md`;
14. `docs/TEST_PLAN.md`;
15. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
16. `docs/VERSIONING.md`;
17. последние PR, Actions, branches, tags, Releases и issues.

## Что уже работает и сохраняется

### Базовый расчёт

- произвольный лист;
- зачистка и непечатные поля как разные этапы;
- произвольный единый формат изделия;
- выпуск, общий/раздельный рез и зазор;
- fitting uniform grids `0°/90°`;
- пользовательские строки заказов и page pairs;
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
- pure M7.6 comparison-table model;
- desktop/mobile comparison workspace из PR `#61` как reusable эксперимент, но не как обязательная основа нового UI.

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

- разные форматы изделий в одном заказе и на одном листе;
- mixed rotations;
- bounded sequences частично заполненных форм;
- общий user-driven work-and-turn search;
- полноценная строка продукции с индивидуальными параметрами;
- односторонние и нечётные работы;
- project persistence/import/export;
- heavy-search worker, progress и cancel;
- production beta matrix.

## Новый порядок R0–R5

### R0 — завершено решением

- старое UI-направление остановлено;
- PR `#62` не объединяется;
- опубликованный release и расчётное ядро не переписываются.

### R1 — текущий документационный PR

- новый продуктовый контракт;
- синхронизация точек входа;
- Issue `#64`.

### R2 — следующий кодовый PR

- versioned application state;
- sheet/press preset model;
- built-in и local presets;
- localStorage repository и migrations;
- deterministic serialization;
- unit tests;
- без смешивания с визуальным redesign.

### R3 — новый чистый workspace

- новое визуальное направление должно быть выбрано до реализации;
- preset switcher;
- строки продукции;
- live validation и calculation snapshot;
- старые технические панели не переносятся в основной workflow.

### R4 — варианты и схема

- paper/forms/cost comparison;
- operator selection;
- preview;
- существующие PDF.

### R5 — сложные многовидовые раскладки

Отдельные bounded solver PR с честными limits, progress/cancel и validation.

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
Открой https://github.com/sunpole/uImposition и работай только по фактическому GitHub-состоянию. Сначала прочитай AGENTS.md, START_HERE.md и docs/OPERATOR_FIRST_PRODUCT_REBUILD.md, затем Issue #64. Не продолжай старый UX-0–UX-5 и не объединяй PR #62. Следующий кодовый этап — R2: pure versioned application-state и sheet/press preset foundation с unit-тестами, без нового UI и без изменения production formulas.
```
