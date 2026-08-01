# uImposition — текущее фактическое состояние

Последнее обновление: **1 августа 2026**.

## 1. Repository checkpoint

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- universal-solver pure-core baseline: merge PR `#102`, commit `9d16a24eec2cf437731ef6a5e74b182d8fa6eaa5`;
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

Рабочий поток:

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

PR `#86` объединил аудит 50 GitHub-репозиториев по:

- page imposition и prepress;
- rectangle packing/nesting;
- cutting stock;
- integer optimization;
- printing-industry scheduling.

PR `#87` перенёс устойчивые выводы в канонические:

- `docs/ARCHITECTURE.md`;
- `docs/ALGORITHM_AND_OPTIMIZATION.md`;
- `docs/TEST_PLAN.md`;
- `docs/REMAINING_WORK.md`.

Актуальный подробный implementation contract:

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

Малые задачи решаются полным перебором как proof oracle. Большие задачи должны использовать restricted master и on-demand pricing/column generation. Простое увеличение static candidate/state limits запрещено как основной large-order путь.

## 6. Завершённый pure-core progress

### Архив и root

- PR `#88`: архивная ветка, корень → `/app/`, legacy root исключён из рабочего `main`.

### Geometry G0/G1

- PR `#89`: immutable `GeometryPattern`, exact uniform slots 0°/90°;
- PR `#90`: adapter и differential parity с application geometry;
- PR `#91`: validated mixed horizontal/vertical strip model;
- PR `#92`: bounded exact mixed-strip generator и coverage.

Основные модули:

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

Основные модули:

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

Основные модули:

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
- deterministic signatures, immutability и corruption rejection.

## 8. Superseded branches и PR

- PR `#85` закрыт после research gate; его допустимая роль ограничена historical small-space ideas;
- PR `#96` закрыт как дубликат PR `#95`;
- PR `#98` и `#101` закрыты как дубликаты объединённого PR `#100`.

Их ветки не являются источником истины. Рабочий код читается только из `main`.

## 9. Честная граница universal core

Пока отсутствуют:

- independent random-small brute-force differential suite;
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

Текущие exact modules являются proof oracle для малых bounded областей, а не production large-order solver.

## 10. Следующий обязательный этап

### R3-A random-small differential proof

Нужно создать независимый brute-force oracle, который не вызывает internals production master, и сравнивать с ним generated tiny cases:

- capacity `1…6`;
- demand count `1…4`;
- simplex и separate duplex;
- разные quantity vectors;
- разные max columns/run lengths.

Проверяются:

- полный feasible structural plan set;
- minimum sheets;
- forms/plates/passes;
- per-demand output/overrun;
- Pareto membership;
- deterministic replay;
- zero underproduction.

После R3-A разрешён bounded restricted-master этап с progress/limits/incumbent и обязательной differential parity на малых задачах.

## 11. Поздний control benchmark

`data/control-case.json` запускается после R3-A и первого restricted master.

Известные ориентиры:

- paper extreme: `3305` sheets;
- operator plan: `3395` sheets;
- operator plan: `4` impositions / `8` layout forms;
- underproduction: `0`.

Solver не читает `data/control-layout-m3.json` как готовый ответ.

## 12. Quality state

Обязательные проверки:

```text
npm run check:docs
npm run check:source
npm test
```

Каждый PR дополнительно проходит полный Chromium/PDF regression, даже если UI не менялся. Runtime/UI/PDF изменение требует visual artifact review.

## 13. Release status

- published version остаётся `0.7.0-alpha.5`;
- pure-core PR не выпускает `alpha.6` автоматически;
- version/recovery branch/tag/Release/uNews создаются отдельным release gate;
- root cutover не означает production-ready или stable;
- owner acceptance опубликованного `/app/` остаётся отдельным решением.

## 14. Неприкосновенные правила

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