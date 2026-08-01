# Solver Architecture Decision после GitHub-аудита

Дата: 2026-08-01  
Статус: proposed authoritative decision для следующего цикла M7.6  
Связано: issue `#83`, draft PR `#85`

## 1. Решение

Новый universal solver uImposition строится как последовательность независимых слоёв:

```text
N — normalization and compatibility
G — geometric pattern generation
P — print-aware production assignment
R — run-length master optimization
C — case memory and operator evidence
M — machine/operator placement constraints
E — export and independent validation
```

Ни один слой не имеет права подменять другой:

- PDF page reorder не выбирает производственный план;
- geometry heuristic не объявляет глобальный optimum;
- case memory не заменяет расчёт;
- UI не пересобирает лицо/оборот самостоятельно;
- recommendation не удаляет допустимые варианты.

## 2. Layer N — normalization and compatibility

Вход пользователя переводится в каноническую модель:

- printable sheet rectangle после trim и press margins;
- product rectangles после bleed/gap/cut rules;
- quantities и variant counts;
- pages и print pairs;
- simplex/duplex/work-and-turn preference;
- front/back colors;
- pricing;
- machine profile и разрешённые технологии.

Результат получает стабильные signatures. Несовместимые изделия делятся на compatibility groups до геометрического поиска.

## 3. Layer G — geometric patterns

### 3.1. Контракт

Geometry не знает файлов, страниц, тиражей и красочности.

```js
{
  id,
  printableWidth,
  printableHeight,
  cutFamily,
  slots: [
    { id, x, y, width, height, rotation, zone }
  ],
  capacity,
  occupiedArea,
  wasteArea,
  coverage: {
    method,
    exactWithinDeclaredSpace,
    truncated,
    limits
  }
}
```

### 3.2. Backends

#### G0 — exact uniform grids

- все клетки 0°;
- все клетки 90°;
- точные `floor`-формулы;
- margins, bleed и gap;
- deterministic coordinates;
- доказанная полнота внутри pure-grid пространства.

#### G1 — exact/bounded mixed strips

Лист делится на вертикальные или горизонтальные полосы. В каждой полосе изделия имеют одну ориентацию. Перебираются целочисленные ширины/высоты полос и обе ориентации.

Это следующий необходимый шаг: mixed 0°/90° иногда превосходит обе чистые сетки.

#### G2 — heuristic general rectangle packing

- MaxRects;
- Skyline;
- Guillotine;
- несколько сортировок и scoring rules;
- deterministic seed/order;
- результат всегда помечается как heuristic, если пространство не исследовано полностью.

#### G3 — external regression oracles

PackingSolver/rectpack и другие внешние движки используются в CI/research для differential testing. Они не становятся обязательной browser dependency первой версии.

## 4. Layer P — print-aware assignment

Production pattern назначает demand units в geometry slots.

```js
{
  geometryPatternId,
  duplexMode,
  turnMode,
  assignments: [
    { slotId, pairId, sideRole, file, frontPage, backPage }
  ],
  positionCountByDemand,
  structuralSignature
}
```

### 4.1. Simplex

Один slot производит одну копию выбранного вида за физический лист.

### 4.2. Separate front/back forms

- front является первичной структурой;
- back строится только проверенным transform;
- количество каждой page-pair на лице и обороте согласовано;
- `1 2 3 4 → 4 3 2 1` для текущего горизонтального переворота через короткую сторону;
- blank back page остаётся `null`, а не фиктивным номером.

### 4.3. Work-and-turn

Для geometry pattern определяется transform `T(slot)`.

Обязательные свойства:

```text
T(T(slot)) = slot
```

- paired orbits содержат лицо и оборот;
- fixed slots обрабатываются по физическому turn mode;
- shared plate хранится отдельно от control front/back views;
- нельзя просто делить `capacity / 2` без проверки transform;
- grid 3×3 даёт разные fixed sets для horizontal reflection, vertical reflection и 180° rotation.

### 4.4. Work-and-tumble/perfecting

Добавляются позже как отдельные transforms и machine capabilities, а не как флаги существующего work-and-turn.

## 5. Layer R — master problem и целые прогоны

Для production pattern `p` и demand unit `i`:

```text
a[p,i] = число копий i, производимых одним физическим листом pattern p
x[p]   = целое неотрицательное число физических листов
```

Жёсткое покрытие:

```text
sum(a[p,i] * x[p]) >= quantity[i]
```

Недопечатка запрещена.

Метрики:

- physical sheets;
- impositions;
- layout forms;
- color plates;
- sheet passes;
- pair/file overrun;
- split orders;
- setup/load cost;
- estimated total cost.

## 6. Почему нужен column generation

Полный список production patterns растёт экспоненциально. Основной large-order solver не должен заранее материализовывать все колонки.

### 6.1. Restricted master problem

Начинает с малого корректного набора:

- dedicated forms;
- paper-minimum construction;
- approved operator cases как warm starts;
- несколько heuristic geometry/assignment patterns.

### 6.2. Pricing subproblem

Master возвращает dual prices demand constraints. Pricing ищет новый production pattern с отрицательной reduced cost или другим доказуемым улучшением текущей objective projection.

Pricing включает:

1. выбор geometry pattern;
2. назначение demand units в slots;
3. duplex/turn constraints;
4. reduced-cost scoring;
5. canonical structural deduplication.

### 6.3. Завершение

- повторять master → pricing;
- остановиться, когда нет улучшающей колонки внутри declared pricing space;
- затем решить integer restricted master;
- для малых задач сравнить с полным brute force;
- для больших честно указывать bounds, gap, budgets и truncation.

### 6.4. Варианты реализации

- малые fixtures: pure JS exhaustive oracle;
- первая browser production версия: bounded JS branch-and-bound/DP;
- research/CI: OR-Tools, SCIP или Cbc как независимые oracles;
- позднее: optional WASM/worker backend, только после доказанной необходимости.

## 7. Pareto и выбор оператора

Нельзя свести задачу к одной фиксированной формуле стоимости.

Сохраняются конструктивно разные планы, если они различаются:

- geometry;
- assignments;
- duplex strategy;
- run lengths;
- production metrics.

Рекомендация применяется поверх lossless catalog:

- paper-first;
- forms-first;
- passes-first;
- overrun-first;
- cost-first;
- custom priority order.

План, выбранный оператором, остаётся независимым от текущей рекомендации.

## 8. Layer C — case memory

### 8.1. Роли данных

```text
tests/fixtures/       маленькие автоматические доказательные случаи
data/benchmarks/      большие задачи и известные границы
data/operator-cases/  подтверждённые технологом планы
data/examples/        кнопки примеров в UI
```

### 8.2. Exact case

При полном совпадении существенных inputs сохранённый plan:

1. загружается как warm start;
2. заново проходит все validators;
3. сравнивается с новым поиском;
4. не подставляется без проверки.

### 8.3. Structural analog

Имена файлов не важны. Сценарии сопоставляются по:

- geometry signature;
- pages/duplex/colors;
- normalized quantity ratios;
- variant counts;
- machine and cut profile.

Похожий case предлагает patterns и run-length seeds, но не считается готовым ответом.

### 8.4. Operator evidence

Сохраняются:

- выбранный plan;
- альтернативы, от которых отказались;
- pricing snapshot;
- operator reason;
- machine context;
- дата и версия solver.

Это обучает ranking/warm-start слой, но не ослабляет hard constraints.

## 9. Layer M — machine constraints

Добавляется после базовой корректности.

### 9.1. Slot zones

```js
{
  zone: "top" | "bottom" | "left" | "right" | "center",
  qualityClass,
  defectIds,
  maxInkCoverage,
  allowedColorProfiles
}
```

### 9.2. Product placement profile

```js
{
  inkCoverage,
  solidFill,
  colors,
  preferredZones,
  forbiddenZones,
  adjacencyRules,
  separationRules
}
```

Ограничения бывают:

- hard — назначение запрещено;
- soft — допустимо со штрафом;
- operator-only — программа показывает предупреждение и ждёт выбора.

## 10. Layer E — export and validation

Единый выбранный production plan является источником для:

- screen preview;
- all-impositions view;
- schemes PDF;
- production report PDF;
- cost report;
- saved operator case.

Экспорт не пересобирает оборот и не меняет assignments.

## 11. Обязательная лестница тестов

### G — geometry

- `G001`: один квадрат;
- `G002`: pure 0° лучше 90°;
- `G003`: pure 90° лучше 0°;
- `G004`: mixed strips лучше обеих pure grids;
- `G005`: bleed/gap/margins;
- `G006`: arbitrary rectangle;
- `G007`: monotonicity properties;
- `G008`: differential oracle against rectpack/PackingSolver.

### P — production assignment

- `P001`: simplex one kind;
- `P002`: separate duplex mirror;
- `P003`: odd page blank back;
- `P004`: work-and-turn even grid;
- `P005`: work-and-turn fixed slots on odd grid;
- `P006`: two equal simplex kinds 8+8;
- `P007`: two unequal kinds, all integer allocations;
- `P008`: four equal kinds 4+4+4+4;
- `P009`: four unequal kinds.

### R — run-length/master

- `R001`: dedicated vs one mixed pattern;
- `R002`: two mixed patterns with different runs;
- `R003`: forms-first vs paper-first;
- `R004`: pricing changes cost winner;
- `R005`: random small cases against brute force;
- `R006`: column generation against full small catalog;
- `R007`: complete/truncated/bounds contract.

### CASE — operator benchmarks

- historical 20-file control case;
- each later approved real order;
- exact expected invariants, not necessarily one immutable layout;
- solver must find known plan or explain/prove a better valid plan.

## 12. Решение по PR #85

Сейчас PR #85 не сливается.

После этой ADR его допустимая роль:

- exhaustive small-space oracle;
- deterministic candidate signatures;
- exact counting;
- test fixture generator;
- pricing-subproblem differential reference.

Недопустимая роль:

- основной large-order candidate store;
- доказательство global completeness;
- развитие через простое увеличение candidate limits.

## 13. Новый порядок разработки

1. Merge research/ADR documentation.
2. Переработать PR #85 под small-space oracle либо закрыть и перенести полезный код новым PR.
3. Реализовать G0 exact geometry и fixtures.
4. Реализовать G1 mixed strips.
5. Добавить pluggable geometry interface и external differential harness.
6. Реализовать P assignment для simplex/separate duplex/work-and-turn.
7. Реализовать exhaustive small master oracle.
8. Реализовать restricted master interface.
9. Реализовать first pricing subproblem.
10. Проверить малые задачи против полного каталога.
11. Вернуться к 20-file benchmark.
12. После корректности добавить case memory и machine constraints.

## 14. Неизменные правила

- zero underproduction;
- no hidden geometry overlap;
- no fake page numbers for blanks;
- front/back generated from one verified structure;
- every plan independently validates;
- heuristic results are labeled heuristic;
- completeness claimed only inside declared finite space;
- operator selection never silently changes;
- PDF/report use the exact selected plan;
- tests and approved cases are never deleted to hide regression.