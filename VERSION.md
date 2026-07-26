# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущий release checkpoint

**`0.7.0-alpha.2`**  
Дата версии: **26 июля 2026**  
Implementation Pull Requests: **№14, №15, №16**  
Этап: **M7.2 — нормализованные метрики решения и статус стоимости**  
Release manifest: `archive/development/0.7.0-alpha.2/release.json`

Фактическое состояние PR, `main`, rollback-ветки, tag и GitHub prerelease проверяется непосредственно в GitHub; документ не хранит переходный статус `draft/open/merged`.

### Что добавлено в M7.2

- единая нормализованная модель `SolutionMetrics`;
- явный статус `pricing ready` / `pricing incomplete`;
- отсутствие выдуманных рабочих цен: без прайса BYN-поля остаются `null`;
- защитный адаптер перед decision ranking;
- недопечатанные решения не могут попасть в рекомендацию;
- `layoutCompactness: null` не превращается молча в `0`;
- импортированный `productionCost` проверяется на совпадение с физическими листами, цветными пластинами и layout-формами того же решения;
- главная страница обновлена с M6-текста до актуальной M7.2-границы;
- основной фронт показывает статус `pricing incomplete` до появления UI ввода рабочих цен.

### Что было добавлено в M7.1

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
- отдельная demo-страница `Бумага / Стоимость / Формы`.

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
physicalSheets:     3305
layoutForms:        112
colorPlates:        448
paperCost:          479.4894 BYN
estimatedTotalCost: 7199.4894 BYN
```

#### Компактный вариант

```text
physicalSheets:     3395
layoutForms:        8
colorPlates:        32
paperCost:          492.5466 BYN
estimatedTotalCost: 972.5466 BYN
```

Поэтому:

- при первом приоритете `Физическая бумага` выигрывает вариант `3305`;
- при первом приоритете `Расчётная стоимость` выигрывает компактный вариант;
- при первом приоритете `Layout-формы` также выигрывает компактный вариант;
- исходные варианты не пересчитываются при простой перестановке целей;
- без рабочего прайса стоимость остаётся `pricing incomplete` и не может выбрать победителя.

### Что ещё не реализовано

- ввод рабочих цен в основном интерфейсе;
- набор Парето;
- автоматический свой оборот;
- автоматическая упаковка смешанных форматов;
- тетрадный/фальцевальный спуск полос;
- импорт/экспорт полного проекта и постоянное хранение.

### Следующая целевая версия

**`0.7.0-alpha.3` — M7.3**

Создать компактный набор существенно разных альтернатив и Pareto-frontier с человеческими объяснениями преимуществ и цены каждого варианта.

</td>
<td width="50%" valign="top">

## English

### Current release checkpoint

**`0.7.0-alpha.2`**  
Version date: **26 July 2026**  
Implementation Pull Requests: **#14, #15, #16**  
Stage: **M7.2 — normalized solution metrics and pricing status**  
Release manifest: `archive/development/0.7.0-alpha.2/release.json`

### Added in M7.2

A normalized `SolutionMetrics` model, explicit `pricing ready` / `pricing incomplete` state, no invented production prices, guarded conversion before decision ranking, rejection of underproduced candidates, rejection of null compactness before ranking, production-cost basis checks, and main-page copy aligned to the active M7.2 boundary.

### Added in M7.1

Eleven reorderable objectives, immutable hard constraints, decision profiles, lexicographic comparison, stable ranking, full metric validation, source-sheet area/weight, gsm, BYN/kg paper pricing, per-color-plate pricing, optional layout preparation cost, total/unit cost, a focused Paper / Cost / Forms demo, Chromium evidence, and a 17-release roadmap to 1.0.

### Verified example

With an illustrative 620×450 mm source sheet, 130 gsm paper, 4 BYN/kg paper, and 15 BYN per color plate, paper priority selects the 3,305-sheet solution while cost or side-layout-form priority selects the compact 3,395-sheet / 8-form solution. The example prices are not production defaults. Without real pricing, the solution remains `pricing incomplete` and cost cannot select a winner.

### Not implemented yet

Main-interface pricing inputs, Pareto alternatives, work-and-turn, automatic mixed-format packing, folded-signature pagination, and complete-project persistence.

### Next target version

**`0.7.0-alpha.3` — M7.3**

Build a compact set of materially different alternatives and a Pareto frontier with human-readable explanations of each option's benefit and cost.

</td>
</tr>
</table>
