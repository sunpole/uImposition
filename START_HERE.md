# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> First entry point for a new conversation, device, or developer.

## Текущее состояние

- репозиторий: `sunpole/uImposition`;
- GitHub — единственный источник истины;
- последний зафиксированный кодовый checkpoint: **`0.7.0-alpha.3` / M7.3**;
- функциональный commit M7.3: `d7767aa6ec3b875864ea7d8ef8110b4c3ca8686e`;
- recovery-ветка: `release/v0.7.0-alpha.3`;
- immutable tag: `v0.7.0-alpha.3`;
- release package, news/uNews/Telegram payload и постоянный evidence archive M7.3 объединены в `main` через PR `#36`;
- текущая активная разработка: **M7.4 — свой оборот / work-and-turn**;
- рабочая ветка: `m7.4/work-and-turn`;
- активный functional PR: `#39`;
- следующий release checkpoint после зелёного functional PR: **`0.7.0-alpha.4`**;
- полный остаток до `1.0.0`: `docs/REMAINING_WORK.md`.

Фактическое состояние PR, Actions, branches, tags и GitHub Releases всегда проверять непосредственно в GitHub. Наличие release manifest, ветки и tag не заменяет независимую проверку самой Release card и приложенных assets.

## Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/REMAINING_WORK.md`;
6. `docs/M7_IMPLEMENTATION_PLAN.md`;
7. `docs/M7_4_WORK_AND_TURN.md`;
8. `docs/M7_3_DISPLAY_ALTERNATIVES.md`;
9. `docs/M7_3_PRODUCTION_ALTERNATIVES.md`;
10. `docs/M7_3_ALTERNATIVE_EXPLANATIONS.md`;
11. `docs/M7_3_RUNTIME_ALTERNATIVES_UI.md`;
12. `docs/PRODUCTION_COSTING.md`;
13. `docs/TECHNICAL_SPECIFICATION_RU.md`;
14. `docs/ARCHITECTURE.md`;
15. `docs/TEST_PLAN.md`;
16. `docs/DEVELOPMENT_HISTORY_POLICY.md`;
17. `data/control-case.json`;
18. `data/production-regression-cases.json`;
19. `data/m7-decision-cases.json`;
20. последние PR, Actions, branches, tags и Releases.

## Что завершено до M7

M1–M6 сохраняют:

- проверенную геометрию листа и изделия;
- точные пары страниц, лицо и зеркальный оборот;
- production report и отдельные PDF схемы/отчёта;
- полный набор `8960` ограниченных кандидатов;
- доказанный минимум физической бумаги `3305` листов;
- нулевую недопечатку;
- отдельные layout-формы и цветовые пластины;
- производственные regression-кейсы и постоянные evidence-архивы.

## Что завершено в M7.1–M7.2

M7.1:

- `11` изменяемых целей и отдельные жёсткие ограничения;
- immutable decision profile;
- лексикографическое ранжирование и объяснение первой решающей цели;
- прозрачный расчёт бумаги, форм и стоимости;
- отдельный regression fixture `Бумага / Стоимость / Формы`.

M7.2:

- единая guarded-модель `SolutionMetrics`;
- рабочие поля плотности, `BYN/кг`, цены цветовой формы и подготовки layout-форм;
- состояния `pricing incomplete`, `pricing inputs ready`, `pricing ready`;
- защита от `null → 0`, недопечатки и несовпадения базы стоимости;
- контрольный итог `972,55 BYN` только после ввода оператором evidence-прайса.

Рабочие цены не имеют выдуманных значений по умолчанию.

## Что опубликовано в M7.3

M7.3 добавил полный цикл реальных альтернатив:

- PR `#20` — Pareto foundation;
- PR `#25` — compact display alternatives;
- PR `#26` — real production alternatives;
- PR `#27` — RU/EN explanations и component cost deltas;
- PR `#28` — runtime state/event и compact read-only UI;
- PR `#30` — документационный sync;
- PR `#33` — version checkpoint `0.7.0-alpha.3`;
- PR `#36` — release evidence, news/uNews/Telegram и release manifest.

Проверенные реальные варианты:

| Вариант | Листы | Layout-формы | Цветовые пластины | Evidence cost |
|---|---:|---:|---:|---:|
| compact manual | 3395 | 8 | 32 | 972.5466 BYN |
| paper minimum | 3305 | 112 | 448 | 7199.4894 BYN |

Paper-first выбирает минимум бумаги. Cost-first выбирает compact manual. Переключение приоритета и reference не регенерирует схемы. Денежные сравнения полностью скрываются при неполном или несовместимом прайсе.

## Что реализуется в M7.4 / PR #39

Цель: отдельная проверяемая стратегия `workAndTurn`.

Уже зафиксировано в рабочей ветке:

- стратегии `separateFrontBackForms` и `workAndTurn`;
- режимы `separateOnly`, `compareBoth`, `workAndTurnOnly`;
- чистая симметричная модель одной общей формы;
- только явно поддержанный горизонтальный переворот;
- обязательная проверка зеркальных front/back пар;
- materialization через существующий duplex validator;
- mode-aware production metrics и validation;
- очищенный runtime без raw reports/layouts/pagePairs;
- компактный RU/EN UI с фактическим preview общей формы;
- focused Chromium scenario;
- подробная документация `docs/M7_4_WORK_AND_TURN.md`.

Контрольный A6-кейс:

- 4 разных файла;
- 2 страницы, `1+1`, по `4000`;
- сетка `4 × 4`;
- оба режима: `1000` физических листов и `2000` прогонов;
- чужой оборот: `2` layout-формы и `2` пластины;
- свой оборот: `1` layout-форма и `1` пластина;
- недопечатка и перетираж: `0`;
- бумага одинакова;
- при evidence-прайсе `15 BYN` за пластину и `0 BYN` за подготовку экономия равна `15 BYN`.

## Граница M7.4

M7.4 доказывает ядро стратегии и фиксированный контрольный кейс. Он не заявляет:

- автоматический work-and-turn поиск для произвольных заказов;
- вертикальный переворот;
- автоматический выбор захвата/бокового упора;
- автоматическую проверку ограничений конкретной машины;
- экономию бумаги, если метрики её не подтверждают.

Математическая симметрия не заменяет технологическую проверку оператором.

## Следующая безопасная последовательность

1. Дождаться зелёных Quality и Chromium/PDF checks exact head PR `#39`.
2. Скачать и проверить focused Chromium artifact `m7-work-and-turn-control`.
3. Завершить review документации и runtime boundary.
4. Перевести PR `#39` из draft в ready и объединить после всех зелёных проверок.
5. Отдельным release checkpoint синхронизировать версию `0.7.0-alpha.4`.
6. Подготовить patchnote, uNews/Telegram payload, focused image и permanent evidence archive.
7. Создать recovery-ветку `release/v0.7.0-alpha.4` и immutable tag `v0.7.0-alpha.4` на точном functional commit.
8. Создать настоящий GitHub prerelease и приложить assets.
9. Независимо проверить Release card и каждый asset.
10. Только затем переходить к следующему milestone.

## Главные правила

- недопечатка всегда запрещена;
- минимум бумаги не равен минимуму денег или форм;
- стоимость — прозрачная отдельная цель;
- layout-формы и цветовые пластины не смешиваются;
- рабочие цены вводит оператор;
- программа показывает компромиссы и оставляет окончательный выбор оператору;
- mixed-format manual fixture не выдаётся за automatic packing;
- последовательные пары 32-страничного изделия не выдаются за фальцевальный спуск;
- полезная история и архивы сохраняются;
- каждый опубликованный патч получает PR, проверки, Chromium evidence, news/uNews/Telegram, evidence archive, recovery-ветку, immutable tag и настоящий GitHub prerelease/release.

## Prompt для нового чата

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/REMAINING_WORK.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/M7_4_WORK_AND_TURN.md, документы M7.3, docs/PRODUCTION_COSTING.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/TEST_PLAN.md, docs/DEVELOPMENT_HISTORY_POLICY.md и control/regression fixtures. Проверь последние PR, Actions, branches, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.

Подтверди checkpoint 0.7.0-alpha.3 по exact commit, recovery-ветке, immutable tag, release manifest, GitHub Release card и assets. Затем продолжай M7.4 через PR #39. Не называй functional PR опубликованным 0.7.0-alpha.4, пока не созданы и независимо не проверены news/uNews/Telegram, evidence archive, recovery branch, tag и настоящий GitHub prerelease.
```
