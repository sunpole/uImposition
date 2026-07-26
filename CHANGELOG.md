# Changelog

## 0.7.0-alpha.3 — 2026-07-26

### Added

- full-metric duplicate removal and strict Pareto dominance;
- deterministic Pareto-frontier construction;
- required extreme alternatives for sheets, cost, forms, plates, overruns, and press passes;
- compact materially-different display selection with mandatory recommendation/extrema;
- explicit requested/effective display limits and hidden-frontier metadata;
- deterministic maximin range-normalized selection for additional tradeoffs;
- real imposition-distribution analysis for distinct orders, split orders, and fragmented blocks;
- `paperSolution → SolutionMetrics` adapter based on real paper-minimizer output;
- real compact-manual and paper-minimum integration through decision profile, Pareto frontier, and display set;
- compatibility checks for currency, sheet basis, source-sheet geometry, grammage, sheet weight, and operator rates;
- pure RU/EN alternative explanations with advantage, tradeoff cost, and deciding objective;
- component cost deltas for paper, color plates, layout-form preparation, and total;
- alternatives runtime preparation, state, controller, command/state events, and caching;
- compact responsive main-page panel for two real production alternatives;
- paper-first / cost-first controls without regenerating impositions;
- selectable comparison reference without changing recommendation;
- focused Chromium scenario `m7-real-alternatives-cost-first`;
- `docs/M7_3_DISPLAY_ALTERNATIVES.md`;
- `docs/M7_3_PRODUCTION_ALTERNATIVES.md`;
- `docs/M7_3_ALTERNATIVE_EXPLANATIONS.md`;
- `docs/M7_3_RUNTIME_UI.md`.

### Changed

- Pareto metrics must be actual finite JavaScript numbers; `null`, `undefined`, numeric strings, and empty strings cannot become `0` through coercion;
- estimated cost enters comparison only when all solutions share a compatible pricing basis and explicit rates;
- the production-report adapter accepts measured split/fragmentation metrics;
- the recommended entry is explained against a real competing alternative rather than itself;
- production data is prepared once and reused when only priority or reference changes;
- main-page hero, roadmap, visible fallback version, README, package, and version manifests describe M7.3.

### Verified real control alternatives

| Priority | Recommended solution | Physical sheets | Layout forms | Color plates | Estimated total |
|---|---|---:|---:|---:|---:|
| Paper | paper minimum | 3305 | 112 | 448 | 7199.4894 BYN |
| Cost | compact manual | 3395 | 8 | 32 | 972.5466 BYN |

Both alternatives are rebuilt from the real control order, layouts, production report, paper minimizer, source sheet, and one shared illustrative pricing profile. They are not production defaults.

Compact manual relative to paper minimum:

- paper: `+13.0572 BYN`;
- color plates: `−6240 BYN`;
- layout-form preparation: `0 BYN`;
- estimated total: `−6226.9428 BYN`;
- physical sheets: `+90`;
- layout forms: `−104`;
- pair overrun: `+1440`.

### Boundary

M7.3 completes real Pareto alternatives and transparent read-only selection. Work-and-turn is not included and begins only in M7.4. Automatic mixed-format packing remains M8.

## 0.7.0-alpha.2 — 2026-07-26

### Added

- normalized `SolutionMetrics`;
- `pricing ready / pricing incomplete`;
- guarded decision conversion and production-cost basis checks;
- main-page production pricing inputs;
- production-report-to-`SolutionMetrics` cost adapter;
- focused pricing Chromium evidence.

### Verified

- control pricing path: `972.55 BYN` / `972,55 BYN`;
- exact checkpoint commit: `aafa7b3a7c2e83d00e9c54796593259e9ef147d8`.

## 0.7.0-alpha.1 — 2026-07-26

### Added

- 11 reorderable objectives and immutable hard constraints;
- decision profiles, lexicographic ranking, stable ordering, and first-difference explanation;
- source-sheet weight, BYN/kg paper cost, per-plate cost, optional layout preparation, total/unit cost;
- focused Paper / Cost / Forms demo;
- roadmap through stable `1.0.0`.

### Verified

| Priority | Recommended solution | Physical sheets | Layout forms | Estimated total |
|---|---|---:|---:|---:|
| Paper | paper minimum | 3305 | 112 | 7199.4894 BYN |
| Cost | compact | 3395 | 8 | 972.5466 BYN |
| Forms | compact | 3395 | 8 | 972.5466 BYN |

Exact checkpoint commit: `622248f9e38f811a02143b428e264176f848b0a4`.

## 0.6.0-alpha — 2026-07-25

### Added

- exhaustive bounded uniform-grid candidate generation;
- proof of the `3305` physical-sheet minimum;
- production validation with zero underproduction;
- explicit physical sheets, press passes, layout forms, and color plates;
- desktop/mobile/Telegram evidence and permanent archive.

### Verified

Paper minimum uses `3305` sheets instead of compact manual `3395`, saving `90` sheets while increasing layout forms from `8` to `112`.
