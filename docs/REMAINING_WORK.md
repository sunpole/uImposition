# uImposition — актуальный остаток до 1.0

Дата актуализации: **1 августа 2026 года**.  
Pure-core baseline: merge PR `#102`, commit `9d16a24eec2cf437731ef6a5e74b182d8fa6eaa5`.

Исследовательская основа:

- [`../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md);
- [`../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md);
- [`../research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`](../research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md).

## 1. Текущая точка

Опубликованный prerelease остаётся `0.7.0-alpha.5`. Корневой GitHub Pages URL уже ведёт в актуальный `/app/`, но новый universal-solver core пока не подключён к пользовательскому runtime.

Завершены:

- архив и root cutover;
- G0 uniform geometry и application adapter;
- G1 mixed-strip geometry и bounded generator;
- P0 single-product simplex/separate duplex;
- P0 horizontal work-and-turn slot orbits;
- P1 multi-product simplex allocations;
- P1 simplex candidate columns;
- P1 separate-duplex candidate columns;
- R0 exact simplex master;
- R0 generic exact production master для simplex/separate-duplex families.

Фактический ledger: PR `#88`–`#102`. Superseded PR `#85`, `#96`, `#98`, `#101` не являются рабочим кодом.

## 2. Что уже доказано

### Geometry

- immutable GeometryPattern и explicit slots;
- exact uniform 0°/90°;
- printable boundaries, bleed, gap и cut semantics;
- deterministic structural signatures;
- horizontal/vertical mixed strips;
- bounded exact coverage и no-overlap validation.

### Production assignment

- simplex и separate duplex одного вида;
- horizontal work-and-turn через actual slot orbits;
- paired/fixed slots и технические blanks;
- multi-product allocations;
- dedicated, mixed, partial и subset columns;
- `8+8`, `10+5+1 blank`, `4+4+4+4`, `4+3+2+1`;
- demand count больше geometry capacity внутри subset catalog;
- зеркальный оборот `1 2 3 4 → 4 3 2 1`;
- формы, пластины и passes разделены.

### Exact small master

- bounded unique columns × positive integer run lengths;
- exact BigInt state count;
- pre-enumeration refusal для oversized space;
- zero underproduction;
- lossless feasible plan set;
- Pareto annotation без удаления;
- sheets/forms/plates/passes/overrun/blanks;
- одна совместимая simplex или separate-duplex family;
- no mixed strategy/geometry catalog;
- no global-completeness claim.

## 3. Неприкосновенная архитектура

```text
N — normalization
G — geometry patterns
P — product/page/side assignment
R — integer runs
C — restricted master + pricing/column generation
M — machine/operator constraints
E — explanation/export/case memory
```

Запрещено:

- решать large orders увеличением exact limits;
- смешивать geometry и demand/pricing/DOM;
- хранить run length внутри candidate column;
- выдавать heuristic за proven optimum;
- читать benchmark answer как production result;
- удалять feasible plans при Pareto/ranking;
- скрывать search limits и truncation;
- удалять архивную ветку до stable `1.0.0`.

## 4. Следующий gate R3-A — independent differential proof

### R3-A1: simplex random-small

- [ ] отдельный brute-force oracle без вызова master internals;
- [ ] deterministic seeded case generator;
- [ ] capacity `1…6`;
- [ ] demand count `1…4`;
- [ ] small quantity vectors;
- [ ] разные `maxSelectedColumns` и `maxRunLength`;
- [ ] exact feasible structural-plan set parity;
- [ ] minimum sheets parity;
- [ ] per-demand output/overrun parity;
- [ ] Pareto parity;
- [ ] deterministic replay;
- [ ] zero-underproduction property.

### R3-A2: separate duplex

- [ ] тот же independent oracle для duplex columns;
- [ ] sheets/output parity с simplex при одинаковых allocations;
- [ ] family-specific forms/plates/passes;
- [ ] asymmetric `4+1`, `1+4`, `4+4`, `1+1`;
- [ ] back mirror corruption tests;
- [ ] no blank printed side;
- [ ] family/strategy mixing rejected.

### Property tests

- [ ] увеличение demand не уменьшает proven minimum sheets;
- [ ] увеличение capacity не ухудшает minimum при сохранении старых columns;
- [ ] input-row permutation не меняет normalized result;
- [ ] every feasible plan has zero underproduction;
- [ ] repeated solve yields byte-identical signatures and metrics.

R3-A должен завершиться до оптимизации exact master или начала large-order heuristics.

## 5. R1 — bounded restricted master

Цель: получить production-oriented search, который остаётся проверяемым exact oracle на малых задачах.

- [ ] canonical coefficient matrix `a[column,demand]`;
- [ ] initial dedicated columns;
- [ ] initial balanced mixed columns;
- [ ] optional operator-case warm-start columns;
- [ ] demand lower bounds;
- [ ] incumbent feasible plans;
- [ ] deterministic branch order;
- [ ] branch-and-bound/pruning;
- [ ] time/state/memory budgets;
- [ ] progress counters;
- [ ] cancellation;
- [ ] partial feasible plans retained;
- [ ] complete/truncated distinction;
- [ ] upper/lower bounds and gap;
- [ ] differential parity с R0 на всех маленьких cases;
- [ ] no DOM dependency.

Первый R1 PR не должен включать pricing, UI или benchmark 20 файлов.

## 6. R2 — pricing subproblem

- [ ] pricing request/response contract;
- [ ] master penalties/dual-like input;
- [ ] selection of GeometryPattern;
- [ ] assignment generation;
- [ ] reduced-cost or lexicographic-improvement score;
- [ ] canonical deduplication;
- [ ] add only structurally new improving columns;
- [ ] deterministic ties;
- [ ] explicit no-improving-column result;
- [ ] truncated pricing status;
- [ ] exact small comparison against complete column catalog;
- [ ] geometry and production validation of every generated column.

External OR-Tools/SCIP/Cbc may be used as CI/research oracles, not mandatory browser dependencies.

## 7. R3-B — bounded column-generation loop

```text
initial columns
→ restricted master
→ pricing
→ add new columns
→ repeat
→ final integer restricted master
```

- [ ] iteration contract;
- [ ] progress events;
- [ ] time/state/memory limits;
- [ ] cancel-safe result;
- [ ] lower/upper bound history;
- [ ] final integer plan;
- [ ] incomplete results visibly marked;
- [ ] all feasible incumbents retained;
- [ ] no global claim without proof;
- [ ] small-case parity with complete R0 catalog.

## 8. Cost and decision integration

После математической parity R3-A:

- [ ] paper cost;
- [ ] layout-form preparation cost;
- [ ] color plate cost;
- [ ] press pass/setup cost;
- [ ] cutting/finishing costs;
- [ ] explicit missing-price state;
- [ ] lexicographic objectives;
- [ ] total-cost objective;
- [ ] component deltas;
- [ ] Pareto annotations;
- [ ] operator selection independent from recommendation;
- [ ] cost changes rerank without corrupting geometry or output.

## 9. Additional production families

### Multi-product work-and-turn

- [ ] shared-form candidate column contract;
- [ ] slot orbit allocation for several demands;
- [ ] fixed/unmatched blanks;
- [ ] named-ink compatibility;
- [ ] forms/plates/passes projection;
- [ ] exact small catalog;
- [ ] master differential tests.

### Advanced duplex

- [ ] vertical work-and-turn transform;
- [ ] work-and-tumble;
- [ ] perfecting;
- [ ] machine-specific transform profiles;
- [ ] independent fixtures and warnings.

### Simplex/odd parity

- [ ] intentional blank back as explicit family;
- [ ] odd technical page in universal demand model;
- [ ] no fake form/plate/pass;
- [ ] parity with current `/app/` behavior.

## 10. G2/G3 — general packing and external geometry oracles

### Internal backends

- [ ] MaxRects adapter;
- [ ] Skyline adapter;
- [ ] Guillotine adapter;
- [ ] deterministic sorting/scoring profiles;
- [ ] heuristic status;
- [ ] multiple materially different packings retained;
- [ ] no false global optimum claim.

### Differential harness

- [ ] pin external repository/version/commit;
- [ ] compare selected fixtures with `rectpack`;
- [ ] compare selected fixtures with PackingSolver;
- [ ] verify capacity, coordinates and validity;
- [ ] preserve only license-compatible fixture outputs;
- [ ] isolate external tools from browser runtime.

## 11. Mixed physical product sizes

После stable G2 и R-loop:

- [ ] several product rectangles on one sheet;
- [ ] compatibility groups;
- [ ] individual bleed/gap/cut;
- [ ] common/separate-cut constraints;
- [ ] multiple valid geometry patterns;
- [ ] cutting complexity;
- [ ] compare uniform and mixed patterns;
- [ ] supplied historical layout remains validation oracle only.

## 12. Control benchmark — 20 files

Запускается только после R3-A и первого restricted master.

`data/control-case.json`:

- [ ] solver reads input only;
- [ ] `data/control-layout-m3.json` is oracle/evidence only;
- [ ] find paper extreme `3305` sheets;
- [ ] find compact plan no worse than `4` impositions / `8` layout forms or validated better result;
- [ ] retain intermediate Pareto plans;
- [ ] zero underproduction;
- [ ] no special-case file IDs;
- [ ] price changes recommendation correctly;
- [ ] selected plan drives screen/report/PDF only after integration gate.

## 13. Operator case memory

- [ ] versioned case schema;
- [ ] exact input signature;
- [ ] structural similarity signature;
- [ ] normalized quantity ratios;
- [ ] approved plan and rejected alternatives;
- [ ] operator reason;
- [ ] pricing and machine snapshot;
- [ ] solver/validator version;
- [ ] warm-start validation;
- [ ] exact and analogous case tests;
- [ ] no silent automatic selection from memory.

Cases are benchmark, warm start and upper bound, never unconditional answers.

## 14. Machine/operator constraints

Добавляются после доказанной базовой G/P/R корректности.

- [ ] machine profile;
- [ ] gripper/side-lay direction;
- [ ] top/bottom/left/right/center zones;
- [ ] defects/forbidden areas;
- [ ] ink coverage and solid-fill risk;
- [ ] named-color compatibility;
- [ ] preferred/forbidden zones;
- [ ] adjacency/separation rules;
- [ ] hard/soft/operator-only distinction;
- [ ] explanations and fixtures.

## 15. Heavy-search worker

- [ ] Web Worker around search only;
- [ ] immutable request/result messages;
- [ ] progress;
- [ ] cancel;
- [ ] time/state/memory budgets;
- [ ] deterministic request signature;
- [ ] safe partial results;
- [ ] no private data upload;
- [ ] responsive UI;
- [ ] validated resume/retry only.

## 16. `/app/` integration gate

Universal core подключается к пользователю только после R3-A parity.

- [ ] feature flag / parallel calculation route;
- [ ] same normalized input as current workspace;
- [ ] old and new solver differential display for development;
- [ ] no automatic replacement of selected production plan;
- [ ] proof/coverage/truncation visible;
- [ ] all found variants available;
- [ ] selected universal plan drives scheme/report/PDF;
- [ ] mobile and dense desktop layouts;
- [ ] no page-level horizontal overflow;
- [ ] full Chromium/PDF evidence;
- [ ] owner acceptance.

## 17. Folded/signature imposition

Отдельная product family, не смешиваемая с flat gang-run assumptions:

- [ ] signatures;
- [ ] folding rules;
- [ ] creep;
- [ ] binding direction;
- [ ] page order after folding;
- [ ] blank/signature completion;
- [ ] fixtures from page-imposition research projects.

## 18. Persistence, portability and profitability

### Persistence

- [ ] versioned project schema;
- [ ] JSON export/import;
- [ ] migrations;
- [ ] case library portability;
- [ ] selected plan reference with recalculation;
- [ ] corrupted-data recovery.

### Profitability

- [ ] revenue;
- [ ] profit/loss;
- [ ] margin;
- [ ] explicit thresholds;
- [ ] finishing/transport/other costs;
- [ ] unprofitable plans remain visible;
- [ ] no hidden coefficients.

## 19. Beta matrix

- [ ] all sheet presets and arbitrary sheets;
- [ ] standard/custom/square/narrow/wide products;
- [ ] equal and strongly different quantities;
- [ ] `1…capacity` kinds in exact fixtures;
- [ ] large anonymized orders;
- [ ] simplex/separate/work-and-turn/advanced duplex;
- [ ] odd pages;
- [ ] independent colors;
- [ ] trim/margins/bleed/gap extremes;
- [ ] mixed rotations and product sizes;
- [ ] machine zones/defects;
- [ ] browser/performance matrix;
- [ ] worker failure recovery.

## 20. Release gates

Published version remains `0.7.0-alpha.5`.

`0.7.0-alpha.6` requires a separate decision:

- [ ] define exact release scope;
- [ ] owner acceptance of current `/app/`;
- [ ] exact-head Quality;
- [ ] exact-head Chromium/PDF;
- [ ] visual evidence review;
- [ ] current docs/status/version/changelog;
- [ ] recovery branch;
- [ ] immutable tag;
- [ ] GitHub prerelease and assets;
- [ ] uNews/Telegram publication verification.

Pure-core progress does not automatically change version, release or production-ready status.