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
- real production alternatives реализуются через PR `#26`;
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
9. `docs/PRODUCTION_COSTING.md`;
10. `docs/TECHNICAL_SPECIFICATION_RU.md`;
11. `docs/ARCHITECTURE.md`;
12. `docs/TEST_PLAN.md`;
13. `docs/DEVELOPMENT_HISTORY_POLICY.md`;
14. `data/control-case.json`;
15. `data/production-regression-cases.json`;
16. `data/m7-decision-cases.json`;
17. последние PR, Actions, branches, tags и Releases.

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
- проверяется общая валюта, лист, плотность и эффективные ставки прайса;
- стоимость исключается при неполной или несовместимой базе;
- реальный контрольный pipeline подтверждает два Pareto-варианта:
  - compact manual: `3395` листов, `8` layout-форм, `972.5466 BYN`;
  - paper minimum: `3305` листов, `112` layout-форм, `7199.4894 BYN`;
- paper-first рекомендует минимум бумаги, cost-first — compact manual без повторной генерации.

Это ещё не завершённый `0.7.0-alpha.3`: пока нет RU/EN текстов компромиссов, component cost deltas, runtime/UI, focused evidence, news и release checkpoint.

## Следующая безопасная задача — продолжение M7.3

1. Работать от актуального `main` после объединения PR `#26`.
2. Не менять опубликованные tags `v0.7.0-alpha.1` и `v0.7.0-alpha.2`.
3. Добавить pure RU/EN explanation model: преимущество, цена компромисса и решающая цель.
4. Добавить совместимые component deltas: бумага, цветовые пластины, подготовка layout-форм и итог.
5. Денежные объяснения показывать только при общей валюте и полностью совместимом `pricing ready`.
6. Затем подключить alternative set к runtime state приложения и компактному UI.
7. Только после UI-проверки готовить focused Chromium evidence, news/uNews/Telegram, archive и release `0.7.0-alpha.3`.

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

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/REMAINING_WORK.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/M7_3_DISPLAY_ALTERNATIVES.md, docs/M7_3_PRODUCTION_ALTERNATIVES.md, docs/PRODUCTION_COSTING.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/TEST_PLAN.md, docs/DEVELOPMENT_HISTORY_POLICY.md, data/control-case.json, data/production-regression-cases.json и data/m7-decision-cases.json. Проверь последние PR, Actions, branches, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.

Подтверди, что опубликованный checkpoint 0.7.0-alpha.2 существует как recovery-ветка, immutable tag и GitHub prerelease. Затем продолжай M7.3 с последнего объединённого PR: Pareto foundation, compact display set и real production alternatives уже реализованы; следующая задача — pure RU/EN explanations и совместимые pricing-component deltas, затем runtime/UI. Не начинай work-and-turn из M7.4 раньше завершения M7.3.
```
