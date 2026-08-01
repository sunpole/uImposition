# uImposition — текущее фактическое состояние

Последнее обновление: **1 августа 2026**.

## 1. Repository checkpoint

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- universal-solver proof baseline: merge PR `#103`, commit `a0fe6edb8092e706572493f2534cc698b935262e`;
- опубликованный prerelease остаётся `0.7.0-alpha.5`;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch/tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- `VERSION.json` намеренно остаётся на последнем опубликованном checkpoint;
- `productionReady` остаётся `false`;
- GitHub — единственный источник истины.

## 2. Архив до rebuild

Постоянная ветка:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

Архивный commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

Архив сохраняет прежний root UI, `/app/`, calculation modules, tests, fixtures и документацию. Его нельзя удалять до стабильного `1.0.0` и отдельного решения владельца.

## 3. Рабочий пользовательский маршрут

Корневой GitHub Pages URL перенаправляется в актуальный `/app/`.

```text
sheet/press preset
→ виды продукции
→ live calculation
→ сравнение вариантов
→ выбор плана
→ лицо / зеркальный оборот / общая форма
→ production metrics
→ PDF
```

В опубликованном приложении поддерживаются:

- local state и presets;
- product rows и TXT import;
- uniform grids 0°/90°;
- odd technical blank;
- verified front и mirrored back;
- separate duplex;
- ограниченная user work-and-turn family;
- alternatives, priorities, selection и costing;
- schemes, report и PDF;
- responsive desktop/mobile UI.

Новый universal-solver core пока **не подключён** к пользовательскому `/app/`. Прежний runtime остаётся рабочим до отдельного integration gate.

## 4. Research и документация

PR `#86` объединил аудит 50 GitHub-репозиториев по page imposition, prepress, packing, cutting stock, integer optimization и printing scheduling.

PR `#87` перенёс устойчивые выводы в:

- `docs/ARCHITECTURE.md`;
- `docs/ALGORITHM_AND_OPTIMIZATION.md`;
- `docs/TEST_PLAN.md`;
- `docs/REMAINING_WORK.md`.

Актуальный подробный contract:

- `research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`.

## 5. Целевая solver architecture

```text
N — normalized demand and machine input
G — geometry patterns with explicit slots
P — product/page/side assignment
R — integer run lengths
C — restricted master and pricing/column generation
M — machine/operator constraints
E — explanation, export and case memory
```

Малые задачи решаются полным перебором как proof oracle. Большие задачи должны использовать restricted master и on-demand pricing/column generation. Простое увеличение exact limits запрещено как основной large-order путь.

## 6. Завершённый pure-core progress

### Архив и root

- PR `#88`: архивная ветка, корень → `/app/`, legacy root исключён из рабочего `main`.

### Geometry G0/G1

- PR `#89`: immutable `GeometryPattern`, exact uniform slots 0°/90°;
- PR `#90`: adapter и differential parity с application geometry;
- PR `#91`: validated mixed horizontal/vertical strip model;
- PR `#92`: bounded exact mixed-strip generator и coverage.

```text
src/geometric-pattern.js
src/uniform-grid-patterns.js
src/mixed-strip-patterns.js
src/current-uniform-geometry-adapter.js
```

### Production assignment P0/P1

- PR `#93`: single-product simplex/separate-duplex production patterns;
- PR `#94`: horizontal work-and-turn slot orbits и shared form;
- PR `#95`: positive multi-product simplex allocations с одним общим прогоном;
- PR `#97`: run-length-free simplex candidate columns с zero-count subsets;
- PR `#100`: run-length-free separate-duplex candidate columns и зеркальный оборот.

```text
src/single-product-production-pattern.js
src/work-and-turn-slot-orbits.js
src/single-product-work-and-turn-pattern.js
src/multi-product-simplex-patterns.js
src/multi-product-simplex-columns.js
src/multi-product-duplex-columns.js
```

### Exact master R0

- PR `#99`: bounded exact simplex small master;
- PR `#102`: generic exact production master для одной совместимой simplex или separate-duplex family.

```text
src/exact-simplex-small-master.js
src/exact-production-small-master.js
```

Master:

- выбирает уникальные candidate columns;
- назначает положительные integer run lengths;
- запрещает недопечатку;
- сохраняет lossless feasible plans;
- Pareto помечает, но не удаляет;
- считает sheets/forms/plates/passes/overrun/blanks;
- проверяет complete non-truncated input catalog;
- запрещает смешение column families, strategies и geometry patterns;
- считает exact BigInt state space;
- отклоняет oversized exact search до enumeration;
- не заявляет global completeness.

### Independent differential proof R3-A

PR `#103` добавил отдельный exhaustive test oracle:

```text
tests/exact-production-small-master-random.test.js
```

Фиксированные seeds создают:

- 16 random-small simplex cases;
- 16 random-small separate-duplex cases;
- capacity 2–3;
- 2–3 demands;
- 1–2 selected columns;
- max run length 2–3;
- разные quantities, input order и color counts.

Для всех 32 задач production master и независимый oracle совпадают по:

- theoretical/evaluated state count;
- полному feasible structural-plan set;
- run vectors;
- sheets/forms/plates/passes/overrun/blanks;
- Pareto frontier;
- minima каждой objective;
- отсутствию feasible result, когда bounded space его действительно не содержит.

## 7. Закрытые proof cases

- exact uniform 0°/90° slots;
- bounded mixed strips;
- simplex и separate duplex одного вида;
- horizontal work-and-turn с paired/fixed slot orbits;
- `8+8`;
- `10+5+1 blank`;
- `4+4+4+4`;
- `4+3+2+1`;
- dedicated/mixed/partial/subset columns;
- demand count больше capacity;
- row back mapping `1 2 3 4 → 4 3 2 1`;
- asymmetric duplex `4+1` с пятью пластинами;
- simplex master parity со старым exact oracle;
- duplex forms/plates/passes из фактического column contract;
- 32 random-small tasks против независимого oracle;
- deterministic signatures, immutability и corruption rejection.

## 8. Superseded branches и PR

- PR `#85` закрыт после research gate;
- PR `#96` закрыт как дубликат PR `#95`;
- PR `#98` и `#101` закрыты как дубликаты PR `#100`.

Их ветки не являются источником истины. Рабочий код читается только из `main`.

## 9. Честная граница universal core

Пока отсутствуют:

- branch-and-bound и lower-bound pruning;
- restricted master для больших задач;
- pricing subproblem и column generation;
- несколько GeometryPattern в одном search;
- multi-product work-and-turn columns;
- work-and-tumble/perfecting;
- automatic mixed physical sizes inside production search;
- named-ink compatibility;
- production cost inside universal master;
- machine zones/defects;
- operator case memory;
- `/app/` integration.

Текущие exact modules являются доказательным oracle для малых bounded областей, а не production large-order solver.

## 10. Следующий обязательный этап — R1 bounded restricted master

Новый search layer должен:

- начинать с dedicated и нескольких balanced mixed columns;
- использовать canonical coefficient matrix;
- вычислять demand lower bounds;
- поддерживать incumbent feasible plans;
- применять deterministic branch-and-bound;
- иметь state/time/memory budgets;
- выдавать progress и cancel-safe partial result;
- показывать upper/lower bounds и gap;
- явно различать complete и truncated;
- сохранять structurally different feasible incumbents;
- совпадать с exact oracle на каждой маленькой задаче;
- не включать pricing, UI или 20-file benchmark в первый PR.

## 11. После R1 — pricing и column generation

```text
initial columns
→ restricted master
→ pricing finds improving column
→ add structurally new column
→ repeat
→ final integer restricted master
```

Каждая generated column проходит существующие geometry/production validators. Heuristic result не называется доказанным optimum.

## 12. Поздний control benchmark

`data/control-case.json` запускается после доказанного restricted master и первого pricing loop.

Ориентиры:

- paper extreme: `3305` sheets;
- operator plan: `3395` sheets;
- operator plan: `4` impositions / `8` layout forms;
- underproduction: `0`.

Solver не читает `data/control-layout-m3.json` как готовый ответ.

## 13. Quality state

Обязательные проверки:

```text
npm run check:docs
npm run check:source
npm test
```

Каждый PR дополнительно проходит полный Chromium/PDF regression, даже если UI не менялся. Runtime/UI/PDF изменение требует visual artifact review.

## 14. Release status

- published version остаётся `0.7.0-alpha.5`;
- pure-core PR не выпускает `alpha.6` автоматически;
- version/recovery branch/tag/Release/uNews создаются отдельным release gate;
- root cutover не означает production-ready или stable;
- owner acceptance `/app/` остаётся отдельным решением.

## 15. Неприкосновенные правила

- zero underproduction;
- back derived only from validated front/source slots;
- geometry separated from demand, pricing and DOM;
- layout forms separated from color plates;
- candidate column never owns run length;
- missing cost remains unavailable;
- operator selection remains explicit;
- fixtures/cases are never trusted without recalculation;
- heuristic result is not called proven optimum;
- search limits and coverage are visible;
- Pareto annotation does not delete source plans;
- archive branch remains recoverable.