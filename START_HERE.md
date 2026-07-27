# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства, Codex-сессии или разработчика.  
> GitHub — единственный источник истины.

## Текущая точка

- репозиторий: `https://github.com/sunpole/uImposition`;
- актуальная ветка: `main`;
- точный commit передачи после PR `#46`: `009451cce94d5cde05ee72305f30447aa65a646c`;
- опубликованный checkpoint: **`0.7.0-alpha.4` / M7.4**;
- `main` уже содержит объединённую, но ещё не опубликованную функциональность **M7.5**;
- следующий обязательный checkpoint: **`0.7.0-alpha.5` / M7.5**;
- основной документ передачи в Codex: `docs/CODEX_HANDOFF.md`;
- полный актуальный остаток: `docs/REMAINING_WORK.md`.

Последние объединённые функциональные PR:

- `#44` — пользовательские production plans из реальных полей;
- `#45` — явный выбор, схемы, production report и PDF выбранного плана;
- `#46` — полный desktop/mobile редактор порядка целей без повторной генерации.

PR `#46` прошёл `173/173` теста, полный Chromium/PDF workflow и визуальную проверку desktop/mobile evidence.

## Что обязательно прочитать

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `docs/CODEX_HANDOFF.md`;
4. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
5. `docs/CURRENT_STATE.md`;
6. `docs/REMAINING_WORK.md`;
7. `docs/TECHNICAL_SPECIFICATION_RU.md`;
8. `docs/ARCHITECTURE.md`;
9. `docs/M7_4_WORK_AND_TURN.md`;
10. `docs/M7_5_USER_UNIFORM_PRODUCTION_PLANS.md`;
11. `docs/M7_5_USER_PLAN_SELECTION_EXPORT.md`;
12. `docs/M7_5_OBJECTIVE_PRIORITY_EDITOR.md`;
13. `docs/PRODUCTION_COSTING.md`;
14. `docs/TEST_PLAN.md`;
15. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
16. `docs/VERSIONING.md`;
17. последние PR, Actions, branches, tags, Releases и issues.

## Что уже работает

### Базовый расчёт

- произвольный лист;
- зачистка и непечатные поля;
- произвольный единый формат изделия;
- выпуск, общий/раздельный рез и зазор;
- fitting uniform grids `0°/90°`;
- пользовательские строки заказов и page pairs;
- front/back materialization и validation;
- production report;
- PDF схем и отчёта;
- operator pricing и BYN-себестоимость.

### Пользовательский M7.5 pipeline

- две проверенные plan-family на каждую fitting orientation;
- lossless-каталог всех найденных допустимых планов;
- Pareto/recommended/dominated как метки, а не удаление;
- явный выбор любого плана;
- реальные схемы, production report и PDF выбранного плана;
- полный порядок из 11 целей;
- presets, стрелки и desktop drag-and-drop;
- reranking без повторной генерации layouts/reports;
- явный выбор оператора не заменяется новой рекомендацией.

## Честная текущая граница

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

Это ещё не общий solver всех технологически возможных монтажей.

Не реализованы полностью:

- общий user-driven work-and-turn search;
- mixed-format automatic packing;
- mixed rotations;
- индивидуальные параметры каждой строки заказа;
- односторонние и нечётные работы;
- тетрадный/фальцевальный спуск;
- прибыль/убыток и маржа;
- сохранение проекта;
- heavy-search worker, progress и cancel;
- полная production matrix до 1.0.

## Первый обязательный шаг новой Codex-сессии

1. Подтвердить `main` commit `009451cce94d5cde05ee72305f30447aa65a646c`.
2. Прочитать `docs/CODEX_HANDOFF.md`.
3. Проверить PR `#44`, `#45`, `#46` и связанные Actions.
4. Провести audit версии и документации.
5. Подготовить полный release checkpoint **`0.7.0-alpha.5`** для уже объединённого M7.5.
6. Не начинать M7.6 до recovery branch, immutable tag, GitHub prerelease, patchnote, uNews/Telegram и permanent evidence alpha.5.

## После alpha.5

Следующий функциональный патч — M7.6:

- компактная таблица всех вариантов;
- одна строка на вариант;
- `Только различия`;
- точные component deltas;
- сортировка и фильтры без удаления планов;
- duplex strategy/plan-family;
- раскрытие и экспорт выбранного варианта;
- desktop/mobile Chromium evidence.

## Главные правила

- недопечатка всегда запрещена;
- оборот не строится независимо от лица;
- рабочие цены вводит оператор;
- layout-формы и цветовые пластины не смешиваются;
- paper minimum не равен minimum cost/forms;
- допустимые варианты не скрываются;
- fixture не выдаётся за общий solver;
- ограниченный search не выдаётся за глобально полный;
- каждый опубликованный патч получает PR, exact-head checks, Chromium evidence, patchnote, uNews/Telegram, permanent archive, recovery branch, immutable tag и настоящий GitHub prerelease/release.

## Prompt для Codex Work

Актуальный готовый запрос находится в `docs/CODEX_HANDOFF.md`, разделы 10–12. Пользовательский вариант запроса также можно начинать так:

```text
Открой https://github.com/sunpole/uImposition и работай только по фактическому GitHub-состоянию. Сначала прочитай AGENTS.md, START_HERE.md и docs/CODEX_HANDOFF.md. Подтверди main commit 009451cce94d5cde05ee72305f30447aa65a646c, опубликованную 0.7.0-alpha.4 и объединённый, но ещё не выпущенный M7.5 через PR #44–#46. Сначала заверши полный release checkpoint 0.7.0-alpha.5, затем переходи к M7.6 небольшими проверяемыми PR.
```
