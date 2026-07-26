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
- фундамент M7.3 объединён в `main` через PR `#20`;
- release-recovery исправлен через PR `#21` и `#22`; одноразовый recovery PR `#23` закрыт без merge;
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
7. `docs/PRODUCTION_COSTING.md`;
8. `docs/TECHNICAL_SPECIFICATION_RU.md`;
9. `docs/ARCHITECTURE.md`;
10. `docs/TEST_PLAN.md`;
11. `docs/DEVELOPMENT_HISTORY_POLICY.md`;
12. `data/control-case.json`;
13. `data/production-regression-cases.json`;
14. `data/m7-decision-cases.json`;
15. последние PR, Actions, branches, tags и Releases.

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

PR `#20` добавил чистую основу без нового release номера:

- удаление полных дублей по метрикам;
- сравнение по отдельной цели;
- определение доминирования;
- построение Pareto-frontier;
- детерминированную сортировку frontier;
- обязательные крайние варианты по бумаге, стоимости, формам, пластинам, перетиражу и прогонам;
- явное число скрытых frontier-вариантов при display limit;
- структурированные дельты метрик;
- unit-тесты и source checks.

Это ещё не завершённый `0.7.0-alpha.3`: пока нет итогового компактного набора альтернатив из реальных решений, человеческих объяснений компромиссов, денежного breakdown сравнения, UI/evidence/news и release checkpoint.

## Следующая безопасная задача — продолжение M7.3

1. Работать от актуального `main` после PR `#22`.
2. Не менять опубликованные tags `v0.7.0-alpha.1` и `v0.7.0-alpha.2`.
3. Собрать одну чистую модель отображаемого набора альтернатив поверх Pareto-frontier.
4. Гарантировать присутствие обязательных крайних вариантов даже при ограничении списка.
5. Добавить структурированное объяснение: преимущество, цена компромисса и точные дельты.
6. Отдельно показать денежные дельты бумаги, форм и общей стоимости, только когда pricing ready.
7. Покрыть дубли, доминирование, ties, усечение и неполные цены тестами.
8. Только после функциональной проверки подключать компактную демонстрацию/UI и готовить `0.7.0-alpha.3`.

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

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/REMAINING_WORK.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/PRODUCTION_COSTING.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/TEST_PLAN.md, docs/DEVELOPMENT_HISTORY_POLICY.md, data/control-case.json, data/production-regression-cases.json и data/m7-decision-cases.json. Проверь последние PR, Actions, branches, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.

Подтверди, что опубликованный checkpoint 0.7.0-alpha.2 существует как recovery-ветка, immutable tag и GitHub prerelease. Затем продолжай M7.3 с последнего объединённого PR: Pareto foundation уже находится в main, следующая задача — компактный materially-different alternatives set и структурированное объяснение компромиссов. Не начинай work-and-turn из M7.4 раньше завершения M7.3.
```
