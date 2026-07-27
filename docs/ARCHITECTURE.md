# uImposition — актуальная архитектура

Последнее обновление: **27 июля 2026**.

## 1. Основной принцип

uImposition — статическое браузерное приложение без обязательного сервера и build step.

- GitHub Pages обслуживает обычные HTML/CSS/JavaScript ES modules;
- геометрия, поиск, validation, production report, ranking и PDF выполняются локально;
- GitHub Actions дают воспроизводимые tests, Chromium evidence и PDF verification;
- серверная база данных пока не нужна;
- browser storage и Web Worker относятся к будущим milestone.

## 2. Архитектурные слои

1. **Configuration** — presets, limits, PDF/search boundaries.
2. **Input/domain** — sheet, product, orders, page pairs, print specification.
3. **Geometry** — printable area, fitting grids, explicit mixed placements.
4. **Imposition construction** — front layout, derived back, candidates.
5. **Validation** — geometry, front/back mapping, directions, production.
6. **Production** — sheets, forms, plates, passes, overrun and reports.
7. **Cost** — explicit operator pricing and guarded cost components.
8. **Search** — bounded candidate families and paper minimizer.
9. **Decision** — normalized metrics, Pareto, ranking and recommendation.
10. **User runtime** — current plan set, objective preference and explicit selection.
11. **Presentation** — DOM renderers without production formulas.
12. **PDF** — document models, dependency-free binary writer and renderers.
13. **Evidence** — Node tests, Chromium, downloads, `pdfinfo`, Poppler and manual review.

## 3. Dependency rules

- `config.js` does not import business modules.
- Domain/search/validation/PDF models do not use DOM.
- Back layout is always derived from an existing front layout.
- Renderer receives a complete validated model and does not recalculate production logic.
- Runtime may coordinate immutable models but must not hide raw calculation rules in event handlers.
- UI filters/sorting/reranking do not regenerate plans unless input geometry/orders actually changed.
- Missing cost stays unavailable and never becomes `0` implicitly.
- Hard validation failure blocks recommendation and export.
- Runtime dependencies and mandatory CDN dependencies are absent.

## 4. Current source map

### Configuration and base input

```text
src/config.js
src/geometry.js
src/orders.js
src/orientation.js
```

- `config.js` — sheet presets, limits, PDF/search settings;
- `geometry.js` — source sheet, trim, press margins, printable area and fitting uniform grids;
- `orders.js` — line parsing, validation and sequential page-pair expansion;
- `orientation.js` — rotation/direction helpers.

### Front/back and validation

```text
src/front-layout.js
src/back-layout.js
src/imposition-validation.js
src/imposition-candidate.js
src/candidate-generator.js
src/imposition-distribution.js
```

- front is deterministic and row-major inside the selected model;
- back is created only from front;
- validation independently checks pages, file/pair identity, coordinates, mirroring and directions;
- candidate generation is bounded and must expose truncation or limits.

### Paper search

```text
src/paper-minimizer.js
src/paper-solution-view.js
src/paper-solution-renderer.js
src/paper-solution-metrics.js
```

The paper minimizer:

1. prints complete capacity groups;
2. packs remaining demand into bounded full-sheet constructions;
3. reapplies the plan to immutable demand;
4. rematerializes layouts and production report;
5. accepts only zero remaining demand.

For the historical control case:

```text
required pair impressions = 52870
capacity                  = 16
lower bound               = ceil(52870 / 16) = 3305
constructed paper         = 3305
```

This proves paper minimum only for that input and capacity. It does not prove minimum forms or cost.

### Mixed-format validation

```text
src/mixed-format-layout.js
```

This module validates a supplied mixed-format placement:

- printable boundaries;
- overlaps;
- pages;
- derived mirrored back.

It is not an automatic rectangle-packing solver.

### Duplex and work-and-turn

```text
src/print-specification.js
src/duplex-strategies.js
src/work-and-turn-layout.js
src/work-and-turn-control-case.js
src/work-and-turn-runtime.js
src/work-and-turn-ui.js
```

Current work-and-turn scope:

- symmetric shared form;
- even column count;
- horizontal axis;
- mirrored front/back pair validation;
- independent production report;
- separate/work-and-turn comparison for a control case.

It is not yet part of general user-driven automatic search.

### Production and cost

```text
src/production-metrics.js
src/production-validation.js
src/production-report.js
src/production-report-renderer.js
src/production-cost.js
src/print-specification.js
src/solution-metrics.js
src/production-solution-metrics.js
```

Important terminology:

- **layout forms** — front/back side layouts;
- **color plates** — color-separated plates.

For one `4+4` imposition:

```text
layout forms = 2
color plates = 8
```

Production validation independently recalculates demand, output, overrun, physical sheets, forms and passes. Underproduction is always invalid.

Cost is built only from explicit pricing inputs. A plan may exist without a ready price.

### Alternatives and decision system

```text
src/optimization-objectives.js
src/decision-profile.js
src/pareto-alternatives.js
src/pareto-display-set.js
src/feasible-solution-catalog.js
src/production-alternative-set.js
src/alternative-explanations.js
src/alternatives-runtime.js
src/alternatives-controller.js
src/alternatives-ui.js
```

Rules:

- catalog data remains lossless;
- Pareto/recommended/dominated are annotations;
- filter does not remove source plans;
- lexicographic order uses the first differing objective;
- operator selection is independent of recommendation.

### User-driven M7.5 production pipeline

```text
src/user-uniform-production-plans.js
src/user-production-plans-ui.js
src/user-production-plans-runtime.js
src/user-production-plan-details-ui.js
src/user-objective-priority.js
src/user-objective-priority-ui.js
```

#### `user-uniform-production-plans.js`

Input:

- user page pairs;
- fitting placement options;
- source sheet;
- duplex color specification;
- optional pricing.

For each fitting `0°/90°` orientation it currently builds:

- `paperMinimum`;
- `dedicatedPairForms`.

Each plan is fully materialized, validated and reported before catalog insertion.

#### `user-production-plans-runtime.js`

Owns:

- current immutable plan set;
- selected plan ID;
- objective preference;
- sanitized public snapshot.

Selection persists when the same plan ID survives recalculation. Objective preference persists when pricing is temporarily unavailable.

#### `user-objective-priority.js`

Pure reranking:

- reuses the same plan array and plan objects;
- does not regenerate geometry/layouts/reports;
- recalculates catalog ranks, recommendation and Pareto annotations;
- reports `regeneratedPlanCount = 0`.

#### `user-production-plan-details-ui.js`

Renders only the explicitly selected plan:

- summary;
- preview schemes;
- dynamic production report;
- PDF actions.

The historical control renderer with fixed M3/M4 text is not reused for user plans.

## 5. Current user pipeline

```text
sheet/product fields
→ calculateSheetGeometry
→ calculatePlacementOptions
→ parseOrders / page pairs
→ createUserUniformProductionPlanSet
→ front/back materialization
→ validateImposition
→ production report
→ guarded metrics/cost
→ feasible lossless catalog
→ Pareto/rank/recommendation
→ explicit operator selection
→ schemes/report/PDF
```

## 6. Current search completeness contract

The current user catalog is complete only inside:

```text
one shared product format
× uniform grid
× fitting rotation 0° or 90°
× paperMinimum and dedicatedPairForms
× separate front/back forms
× one shared duplex color specification
× complete front/back page pairs
```

Anything outside this scope must be described as not searched, not as impossible.

Required status vocabulary:

- `complete within scope`;
- `feasible`;
- `lower bound reached`;
- `truncated/incomplete`;
- `not supported`.

These statuses must not be conflated.

## 7. PDF architecture

```text
src/pdf-document-model.js
src/pdf-binary.js
src/pdf-scheme-renderer.js
src/pdf-report-renderer.js
src/pdf-export-ui.js
```

- scheme and report documents are independent;
- one front/back layout page is modeled explicitly;
- PDF writer is dependency-free;
- user-selected PDF uses selected plan layouts/report;
- preview limits do not truncate the underlying plan;
- interactive scheme export has an explicit safety limit.

## 8. UI architecture

- `index.html` defines static sections and module entrypoints;
- UI modules may create their own panels near stable anchors;
- calculation state lives in model/runtime modules, not DOM text;
- settings panel and result panels share sanitized runtime events;
- mobile layout must not require drag-and-drop;
- dense tables may have local horizontal scrolling, but the page itself should not overflow.

## 9. Test architecture

### Unit/source

```text
npm run check:source
npm test
npm run check
```

- Node built-in test runner;
- pure modules tested without browser;
- source syntax check lists all production modules explicitly.

### Chromium/PDF

`.github/workflows/capture-screenshots.yml`:

- checks out exact source;
- runs real Chromium;
- executes scenario JSON actions/assertions;
- captures desktop/mobile focused screenshots;
- downloads generated PDFs;
- checks PDF structure/page counts;
- runs `pdfinfo` and Poppler;
- uploads manifest, logs, PNG and PDF artifacts.

A green DOM assertion is not enough. Focused screenshot must be opened and visually checked.

### Release validation

- patchnote/image metadata is validated before publication;
- release evidence is stored permanently;
- recovery branch and immutable tag point to exact release commit;
- GitHub Release card and assets are verified independently.

## 10. Planned architecture extensions

### M7.6

- pure comparison-table model;
- filter/sort/differences as view transformations;
- no regeneration;
- component cost columns and deltas.

### Additional plan families

Each family must provide:

- exact eligibility;
- finite candidate bounds;
- deterministic signatures;
- independent materialization/validation/report;
- explicit completeness/truncation status.

### Mixed packing

Future automatic packing must be separate from `mixed-format-layout.js` validation and must preserve multiple valid materially different packings.

### Persistence

Future versioned project schema should store inputs and operator preferences, not trust serialized derived reports without recalculation and migration validation.

### Heavy search

Future worker boundary should isolate search only; domain validation and final report remain reusable deterministic modules.

## 11. Non-negotiable invariants

- no underproduction;
- no independent back generation;
- no hidden pricing defaults;
- no loss of feasible alternatives;
- no silent search truncation;
- no global optimum claim without proof;
- no renderer-owned production formulas;
- no machine compatibility claim from geometry alone;
- no release claim without actual verified Release assets.
