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
- Pareto foundation объединён через PR `#20`;
- compact display alternatives реализуются через PR `#25`;
- полный план до `1.0.0`: `docs/REMAINING_WORK.md`.

`VERSION.json`, `VERSION.md`, package version и видимая версия сайта остаются `0.7.0-alpha.2`, пока M7.3 не пройдёт полный отдельный release checkpoint.

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
4. Разделённые заказы, compactness и число разных заказов на монтаже.
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

## Что реализовано в M7.3

### PR #20 — Pareto foundation

- полная метрик-сигнатура решения;
- удаление полных дублей с сохранением первого решения;
- сравнение решений по отдельной цели с учётом minimize/maximize;
- проверка доминирования: не хуже по всем целям и строго лучше хотя бы по одной;
- построение Pareto-frontier;
- детерминированная лексикографическая сортировка frontier;
- display limit, `visibleFrontier` и явный `hiddenFrontierCount`;
- крайние решения по бумаге, стоимости, layout-формам, цветовым пластинам, перетиражу и листопрогонам;
- структурированные metric deltas.

### PR #25 — compact display alternatives

- рекомендация закрепляется в отображаемом наборе;
- уникальные обязательные extrema не скрываются малым лимитом;
- одно решение с несколькими extreme-причинами не дублируется;
- слишком малый лимит расширяется явно через `effectiveDisplayLimit` и `limitExpandedBy`;
- свободные места заполняются детерминированным maximin-отбором по нормализованным диапазонам целей;
- скрытый суммарный score и скрытые веса не используются;
- возвращаются причины включения, nearest-selected diversity evidence, преимущества, компромиссы и точные дельты;
- факт усечения, число и идентификаторы скрытых frontier-вариантов остаются явными;
- `pricing incomplete` поддерживается только через явное исключение денежной цели;
- `null`, `undefined`, числовые строки и пустые строки не могут стать нулевой Pareto-метрикой;
- добавлен `docs/M7_3_DISPLAY_ALTERNATIVES.md` и regression-проверки.

## Что ещё требуется для завершения M7.3

- сформировать реальный набор нормализованных alternatives из production pipeline, а не только unit fixtures;
- связать recommendations/Pareto/display set с текущим decision profile приложения;
- человекочитаемые RU/EN объяснения `преимущество / цена компромисса`;
- отдельный monetary breakdown: бумага, цветовые пластины, подготовка layout-форм и итог;
- денежные дельты показывать только при `pricing ready` и общей валюте/базе расчёта;
- компактная RU/EN демонстрация или UI;
- фокусный Chromium evidence нового пользовательского результата;
- release news, uNews/Telegram payload, permanent archive и release checkpoint `0.7.0-alpha.3`.

## Чего ещё нет

- автоматического своего оборота / work-and-turn — это M7.4;
- финального редактора приоритетов и цен — M7.5;
- полной таблицы вариантов и экспорта выбранного решения — M7.6;
- автоматического mixed-format packing — M8;
- фальцевального/тетрадного спуска;
- полного сохранения и переноса рабочего проекта.

## Следующая безопасная задача

После объединения PR `#25` создать следующий отдельный M7.3 PR от актуального `main`:

1. определить источник нескольких реальных нормализованных решений из существующих manual/paper candidate pipelines;
2. не смешивать `SolutionMetrics` с сырыми candidate-структурами;
3. собрать Pareto-frontier и compact display set на реальных решениях;
4. передать текущий decision profile как objective order;
5. добавить pure formatter человеческих RU/EN объяснений;
6. добавить pricing-component deltas только при совместимом `pricing ready`;
7. покрыть несовместимые валюты/базы, отсутствующую стоимость и смену recommendation тестами;
8. UI и release не начинать до проверки этой интеграции.

## English summary

The latest complete published checkpoint remains `0.7.0-alpha.2` / M7.2. M7.3 is active unreleased development. PR #20 provides duplicate removal, dominance checks, Pareto-frontier construction, extrema, truncation metadata, and metric deltas. PR #25 adds a compact display-set model that pins the recommendation and unique extrema, transparently expands an insufficient limit, selects additional tradeoffs through deterministic maximin range-normalized distance, exposes structured comparison evidence, and rejects coercible missing metrics. The next safe patch is integration with real normalized production alternatives plus pure RU/EN and pricing-component explanation models.
