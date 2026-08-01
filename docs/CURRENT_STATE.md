# uImposition — текущее фактическое состояние

Последнее обновление: **1 августа 2026**.

## 1. Repository checkpoint

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- post-R0 solver checkpoint: `a0fe6edb8092e706572493f2534cc698b935262e`;
- опубликованный prerelease остаётся `0.7.0-alpha.5`;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch/tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- `VERSION.json` намеренно остаётся на последнем опубликованном checkpoint;
- `productionReady` остаётся `false`;
- GitHub — единственный источник истины.

Последний exact-head proof:

- PR `#103`;
- Quality run: `30696531600`;
- artifact: `8817436243`;
- digest: `sha256:4cccbb54a24406c439f1164951090824f96b85ea58f366030106ecbd02461bbd`;
- `405/405` Node tests;
- random-small simplex и separate-duplex results совпали с независимым exhaustive oracle.

## 2. Архивная точка до rebuild

Постоянная ветка:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

указывает на commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

Она сохраняет прежний root UI, operator `/app/`, calculation modules, tests, fixtures и документацию. Ветку нельзя удалять до стабильного `1.0.0` и отдельного решения владельца.

## 3. Рабочий пользовательский маршрут

Актуальное приложение находится в `app/`. Корневой GitHub Pages URL перенаправляет в `/app/`.

Рабочий поток:

```text
выбрать sheet/press preset
→ добавить виды продукции
→ получить live calculation
→ сравнить варианты
→ выбрать план
→ проверить лицо/оборот/общую форму
→ открыть production metrics
→ экспортировать PDF
```

Runtime поддерживает:

- versioned local application state и presets;
- product rows и TXT import;
- current uniform `0°/90°` calculation;
- odd technical blank;
- verified front и mirrored back;
- separate duplex;
- ограниченную user work-and-turn family;
- alternatives, objectives, recommendation и explicit selection;
- pricing/costing;
- schemes, report и selected-plan PDF;
- responsive desktop/mobile interface.

Новый solver foundation пока не подключён к runtime. Старые проверенные модули остаются regression foundation до отдельной migration parity.

## 4. Исследовательское и архитектурное основание

PR `#86` объединил аудит 50 GitHub-репозиториев и решение использовать внешние проекты как research/differential oracles.

PR `#87` перенёс устойчивые выводы в:

- `docs/ARCHITECTURE.md`;
- `docs/ALGORITHM_AND_OPTIMIZATION.md`;
- `docs/TEST_PLAN.md`;
- `docs/REMAINING_WORK.md`.

Основной implementation contract:

- `research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`.

Целевая архитектура:

```text
N — normalized demand and machine input
G — geometry patterns with explicit slots
P — product/page/side assignment
R — integer run lengths
C — restricted master and pricing/column generation
M — machine/operator constraints
E — explanation, export and case memory
```

Большие заказы нельзя решать увеличением static candidate limits.

## 5. Завершённый слой G — geometry patterns

### PR #89 — exact uniform geometry

- immutable `GeometryPattern` и slots;
- exact coordinates;
- pure grids `0°/90°`;
- no-overlap/bounds validation;
- deterministic structural signatures;
- property tests и agreement с current capacity API.

### PR #90 — current input adapter

- sheet stage и trim;
- press margins;
- finished/occupied product footprint;
- bleed/gap/cut semantics;
- differential agreement с current placement calculation.

### PR #91–#92 — mixed strips

- generalized uniform/mixed geometry contract;
- horizontal/vertical guillotine strips;
- ordered `0°/90°` sequences;
- exact bounded enumeration;
- explicit truncation/coverage;
- fixture, где mixed capacity `15` лучше обеих pure grids `10`.

Честная граница G:

- uniform grids и bounded ordered mixed strips доказаны;
- arbitrary MaxRects/Skyline/general packing ещё не реализованы;
- несколько физических product sizes на одном sheet ещё не поддерживаются.

## 6. Завершённый слой P — production columns

### PR #93 — one product

- simplex и separate duplex;
- exact integer run;
- front cells из реальных slots;
- back только horizontal reflection;
- odd technical blank;
- forms/plates/passes/overrun;
- zero underproduction.

### PR #94 — one-product work-and-turn

- horizontal slot transform;
- involution proof;
- paired/fixed/unmatched orbits;
- useful capacity из фактических orbits;
- one shared form;
- count-only shared plate model;
- explicit fixed/unmatched blanks.

### PR #95 — all-positive simplex pattern

- несколько simplex demands на одной форме;
- exact positive allocations;
- `run = max(ceil(quantity[i] / count[i]))`;
- complete bounded allocation catalog;
- deterministic cells и blank slots.

### PR #97 — simplex candidate columns

- non-negative allocations;
- dedicated, mixed, partial и subset columns;
- zero column запрещена;
- candidate column не содержит run length;
- exact BigInt column-space count.

### PR #100 — separate-duplex candidate columns

- те же subset allocations для duplex family;
- front primary form;
- derived mirrored back;
- explicit front/back blanks;
- two layout forms;
- actual front+back plate count;
- two passes per physical sheet;
- no run length на уровне column.

Честная граница P:

- simplex и separate-duplex multi-product columns доказаны;
- multi-product work-and-turn/work-and-tumble/perfecting отсутствуют;
- named inks пока представлены только compatibility-check requirement;
- все products внутри catalog используют один geometry footprint и совместимую color family.

## 7. Завершённый R0 — exact small master oracle

### PR #99 — simplex exact master

- unique candidate-column sets;
- positive integer run vectors;
- exact state-space count;
- отказ до enumeration при превышении limit;
- all feasible plans retained;
- zero underproduction;
- Pareto annotation;
- no global claim.

### PR #102 — generic production-family master

Поддерживает отдельно:

- simplex columns;
- separate-duplex columns.

Запрещает смешивать:

- column families;
- print strategies;
- demands;
- geometry patterns.

Метрики выводятся из column contract:

- `layoutFormsPerColumn`;
- `colorPlatesPerColumn`;
- `pressPassesPerSheet`;
- normalized blank product positions.

### PR #103 — independent differential proof

- 16 deterministic random-small simplex cases;
- 16 deterministic random-small separate-duplex cases;
- independent combinations/run/metrics/Pareto oracle;
- full feasible-plan set comparison;
- objective-minimum comparison;
- all checks passed.

R0 является медленным доказательным oracle, а не large-order runtime.

## 8. Superseded PR

- PR `#85`: старый bounded candidate catalog; закрыт без merge после архитектурного аудита;
- PR `#96`: параллельный single-pattern P1 prototype; полезные duplex идеи перенесены;
- PR `#98`: stale duplex-column draft; перенесён свежим PR `#100`.

Ветки сохраняются как история/reference, но их API не являются актуальным production contract.

## 9. Честная граница текущего solver

Пока отсутствуют:

- R1 restricted-master matrix/solution contract;
- relaxed master, dual values, lower bounds и optimality gap;
- R2 pricing subproblem;
- column-generation loop;
- large-order search без полного static catalog;
- pricing/cost objectives в новом master;
- control benchmark через новый G/P/R pipeline;
- external OR-Tools/SCIP/Cbc differential harness;
- arbitrary packing and mixed physical sizes;
- machine defects/zones;
- operator case memory;
- новый solver в `/app/`, report и PDF;
- доказанный global optimum реального произвольного заказа.

Исторический control layout остаётся oracle/benchmark и не читается solver как готовый ответ.

## 10. Следующий кодовый этап

### R1-A — restricted master contract

Pure modules должны описать:

- canonical demand vector;
- canonical coefficient matrix `a[p,i]` из exact column allocations;
- compatible column family/strategy/geometry identity;
- selected restricted column set;
- integer и relaxed solution representations;
- objective/production-metric projection;
- lower bound, upper bound, gap и solver status;
- complete/truncated/unsupported state;
- independent validation и deterministic signatures.

Acceptance:

- simplex и duplex catalogs преобразуются одним contract;
- coefficients совпадают с `positionsPerSheet` каждой column;
- dedicated/mixed/subset columns не теряются;
- incompatible inputs rejected;
- R0 exact oracle проверяет small restricted-master fixtures;
- restricted optimum не называется global optimum вне supplied columns.

После contract:

1. bounded integer/relaxed restricted-master backend;
2. external solver differential fixtures;
3. R2 pricing request/response;
4. bounded column generation;
5. historical control benchmark;
6. runtime migration.

## 11. Quality state

Обязательные проверки:

```text
npm run check:docs
npm run check:source
npm test
```

Pure solver/test PR требуют exact-head Quality. Runtime/UI/PDF изменения дополнительно проходят Chromium/PDF workflow и visual artifact review.

## 12. Release status

- опубликованный checkpoint остаётся `0.7.0-alpha.5`;
- pure solver foundation не означает новый prerelease автоматически;
- `0.7.0-alpha.6` требует отдельной границы, version sync, evidence, recovery branch, immutable tag, GitHub prerelease и uNews state;
- текущий root уже ведёт в `/app/`, но проект всё ещё не production-ready.

## 13. Неприкосновенные правила

- zero underproduction;
- back derived only from validated front/transform;
- geometry separated from demand and pricing;
- layout forms separated from color plates;
- missing cost remains unavailable;
- operator selection remains explicit;
- fixtures/cases are never trusted without recalculation;
- heuristic/restricted result is not called proven global optimum;
- search limits, bounds and coverage are visible;
- feasible structural plans are not removed by ranking;
- archive branch remains recoverable;
- solver work and release work remain separate.
