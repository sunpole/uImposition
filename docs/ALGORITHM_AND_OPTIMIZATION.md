# Алгоритм и оптимизация / Algorithm and Optimization

Последнее обновление: **1 августа 2026 года**.

Исследовательская основа:

- [`../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md);
- [`../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md).

## Русская версия

## 1. Задача разделена на три математических уровня

### 1.1. Геометрия

Нужно найти допустимые прямоугольные места на printable sheet.

Для простой uniform-сетки без промежутка:

```text
columns = floor(W / w)
rows    = floor(H / h)
capacity = columns × rows
```

С промежутком между изделиями:

```text
columns = floor((W + gapX) / (w + gapX))
rows    = floor((H + gapY) / (h + gapY))
```

Обязательно считаются обе чистые ориентации:

```text
0°  : item = w × h
90° : item = h × w
```

Максимум двух pure-grid формул не является глобальным максимумом: mixed 0°/90° strips или general packing могут дать больше мест.

Geometry result хранит координаты каждого slot, а не только число мест.

### 1.2. Производственное назначение

Для каждого допустимого geometry pattern создаются production patterns: какие виды, страницы и стороны стоят в slots.

```text
a[p,i] = число копий demand unit i,
         производимых одним физическим листом pattern p
```

Demand unit может означать:

- simplex product kind;
- duplex print pair;
- paired role work-and-turn;
- позднее — более сложную production unit.

### 1.3. Целочисленные прогоны

```text
x[p] = целое неотрицательное число физических листов pattern p
```

Для каждого demand unit:

```text
Produced_i = sum(a[p,i] × x[p])
Produced_i >= Required_i
```

Недопечатка запрещена.

```text
Overrun_i = Produced_i - Required_i
Paper     = sum(x[p])
```

## 2. Геометрические пространства

### G0 — exact uniform grids

Полностью перебираются:

- pure 0°;
- pure 90°;
- допустимые fields, bleed и gaps;
- deterministic coordinates.

Статус `complete` относится только к этому finite space.

### G1 — mixed-orientation strips

Лист делится на полосы. В каждой полосе используется одна ориентация. Перебираются допустимые целочисленные границы полос и обе ориентации.

Этот этап должен быть exact или явно bounded.

### G2 — general rectangle packing

MaxRects, Skyline и Guillotine используются как pluggable heuristics.

Для каждого heuristic сохраняются:

- algorithm ID;
- sorting/scoring rule;
- seed/order;
- placements;
- occupied/waste area;
- elapsed time;
- `heuristic` или `truncated` status.

Одинаковая вместимость не означает одинаковый production pattern: расположение slots важно для реза, оборота и machine zones.

## 3. Simplex

Для одного вида:

```text
sheets = ceil(quantity / capacity)
produced = sheets × capacity
overrun = produced - quantity
```

Для нескольких видов на одной форме и allocation `c_i`:

```text
sum(c_i) <= capacity
run = max_i(ceil(quantity_i / c_i))
```

Пример `capacity = 16`, два вида по `1000`:

```text
8 + 8
run = 125
produced = 1000 + 1000
```

Но separate forms также должны сохраняться как альтернативный plan, потому что при других тиражах они могут использовать меньше бумаги.

## 4. Separate duplex

Front является первичной структурой. Back строится проверенным transform.

Для текущего горизонтального переворота через короткую сторону:

```text
[A, B, C, D] → [back(D), back(C), back(B), back(A)]
```

Строки не меняются местами.

Для обычного двустороннего монтажа:

```text
layout forms = 2 × impositions
press passes = 2 × physical sheets
```

Color plates считаются отдельно по реальной красочности каждой печатаемой стороны.

Технический blank:

- хранится как `null`;
- не создаёт фиктивную страницу;
- не добавляет печатную сторону, если весь оборот монтажа пустой;
- не уничтожает реальные обороты других пар на том же монтаже.

## 5. Work-and-turn

Work-and-turn определяется не делением capacity пополам, а transform slots:

```text
T(T(slot)) = slot
```

Орбиты transform:

- парные slots — лицо и оборот на shared plate;
- fixed slots — зависят от физического способа переворота;
- недопустимые fixed slots остаются технически пустыми или исключают family.

Для shared plate:

- одна layout form;
- два press passes на каждый физический лист;
- количество color plates определяется общей формой и реальными красками;
- control front/back views служат проверке готового изделия, но не являются двумя печатными формами.

Horizontal reflection, vertical reflection и 180° rotation — разные transforms и не должны смешиваться одним флагом.

## 6. Master problem

Restricted master выбирает production patterns и run lengths.

Жёсткие ограничения:

- zero underproduction;
- geometry inside printable area;
- no overlap;
- valid page-pair identity;
- valid front/back/work-and-turn transform;
- allowed machine/duplex strategy;
- independently valid production report.

Основные objectives:

- physical sheets;
- layout forms;
- color plates;
- press passes;
- pair overrun;
- file overrun;
- split orders;
- setup/preparation cost;
- total cost.

## 7. Почему нельзя заранее сгенерировать все монтажи

Число patterns растёт экспоненциально по:

- количеству demand units;
- capacity;
- integer allocations;
- geometry patterns;
- duplex strategies;
- run-length combinations.

Полный static catalog допустим только как малый brute-force oracle.

Для больших заказов основной алгоритм — column generation.

## 8. Column generation

### 8.1. Начальные колонки

Restricted master начинается с корректного небольшого набора:

- dedicated patterns;
- paper-minimum construction;
- work-and-turn dedicated patterns, когда они допустимы;
- geometry heuristics;
- approved operator cases как warm starts;
- exhaustive small patterns, когда пространство мало.

### 8.2. Pricing subproblem

После решения relaxed master pricing получает оценки спроса и ищет production pattern с улучшающей reduced cost.

Pricing должен одновременно учитывать:

- geometry pattern;
- allocation demand units;
- page/duplex transform;
- colors и forms;
- current objective projection;
- structural signature.

### 8.3. Цикл

```text
restricted master
→ dual information
→ pricing pattern
→ добавить новую колонку
→ повторить
→ integer restricted master
```

### 8.4. Остановка

Результат обязан сообщать:

- lower/upper bounds, когда доступны;
- optimality gap;
- generated/evaluated states;
- time/state/memory limits;
- причины truncation;
- complete space, внутри которого делается claim.

`Не найдено` в усечённом поиске не означает `невозможно`.

## 9. Small-space exhaustive oracle

Полный перебор сохраняется для малых задач:

- one/few geometry patterns;
- небольшой capacity;
- ограниченное число видов;
- bounded number of impositions;
- finite run-length range.

Его роль:

- доказать expected result fixtures;
- сравнивать pricing subproblem;
- property/differential tests;
- проверять, что column generation не теряет решения в малом пространстве.

Draft PR #85 должен быть переработан именно в этот oracle, а не превращаться в large-order solver увеличением лимитов.

## 10. Multi-objective catalog

Нельзя сводить все производственные решения к одной скрытой сумме коэффициентов.

Каталог сохраняет конструктивно разные планы. Затем применяются:

- Pareto annotations;
- lexicographic objective order;
- cost-first или другой explicit profile;
- operator selection.

Рекомендация не удаляет остальные варианты.

Пример компромисса:

```text
вариант A: меньше бумаги, больше форм
вариант B: больше бумаги, меньше форм
вариант C: минимальная стоимость при текущем прайсе
```

Все три могут быть полезны и обязаны остаться доступными.

## 11. Case memory

Подтверждённый человеком plan не становится hardcoded answer.

Он используется как:

- regression benchmark;
- warm start;
- upper bound;
- ranking evidence;
- example для пользователя.

Перед повторным использованием plan заново проходит:

- geometry validation;
- production coverage;
- transform validation;
- current pricing calculation;
- comparison with newly generated plans.

Похожие cases определяются по structural signature, а не именам файлов.

## 12. Machine constraints

После доказанной G/P/R-математики добавляются:

- defective/forbidden zones;
- top/bottom/left/right preferences;
- ink coverage;
- solid fills;
- color compatibility;
- adjacency/separation constraints.

Hard constraints исключают assignment. Soft constraints дают явный штраф. Operator-only rules показывают предупреждение и не маскируются математическим коэффициентом.

## 13. Проверка оптимальности

Допустимые статусы:

- `complete within declared space`;
- `proven lower bound reached`;
- `feasible`;
- `heuristic`;
- `truncated`;
- `not searched`;
- `not supported`.

Глобальный optimum заявляется только при доказательстве.

Достижение capacity lower bound может доказать минимум бумаги для конкретного input/capacity, но не доказывает минимум форм, стоимости или machine risk.

## 14. Иерархия проверки найденного плана

Любой внутренний или внешний solver result проходит один маршрут:

1. materialize geometry slots;
2. materialize production assignments;
3. derive/validate back or shared transform;
4. recalculate demand output;
5. reject underproduction;
6. recalculate forms, plates, passes and overrun;
7. calculate guarded cost;
8. insert into lossless catalog;
9. rank without deleting alternatives;
10. export exact selected plan.

## 15. English summary

uImposition separates geometric packing, print-aware assignment, and integer run-length optimization. Small finite instances use exhaustive enumeration as a proof oracle. Large orders use a restricted master problem with an on-demand pricing subproblem instead of pre-generating every possible imposition. External packing and MIP solvers are differential oracles, not trusted runtime answers. Every plan is rematerialized and independently validated, zero underproduction is mandatory, and operator-approved cases are warm starts and benchmarks rather than hardcoded solutions.