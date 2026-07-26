# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> First entry point for a new conversation, device, or developer.

## Текущее состояние

- репозиторий: `sunpole/uImposition`;
- опубликованный базовый checkpoint: `0.6.0-alpha`;
- текущий release-кандидат: **`0.7.0-alpha.1` / M7.1**;
- рабочая ветка: `m7.1/0.7.0-alpha.1`;
- implementation PR: `#12`;
- следующий патч после выпуска M7.1: `0.7.0-alpha.2` / M7.2;
- полный остаток до `1.0.0`: `docs/REMAINING_WORK.md`;
- GitHub остаётся единственным источником истины.

Фактическое состояние PR, Actions, rollback-ветки, tag и GitHub prerelease всегда проверять непосредственно в GitHub. Этот документ не утверждает переходные состояния `open/merged`, которые могли измениться после его записи.

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

## Что завершено к M6

- геометрия листа и изделия;
- точные пары страниц;
- проверенные лица и зеркальные обороты;
- production report;
- отдельные PDF схем и отчёта;
- полный набор `8960` ограниченных кандидатов;
- доказанный минимум бумаги `3305` листов;
- нулевая недопечатка;
- отдельные layout-формы и цветовые пластины;
- производственные regression-кейсы;
- release news, Telegram-кадр и постоянные архивы.

## Что добавляет M7.1

- 11 изменяемых целей;
- жёсткие ограничения вне пользовательской сортировки;
- immutable decision profile;
- лексикографическое ранжирование;
- мгновенная смена рекомендации при изменении порядка целей;
- вес бумаги по исходному закупаемому листу и плотности;
- стоимость бумаги по `BYN/кг`;
- стоимость цветовых форм за штуку;
- общая расчётная стоимость и себестоимость изделия;
- отдельная короткая demo-страница `Бумага / Стоимость / Формы`;
- план из 17 release-патчей до `1.0.0`.

Рабочие цены не имеют выдуманных значений по умолчанию. Числа `130 г/м²`, `4 BYN/кг`, `15 BYN/форма` используются только как иллюстративный regression fixture.

## Следующая точка продолжения — M7.2

После фактического выпуска `0.7.0-alpha.1`:

1. проверить `release/v0.7.0-alpha.1`;
2. проверить immutable tag `v0.7.0-alpha.1`;
3. проверить настоящий GitHub prerelease;
4. проверить news/uNews/Telegram queue;
5. создать `m7.2/0.7.0-alpha.2` от окончательного `main`;
6. построить единую нормализованную модель метрик решения;
7. подключить реальные production report и явный статус `pricing ready / incomplete`;
8. не начинать Pareto или свой оборот до проверки M7.2.

## Главные правила

- недопечатка всегда запрещена;
- минимум бумаги не равен минимуму денег или форм;
- стоимость — прозрачная отдельная цель;
- layout-формы и цветовые пластины не смешиваются;
- рабочие цены вводит оператор;
- mixed-format manual fixture не выдаётся за automatic packing;
- последовательные пары 32-страничного изделия не выдаются за фальцевальный спуск;
- полезная история и архивы сохраняются;
- каждый завершённый опубликованный патч получает recovery-ветку, immutable tag, настоящий Release/prerelease, news и evidence archive.

## Prompt для нового чата

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/REMAINING_WORK.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/PRODUCTION_COSTING.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/TEST_PLAN.md, docs/DEVELOPMENT_HISTORY_POLICY.md, data/control-case.json, data/production-regression-cases.json и data/m7-decision-cases.json. Проверь последние PR, Actions, branches, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.

Проверь фактический checkpoint 0.7.0-alpha.1. Если он полностью выпущен, продолжай M7.2: единые метрики решения и pricing readiness. Не перескакивай сразу к Pareto или своему обороту.
```
