# uImposition — план реализации универсального solver

Дата: **1 августа 2026**  
Статус: **актуальный обязательный implementation contract**

## 1. Решение после исследования

После аудита 50 GitHub-репозиториев проект больше не развивается как один растущий генератор всех возможных монтажей.

Основная архитектура:

```text
N — нормализация заказа
G — геометрические patterns
P — назначение изделий/страниц/сторон
R — целочисленные прогоны
C — restricted master + pricing/column generation
M — machine/operator constraints
E — explanation/export/case memory
```

Полный аудит:

- [`PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md)
- [`SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](SOLVER_ARCHITECTURE_DECISION_2026-08-01.md)

## 2. Архив и рабочая ветка

Состояние проекта до root cutover и начала universal-solver rebuild сохранено в:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

Архивный commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

`main` содержит актуальное приложение и новую документацию. Удалённый legacy UI восстанавливается из архивной ветки, а не возвращается копированием в новые модули.

## 3. Внешние опоры и их роль

### Page imposition и PDF

| Проект | Использование |
|---|---|
| `pdfcpu/pdfcpu` | N-up/booklet, blank pages, rotation и API/CLI/core tests |
| `Laidout/laidout` | доменная модель imposition/signatures и произвольные схемы |
| `ksharindam/pdfcook` | цепочки prepress transformations |
| `qpdf/qpdf`, Ghostscript, Poppler | независимая structural/render validation PDF |

Эти проекты не решают gang-run quantities и cost master problem.

### Geometry packing

| Проект | Использование |
|---|---|
| `secnot/rectpack` | differential oracle MaxRects/Skyline/Guillotine |
| `fontanf/packingsolver` | сильный oracle для rotation, trims, cut thickness, defects и time limits |
| `juj/RectangleBinPack` | reference implementations алгоритмов |
| `olragon/binpackingjs` | browser/TypeScript experimental backend |
| `bozokopic/opcut` | cutting layout UX и pattern output |

Heuristic packing не доказывает global optimum. Все ответы проходят наш validator.

### Integer optimization и column generation

| Проект/класс | Использование |
|---|---|
| OR-Tools | small/medium independent integer oracle |
| SCIP / Cbc | exact/reference solves в research/CI |
| cutting-stock column-generation examples | master/pricing decomposition |
| printing-industry packing/scheduling research | datasets, objectives и stress tests |

Внешний solver не становится обязательной browser dependency. Production runtime остаётся локальным JS/Web Worker; внешние engines используются для differential validation и исследований.

## 4. Этап D1 — нормализованная модель задачи

Нужно создать immutable plain-data contracts:

```js
OrderDemand
PrintableSheet
ProductGeometry
GeometryPattern
ProductionPattern
RunPlan
SearchCoverage
```

Обязательные свойства:

- размеры хранятся в миллиметрах без DOM;
- demand отделён от layout;
- geometry pattern не содержит тиражей или красочности;
- production pattern ссылается на реальные slots;
- deterministic canonical signature;
- serialization не хранит доверенные derived totals;
- каждый результат можно независимо пересчитать и валидировать.

## 5. Этап G0 — точные uniform grids

Первый кодовый этап.

Для каждой разрешённой ориентации вычислить:

```text
columns = floor((printableWidth + gapX) / (occupiedWidth + gapX))
rows    = floor((printableHeight + gapY) / (occupiedHeight + gapY))
capacity = columns × rows
```

Результат содержит реальные slots:

```js
{
  id,
  xMm,
  yMm,
  widthMm,
  heightMm,
  rotation: 0 | 90,
  row,
  column
}
```

Нужны оба pattern, даже когда один хуже, потому что orientation может влиять на дальнейший производственный выбор.

Acceptance G0:

- точные 0° и 90° grids;
- margins, bleed, gap и common/separate cut;
- zero overlap;
- все slots внутри printable area;
- deterministic ordering;
- monotonicity/property tests;
- mirror/rotation invariants;
- старый `calculatePlacementOptions()` остаётся regression reference, но новый API возвращает координаты.

## 6. Этап G1 — mixed guillotine strips

После зелёного G0:

- horizontal strip decomposition;
- vertical strip decomposition;
- внутри полосы одна ориентация;
- комбинации `0°+90°`;
- exact enumeration внутри явных limits;
- lower/upper bounds;
- deduplication по geometry signature;
- differential tests против `rectpack`/PackingSolver на малых задачах.

G1 не должен объявлять general rectangle packing полным.

## 7. Этап P0/P1 — назначение изделий

### P0: один вид

- simplex;
- separate duplex;
- work-and-turn через явное преобразование slots;
- нечётные страницы и техническая пустая сторона;
- physical sheets = `ceil(quantity / usefulPositions)`;
- no underproduction.

### P1: несколько видов на одном pattern

Для allocation `a[i]`:

```text
sum(a[i]) <= capacity
run = max(ceil(quantity[i] / a[i]))
```

Обязательные тесты:

- два одинаковых тиража `8+8` при capacity 16;
- два разных тиража, полный перебор allocations;
- четыре одинаковых `4+4+4+4`;
- четыре разных;
- 1…capacity видов;
- simplex и duplex отдельно;
- page/color compatibility.

## 8. Этап R0 — полный малый solver

Малые задачи решаются полным перебором и становятся oracle.

Границы задаются явно:

- `maxProducts`;
- `maxCapacity`;
- `maxPatterns`;
- `maxForms`;
- `maxRunLength`;
- `maxStates`.

Solver сохраняет все конструктивно разные Pareto-планы и возвращает:

- `completeWithinRequestedSpace`;
- `truncated`;
- причины усечения;
- число рассмотренных states/patterns.

Draft PR #85 после переработки может использоваться только здесь — как exhaustive small-space catalog/oracle.

## 9. Этап R1/R2 — restricted master и pricing

Master problem:

```text
minimize selected objective
subject to
sum(patternContribution[p,i] × run[p]) >= demand[i]
run[p] >= 0, integer in final solve
```

Pricing problem получает dual/penalty information и ищет новый production pattern, который улучшает master objective.

Цикл:

```text
initial columns
→ solve restricted master
→ pricing finds improving pattern
→ add structurally new pattern
→ repeat
→ final integer solve
```

Нужно поддержать разные цели:

- sheets;
- impositions/layout forms;
- color plates;
- press passes;
- overrun;
- cost;
- lexicographic objective order.

## 10. Этап R3 — proof и differential validation

Каждая новая версия solver проходит:

1. exact tiny fixtures;
2. generated random small cases против brute force;
3. differential geometry tests против `rectpack`/PackingSolver;
4. differential integer tests против OR-Tools/SCIP/Cbc;
5. independent production report;
6. deterministic replay;
7. no-underproduction audit.

Внешнее решение никогда не принимается без нашего geometry/production validator.

## 11. Поздний benchmark: 20 файлов

`data/control-case.json` используется только после прохождения D1–R3.

Известные точки:

- paper lower bound / найденный extreme: `3305` sheets;
- известный операторский вариант: `3395` sheets;
- операторский вариант: `4` impositions / `8` layout forms;
- underproduction: `0`.

Solver обязан найти paper extreme, compact-form extreme и промежуточные Pareto plans без чтения `data/control-layout-m3.json` как ответа.

## 12. Operator case memory

Подтверждённый оператором case хранит:

- нормализованный input signature;
- выбранный production plan;
- metrics и pricing context;
- operator notes;
- validation version;
- source/approval metadata.

Case используется как benchmark, warm start, upper bound и пользовательский пример, но не как безусловный ответ. При изменении заказа или прайса выполняется полный перерасчёт и повторная validation.

## 13. Machine/operator constraints

Добавляются после доказанной базовой математики:

- gripper/side-lay zones;
- top/bottom/left/right preferences;
- cylinder defects;
- ink coverage и solid-fill risks;
- color compatibility;
- preferred/forbidden zones;
- common/separate cut constraints.

Различаются hard constraints, soft penalties и operator warnings.

## 14. Что нельзя делать

- увеличивать static candidate limits как основной путь больших заказов;
- смешивать geometry и тиражи в DOM-коде;
- выдавать heuristic answer за proven optimum;
- читать benchmark answer в production solver;
- подменять operator selection рекомендацией;
- считать сохранённые derived metrics без повторной validation;
- добавлять machine heuristics до прохождения базовых G/P/R тестов;
- удалять архивную ветку до стабильного 1.0 checkpoint.

## 15. Ближайшие PR

### PR G0-A

- `src/geometric-pattern.js`;
- `src/uniform-grid-patterns.js`;
- exact slot coordinates;
- validation helpers;
- tests G0.1–G0.8;
- no UI changes.

### PR G0-B

- adapter из current application geometry;
- result comparison со старым placement API;
- source checks и regression;
- no recommendation changes.

### PR G1

- bounded mixed strip patterns;
- exact small tests;
- differential oracle fixtures.

Каждый PR имеет одну измеримую цель и exact-head Quality.
