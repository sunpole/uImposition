# Текущее состояние / Current State

Последнее обновление: **26 июля 2026**  
Last updated: **26 July 2026**

## Версия и release checkpoint

- версия в `main`: **`0.7.0-alpha.3` / M7.3**;
- exact functional commit M7.3: `d7767aa6ec3b875864ea7d8ef8110b4c3ca8686e`;
- recovery-ветка: `release/v0.7.0-alpha.3`;
- immutable tag: `v0.7.0-alpha.3`;
- release package M7.3 объединён через PR `#36`;
- package включает patchnote, uNews/Telegram payload, focused image, permanent evidence archive и release manifest;
- фактическую GitHub Release card и каждый приложенный asset необходимо проверять непосредственно в GitHub;
- активная разработка: **M7.4 / будущий `0.7.0-alpha.4`**;
- рабочая ветка: `m7.4/work-and-turn`;
- functional PR: `#39`;
- полный план до `1.0.0`: `docs/REMAINING_WORK.md`.

Версия остаётся `0.7.0-alpha.3`, пока functional PR M7.4 не объединён и не выполнен отдельный полный release checkpoint `0.7.0-alpha.4`.

## Что работает после M6

- проверенная геометрия листа и изделия;
- парсинг заказов и печатных пар;
- лицо и зеркальный оборот;
- production report;
- отдельные PDF схем и отчёта;
- полный набор `8960` ограниченных uniform-grid кандидатов;
- доказанный минимум физической бумаги `3305` листов;
- нулевая недопечатка;
- отдельные layout-формы и цветовые пластины;
- production regression fixtures;
- Chromium, `pdfinfo`, Poppler и постоянные evidence archives.

## Что завершено в M7.1

- `11` изменяемых целей и отдельные жёсткие ограничения;
- immutable decision profile;
- перемещение целей без DOM;
- лексикографическое сравнение и стабильное ранжирование;
- объяснение первой решающей цели;
- денежная цель `estimatedTotalCost`;
- вес исходного листа;
- бумага в `BYN/кг`;
- цветовые формы и необязательная подготовка layout-форм;
- общая стоимость и стоимость заказанного изделия;
- demo `Бумага / Стоимость / Формы`;
- checkpoint `0.7.0-alpha.1`.

## Что завершено в M7.2

- guarded-модель `SolutionMetrics`;
- нормализованные листы, монтажи, формы, пластины и прогоны;
- перетираж, split orders, fragmentation и compactness;
- бумажная масса и component cost breakdown;
- запрет решения с недопечаткой;
- защита от `null → 0`;
- проверка совпадения imported production cost;
- основной UI рабочего прайса;
- состояния `pricing incomplete / inputs ready / ready`;
- production report → `SolutionMetrics` adapter;
- checkpoint `0.7.0-alpha.2`.

Рабочие цены не имеют demo-значений по умолчанию. Контрольные числа используются только в тестах и evidence-сценариях.

## Что завершено в M7.3

### Pareto и compact display

- полная метрик-сигнатура;
- удаление дублей;
- objective-aware dominance;
- Pareto frontier;
- обязательные extrema;
- детерминированный materially-different display set;
- причины `recommended / extreme / diverseTradeoff`;
- точные advantages, tradeoffs и deltas;
- исключение неполной стоимости вместо подмены нулём.

### Реальные production alternatives

- manual production report и paper minimum переводятся в общие `SolutionMetrics`;
- raw layouts/candidates/planned runs не выходят в decision/Pareto слой;
- реальные split/fragmentation metrics;
- строгий paper-solution adapter;
- pricing comparison `ready / incomplete / incompatible`;
- paper-first и cost-first без повторной генерации.

Проверенный результат:

| Метрика | Compact manual | Paper minimum |
|---|---:|---:|
| физические листы | 3395 | 3305 |
| монтажи | 4 | 56 |
| layout-формы | 8 | 112 |
| цветовые пластины | 32 | 448 |
| листопрогоны | 6790 | 6610 |
| перетираж файлов | 930 | 0 |
| перетираж пар | 1450 | 10 |
| стоимость | 972.5466 BYN | 7199.4894 BYN |

Оба решения имеют нулевую недопечатку и находятся на Pareto frontier. Paper-first рекомендует paper minimum; cost-first — compact manual.

### Объяснения и UI

- RU/EN advantage, tradeoff и deciding objective;
- смена reference без регенерации;
- component deltas по бумаге, пластинам, подготовке и итогу;
- денежные объяснения только при совместимом pricing;
- sanitized public event `uimposition:alternatives`;
- compact read-only UI двух реальных вариантов;
- focused Chromium scenario;
- version/release package `0.7.0-alpha.3`.

## Что реализовано в M7.4 / PR #39

### Стратегии и режимы

- `separateFrontBackForms`;
- `workAndTurn`;
- `separateOnly`;
- `compareBoth`;
- `workAndTurnOnly`.

### Чистая модель work-and-turn

- одна общая форма;
- чётное число колонок;
- front page в одной половине;
- парная back page в зеркальной позиции;
- проверка файла, pair index, page role и direction;
- только горизонтальный turn axis;
- `samePlateForBothPasses: true`;
- отклонение повреждённой или асимметричной формы.

### Независимая производственная проверка

- общая форма materialize-ится в канонические front/back layouts только для проверки готовых пар;
- существующий `validateImposition` повторно проверяет результат;
- production report независимо считает готовые изделия после двух прогонов;
- `runMetrics` отдельно фиксирует физическую технологию:
  - separate: `frontForms=1`, `backForms=1`, `forms=2`;
  - work-and-turn: `frontForms=1`, `backForms=0`, `forms=1`;
- validation проверяет duplex mode и форму totals;
- недопечатка остаётся запрещённой.

### Контрольный кейс

- 4 разных A6;
- 2 страницы;
- `1+1`;
- по `4000` экземпляров;
- printable area `608 × 431 mm`;
- сетка `4 × 4`;
- run length `1000`.

Проверенный результат модели:

| Метрика | Чужой оборот | Свой оборот |
|---|---:|---:|
| физические листы | 1000 | 1000 |
| листопрогоны | 2000 | 2000 |
| layout-формы | 2 | 1 |
| цветовые пластины при 1+1 | 2 | 1 |
| недопечатка | 0 | 0 |
| перетираж | 0 | 0 |

При evidence-прайсе `15 BYN` за пластину и `0 BYN` за подготовку денежная экономия равна `15 BYN`. Бумага и число прогонов не меняются.

### Runtime и UI

- обе стратегии подготавливаются один раз на pricing state;
- режим только фильтрует готовые метрики;
- public state не содержит reports, raw layouts, pagePairs или halfRows;
- основная страница показывает compact RU/EN comparison;
- preview общей формы `4 × 4` показывает фактические front/back pages;
- обязательное предупреждение требует проверки захвата, бокового упора, приводки и машины;
- focused scenario: `m7-work-and-turn-control`;
- отдельный документ: `docs/M7_4_WORK_AND_TURN.md`.

## Граница текущей реализации

M7.4 не заявляет:

- общий автоматический work-and-turn search для произвольных заказов;
- вертикальный переворот;
- автоматический выбор захвата или бокового упора;
- автоматическую совместимость с конкретной машиной;
- экономию бумаги в контрольном кейсе.

## Что требуется до `0.7.0-alpha.4`

1. Зелёные exact-head Quality и Chromium/PDF checks PR `#39`.
2. Скачанный и визуально проверенный focused screenshot.
3. Review functional diff и merge PR `#39`.
4. Version sync.
5. Patchnote.
6. uNews/Telegram payload.
7. Permanent evidence archive и release manifest.
8. Recovery branch `release/v0.7.0-alpha.4`.
9. Immutable tag `v0.7.0-alpha.4`.
10. Настоящий GitHub prerelease с assets.
11. Независимая проверка Release card и каждого asset.

## Чего ещё нет

- финального редактора приоритетов и цен — M7.5;
- полной таблицы вариантов и экспорта выбранного решения — M7.6;
- automatic mixed-format packing — M8;
- общего work-and-turn solver для произвольных наборов;
- фальцевального/тетрадного спуска;
- полного сохранения и переноса рабочего проекта.

## Следующая безопасная задача

Завершить exact-head проверки и review PR `#39`, затем выполнить отдельный release checkpoint `0.7.0-alpha.4`. Не начинать M7.5 до подтверждённых recovery branch, tag, GitHub prerelease и assets M7.4.

## English summary

The repository checkpoint is `0.7.0-alpha.3` / M7.3. M7.4 is active in PR #39 and adds a separately validated work-and-turn strategy. The fixed A6 control case proves equal paper and press passes (`1000` sheets, `2000` passes) while reducing side-layout forms and 1+1 color plates from `2` to `1`, with zero underproduction and overrun. The runtime reuses one prepared comparison, hides all money until operator pricing is ready, and exposes only sanitized metrics and a safe plate preview. M7.4 is not a published `0.7.0-alpha.4` until the functional PR, evidence, patchnote, uNews/Telegram payload, archive, recovery branch, immutable tag, GitHub prerelease, and release assets are independently verified.
