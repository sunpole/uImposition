# uImposition — передача разработки

Дата актуализации: **1 августа 2026**  
Репозиторий: `https://github.com/sunpole/uImposition`  
GitHub — единственный источник истины.

## 1. Точка передачи

- рабочая ветка: `main`;
- архитектурный baseline перед root cutover: `b9d83855ff685bb38831670fb0c3975bbd1bdbc4`;
- опубликованный checkpoint: `0.7.0-alpha.5`;
- release branch/tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- архив до universal-solver rebuild: `archive/pre-universal-solver-rebuild-2026-08-01`;
- основной backlog: Issue `#83`;
- draft PR `#85` не использовать как large-order solver;
- research PR `#86` и canonical-docs PR `#87` объединены.

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

Актуальный operator-first интерфейс находится в `app/`.

Корневой `index.html` должен только перенаправлять в `/app/`.

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

## 5. Архив

До удаления или замены legacy UI создана ветка:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

Она содержит полное состояние на commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

Не удалять ветку до стабильного `1.0.0` и отдельного решения владельца.

## 6. Solver architecture

```text
N — normalized demand/input
G — geometric patterns with explicit slots
P — production assignment
R — integer run lengths
C — restricted master + pricing/column generation
M — machine/operator constraints
E — explanation/export/case memory
```

### Малые задачи

- exact exhaustive enumeration;
- brute-force oracle;
- deterministic structural signatures;
- explicit complete/truncated status.

### Большие задачи

- initial pattern columns;
- restricted master;
- pricing subproblem;
- add only improving structural columns;
- final integer solve;
- independent validation/report.

Запрещено делать large-order search увеличением одного static candidate limit.

## 7. Внешние проекты

Используются как research/differential oracles:

- PDF/imposition: `pdfcpu`, `Laidout`, `pdfcook`;
- geometry: `rectpack`, PackingSolver, RectangleBinPack, `binpackingjs`;
- integer optimization: OR-Tools, SCIP, Cbc;
- column generation: cutting-stock master/pricing examples;
- printing industry: packing/scheduling datasets;
- PDF verification: qpdf, Ghostscript, Poppler.

Перед любым переносом кода проверить лицензию. Внешний ответ всегда повторно проходит наш validator.

## 8. Статус PR #85

Полезные идеи:

- exact BigInt theoretical counts;
- deterministic signatures;
- small bounded catalog;
- coverage/truncation metadata.

Неприемлемо:

- считать статическое перечисление всех candidates основой больших заказов;
- merge без rebase/rewrite под новую G/P/R модель;
- объявлять high-dimensional space complete.

Будущая роль — R0 exhaustive small oracle.

## 9. Следующая кодовая цель

### G0-A — pure uniform geometry patterns

Создать:

```text
src/geometric-pattern.js
src/uniform-grid-patterns.js
tests/geometric-pattern.test.js
tests/uniform-grid-patterns.test.js
```

Контракт:

```js
GeometryPattern {
  id,
  printableArea,
  occupiedProduct,
  rotation,
  rows,
  columns,
  capacity,
  slots,
  usedBounds,
  unusedEdges,
  structuralSignature,
  coverage
}
```

Каждый slot:

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

Acceptance:

- patterns 0° и 90°;
- exact coordinates;
- margins/bleed/gap/cut input;
- no overlap;
- inside printable area;
- deterministic row-major order;
- stable signature;
- monotonicity/property tests;
- agreement with current capacity API;
- no DOM, pricing or plan recommendation changes.

## 10. Следующая последовательность

1. G0-A pure patterns;
2. G0-B application adapter;
3. G1 mixed strips;
4. P0 single product;
5. P1 multiple products/allocations;
6. R0 exhaustive small solver;
7. restricted master;
8. pricing/column generation;
9. differential validation;
10. historical 20-file benchmark;
11. operator case memory;
12. machine constraints.

## 11. Production invariants

1. Underproduction is always invalid.
2. Back is derived only from validated front.
3. Geometry is separate from demand, colors and pricing.
4. Layout forms and color plates are separate metrics.
5. Missing cost stays unavailable.
6. Operator selection is independent from recommendation.
7. Catalog filters never delete source plans.
8. Fixture/case answers are never trusted without recalculation.
9. Heuristic result is not called proven optimum.
10. Search scope, coverage and truncation are explicit.
11. Renderer does not own production formulas.
12. Version/release work is separate from feature work.

## 12. Quality and PR process

```text
one measurable goal
→ feature branch
→ draft PR
→ exact-head npm run check
→ Chromium/PDF when runtime/export changes
→ visual artifact review
→ merge
```

No root cutover, version bump, tag or Release is implied by a pure solver PR.
