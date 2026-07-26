# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> First entry point for a new conversation, device, or developer.

## Текущее состояние

- репозиторий: `sunpole/uImposition`;
- GitHub — единственный источник истины;
- функциональность M7.4 объединена через PR `#39`;
- functional merge commit: `20b17a8dd578be6777d50934f69c561b10363aca`;
- текущий version checkpoint: **`0.7.0-alpha.4` / M7.4**;
- release-prep ветка: `release-prep/v0.7.0-alpha.4`;
- следующий шаг: publication package с patchnote, uNews/Telegram, focused image, permanent evidence и release manifest;
- recovery-ветка `release/v0.7.0-alpha.4`, tag `v0.7.0-alpha.4` и GitHub prerelease считаются завершёнными только после их фактического создания и независимой проверки;
- следующая функциональная цель после полного checkpoint: **M7.5 / `0.7.0-alpha.5`**;
- полный остаток до `1.0.0`: `docs/REMAINING_WORK.md`.

## Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/REMAINING_WORK.md`;
6. `docs/M7_IMPLEMENTATION_PLAN.md`;
7. `docs/M7_4_WORK_AND_TURN.md`;
8. документы M7.3;
9. `docs/PRODUCTION_COSTING.md`;
10. `docs/ARCHITECTURE.md`;
11. `docs/TEST_PLAN.md`;
12. `docs/DEVELOPMENT_HISTORY_POLICY.md`;
13. control/regression fixtures;
14. последние PR, Actions, branches, tags и Releases.

## Что завершено до M7.4

- M1–M6: геометрия, пары страниц, лицо/оборот, production report, PDF, полный bounded search и доказанный минимум `3305` листов;
- M7.1: цели, порядок, ranking и прозрачная модель стоимости;
- M7.2: guarded `SolutionMetrics` и рабочий pricing pipeline;
- M7.3: реальные Pareto-варианты, RU/EN explanations, component deltas и compact runtime/UI.

## Что завершено в M7.4

- стратегии `separateFrontBackForms` и `workAndTurn`;
- режимы `separateOnly / compareBoth / workAndTurnOnly`;
- чистая симметричная модель одной общей формы;
- горизонтальный переворот как единственный поддержанный axis;
- обязательная проверка зеркальных front/back пар;
- materialization через существующий duplex validator;
- mode-aware production metrics и validation;
- sanitized runtime без raw reports/layouts/pagePairs;
- компактный RU/EN UI и preview общей формы;
- focused Chromium scenario;
- подробная документация `docs/M7_4_WORK_AND_TURN.md`;
- exact-head Quality: `146/146` тестов;
- полный Chromium/PDF regression: success;
- визуально проверенный focused screenshot.

## Проверенный A6-кейс

Четыре разных файла, 2 страницы, `1+1`, по `4000`:

| Метрика | Чужой оборот | Свой оборот |
|---|---:|---:|
| Физические листы | 1000 | 1000 |
| Прогоны | 2000 | 2000 |
| Layout-формы | 2 | 1 |
| Цветовые пластины | 2 | 1 |
| Недопечатка | 0 | 0 |
| Перетираж | 0 | 0 |

При evidence-прайсе `15 BYN` за пластину и нулевой подготовке свой оборот экономит ровно `15 BYN`. Бумага и прогоны одинаковы.

## Граница M7.4

M7.4 не заявляет общий automatic work-and-turn solver, вертикальный переворот или автоматическую совместимость с конкретной машиной. Оператор проверяет захват, боковой упор, приводку и допустимость переворота.

## Текущая безопасная последовательность

1. Завершить version checkpoint PR `0.7.0-alpha.4` и получить зелёные exact-head проверки.
2. Зафиксировать точный version merge commit как `releaseCommit`.
3. Подготовить patchnote и короткий Telegram/uNews-текст.
4. Сохранить focused PNG, manifest, capture log и quality log в permanent evidence ZIP.
5. Создать publication PR и проверить его workflows.
6. Создать recovery-ветку, immutable tag и настоящий GitHub prerelease с assets.
7. Независимо открыть Release card и проверить каждый asset.
8. Только затем переходить к M7.5.

## Главные правила

- недопечатка всегда запрещена;
- рабочие цены вводит оператор;
- минимум бумаги не равен минимуму денег или форм;
- layout-формы и цветовые пластины не смешиваются;
- пользователь видит компромиссы и выбирает решение;
- fixture не выдаётся за общий solver;
- каждый опубликованный патч получает PR, проверки, Chromium evidence, patchnote, uNews/Telegram, archive, recovery branch, immutable tag и GitHub prerelease/release.

## Prompt для нового чата

```text
Открой sunpole/uImposition через GitHub. Прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/REMAINING_WORK.md и docs/M7_4_WORK_AND_TURN.md. Проверь последние PR, Actions, branches, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.

Подтверди functional merge M7.4 через PR #39 и commit 20b17a8dd578be6777d50934f69c561b10363aca. Затем заверши release checkpoint 0.7.0-alpha.4: version PR, patchnote, uNews/Telegram, focused evidence, permanent archive, release manifest, recovery branch, immutable tag, GitHub prerelease и независимая проверка assets. Не начинай M7.5 раньше полного checkpoint.
```
