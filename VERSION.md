# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущий release checkpoint

**`0.7.0-alpha.1`**  
Дата версии: **26 июля 2026**  
Implementation Pull Request: **№12**  
Этап: **M7.1 — приоритеты решений и денежная оценка BYN**  
Release manifest: `archive/development/0.7.0-alpha.1/release.json`

Фактическое состояние PR, `main`, rollback-ветки, tag и GitHub prerelease проверяется непосредственно в GitHub; документ не хранит переходный статус `draft/open/merged`.

### Что добавлено после M6

- 11 изменяемых целей оптимизации;
- отдельный неизменяемый набор жёстких ограничений;
- immutable decision profile;
- перемещение цели на произвольную позицию и вверх/вниз;
- лексикографическое сравнение;
- детерминированное стабильное ранжирование;
- объяснение первой метрики, которая определила победителя;
- обязательная проверка полного набора метрик до сравнения;
- цель `estimatedTotalCost`;
- расчёт площади и веса исходного закупаемого листа;
- плотность бумаги в `г/м²`;
- стоимость бумаги в `BYN/кг`;
- стоимость цветовых печатных форм/пластин за штуку;
- необязательная стоимость подготовки layout-форм;
- итоговая расчётная стоимость и стоимость одного заказанного изделия;
- отдельная demo-страница `Бумага / Стоимость / Формы`;
- фокусный Chromium screenshot без длинной страницы;
- полный план из 17 release-патчей до `1.0.0`.

### Проверенный денежный пример

Пример предназначен для проверки логики, а не является рабочим прайсом:

```text
исходный лист:  620 × 450 мм
плотность:      130 г/м²
бумага:         4 BYN/кг
цветовая форма: 15 BYN
```

#### Минимум бумаги

```text
physicalSheets:    3305
layoutForms:       112
colorPlates:       448
paperCost:         479.4894 BYN
estimatedTotalCost:7199.4894 BYN
```

#### Компактный вариант

```text
physicalSheets:    3395
layoutForms:       8
colorPlates:       32
paperCost:         492.5466 BYN
estimatedTotalCost:972.5466 BYN
```

Поэтому:

- при первом приоритете `Физическая бумага` выигрывает вариант `3305`;
- при первом приоритете `Расчётная стоимость` выигрывает компактный вариант;
- при первом приоритете `Layout-формы` также выигрывает компактный вариант;
- исходные варианты не пересчитываются при простой перестановке целей.

### Что ещё не реализовано

- ввод рабочих цен в основном интерфейсе;
- единая нормализованная модель всех метрик решения;
- набор Парето;
- автоматический свой оборот;
- автоматическая упаковка смешанных форматов;
- тетрадный/фальцевальный спуск полос;
- импорт/экспорт полного проекта и постоянное хранение.

### Следующая целевая версия

**`0.7.0-alpha.2` — M7.2**

Создать единую модель метрик для ручного, бумажного и будущих вариантов; подключить production report и явный статус готовности цен без выдуманных defaults.

</td>
<td width="50%" valign="top">

## English

### Current release checkpoint

**`0.7.0-alpha.1`**  
Version date: **26 July 2026**  
Implementation PR: **#12**  
Stage: **M7.1 — decision priorities and BYN costing**  
Release manifest: `archive/development/0.7.0-alpha.1/release.json`

### Added after M6

Eleven reorderable objectives, immutable hard constraints, decision profiles, lexicographic comparison, stable ranking, full metric validation, source-sheet area/weight, gsm, BYN/kg paper pricing, per-color-plate pricing, optional layout preparation cost, total/unit cost, a focused Paper / Cost / Forms demo, Chromium evidence, and a 17-release roadmap to 1.0.

### Verified example

With an illustrative 620×450 mm source sheet, 130 gsm paper, 4 BYN/kg paper, and 15 BYN per color plate, paper priority selects the 3,305-sheet solution while cost or side-layout-form priority selects the compact 3,395-sheet / 8-form solution. The example prices are not production defaults.

### Not implemented yet

Main-interface pricing inputs, normalized metrics for every solution, Pareto alternatives, work-and-turn, automatic mixed-format packing, folded-signature pagination, and complete-project persistence.

### Next target version

**`0.7.0-alpha.2` — M7.2**

Create one normalized metrics model for manual, paper-minimum, and future solutions, connected to production reporting and explicit pricing readiness.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила;
- `archive/development/0.7.0-alpha.1/release.json` — machine-readable release checkpoint.

## Релизы и откат / Releases and rollback

Checkpoint `0.7.0-alpha.1` определяет recovery-ветку `release/v0.7.0-alpha.1`, immutable tag `v0.7.0-alpha.1` и настоящий GitHub **prerelease** с release notes, фокусным PNG и ZIP доказательств. Патчноут и изображение одновременно входят в очередь uNews/Telegram. Их фактическое существование проверяется через GitHub после merge.
