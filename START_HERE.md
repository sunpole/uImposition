# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> First entry point for a new conversation, device, or developer.

## Текущее состояние

- репозиторий: `sunpole/uImposition`;
- последний полностью опубликованный checkpoint: **`0.7.0-alpha.2` / M7.2**;
- recovery-ветка: `release/v0.7.0-alpha.2`;
- immutable tag: `v0.7.0-alpha.2`;
- GitHub prerelease, news/uNews/Telegram и evidence archive для M7.2 проверены;
- активная разработка: **M7.3 — существенно разные альтернативы и Pareto**;
- Pareto foundation объединён через PR `#20`;
- compact display alternatives объединены через PR `#25`;
- real production alternatives объединены через PR `#26`;
- RU/EN explanations и component cost deltas объединены через PR `#27`;
- runtime state/event и compact read-only UI реализуются через PR `#28`;
- полный остаток до `1.0.0`: `docs/REMAINING_WORK.md`;
- GitHub остаётся единственным источником истины.

Фактическое состояние PR, Actions, branches, tags и Releases всегда проверять непосредственно в GitHub. Незавершённый код в `main` не является опубликованной версией, пока не выполнен полный release checkpoint.

## Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/REMAINING_WORK.md`;
6. `docs/M7_IMPLEMENTATION_PLAN.md`;
7. `docs/M7_3_DISPLAY_ALTERNATIVES.md`;
8. `docs/M7_3_PRODUCTION_ALTERNATIVES.md`;
9. `docs/M7_3_ALTERNATIVE_EXPLANATIONS.md`;
10. `docs/M7_3_RUNTIME_ALTERNATIVES_UI.md`;
11. `docs/PRODUCTION_COSTING.md`;
12. `docs/TECHNICAL_SPECIFICATION_RU.md`;
13. `docs/ARCHITECTURE.md`;
14. `docs/TEST_PLAN.md`;
15. `docs/DEVELOPMENT_HISTORY_POLICY.md`;
16. `data/control-case.json`;
17. `data/production-regression-cases.json`;
18. `data/m7-decision-cases.json`;
19. последние PR, Actions, branches, tags и Releases.

## Что завершено к M7.2

M6 сохраняет:

- проверенную геометрию листа и изделия;
- точные пары страниц, лицо и зеркальный оборот;
- production report и отдельные PDF схемы/отчёта;
- полный набор `8960` ограниченных кандидатов;
- доказанный минимум физической бумаги `3305` листов;
- нулевую недопечатку;
- отдельные layout-формы и цветовые пластины;
- производственные regression-кейсы и постоянные evidence-архивы.

M7.1 добавляет:

- `11` изменяемых целей и отдельные жёсткие ограничения;
- immutable decision profile;
- лексикографическое ранжирование и объяснение первой решающей цели;
- прозрачный расчёт веса бумаги, стоимости бумаги, форм, общей стоимости и стоимости изделия;
- отдельный regression fixture `Бумага / Стоимость / Формы`.

M7.2 добавляет:

- единую guarded-модель `SolutionMetrics`;
- рабочие поля плотности, `BYN/кг`, цены цветовой формы и необязательной подготовки layout-форм;
- явные состояния `pricing incomplete`, `pricing inputs ready`, `pricing ready`;
- подключение production report к реальному BYN-расчёту;
- защиту от `null → 0`, недопечатки и несовпадения базы стоимости;
- контрольный итог `972,55 BYN` только после ввода оператором проверенных цен.

Рабочие цены не имеют выдуманных значений по умолчанию. Числа demo-fixture используются только для тестов и объяснения поведения.

## Что уже сделано в M7.3

### PR #20 — Pareto foundation

- удаление полных дублей по метрикам;
- сравнение по отдельной цели;
- определение доминирования;
- построение Pareto-frontier;
- детерминированная сортировка frontier;
- обязательные крайние варианты по бумаге, стоимости, формам, пластинам, перетиражу и прогонам;
- явное число скрытых frontier-вариантов при display limit;
- структурированные дельты метрик.

### PR #25 — compact display alternatives

- рекомендация и уникальные extrema закрепляются в отображаемом наборе;
- слишком малый лимит расширяется прозрачно;
- одно решение с несколькими extreme-причинами не дублируется;
- дополнительные компромиссы выбираются детерминированным maximin-методом;
- причины включения, преимущества, компромиссы и точные дельты структурированы;
- `null`, `undefined`, строки и пустые значения запрещены как активные Pareto-метрики;
- при `pricing incomplete` денежная цель исключается, а нулевая стоимость не выдумывается.

### PR #26 — real production alternatives

- реальные ручные монтажи и доказанный paper minimum переводятся в общие `SolutionMetrics`;
- сырые candidate/layout структуры не попадают в decision/Pareto слой;
- из фактического состава монтажей выводятся разные заказы, split orders и fragmented blocks;
- проверяется общая валюта, лист, плотность и явные операторские ставки;
- стоимость исключается при неполной или несовместимой базе;
- реальный контрольный pipeline подтверждает два Pareto-варианта:
  - compact manual: `3395` листов, `8` layout-форм, `972.5466 BYN`;
  - paper minimum: `3305` листов, `112` layout-форм, `7199.4894 BYN`;
- paper-first рекомендует минимум бумаги, cost-first — compact manual без повторной генерации.

### PR #27 — explanations and component cost deltas

- причины показа варианта локализованы на RU/EN;
- для каждого варианта возвращаются преимущество, цена компромисса и решающая цель;
- рекомендуемый вариант сравнивается не сам с собой, а со следующим ранжированным конкурентом;
- reference-вариант можно менять без повторной генерации альтернатив;
- component deltas показывают бумагу, цветовые пластины, подготовку layout-форм и итог;
- денежные объяснения доступны только при совместимом `pricing ready`;
- при `incomplete` или `incompatible` денежные значения полностью скрываются;
- реальный paper-first breakdown показывает `−6226.9428 BYN` общей разницы compact manual против paper minimum.

### PR #28 — runtime state/event и компактный UI

- production data и paper minimum подготавливаются один раз и кэшируются;
- controller принимает production/pricing events и команды priority/reference;
- public event `uimposition:alternatives` не содержит raw layouts, candidates, planned runs или paper solution;
- read-only UI показывает два реальных Pareto-варианта;
- paper-first и cost-first меняют recommendation без повторной генерации монтажей;
- reference-вариант переключается отдельно;
- RU/EN explanations, exact metrics и component deltas отображаются на основной странице;
- при неполном прайсе cost-first и денежные компоненты недоступны, но бумажное сравнение продолжает работать;
- focused Chromium scenario проверяет реальный cost-first результат;
- отдельный документ: `docs/M7_3_RUNTIME_ALTERNATIVES_UI.md`.

Это ещё не опубликованный `0.7.0-alpha.3`: до release checkpoint остаются постоянный evidence archive, news/uNews/Telegram, синхронизация версии, recovery branch, immutable tag и GitHub prerelease.

## Следующая безопасная задача — завершение M7.3

1. Завершить проверки и объединить PR `#28`.
2. Не менять опубликованные tags `v0.7.0-alpha.1` и `v0.7.0-alpha.2`.
3. Скачать и проверить focused Chromium artifact PR `#28`.
4. Подготовить release news и uNews/Telegram payload для `0.7.0-alpha.3`.
5. Сохранить focused evidence в постоянный archive.
6. Синхронизировать `VERSION.json`, `VERSION.md`, package и видимую версию.
7. Создать `release/v0.7.0-alpha.3`, immutable tag `v0.7.0-alpha.3` и настоящий GitHub prerelease.
8. Не начинать work-and-turn из M7.4 раньше полного release checkpoint M7.3.

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
- каждый завершённый опубликованный патч получает PR, проверки, Chromium evidence, news/uNews/Telegram, evidence archive, recovery-ветку, immutable tag и настоящий GitHub prerelease/release.

## Prompt для нового чата

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/REMAINING_WORK.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/M7_3_DISPLAY_ALTERNATIVES.md, docs/M7_3_PRODUCTION_ALTERNATIVES.md, docs/M7_3_ALTERNATIVE_EXPLANATIONS.md, docs/M7_3_RUNTIME_ALTERNATIVES_UI.md, docs/PRODUCTION_COSTING.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/TEST_PLAN.md, docs/DEVELOPMENT_HISTORY_POLICY.md, data/control-case.json, data/production-regression-cases.json и data/m7-decision-cases.json. Проверь последние PR, Actions, branches, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.

Подтверди, что опубликованный checkpoint 0.7.0-alpha.2 существует как recovery-ветка, immutable tag и GitHub prerelease. Затем продолжай M7.3 с последнего объединённого PR: Pareto foundation, compact display set, real production alternatives и RU/EN explanations уже объединены; runtime/controller/read-only UI реализуются через PR #28. Следующая задача после его проверки — полный release checkpoint 0.7.0-alpha.3 с news/uNews/Telegram, evidence archive, recovery-веткой, tag и GitHub prerelease. Не начинай work-and-turn из M7.4 раньше завершения M7.3.
```
