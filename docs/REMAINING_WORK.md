# uImposition — актуальный остаток до 1.0

Дата актуализации: **1 августа 2026 года**.

Исследовательская основа:

- [`../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md);
- [`../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md).

## 1. Текущая точка

Опубликованный prerelease остаётся `0.7.0-alpha.5`.

После него в `main` уже добавлены и проверены:

- operator-first `/app/`;
- persistent desktop navigation и mobile adaptation;
- independent front/back colors;
- odd-page technical blanks;
- verified mirrored back;
- user work-and-turn shared plate;
- compact control-order input;
- full display of every generated imposition;
- bounded search contract;
- audit 50 GitHub repositories и revised solver architecture.

Root cutover и выпуск `0.7.0-alpha.6` по-прежнему требуют отдельной owner acceptance. Новый solver не должен автоматически переключать корневой сайт.

## 2. Что доказано и сохраняется

- trim и press margins;
- uniform fitting 0°/90°;
- page-pair expansion;
- deterministic front и derived mirrored back;
- odd-page blank semantics;
- independent production validation;
- paper-minimum lower-bound proof для контрольного input/capacity;
- layout forms, color plates и passes как разные metrics;
- guarded pricing/cost;
- lossless feasible catalog;
- Pareto/ranking/recommendation;
- explicit operator selection;
- selected plan scheme/report/PDF consistency;
- shared-plate work-and-turn для текущей ограниченной family;
- bounded complete/truncated search contract;
- desktop/mobile Chromium и PDF regression.

Эти возможности не переписываются одним большим PR.

## 3. Главный архитектурный вывод аудита

Большой заказ нельзя решать предварительным перечислением и хранением всех возможных монтажей.

Основной путь:

```text
normalization
→ geometric patterns
→ print-aware assignment
→ restricted master
→ pricing/column generation
→ integer plan
→ independent validation
→ lossless alternatives
```

Полный static catalog остаётся только малым exact oracle.

## 4. Research/documentation gate — завершён

- [x] исследовать не менее 50 репозиториев;
- [x] разделить PDF imposition, geometry packing и production optimization;
- [x] проверить сильнейшие core/test/license sources;
- [x] зафиксировать pluggable geometry;
- [x] выбрать restricted master + pricing/column generation;
- [x] определить роль operator cases;
- [x] определить роль external solvers как oracles;
- [x] объединить research PR `#86`;
- [x] пересмотреть `ARCHITECTURE.md`;
- [x] пересмотреть `ALGORITHM_AND_OPTIMIZATION.md`;
- [x] пересмотреть `TEST_PLAN.md`;
- [x] пересмотреть этот backlog.

## 5. Immediate D1 — решение по draft PR #85

PR #85 не сливается как large-order solver.

Требуется:

- [ ] переименовать модуль и API в small-space exhaustive oracle;
- [ ] сохранить BigInt exact candidate count;
- [ ] сохранить deterministic structural signatures;
- [ ] сохранить complete/truncated coverage;
- [ ] ограничить назначение малым finite space;
- [ ] добавить явное предупреждение против увеличения limits для больших заказов;
- [ ] связать oracle с будущим geometry-pattern interface;
- [ ] использовать его в differential tests pricing subproblem;
- [ ] закрыть или заменить PR #85, если чистая переработка создаёт более понятную историю.

## 6. G0 — exact uniform geometry

Первый следующий code milestone.

- [ ] ввести immutable `GeometricPattern` и `Slot` models;
- [ ] pure 0° grid;
- [ ] pure 90° grid;
- [ ] exact coordinates;
- [ ] trim/press margins;
- [ ] bleed/gap/cut family;
- [ ] occupied/waste area;
- [ ] deterministic structural signature;
- [ ] `completeWithinPureGridSpace` status;
- [ ] G001–G003, G005–G007 fixtures/property tests;
- [ ] adapter из текущих placement options без поломки `/app/`.

## 7. G1 — mixed-orientation strips

- [ ] horizontal strips;
- [ ] vertical strips;
- [ ] 0°/90° per strip;
- [ ] exact/bounded integer strip boundaries;
- [ ] no overlap and boundary proof;
- [ ] G004 fixture, где mixed лучше обеих pure grids;
- [ ] multiple materially different patterns retained;
- [ ] exact/truncated status;
- [ ] performance budget.

## 8. G2/G3 — general packing и external oracles

### Internal heuristic backends

- [ ] MaxRects adapter;
- [ ] Skyline adapter;
- [ ] Guillotine adapter;
- [ ] deterministic sorting/scoring profiles;
- [ ] clear heuristic status;
- [ ] no false global optimum claim.

### Differential research harness

- [ ] record exact external repo/version/commit;
- [ ] run selected fixtures through `rectpack`;
- [ ] run selected fixtures through PackingSolver;
- [ ] compare capacity, coordinates and validity;
- [ ] preserve only license-compatible fixture outputs;
- [ ] block reuse when license metadata conflicts.

## 9. P0 — basic production assignment

### Simplex

- [ ] one kind;
- [ ] multiple kinds;
- [ ] integer allocations inside one geometry pattern;
- [ ] exact run calculation;
- [ ] zero underproduction;
- [ ] P001, P006–P010 tests.

### Separate duplex

- [ ] geometry slots independent from page assignment;
- [ ] front primary structure;
- [ ] transform-generated back;
- [ ] horizontal short-edge mirror;
- [ ] odd-page blanks;
- [ ] independent side activity/forms/plates/passes;
- [ ] P002–P003 tests.

### Work-and-turn

- [ ] explicit `T(slot)` model;
- [ ] involution validation;
- [ ] paired and fixed slot orbits;
- [ ] horizontal reflection;
- [ ] vertical reflection as separate capability;
- [ ] 180° transform as separate capability;
- [ ] shared plate and control views;
- [ ] P004–P005 tests.

## 10. R0 — exhaustive small master oracle

- [ ] small finite set of production patterns;
- [ ] bounded integer run lengths;
- [ ] complete plan enumeration;
- [ ] exact zero-underproduction filtering;
- [ ] structural plan signatures;
- [ ] full Pareto frontier;
- [ ] brute-force random-small oracle;
- [ ] R001–R005 tests;
- [ ] explicit maximum problem size.

Этот этап должен быть медленным, но доказательным. Он нужен как oracle, а не как final large-order runtime.

## 11. R1 — restricted master interface

- [ ] canonical coefficient matrix `a[p,i]`;
- [ ] initial columns from dedicated/paper-minimum/work-and-turn;
- [ ] operator-case warm-start columns;
- [ ] integer and relaxed solution models;
- [ ] bounds/gap/counters;
- [ ] production metrics projection;
- [ ] no DOM dependency;
- [ ] external OR-Tools/SCIP/Cbc differential fixtures for small problems.

## 12. R2 — first pricing subproblem

- [ ] pricing request/response contract;
- [ ] dual-value input;
- [ ] geometry-pattern selection;
- [ ] assignment generation;
- [ ] reduced-cost calculation;
- [ ] canonical deduplication;
- [ ] add only improving columns;
- [ ] deterministic tie-breaking;
- [ ] R006 test against full small catalog;
- [ ] honest no-column/truncated distinction.

## 13. R3 — bounded column-generation loop

- [ ] master → pricing iterations;
- [ ] time/state/memory limits;
- [ ] cancellation;
- [ ] progress events;
- [ ] upper/lower bounds and gap;
- [ ] final integer restricted master;
- [ ] partial feasible plans retained;
- [ ] complete/truncated status;
- [ ] R007–R008 tests;
- [ ] no global claim without proof.

## 14. Control benchmark integration

Только после G0/G1/P0/R0/R1/R2.

`data/control-case.json`:

- [ ] production solver читает только input;
- [ ] `data/control-layout-m3.json` используется только как oracle/evidence;
- [ ] paper-first сохраняет 3305-sheet extreme;
- [ ] forms-first находит plan не хуже 4 impositions / 8 layout forms или объясняет validated better plan;
- [ ] intermediate Pareto plans retained;
- [ ] zero underproduction;
- [ ] pricing changes recommendation correctly;
- [ ] exact selected plan drives screen/report/PDF;
- [ ] no special-case file IDs in production code.

## 15. Layer C — operator case memory

- [ ] versioned case schema;
- [ ] exact input signature;
- [ ] structural similarity signature;
- [ ] normalized quantity ratios;
- [ ] approved plan and rejected alternatives;
- [ ] operator reason;
- [ ] pricing and machine snapshot;
- [ ] solver version;
- [ ] warm-start validation;
- [ ] exact-case and analogous-case tests;
- [ ] UI to save a selected plan as operator evidence;
- [ ] no silent automatic selection from memory.

## 16. Layer M — machine and placement constraints

Добавляется после базовой G/P/R корректности.

- [ ] machine profile;
- [ ] gripper/side-lay direction;
- [ ] top/bottom/left/right/center zones;
- [ ] defects/forbidden areas;
- [ ] quality classes;
- [ ] ink coverage/solid fill;
- [ ] color compatibility;
- [ ] preferred/forbidden zones;
- [ ] adjacency/separation rules;
- [ ] hard/soft/operator-only distinction;
- [ ] explanations;
- [ ] M001–M004 fixtures.

## 17. Heavy-search worker

- [ ] Web Worker boundary only around search;
- [ ] progress;
- [ ] cancel;
- [ ] time/state/memory budgets;
- [ ] deterministic request signature;
- [ ] safe partial results;
- [ ] no private data upload;
- [ ] UI remains responsive;
- [ ] resume/retry only when deterministic and validated.

## 18. Comparison and operator UX

Existing lossless comparison work is reused.

- [ ] compact expert table;
- [ ] all/Pareto/recommended/dominated filters;
- [ ] only differences;
- [ ] sorting by any metric;
- [ ] plan-family/duplex/geometry filters;
- [ ] proof/heuristic/truncated column;
- [ ] bounds/gap/progress;
- [ ] selected plan highlighted independently;
- [ ] exact component deltas;
- [ ] mobile and dense desktop modes;
- [ ] no page-level horizontal overflow.

## 19. Mixed physical product sizes

После G2 и stable R-loop:

- [ ] multiple product rectangles on one sheet;
- [ ] compatibility groups;
- [ ] individual bleed/gap/cut;
- [ ] common/separate cut constraints;
- [ ] multiple valid packings;
- [ ] cutting complexity;
- [ ] compare uniform and mixed patterns;
- [ ] supplied fixture remains validation oracle;
- [ ] no automatic claim from a manually supplied layout.

## 20. One-sided, folded and advanced duplex products

### Simplex/odd

Базовая support уже есть частично; после new architecture требуется regression parity:

- [ ] explicit simplex production family;
- [ ] intentional blank back;
- [ ] correct forms/plates/cost;
- [ ] no fake side.

### Folded/signature imposition

- [ ] separate product family;
- [ ] signatures and folding rules;
- [ ] creep/binding direction;
- [ ] page order after folding;
- [ ] no mixing with flat gang-run assumptions.

### Advanced duplex

- [ ] work-and-tumble;
- [ ] perfecting;
- [ ] machine-specific transforms;
- [ ] independent fixtures and warnings.

## 21. Persistence and portability

- [ ] versioned project schema;
- [ ] auto-save input/operator state;
- [ ] JSON export/import;
- [ ] migrations;
- [ ] case library export/import;
- [ ] pricing profile;
- [ ] objective preference;
- [ ] selected plan reference with recalculation;
- [ ] safe recovery from corrupted/incompatible data.

## 22. Cost and profitability

- [ ] cutting/setup/changeover costs;
- [ ] finishing/binding;
- [ ] revenue;
- [ ] profit/loss;
- [ ] margin;
- [ ] explicit business thresholds;
- [ ] unprofitable plans remain visible;
- [ ] no hidden coefficients.

## 23. Beta matrix

- [ ] all sheet presets and arbitrary sheets;
- [ ] standard and custom products;
- [ ] square, narrow and wide rectangles;
- [ ] equal and very different quantities;
- [ ] 1..capacity kinds in small fixtures;
- [ ] large anonymized orders;
- [ ] simplex/separate/work-and-turn;
- [ ] odd pages;
- [ ] multiple colors;
- [ ] trim/margins/bleed/gap extremes;
- [ ] mixed orientations;
- [ ] mixed product sizes;
- [ ] machine zones/defects;
- [ ] browser/performance matrix;
- [ ] worker failure recovery.

## 24. Release and root cutover

`0.7.0-alpha.6` не создаётся автоматически только из-за завершения research/docs.

Перед выпуском:

- [ ] owner acceptance текущего `/app/`;
- [ ] определить точную функциональную границу alpha.6;
- [ ] exact-head Quality;
- [ ] exact-head Chromium/PDF;
- [ ] focused evidence manually reviewed;
- [ ] current docs/status/version/changelog;
- [ ] recovery branch;
- [ ] immutable tag;
- [ ] GitHub prerelease and assets;
- [ ] root cutover только по отдельному подтверждению.

## 25. Принципы, которые сохраняются до 1.0

- user chooses; software recommends;
- zero underproduction;
- geometry and production are separate layers;
- back/shared plate comes from one verified structure;
- layout forms and color plates stay separate;
- missing money is not zero;
- feasible alternatives inside declared scope are not hidden;
- structural variants are not merged by metrics alone;
- heuristic is not proof;
- truncation is visible;
- external and saved plans are revalidated;
- operator cases are memory, not hardcoded answers;
- PDF/report use the exact selected plan;
- every release has immutable evidence and recovery checkpoint.