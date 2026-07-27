# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства, Codex-сессии или разработчика.  
> GitHub — единственный источник истины.

## Текущая точка

- репозиторий: `https://github.com/sunpole/uImposition`;
- актуальная ветка: `main`;
- функциональный baseline после PR `#46`: `009451cce94d5cde05ee72305f30447aa65a646c`;
- опубликованный prerelease: **`0.7.0-alpha.5` / M7.5**;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch и immutable tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- publication merge commit: `546f637a25b51f72706ebbe7346acb2df9819af8`;
- следующий функциональный milestone: **M7.6 / `0.7.0-alpha.6`**;
- основной документ передачи в Codex: `docs/CODEX_HANDOFF.md`;
- полный актуальный остаток: `docs/REMAINING_WORK.md`.

Последние объединённые функциональные PR:

- `#44` — пользовательские production plans из реальных полей;
- `#45` — явный выбор, схемы, production report и PDF выбранного плана;
- `#46` — полный desktop/mobile редактор порядка целей без повторной генерации.
- `#49` — version checkpoint `0.7.0-alpha.5`;
- `#50` — patchnote, focused image, permanent evidence, hashes и GitHub prerelease.

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

## Release alpha.5 завершён

- exact-head Quality: `173/173`;
- полный Chromium/PDF: `16/16`, PDF `8 + 6` A4 страниц;
- focused source commit: `a8db529c29e7b71a7809bb5f857d48cfde115597`;
- Release card и оба приложенных asset независимо проверены;
- release PNG SHA-256: `bb5686efa1d0f75990885b6f5e8736c1c4c93233eae181c3ae68f81397cf5a6e`;
- evidence ZIP SHA-256: `9ac0cfb4c01c34e530b4f734e499e6184cf2d6ab78f2157ea1216e6ee5742ec9`;
- patchnote имеет `queued_at`; фактическая Telegram-публикация остаётся ответственностью внешнего FIFO `sunpole/uNews`.

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
Открой https://github.com/sunpole/uImposition и работай только по фактическому GitHub-состоянию. Сначала прочитай AGENTS.md, START_HERE.md и docs/CODEX_HANDOFF.md. Проверь опубликованный prerelease 0.7.0-alpha.5 и актуальный main. Следующий этап — M7.6: начинай с pure comparison-table model и tests, не с большого нового solver.
```
