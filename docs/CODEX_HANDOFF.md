# uImposition — передача разработки

Дата актуализации: **1 августа 2026**  
Репозиторий: `https://github.com/sunpole/uImposition`  
GitHub — единственный источник истины.

## 1. Точка передачи

- рабочая ветка: `main`;
- фактический post-R0 checkpoint: `a0fe6edb8092e706572493f2534cc698b935262e`;
- опубликованный checkpoint: `0.7.0-alpha.5`;
- release branch/tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- архив до universal-solver rebuild: `archive/pre-universal-solver-rebuild-2026-08-01`;
- основной backlog: Issue `#83`;
- G0, G1, P0, P1 и R0 exact small oracle завершены;
- следующий implementation layer: R1 restricted master contract;
- последний proof gate: PR `#103`, `405/405` tests.

## 2. Обязательный порядок чтения

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `README.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/CODEX_HANDOFF.md`;
6. `docs/ARCHITECTURE.md`;
7. `docs/ALGORITHM_AND_OPTIMIZATION.md`;
8. `docs/TEST_PLAN.md`;
9. `docs/REMAINING_WORK.md`;
10. `research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`;
11. `research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`;
12. `research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`;
13. `docs/PROJECT_CATALOG.md`;
14. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
15. Issue `#83`, open PR, latest Actions, branches, tags и Releases.

Документация, которая противоречит фактическому GitHub, исправляется до продолжения кода.

## 3. Назначение продукта

uImposition должен:

- принимать реальные листы, изделия, страницы, цветность, тиражи и цены;
- создавать геометрически корректные patterns;
- назначать в slots виды, страницы и стороны;
- подбирать один или несколько монтажей и целочисленные прогоны;
- никогда не допускать недопечатку;
- считать sheets, layout forms, color plates, passes, overrun и cost;
- сохранять конструктивно разные допустимые решения;
- показывать доказуемую границу поиска;
- оставлять выбор оператору;
- использовать подтверждённые cases как benchmark/warm start, но не как готовый ответ;
- позднее учитывать machine zones, defects и operator preferences.

## 4. Фактический runtime

Актуальный operator-first интерфейс находится в `app/`. Корневой `index.html` перенаправляет в `/app/`.

Работают:

- versioned application state;
- built-in/local sheet and press presets;
- product rows и TXT import;
- current uniform fitting `0°/90°`;
- page pairs и odd technical blank;
- validated front и mirrored back;
- separate duplex и ограниченный work-and-turn;
- production metrics/cost;
- lossless alternatives, objectives и selection;
- schemes/report/PDF;
- mobile/desktop regression.

Новый G/P/R solver foundation пока не подключён к runtime. Migration выполняется только отдельным PR после proof parity.

## 5. Архив

Ветка:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

содержит полное состояние до root cutover на commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

Не удалять ветку до стабильного `1.0.0` и отдельного решения владельца.

## 6. Solver architecture

```text
N — normalized demand/input
G — geometric patterns with explicit slots
P — production assignment/columns
R — integer run lengths and master plans
C — restricted master + pricing/column generation
M — machine/operator constraints
E — explanation/export/case memory
```

### Малые задачи

- exact exhaustive enumeration;
- brute-force oracle;
- deterministic structural signatures;
- explicit complete/truncated status;
- independent differential validation.

### Большие задачи

- initial production columns;
- restricted master;
- relaxed bounds/dual information;
- pricing subproblem;
- add only improving structural columns;
- final integer solve;
- independent validation/report.

Запрещено делать large-order search увеличением одного static candidate limit.

## 7. Завершённая реализация G

### PR #89–#90

- immutable GeometryPattern и slots;
- uniform `0°/90°` patterns;
- exact coordinates, bounds, no-overlap;
- current sheet/trim/press adapter;
- capacity differential agreement.

### PR #91–#92

- generalized mixed-strip contract;
- horizontal/vertical ordered guillotine strips;
- exact bounded `0°/90°` generation;
- honest coverage/truncation;
- mixed-capacity fixture better than both pure grids.

Остаются позже: arbitrary packing, mixed physical product sizes и external geometry oracles.

## 8. Завершённая реализация P

### PR #93–#94

- one-product simplex/separate-duplex;
- horizontal mirrored back;
- integer run and zero underproduction;
- horizontal work-and-turn slot orbits;
- paired/fixed/unmatched positions;
- shared-form metrics.

### PR #95, #97, #100

- exact all-positive multi-product simplex pattern;
- simplex candidate columns с zero-count subsets;
- separate-duplex candidate columns;
- dedicated/mixed/partial columns;
- explicit blank positions;
- no run length на уровне candidate column;
- exact BigInt column-space count;
- immutable validation/signatures.

Остаются позже: multi-product work-and-turn/work-and-tumble/perfecting и named-ink model.

## 9. Завершённый R0 exact small oracle

### PR #99

- bounded simplex master;
- unique column sets;
- positive integer runs;
- exact state-space count;
- lossless feasible plans;
- Pareto annotation;
- zero underproduction.

### PR #102

- общий master для simplex и separate-duplex families;
- forms/plates/passes выводятся из column contract;
- incompatible strategies/geometry/demands rejected;
- no global completeness claim.

### PR #103

- 32 deterministic random-small cases;
- independent exhaustive oracle;
- exact comparison of state counts, feasible plans, metrics, Pareto и objective minima;
- exact-head Quality: `405/405` tests.

R0 используется как proof oracle, а не как large-order runtime.

## 10. Superseded work

- PR `#85` закрыт: static candidate catalog не является large-order solver;
- PR `#96` закрыт: параллельный P1 prototype заменён каноническими modules;
- PR `#98` закрыт: stale duplex draft перенесён в PR `#100`.

Ветки можно читать как историю, но нельзя использовать их API как текущий contract.

## 11. Следующая кодовая цель

### R1-A — restricted master contract

Создать pure modules, не зависящие от конкретного LP/MIP backend:

```text
src/restricted-master-problem.js
src/restricted-master-solution.js
tests/restricted-master-problem.test.js
tests/restricted-master-solution.test.js
```

Минимальный contract:

```js
RestrictedMasterProblem {
  id,
  columnFamily,
  columnStrategy,
  geometrySignature,
  demands,
  columns,
  coefficients,
  objectiveDefinitions,
  lowerBounds,
  requestedScope,
  structuralSignature
}
```

Coefficient matrix:

```text
a[p,i] = positionsPerSheet demand i in production column p
```

Solution model:

```js
RestrictedMasterSolution {
  status,
  solveType,
  columnRuns,
  producedByDemand,
  lowerBound,
  upperBound,
  gap,
  metrics,
  coverage,
  structuralSignature
}
```

Acceptance:

- one contract for simplex and separate-duplex catalogs;
- exact canonical coefficient matrix;
- dedicated/mixed/subset columns retained;
- duplicate/incompatible columns rejected;
- integer and relaxed values distinguished;
- missing bound/gap never converted to zero;
- restricted optimum explicitly differs from global optimum;
- small fixture projection agrees with R0 exact oracle;
- no DOM, pricing UI, worker или PDF dependency.

## 12. Следующая последовательность

1. R1-A restricted-master problem/solution contract;
2. R1-B bounded integer/relaxed backend;
3. external OR-Tools/SCIP/Cbc differential fixtures;
4. R2 pricing request/response contract;
5. first deterministic pricing subproblem;
6. bounded master → pricing loop;
7. historical 20-file benchmark;
8. operator case memory;
9. machine constraints;
10. runtime/report/PDF migration;
11. separate alpha.6 release gate.

## 13. Production invariants

1. Underproduction is always invalid.
2. Back is derived only from validated front/transform.
3. Geometry is separate from demand, colors and pricing.
4. Layout forms and color plates are separate metrics.
5. Missing cost/bound/gap stays unavailable.
6. Operator selection is independent from recommendation.
7. Catalog filters never delete source plans.
8. Fixture/case answers are never trusted without recalculation.
9. Heuristic/restricted result is not called proven global optimum.
10. Search scope, bounds, coverage and truncation are explicit.
11. Renderer does not own production formulas.
12. Version/release work is separate from feature work.

## 14. Quality and PR process

```text
one measurable goal
→ feature branch
→ PR
→ exact-head npm run check
→ Chromium/PDF only when runtime/export changes
→ artifact/log inspection
→ merge
```

No pure solver PR implies version bump, tag, Release или production-ready status.
