# Changelog

## 0.7.0-alpha.2 — 2026-07-26

### Added

- one normalized `SolutionMetrics` model for solution-level metrics;
- explicit `pricing ready` / `pricing incomplete` status;
- guarded conversion from normalized metrics into decision-rankable solutions;
- regression coverage for incomplete pricing, BYN costing, cost-first ranking, null-cost guards, underproduction guards, compactness guards, and production-cost basis mismatches;
- main-page M7.2 status panel that explains why cost remains unavailable until production prices are provided.

### Changed

- visible site fallback version, package version, README, and version manifest are synchronized to `0.7.0-alpha.2`;
- the main hero and roadmap copy now describe the active M7.2 boundary instead of the old M6 boundary;
- `estimatedTotalCost: null` remains incomplete and can no longer become `0` through JavaScript number coercion;
- underproduced solutions cannot enter decision ranking;
- `layoutCompactness: null` cannot enter decision ranking as a silent `0`;
- imported production costs must match the candidate's physical sheets, color plates, and layout forms before normalization accepts them.

### Boundary

M7.2 provides the guarded metrics and visible status foundation. It still does not add the main-interface production price editor, Pareto alternatives, work-and-turn, or automatic mixed-format packing.

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

- source sheet: `620 × 450 mm`;
- grammage: `130 g/m²`;
- paper price: `4 BYN/kg`;
- color-plate price: `15 BYN`;
- one source sheet weighs `0.03627 kg`;
- compact solution paper: `123.13665 kg`, paper cost `492.5466 BYN`, plates `480 BYN`, total `972.5466 BYN`;
- paper-minimum solution paper: `119.87235 kg`, paper cost `479.4894 BYN`, plates `6720 BYN`, total `7199.4894 BYN`;
- paper priority selects `3305 sheets / 112 side-layout forms`;
- cost priority selects `3395 sheets / 8 side-layout forms`;
- side-layout-form priority also selects the compact solution;
- changing only the objective order does not regenerate the solution set;
- focused Chromium evidence shows the real click, reordered hierarchy, `3395`, `972.55 BYN`, and `8` forms.

### Boundary

M7.1 supplies the pure decision and costing foundation plus a standalone proof page. Actual pricing inputs in the main application, normalized metrics for every generated solution, Pareto alternatives, work-and-turn, and the compact production comparison table remain separate M7.2–M7.6 releases.

## 0.6.0-alpha — 2026-07-25

### Added

- pure immutable imposition-candidate and pair-demand models;
- distinct first-saturation and candidate-completion event run lengths;
- exact complete one/two-pair candidate generation for the control capacity;
- all `8960` unique 35-pair / 16-position candidates without hidden truncation;
- automatic construction of valid run lengths with zero underproduction;
- a universal paper lower-bound proof and an independently rematerialized solution;
- pure paper-solution comparison view model and responsive renderer;
- a focused Telegram/uNews screenshot scenario for the M6 result panel;
- concise CI failure diagnostics with the full quality log retained as an artifact;
- explicit 4+4 print specification separating side-layout forms from color plates;
- fixed mixed-format duplex validation with overlap, boundary, page, and mirror checks;
- production regression fixtures for A6 landscape/portrait, mixed A4/A5/A6, and variable-run A5;
- a documented M7 operator-decision plan and a machine-readable own-back fixture.

### Changed

- the control demo now calculates and explains the proven paper minimum after the manual production report;
- visible site and package versions are synchronized to `0.6.0-alpha`;
- screenshot tooling can capture a named component instead of a full-page image;
- release news can use a close-up of the feature that actually changed;
- architecture, configuration, test plan, roadmap, README, current state, and version documents describe the M6 boundary;
- M7 now explicitly covers draggable objective priority, instant re-ranking, own/foreign back comparison, Pareto alternatives, and compact layout.

### Verified

- required pair quantity: `52870`;
- capacity per physical sheet: `16`;
- universal lower bound: `ceil(52870 / 16) = 3305`;
- constructed valid solution: `3305` physical sheets;
- saving versus the manual reference: `90` sheets (`2.65%`);
- automatic solution: `56` impositions, `112` side-layout forms, `6610` press passes;
- underproduction: `0`;
- pair overrun: `10`;
- complete-file overrun: `0`;
- independent production-report rematerialisation confirms the same totals;
- desktop/mobile Chromium shows the proof and the `8 → 112` form trade-off;
- both existing PDFs remain downloadable, structurally valid, readable by `pdfinfo`, and renderable by Poppler;
- A6 `148×105`, 32 pages, 4+4 uses `4×4` without rotation;
- A6 `105×148`, 32 pages, 4+4 rotates 90° to `4×4`;
- the supplied `1×A4 + 2×A5 + 8×A6` mixed duplex fits `608×431` without overlap;
- A5 quantities `400 / 700 / 4200` reach the proven `663`-sheet lower bound with total overrun `4`;
- one 4+4 imposition means `2` side-layout forms and `8` color plates.

### Boundary

M6 proves the minimum physical paper for the control uniform-grid input. It does not yet minimise forms, generate automatic mixed-format packing, implement folded-signature pagination, or calculate work-and-turn layouts. Those operator-decision capabilities begin in M7.

## 0.5.0-alpha — 2026-07-24

### Added

- centralized PDF configuration with A4, sheet-proportional, and custom page modes;
- pure `pdf-document-model` with deterministic scheme and report documents;
- dependency-free PDF 1.4 writer using JPEG page XObjects;
- browser Canvas renderer for Cyrillic labels, page arrows, tables, and production totals;
- separate eight-page scheme PDF with one validated scheme per page;
- separate six-page A4 production-report PDF;
- browser download controls for both documents;
- structural page-count verification in Playwright;
- `pdfinfo` validation and Poppler rendering of every downloaded page;
- dedicated M5 unit, integration, geometry, pagination, and binary tests;
- `docs/M5_IMPLEMENTATION_PLAN.md`.
