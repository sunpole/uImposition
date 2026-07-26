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
- compact display alternatives объединены через PR `#25`;
- real production alternatives реализуются через PR `#26`;
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
- удаление полных дублей;
- objective-aware сравнение и доминирование;
- Pareto-frontier и детерминированная сортировка;
- крайние решения и явное усечение;
- структурированные metric deltas.

### PR #25 — compact display alternatives

- рекомендация и уникальные обязательные extrema закрепляются;
- слишком малый display limit расширяется явно;
- одно решение с несколькими причинами не дублируется;
- дополнительные tradeoff-варианты выбираются детерминированным maximin-методом;
- причины включения, преимущества, компромиссы и точные дельты структурированы;
- неполная стоимость исключается, а не подменяется нулём;
- активные Pareto-метрики обязаны быть настоящими конечными числами.

### PR #26 — real production alternatives

- ручной production report и доказанный paper minimum переводятся в общие `SolutionMetrics`;
- сырые layouts/candidates/planned runs остаются за границей decision/Pareto слоя;
- реальные `distinctOrdersPerImposition`, `splitOrders` и `fragmentedBlocks` выводятся из состава монтажей;
- paper minimum получает отдельный строгий адаптер;
- production report adapter принимает измеренные split/fragmentation metrics вместо нулевых заглушек;
- `productionAlternativeSet` применяет current decision profile, Pareto и compact display set к нормализованным решениям;
- сравнение стоимости разрешается только при общей валюте, листе, плотности, весе и эффективных ставках;
- состояния прайса: `ready`, `incomplete`, `incompatible`;
- полный integration test заново строит реальные схемы, report и paper solution из repository data.

Проверенный реальный контрольный результат:

| Метрика | Compact manual | Paper minimum |
|---|---:|---:|
| Физические листы | 3395 | 3305 |
| Монтажи | 4 | 56 |
| Layout-формы | 8 | 112 |
| Цветовые пластины | 32 | 448 |
| Листопрогоны | 6790 | 6610 |
| Перетираж файлов | 930 | 0 |
| Перетираж пар | 1450 | 10 |
| Разделённые заказы | 2 | 19 |
| Стоимость | 972.5466 BYN | 7199.4894 BYN |

Оба решения имеют нулевую недопечатку и входят в Pareto-frontier. При paper-first рекомендуется paper minimum; при cost-first — compact manual без повторной генерации.

## Что ещё требуется для завершения M7.3

- pure RU/EN объяснения `преимущество / цена компромисса / решающая цель`;
- component monetary deltas: бумага, цветовые пластины, подготовка layout-форм и итог;
- денежные объяснения только при совместимом `pricing ready`;
- runtime event/state с реальным alternative set;
- компактная RU/EN демонстрация или UI;
- focused Chromium evidence нового пользовательского результата;
- release news, uNews/Telegram payload, permanent archive и release checkpoint `0.7.0-alpha.3`.

## Чего ещё нет

- автоматического своего оборота / work-and-turn — это M7.4;
- финального редактора приоритетов и цен — M7.5;
- полной таблицы вариантов и экспорта выбранного решения — M7.6;
- автоматического mixed-format packing — M8;
- фальцевального/тетрадного спуска;
- полного сохранения и переноса рабочего проекта.

## Следующая безопасная задача

После объединения PR `#26` создать отдельный M7.3 PR от актуального `main`:

1. построить pure RU/EN explanation model поверх display entries и source `SolutionMetrics`;
2. не смешивать форматирование текста с выбором вариантов;
3. возвращать преимущество, цену компромисса и решающую цель;
4. добавить component deltas по `paperCost`, `colorPlateCost`, `layoutFormPreparationCost` и `estimatedTotalCost`;
5. проверять общую валюту и pricing fingerprint перед денежными фразами;
6. покрыть смену reference/recommendation, равенство, incomplete и incompatible pricing тестами;
7. runtime/UI начинать только после проверки pure explanation model.

## English summary

The latest published checkpoint remains `0.7.0-alpha.2`. M7.3 is unreleased development. PR #20 provides the Pareto foundation, PR #25 provides compact materially-different display selection, and PR #26 integrates the real manual production report and proven paper-minimum solution through normalized `SolutionMetrics`. The real control pipeline validates both Pareto alternatives and instant paper-first/cost-first reranking while excluding incomplete or incompatible pricing. The next safe patch is a pure RU/EN tradeoff and component-cost explanation model, followed by runtime/UI integration.
