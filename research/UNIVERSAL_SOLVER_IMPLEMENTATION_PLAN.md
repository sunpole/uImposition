# uImposition — план реализации универсального solver

Дата: **1 августа 2026**  
Статус: **актуальный обязательный implementation contract**  
Фактический baseline: merge PR `#103`, commit `a0fe6edb8092e706572493f2534cc698b935262e`

## 1. Архитектурное решение

После аудита 50 GitHub-репозиториев проект не развивается как один растущий генератор всех возможных монтажей.

```text
N — нормализация заказа
G — геометрические patterns с реальными slots
P — назначение изделий, страниц и сторон
R — целочисленные прогоны
C — restricted master + pricing / column generation
M — ограничения машины и оператора
E — объяснения, экспорт и память подтверждённых cases
```

Источники исследования:

- [`PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md);
- [`SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](SOLVER_ARCHITECTURE_DECISION_2026-08-01.md).

## 2. Архив и рабочая линия

Состояние до root cutover и universal-solver rebuild сохранено в постоянной ветке:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

Архивный commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

Корневой GitHub Pages URL ведёт в актуальный `/app/`. Старый root UI удалён из рабочего `main`, но полностью восстанавливается из архивной ветки. Архив нельзя удалять до стабильного `1.0.0` и отдельного решения владельца.

## 3. Внешние опоры

### PDF и page imposition

| Проект | Роль |
|---|---|
| `pdfcpu/pdfcpu` | N-up/booklet, blank pages, rotation, API/CLI/core tests |
| `Laidout/laidout` | доменная модель imposition/signatures |
| `ksharindam/pdfcook` | цепочки prepress transformations |
| `qpdf/qpdf`, Ghostscript, Poppler | structural/render validation PDF |

### Geometry packing

| Проект | Роль |
|---|---|
| `secnot/rectpack` | differential oracle MaxRects/Skyline/Guillotine |
| `fontanf/packingsolver` | rotation, trims, cut thickness, defects, time limits |
| `juj/RectangleBinPack` | reference implementations |
| `olragon/binpackingjs` | browser/TypeScript experimental backend |
| `bozokopic/opcut` | cutting-layout UX и pattern output |

### Integer optimization

| Проект/класс | Роль |
|---|---|
| OR-Tools | независимый integer oracle для малых/средних задач |
| SCIP / Cbc | exact/reference solves в research/CI |
| cutting-stock column-generation examples | master/pricing decomposition |
| printing-industry packing/scheduling research | datasets, objectives, stress tests |

Внешний solver не становится доверенной browser dependency. Его ответы проходят наши geometry/production validators.

## 4. Фактический progress ledger

| Этап | Статус | PR / основной результат |
|---|---|---|
| Архив и root cutover | **Завершён** | `#88`: архивная ветка, корень → `/app/`, legacy root удалён |
| G0 exact uniform geometry | **Завершён** | `#89`: immutable `GeometryPattern`, slots 0°/90°, validation |
| G0 application adapter | **Завершён** | `#90`: differential parity с текущей application geometry |
| G1 mixed-strip model | **Завершён** | `#91`: validated horizontal/vertical strip composition |
| G1 bounded generator | **Завершён** | `#92`: exact bounded strip enumeration и coverage |
| P0 single-product assignment | **Завершён** | `#93`: simplex/separate-duplex production patterns |
| P0 work-and-turn orbits | **Завершён** | `#94`: exact horizontal slot orbits, shared form, fixed blanks |
| P1 positive simplex allocations | **Завершён** | `#95`: один общий прогон, exact small allocation oracle |
| P1 simplex candidate columns | **Завершён** | `#97`: zero-count subsets, без run length |
| P1 separate-duplex columns | **Завершён** | `#100`: зеркальный оборот, two-form column contract |
| R0 simplex exact master | **Завершён** | `#99`: bounded exhaustive columns × integer run lengths |
| R0 generic production master | **Завершён** | `#102`: simplex и separate duplex через единый family adapter |
| R3-A random-small differential proof | **Завершён** | `#103`: 32 seeded cases против независимого exhaustive oracle |

Superseded PR `#85`, `#96`, `#98` и `#101` закрыты без merge как исторические или параллельные дубликаты уже объединённых реализаций. Они не являются источниками рабочего кода.

## 5. Реализованные contracts

### GeometryPattern

```text
src/geometric-pattern.js
src/uniform-grid-patterns.js
src/mixed-strip-patterns.js
src/current-uniform-geometry-adapter.js
```

Геометрия содержит реальные slots:

```js
{
  id,
  xMm,
  yMm,
  widthMm,
  heightMm,
  rotation,
  row,
  column
}
```

Геометрия не содержит тиражей, страниц, красочности, цен или рекомендаций.

### Production patterns и work-and-turn

```text
src/single-product-production-pattern.js
src/work-and-turn-slot-orbits.js
src/single-product-work-and-turn-pattern.js
src/multi-product-simplex-patterns.js
```

Доказаны:

- simplex;
- separate duplex;
- горизонтальный work-and-turn одного двустороннего изделия;
- физические paired/fixed slot orbits;
- технические пустые позиции;
- `physicalSheets = ceil(quantity / usefulPositions)`;
- отсутствие недопечатки;
- формы, пластины и passes считаются раздельно.

### Candidate columns

```text
src/multi-product-simplex-columns.js
src/multi-product-duplex-columns.js
```

Column описывает вклад **одного физического листа**:

- allocation counts по demand;
- реальные front/back cells;
- forms/plates/passes per column;
- structural и label-aware signatures;
- print-family compatibility.

Column намеренно не содержит:

- `runLength`;
- produced quantity;
- overrun/underproduction claim;
- рекомендацию.

### Exact small master

```text
src/exact-simplex-small-master.js
src/exact-production-small-master.js
```

Математическая модель:

```text
printed[i] = Σ(columnContribution[j,i] × run[j])
printed[i] >= required[i]
run[j] ∈ Z+, если column j выбрана
```

В текущей bounded exact области master:

- выбирает уникальные columns;
- перебирает положительные целые run lengths;
- запрещает недопечатку;
- сохраняет все конструктивно разные feasible plans;
- Pareto помечает, но не удаляет планы;
- считает sheets/forms/plates/passes/overrun/blanks;
- поддерживает одну совместимую simplex **или** separate-duplex family;
- не смешивает разные стратегии и GeometryPattern;
- считает exact BigInt state-space до поиска;
- отклоняет oversized search до enumeration;
- никогда не заявляет global completeness.

### Independent differential proof

```text
tests/exact-production-small-master-random.test.js
```

PR `#103` добавил независимый test-only exhaustive oracle, который не вызывает production master internals. Фиксированные seeds создают:

- 16 simplex cases;
- 16 separate-duplex cases;
- capacity `2…3`;
- `2…3` demand;
- `1…2` selected columns;
- maximum run length `2…3`;
- разные quantity vectors, input order и color counts.

Для каждой задачи совпадают:

- theoretical/evaluated state count;
- полный feasible structural-plan set;
- run vectors;
- production metrics;
- Pareto frontier;
- minimum value по sheets/forms/plates/passes/overrun/blanks;
- корректный пустой результат, когда bounded space не имеет feasible plan.

Это доказательство малой ограниченной области, а не claim о large-order completeness.

## 6. Закрытые proof fixtures

### Geometry

- uniform 0°/90°;
- printable boundaries;
- bleed/gap/common и separate cut;
- deterministic slots/signatures;
- mixed horizontal/vertical strips;
- zero overlap;
- exact bounded coverage.

### P0/P1

- один simplex/duplex вид;
- `8+8` при capacity 16;
- `10+5+1 blank` для тиражей `1000/500`;
- `4+4+4+4`;
- `4+3+2+1`;
- dedicated, mixed, partial и subset columns;
- demand count больше capacity;
- `1 2 3 4 → 4 3 2 1` на обороте;
- work-and-turn `4×4` и нечётная `3×3` с fixed blanks;
- одинаковая allocation space у simplex и duplex.

### Exact master

- simplex generic result совпадает со старым simplex oracle;
- mixed и dedicated plans сохраняются отдельно;
- duplex forms/plates/passes берутся из column contract;
- asymmetric `4+1` даёт пять пластин на duplex column;
- incompatible families/geometry/catalog coverage отклоняются;
- state-space limits проверяются до перебора;
- 32 random-small cases совпадают с независимым exhaustive oracle.

## 7. Текущая честная граница

Пока не реализованы:

- branch-and-bound и lower-bound pruning;
- restricted master для больших задач;
- pricing subproblem и column generation;
- несколько GeometryPattern в одном search;
- multi-product work-and-turn columns;
- work-and-tumble/perfecting;
- mixed physical product sizes в автоматическом search;
- named-ink compatibility;
- production cost inside universal master;
- machine zones/defects;
- operator case memory;
- подключение нового universal solver к `/app/`.

Текущий `/app/` продолжает использовать прежний проверенный bounded runtime. Новое ядро развивается отдельно и не выдаётся за подключённую пользовательскую функцию.

## 8. Следующий обязательный этап R1-A

Exact oracle уже доказан на выбранных и random-small fixtures. Следующий слой — bounded restricted master, который должен выдавать те же результаты на малых задачах, но не перечислять полное пространство больших задач.

### Контракт

- immutable request/result;
- одна совместимая column family и GeometryPattern;
- initial dedicated columns;
- несколько balanced mixed columns;
- canonical coefficient matrix `a[column,demand]`;
- deterministic branch order;
- demand lower bounds;
- incumbent feasible plans;
- branch-and-bound/pruning;
- explicit time/state/memory budgets;
- progress counters;
- cancel-safe partial result;
- upper/lower bounds и gap;
- `completeWithinRequestedSpace` только при доказанном завершении;
- `truncated` с причинами при остановке;
- все найденные structurally different feasible incumbents сохраняются.

### Обязательный differential gate

Для каждой маленькой задачи restricted master сравнивается с `exact-production-small-master`:

- minimum sheets;
- forms/plates/passes;
- per-demand output/overrun;
- feasible/Pareto set внутри заявленного режима сохранения;
- deterministic replay;
- zero underproduction.

Первый R1-A PR не включает pricing, UI, 20-file benchmark или Web Worker.

## 9. После R1-A: R2 pricing / column generation

```text
initial columns
→ restricted master
→ pricing ищет улучшающую production column
→ добавить только новую structural signature
→ повторить
→ final integer solve
```

Pricing использует те же immutable GeometryPattern и column validators. Heuristic column допускается как кандидат, но не как доказательство оптимума.

Цели:

- sheets;
- layout forms;
- color plates;
- press passes;
- overrun;
- cost;
- lexicographic objective order.

## 10. Поздний benchmark 20 файлов

`data/control-case.json` запускается после первого доказанного restricted master и pricing loop.

Известные точки:

- paper extreme: `3305` sheets;
- операторский вариант: `3395` sheets;
- операторский вариант: `4` impositions / `8` layout forms;
- underproduction: `0`.

Solver обязан найти paper extreme, compact-form extreme и промежуточные Pareto plans без чтения `data/control-layout-m3.json` как ответа.

## 11. Operator case memory

Подтверждённый case хранит:

- normalized input signature;
- выбранный production plan;
- metrics и pricing context;
- operator notes;
- validation version;
- source/approval metadata.

Case используется как benchmark, warm start и upper bound, но всегда повторно валидируется и пересчитывается.

## 12. Machine/operator constraints

Добавляются после доказанной базовой математики:

- gripper/side-lay zones;
- top/bottom/left/right preferences;
- cylinder defects;
- ink coverage и solid-fill risks;
- color compatibility;
- preferred/forbidden zones;
- common/separate cut constraints.

Различаются hard constraints, soft penalties и operator warnings.

## 13. Неприкосновенные правила

- zero underproduction;
- back строится только из validated front/source slots;
- geometry отделена от demand, pricing и DOM;
- layout forms и color plates не смешиваются;
- column не владеет run length;
- exact master не выдаётся за large-order solver;
- Pareto annotation не удаляет feasible source plans;
- benchmark answer не читается production solver;
- heuristic result не называется proven optimum;
- search limits и coverage всегда видимы;
- operator selection не заменяется recommendation;
- архивная ветка сохраняется до стабильного `1.0.0`.

## 14. Ближайшие PR

### R1-A1

- restricted-master request/result contract;
- canonical coefficient matrix;
- dedicated/balanced initial column selection;
- deterministic lower bounds;
- no pruning yet beyond immediately impossible branches.

### R1-A2

- branch-and-bound;
- incumbent management;
- progress/state/time budgets;
- exact-oracle parity fixtures.

### R1-A3

- separate-duplex parity;
- Pareto incumbent retention;
- cancellation/truncation evidence.

Каждый PR имеет одну измеримую цель и exact-head Quality. Полный Chromium/PDF workflow обязателен как regression даже для pure-code изменения.