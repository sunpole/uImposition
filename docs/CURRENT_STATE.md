# Текущее состояние / Current State

Последнее обновление: **26 июля 2026**  
Last updated: **26 July 2026**

## Версия и release checkpoint

- последний полностью опубликованный checkpoint: **`0.7.0-alpha.2` / M7.2**;
- recovery-ветка `release/v0.7.0-alpha.2` указывает на commit `aafa7b3a7c2e83d00e9c54796593259e9ef147d8`;
- immutable tag `v0.7.0-alpha.2` указывает на тот же commit;
- GitHub prerelease, news/uNews/Telegram и evidence archive для M7.2 созданы и проверены;
- предыдущий tag `v0.7.0-alpha.1` восстановлен на точном commit `622248f9e38f811a02143b428e264176f848b0a4`;
- активная разработка: **M7.3 / будущий `0.7.0-alpha.3`**;
- Pareto foundation объединён в `main` через PR `#20`;
- release-процесс исправлен PR `#21` и `#22`;
- одноразовый recovery PR `#23` выполнил проверяемую публикацию и закрыт без merge;
- полный план до `1.0.0`: `docs/REMAINING_WORK.md`.

`VERSION.json`, `VERSION.md` и видимая версия сайта остаются `0.7.0-alpha.2`, пока M7.3 не пройдёт полный отдельный release checkpoint.

## Что работает после M6

- проверенная геометрия, пары страниц, лицо/оборот и production report;
- отдельные PDF схем и отчёта;
- полный набор `8960` ограниченных uniform-grid кандидатов;
- доказанный минимум физической бумаги `3305` листов;
- нулевая недопечатка;
- отдельные layout-формы и цветовые пластины;
- production regression fixtures;
- Chromium, `pdfinfo`, Poppler, release news и постоянные архивы.

## Что завершено в M7.1

1. `11` изменяемых целей оптимизации.
2. Жёсткие ограничения вне пользовательской сортировки.
3. Immutable decision profile.
4. Перемещение целей по позиции или вверх/вниз.
5. Лексикографическое сравнение и стабильное ранжирование.
6. Объяснение первой метрики, определившей победителя.
7. Полная проверка метрик до допуска варианта к сравнению.
8. Денежная цель `estimatedTotalCost`.
9. Площадь и вес исходного закупаемого листа.
10. Стоимость бумаги в `BYN/кг`.
11. Стоимость цветовых форм за штуку.
12. Необязательная стоимость подготовки layout-форм.
13. Итоговая расчётная стоимость и стоимость одного заказанного изделия.
14. Короткая demo-страница `Бумага / Стоимость / Формы`.
15. Отдельный release checkpoint `0.7.0-alpha.1`.

## Что завершено в M7.2

1. Единая guarded-модель `SolutionMetrics`.
2. Нормализованные бумага, монтажи, layout-формы, цветовые пластины и листопрогоны.
3. Перетираж готовых файлов и печатных пар.
4. Разделённые заказы, компактность и число разных заказов на монтаже.
5. Бумажная масса, стоимость бумаги, стоимость форм, итоговая стоимость и стоимость изделия.
6. Запрет допуска решения с недопечаткой.
7. Защита от превращения `null`-цены или `null`-compactness в числовой `0`.
8. Проверка совпадения базы imported production cost с physical sheets, color plates и layout forms.
9. Основной UI ввода плотности, `BYN/кг`, цены цветовой формы и необязательной подготовки layout-форм.
10. Состояния `pricing incomplete`, `pricing inputs ready`, `pricing ready`.
11. Адаптер production report → `SolutionMetrics`.
12. Контрольный production result `972,55 BYN` после явного ввода тестовых цен.
13. Отдельный release checkpoint `0.7.0-alpha.2`.

Рабочие цены не имеют demo-значений по умолчанию. Контрольные числа используются только в regression-тестах и evidence-сценариях.

## Что уже находится в `main` для M7.3

PR `#20` добавил чистый модуль `src/pareto-alternatives.js` и тесты:

- полная метрик-сигнатура решения;
- удаление полных дублей с сохранением первого решения;
- сравнение решений по отдельной цели с учётом minimize/maximize;
- проверка доминирования: не хуже по всем целям и строго лучше хотя бы по одной;
- построение Pareto-frontier;
- детерминированная лексикографическая сортировка frontier;
- display limit, `visibleFrontier` и явный `hiddenFrontierCount`;
- обязательные крайние решения по бумаге, стоимости, layout-формам, цветовым пластинам, перетиражу и листопрогонам;
- структурированные metric deltas.

Quality checks и Chromium workflow PR `#20` завершились успешно.

## Что ещё требуется для завершения M7.3

- модель компактного отображаемого набора, а не только сырой frontier;
- обязательное сохранение рекомендованного и крайних вариантов при лимите;
- устранение повторов, когда одно решение выигрывает несколько категорий;
- человеческие объяснения `преимущество / цена компромисса`;
- точные дельты относительно выбранного или рекомендованного варианта;
- отдельный monetary breakdown, доступный только при `pricing ready`;
- реальный набор альтернатив из нормализованных решений, а не только unit fixtures;
- компактная RU/EN демонстрация или UI;
- Chromium evidence, news, archive и release checkpoint `0.7.0-alpha.3`.

## Чего ещё нет

- автоматического своего оборота / work-and-turn — это M7.4;
- финального редактора приоритетов и цен — M7.5;
- полной таблицы вариантов и экспорта выбранного решения — M7.6;
- автоматического mixed-format packing — M8;
- фальцевального/тетрадного спуска;
- полного сохранения и переноса рабочего проекта.

## Следующая безопасная задача

Создать отдельный M7.3 PR от актуального `main` и реализовать чистую модель `display alternatives` поверх существующего Pareto-frontier:

1. принять frontier, текущий decision profile и display limit;
2. закрепить рекомендованное решение;
3. закрепить уникальные крайние решения;
4. заполнить оставшиеся места лучшими различающимися tradeoff-вариантами;
5. вернуть причины включения, скрытое количество и точные дельты;
6. не скрывать факт усечения;
7. покрыть ties, повторяющиеся extrema, маленький лимит, неполную pricing-модель и стабильность порядка тестами.

## English summary

The latest complete published checkpoint is `0.7.0-alpha.2` / M7.2, with exact recovery branch, immutable tag, GitHub prerelease, release news, Telegram/uNews payload, and permanent evidence. M7.3 is active development and is not a release yet. PR #20 already provides deterministic duplicate removal, dominance checks, Pareto-frontier construction, required extrema, display-limit metadata, and metric deltas. The next safe patch is a pure compact display-alternatives model that pins the recommended and unique extreme solutions, explains tradeoffs, preserves truncation metadata, and only exposes monetary comparisons when pricing is ready.
