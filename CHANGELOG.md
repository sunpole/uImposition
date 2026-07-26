# Changelog

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
- the main hero and roadmap copy now describe the active M7.2 boundary instead of the old M6 boundary;
- `estimatedTotalCost: null` remains incomplete and can no longer become `0` through JavaScript number coercion;
- underproduced solutions cannot enter decision ranking;
- `layoutCompactness: null` cannot enter decision ranking as a silent `0`;
- imported production costs must match the candidate's physical sheets, color plates, and layout forms before normalization accepts them;
- the main pricing panel now moves from `pricing incomplete` to `pricing inputs ready` after valid prices, and to `pricing ready` after the production report is available.

### Boundary

M7.2 now provides the guarded metrics foundation, operator pricing inputs, and real production-report cost for the current control solution. It still does not add Pareto alternatives, work-and-turn, or automatic mixed-format packing.

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
- `docs/REMAINING_WORK.md` with 17 release patches from M7.1 to stable `1.0.0`.

### Changed

- the default objective order now places estimated cost immediately after physical sheets;
- every candidate solution must provide all 11 finite metrics before comparison;
- M7 planning now includes paper weight, BYN paper cost, form cost, total cost, and unit cost;
- README exposes the active M7.1 work and the full remaining roadmap;
- screenshot tooling can assert the DOM after its interaction actions;
- visible and package versions are synchronized to `0.7.0-alpha.1`.

### Verified

Illustrative pricing only:
