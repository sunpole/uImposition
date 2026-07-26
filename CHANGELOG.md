# Changelog

## Unreleased — M7.3 development

### Added

- pure `pareto-alternatives` foundation for full-metric duplicate removal;
- objective-aware solution comparison for minimize and maximize directions;
- strict Pareto dominance checks;
- deterministic Pareto-frontier construction;
- required extreme selection for physical sheets, estimated cost, layout forms, color plates, file/pair overrun, and press passes;
- explicit `visibleFrontier` and `hiddenFrontierCount` metadata for limited displays;
- structured per-objective metric deltas;
- pure `pareto-display-set` model for a compact materially-different alternative set;
- mandatory recommendation and unique extrema that cannot be hidden by a small display limit;
- explicit requested/effective limits and `limitExpandedBy` metadata;
- deterministic maximin range-normalized selection for additional tradeoff alternatives;
- structured inclusion reasons, nearest-selected diversity evidence, advantages, tradeoffs, equal metrics, and exact deltas;
- explicit `pricingComparable` behavior when cost is absent from the active Pareto objectives;
- real imposition-distribution analysis for distinct orders, split orders, and fragmented blocks;
- `paperSolution → SolutionMetrics` adapter based on real paper-minimizer output;
- `productionAlternativeSet` integration from normalized production metrics through decision profile, Pareto frontier, and compact display set;
- compatibility checks for currency, sheet basis, source-sheet geometry, grammage, sheet weight, and effective paper/plate/layout-preparation rates;
- full control-pipeline integration that rebuilds the real manual report and paper-minimum result from repository data;
- `docs/M7_3_DISPLAY_ALTERNATIVES.md`;
- `docs/M7_3_PRODUCTION_ALTERNATIVES.md`;
- regression coverage for duplicates, dominance, tradeoffs, extrema, limit expansion, deterministic diversity, incomplete/incompatible pricing, invalid references, metric coercion guards, real distribution metrics, and real production alternatives.

### Changed

- Pareto and display metrics must be actual finite JavaScript numbers; `null`, `undefined`, numeric strings, and empty strings can no longer become `0` through coercion;
- the production-report adapter now accepts measured `splitOrders` and `fragmentedBlocks` instead of hardcoding both to zero;
- estimated cost enters a production alternative comparison only when every solution shares a compatible pricing basis and rates.

### Verified real control alternatives

| Priority | Recommended solution | Physical sheets | Layout forms | Color plates | Estimated total |
|---|---|---:|---:|---:|---:|
| Paper | paper minimum | 3305 | 112 | 448 | 7199.4894 BYN |
| Cost | compact manual | 3395 | 8 | 32 | 972.5466 BYN |

Both values are rebuilt from the real control order, layouts, production report, paper minimizer, source sheet, and a shared illustrative pricing profile. They are not production defaults.

### Boundary

This work is merged or proposed for `main` but is **not yet a published version**. The visible and released checkpoint remains `0.7.0-alpha.2`. M7.3 still requires human-readable RU/EN tradeoff copy, component-cost deltas, runtime/UI integration, focused evidence, news, archive, recovery branch, tag, and GitHub prerelease.

## 0.7.0-alpha.2 — 2026-07-26

### Added

- one normalized `SolutionMetrics` model for solution-level metrics;
- explicit `pricing ready` / `pricing incomplete` status;
- guarded conversion from normalized metrics into decision-rankable solutions;
- regression coverage for incomplete pricing, BYN costing, cost-first ranking, null-cost guards, underproduction guards, compactness guards, and production-cost basis mismatches;
- main-page M7.2 status panel that explains why cost remains unavailable until production prices are provided;
- main-page production pricing inputs for paper grammage, BYN/kg paper price, BYN color-plate price, and optional layout-form preparation cost;
- production-report-to-`SolutionMetrics` adapter that calculates real BYN solution cost from report totals;
- screenshot coverage for the full path: enter pricing, load the control production report, and show `pricing ready` with the calculated solution cost.

### Changed

- visible site fallback version, package version, README, and version manifest are synchronized to `0.7.0-alpha.2`;
- the main hero and roadmap copy describe the active M7.2 boundary instead of the old M6 boundary;
- `estimatedTotalCost: null` remains incomplete and can no longer become `0` through JavaScript number coercion;
- underproduced solutions cannot enter decision ranking;
- `layoutCompactness: null` cannot enter decision ranking as a silent `0`;
- imported production costs must match the candidate's physical sheets, color plates, and layout forms before normalization accepts them;
- the main pricing panel moves from `pricing incomplete` to `pricing inputs ready` after valid prices, and to `pricing ready` after the production report is available.

### Verified

- control pricing path ends at `972.55 BYN` / `972,55 BYN`;
- recovery branch `release/v0.7.0-alpha.2`, tag `v0.7.0-alpha.2`, GitHub prerelease, news/uNews/Telegram payload, and permanent evidence archive are published;
- tag and recovery branch point to exact checkpoint commit `aafa7b3a7c2e83d00e9c54796593259e9ef147d8`.

### Boundary

M7.2 provides guarded metrics, operator pricing inputs, and real production-report cost for the current control solution. It does not include completed Pareto alternatives, work-and-turn, or automatic mixed-format packing.

## 0.7.0-alpha.1 — 2026-07-26

### Added

- 11 explicit reorderable optimization objectives;
- immutable hard constraints kept outside the user-controlled order;
- pure decision-profile model with objective movement by index or offset;
- lexicographic solution comparison and stable deterministic ranking;
- first-difference explanation for the objective that selected a winner;
- full metric validation before any solution can enter ranking;
- `estimatedTotalCost` as an independent optimization objective;
- source-sheet area and weight calculation from millimetres and gsm;
- paper mass and paper cost from physical-sheet count and BYN/kg price;
- per-color-plate/form cost;
- optional side-layout preparation cost;
- total estimated production cost and cost per ordered finished item;
- illustrative BYN pricing fixture that is explicitly not a production default;
- standalone focused decision demo with Paper / Cost / Forms priority buttons;
- focused Chromium scenario that clicks the cost priority and verifies the changed recommendation;
- `docs/PRODUCTION_COSTING.md`;
- `docs/REMAINING_WORK.md` with the release sequence through stable `1.0.0`.

### Changed

- the default objective order places estimated cost immediately after physical sheets;
- every candidate solution must provide all 11 finite metrics before comparison;
- M7 planning includes paper weight, BYN paper cost, form cost, total cost, and unit cost;
- README exposes the active M7 work and remaining roadmap;
- screenshot tooling can assert the DOM after its interaction actions;
- visible and package versions are synchronized to `0.7.0-alpha.1`.

### Verified illustrative fixture

| Priority | Recommended solution | Physical sheets | Layout forms | Color plates | Estimated total |
|---|---|---:|---:|---:|---:|
| Paper | paper minimum | 3305 | 112 | 448 | 7199.4894 BYN |
| Cost | compact | 3395 | 8 | 32 | 972.5466 BYN |
| Forms | compact | 3395 | 8 | 32 | 972.5466 BYN |

The pricing values are regression fixtures only, not production defaults. The exact recovery branch, tag `v0.7.0-alpha.1`, GitHub prerelease, news, and evidence are published at commit `622248f9e38f811a02143b428e264176f848b0a4`.

## 0.6.0-alpha — 2026-07-25

### Added

- exhaustive bounded uniform-grid candidate generation;
- proof of the `3305` physical-sheet minimum for the control order set;
- production validation with zero underproduction;
- explicit physical sheets, press passes, layout forms, and color plates;
- focused desktop/mobile/Telegram Chromium evidence;
- permanent development evidence and release news.

### Verified

The paper-minimum solution uses `3305` physical sheets instead of the compact manual fixture's `3395`, saving `90` sheets while increasing layout forms from `8` to `112`. The tradeoff is intentionally visible and is the foundation for M7 multi-objective decision support.
