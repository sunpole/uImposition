# Changelog

## 0.7.0-alpha.5 — 2026-07-27

### Added

- user-entered sheet/product geometry and order rows connected to verified production-plan generation;
- `paperMinimum` and `dedicatedPairForms` plan families for every fitting `0°/90°` orientation;
- full front/back materialization, independent imposition validation, production reports, and zero-underproduction guards for every plan;
- lossless feasible catalog that retains dominated, expensive, and metric-equivalent but structurally distinct plans;
- Pareto, recommendation, dominance, and rank annotations without deleting catalog data;
- explicit operator selection of any plan independently from recommendation;
- real selected-plan front/back previews, production details, scheme PDF, and report PDF;
- complete operator objective editor with 11 pricing-ready objectives, six presets, accessible arrow controls, and desktop drag-and-drop;
- persistent objective preference and reranking over the same plan objects with `regeneratedPlanCount = 0`;
- desktop/mobile Chromium scenarios for catalog, selection/details/export, and objective-priority behavior.

### Changed

- the main page now represents M7.5 as the current version checkpoint;
- version sources, package metadata, runtime-visible fallbacks, and screenshot assertions are synchronized to `0.7.0-alpha.5`;
- M7.6 / `0.7.0-alpha.6` is the next target;
- release evidence records an exact `sourceCommit` for Chromium capture separately from the later immutable `releaseCommit`.

### Verified control result

For three two-page A6 jobs of `100` at `4+1`, all four plans remain available. The operator-selected `uniform-r90-paper-minimum` remains selected at 20 sheets while cost-first recommends `uniform-r90-dedicated-pairs` at 21 sheets and `240.05 BYN` under the evidence pricing profile. Reranking reuses four plans and regenerates zero.

### Boundary

The user catalog is complete only within one shared product format × uniform grid × fitting `0°/90°` × `paperMinimum/dedicatedPairForms` × separate front/back forms × one shared duplex color specification × complete page pairs. M7.5 does not claim a global imposition solver, general user-driven work-and-turn search, mixed-format packing, mixed rotations, per-row geometry/colors, simplex/odd-page production, folding imposition, profitability, persistence, or machine compatibility.

### Published

- version/release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- publication merge commit: `546f637a25b51f72706ebbe7346acb2df9819af8`;
- recovery branch and immutable tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- GitHub prerelease includes the focused PNG and permanent evidence ZIP;
- release PNG SHA-256: `bb5686efa1d0f75990885b6f5e8736c1c4c93233eae181c3ae68f81397cf5a6e`;
- evidence ZIP SHA-256: `9ac0cfb4c01c34e530b4f734e499e6184cf2d6ab78f2157ea1216e6ee5742ec9`.

## 0.7.0-alpha.4 — 2026-07-26

### Added

- explicit `separateFrontBackForms` and `workAndTurn` duplex strategies;
- operator search modes `separateOnly`, `compareBoth`, and `workAndTurnOnly`;
- pure symmetric shared-plate model for horizontal work-and-turn;
- mandatory mirrored file/page-pair, page-role, grid-coordinate, and direction validation;
- materialization of the shared plate into canonical front/back layouts for independent finished-pair validation;
- mode-aware production metrics for separate `1+1` forms versus one shared `1+0` form;
- independent work-and-turn production-report validation with zero underproduction;
- fixed four-A6, 2-page, 1+1, 4,000-copy control case;
- sanitized `uimposition:work-and-turn` runtime state without raw reports, layouts, page pairs, or half-row construction data;
- mode filtering over one prepared comparison without rebuilding geometry;
- compact RU/EN work-and-turn comparison panel;
- factual 4×4 shared-plate preview;
- focused Chromium scenario `m7-work-and-turn-control`;
- `docs/M7_4_WORK_AND_TURN.md` and synchronized project entry documentation;
- regression coverage for valid and damaged mirrored pairs, odd-column rejection, production totals, search modes, pricing suppression, exact plate savings, and public-state boundaries.

### Changed

- production run metrics and validation now derive front forms, back forms, and total forms from the explicit duplex strategy instead of assuming separate forms unconditionally;
- the previous unsupported-mode regression now rejects only genuinely unknown duplex modes;
- main-page documentation now treats M7.3 as the prior checkpoint and M7.4 as the current release;
- package, README, VERSION files, and runtime-visible site version are synchronized to `0.7.0-alpha.4`.

### Verified control result

| Metric | Separate front/back forms | Work-and-turn |
|---|---:|---:|
| Physical sheets | 1000 | 1000 |
| Press passes | 2000 | 2000 |
| Side-layout forms | 2 | 1 |
| Color plates for 1+1 | 2 | 1 |
| Underproduction | 0 | 0 |
| Overrun | 0 | 0 |

With the evidence profile `130 g/m²`, `4 BYN/kg`, `15 BYN/color plate`, and `0 BYN/layout preparation`, the separate strategy totals `175.08 BYN`, work-and-turn totals `160.08 BYN`, and the exact saving is `15 BYN`. These values are regression evidence, not production defaults.

### Verified UI evidence

The focused Chromium scenario confirms the initial no-pricing state, enters the evidence pricing profile, verifies `workAndTurn` as recommended, checks `1000` sheets and `2000` passes, checks forms and plates `2 → 1`, checks the `15 BYN` saving, verifies both `A·1` and `A·2` on the shared plate, and captures only the M7.4 comparison panel.

### Boundary

M7.4 validates horizontal work-and-turn for the fixed A6 control case. It does not claim a general arbitrary-order work-and-turn solver, vertical turning, automatic gripper/side-guide selection, or automatic compatibility with a specific press. Equal paper and press-pass totals remain visible; no paper saving is claimed.

## 0.7.0-alpha.3 — 2026-07-26

### Added

- pure `pareto-alternatives` foundation for full-metric duplicate removal;
- objective-aware solution comparison for minimize and maximize directions;
- strict Pareto dominance checks;
- deterministic Pareto-frontier construction;
- required extreme selection for physical sheets, estimated cost, layout forms, color plates, file/pair overrun, and press passes;
- explicit frontier truncation metadata;
- structured per-objective metric deltas;
- pure `pareto-display-set` model for a compact materially-different alternative set;
- mandatory recommendation and unique extrema that cannot be hidden by a small display limit;
- deterministic maximin range-normalized selection for additional tradeoff alternatives;
- structured inclusion reasons, advantages, tradeoffs, equal metrics, and exact deltas;
- real imposition-distribution analysis for distinct orders, split orders, and fragmented blocks;
- `paperSolution → SolutionMetrics` adapter based on real paper-minimizer output;
- `productionAlternativeSet` integration from normalized production metrics through decision profile, Pareto frontier, and compact display set;
- compatibility checks for currency, sheet basis, source-sheet geometry, grammage, sheet weight, and explicit paper/plate/layout-preparation rates;
- full control-pipeline integration that rebuilds the real manual report and paper-minimum result from repository data;
- pure RU/EN alternative-explanation model;
- meaningful comparison references for recommended, reference, and ordinary alternatives;
- localized reasons, primary advantage, primary tradeoff, and deciding-objective evidence;
- component cost deltas for paper, color plates, layout-form preparation, and total estimated cost;
- complete suppression of monetary text for incomplete or incompatible pricing;
- pure alternatives runtime state builder;
- separate controller for production/pricing events and priority/reference commands;
- sanitized public `uimposition:alternatives` state without raw reports, layouts, candidates, planned runs, or paper solutions;
- compact read-only RU/EN alternatives panel on the main page;
- paper-first and cost-first recommendation controls without regenerating impositions;
- interactive comparison-reference selection;
- focused Chromium scenario `m7-real-alternatives-cost-first`;
- M7.3 architecture, production-alternative, explanation, display-set, and runtime/UI documentation;
- regression coverage for duplicates, dominance, tradeoffs, extrema, deterministic diversity, incomplete/incompatible pricing, invalid references, real distribution metrics, real production alternatives, RU/EN copy, exact BYN component deltas, runtime states, priority changes, reference changes, and invalid control geometry.

### Changed

- Pareto and display metrics must be actual finite JavaScript numbers; `null`, `undefined`, numeric strings, and empty strings cannot become `0` through coercion;
- the production-report adapter now accepts measured `splitOrders` and `fragmentedBlocks`;
- normalized solution metrics retain explicit operator pricing rates;
- estimated cost enters a comparison only when every solution shares a compatible pricing basis and rates;
- the recommended/reference entry is compared with a real competing alternative instead of itself;
- priority, language, and reference changes rerun only decision/Pareto/explanation layers over cached production data;
- the UI layer no longer reads raw production or paper-minimizer structures directly;
- package, README, VERSION files, and the runtime-visible site version are synchronized to `0.7.0-alpha.3`.

### Verified real control alternatives

| Priority | Recommended solution | Physical sheets | Layout forms | Color plates | Estimated total |
|---|---|---:|---:|---:|---:|
| Paper | paper minimum | 3305 | 112 | 448 | 7199.4894 BYN |
| Cost | compact manual | 3395 | 8 | 32 | 972.5466 BYN |

Both values are rebuilt from the real control order, layouts, production report, paper minimizer, source sheet, and one shared illustrative pricing profile. They are not production defaults.

For compact manual relative to paper minimum, the verified component deltas are:

- paper: `+13.0572 BYN`;
- color plates: `−6240 BYN`;
- layout-form preparation: `0 BYN`;
- estimated total: `−6226.9428 BYN`.

### Verified UI evidence

The focused Chromium scenario enters the illustrative pricing profile, loads the real control order, selects cost-first, verifies `manual-compact` as recommended, verifies the paper advantage and cost tradeoff, and captures only the M7.3 alternatives panel.

### Boundary

M7.3 provides real Pareto alternatives and a read-only decision panel. It does not include validated work-and-turn, the full priority editor, the final alternatives table/export, or automatic mixed-format packing.

## 0.7.0-alpha.2 — 2026-07-26

### Added

- one normalized `SolutionMetrics` model for solution-level metrics;
- explicit `pricing ready` / `pricing incomplete` status;
- guarded conversion from normalized metrics into decision-rankable solutions;
- regression coverage for incomplete pricing, BYN costing, cost-first ranking, null-cost guards, underproduction guards, compactness guards, and production-cost basis mismatches;
- main-page production pricing inputs for paper grammage, BYN/kg paper price, BYN color-plate price, and optional layout-form preparation cost;
- production-report-to-`SolutionMetrics` adapter that calculates real BYN solution cost from report totals;
- screenshot coverage for the full path from operator prices to `pricing ready`.

### Changed

- visible site fallback version, package version, README, and version manifest were synchronized to `0.7.0-alpha.2`;
- `estimatedTotalCost: null` remains incomplete and cannot become `0`;
- underproduced solutions cannot enter decision ranking;
- `layoutCompactness: null` cannot enter decision ranking as a silent `0`;
- imported production costs must match the candidate's physical sheets, color plates, and layout forms.

### Verified

- control pricing path ends at `972.55 BYN` / `972,55 BYN`;
- recovery branch `release/v0.7.0-alpha.2`, tag `v0.7.0-alpha.2`, GitHub prerelease, news/uNews/Telegram payload, and permanent evidence archive are published;
- tag and recovery branch point to exact checkpoint commit `aafa7b3a7c2e83d00e9c54796593259e9ef147d8`.

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
