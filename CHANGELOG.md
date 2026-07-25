# Changelog

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

### Changed

- the control demo now exposes independent scheme and report PDF downloads;
- wide report tables are paginated deterministically;
- incomplete final table pages keep stable row height;
- long report titles automatically shrink to avoid page-number overlap;
- screenshot artifacts now include downloaded PDFs, `pdfinfo` output, and rendered PNG pages;
- visible version and package metadata are synchronized to `0.5.0-alpha`;
- M6 paper minimisation is the next active milestone.

### Verified

- four impositions create exactly eight scheme pages in required front/back order;
- the production report remains a separate six-page document;
- A4 MediaBox is `595.276 × 841.89 pt`;
- Poppler reads and renders all 14 pages from both documents;
- Cyrillic, arrows, page numbers, tables, and long contribution rows are readable;
- no clipping, black squares, broken glyphs, or overlapping headers were found;
- invalid schemes and non-production-ready reports are rejected before export;
- zero runtime dependencies and no CDN are required.

## 0.4.0-alpha — 2026-07-24

### Added

- `production-metrics`, `production-validation`, and `production-report` pure calculation modules;
- produced quantity and explainable imposition contributions for every print pair;
- underproduction and overrun metrics for all 35 control pairs;
- complete-file production based on the minimum produced quantity across a file's pairs;
- separate pair-overrun and complete-file-overrun totals;
- physical-sheet, front-form, back-form, total-form, and press-pass metrics;
- hard production-readiness rejection when any pair underproduces;
- responsive production summary with a 20-file table and collapsible 35-pair details;
- `docs/M4_IMPLEMENTATION_PLAN.md` with approved formulas and acceptance criteria;
- M4 integration tests for the complete control dataset and invalid inputs.

### Changed

- the control demo now builds a validated production report after the four front/back impositions;
- source checks include every M4 calculation and rendering module;
- the test plan records complete-file overrun separately from summed pair overrun;
- desktop and mobile Chromium scenarios verify the production report;
- the visible site, package metadata, screenshot tooling, documentation, and version manifest are synchronized to `0.4.0-alpha`;
- M5 PDF export is now the next active milestone.

### Verified

- 20 files expand into 35 pair metrics;
- physical sheets: `3395`;
- forms: `4` front + `4` back = `8`;
- press passes: `6790`;
- underproduction: `0`;
- total pair overrun: `1450`;
- complete-file overrun: `930`;
- unknown pairs, damaged impositions, duplicate definitions, unsupported duplex modes, and underproduction are rejected;
- desktop and mobile Chromium screenshots show the report and exact control totals.

The four imposition run lengths remain verified manual input rather than optimizer output or a proven global minimum.

## 0.3.0-alpha — 2026-07-24

### Added

- pure `orientation`, `front-layout`, `back-layout`, and `imposition-validation` modules;
- contiguous row-major front-position blocks;
- automatic mirrored-back derivation that preserves row order and reverses columns;
- exact front/back page mapping, including null unmatched backs;
- independent file, pair, page, coordinate, and direction validation;
- `data/control-layout-m3.json` with four manual 4×4 control layouts;
- tests covering all four fronts and four backs, file 119, null backs, and block continuity;
- DOM-only scheme renderer with `file,page arrow` cells;
- responsive desktop/mobile cards for eight verified schemes;
- automatic clearing of stale control schemes after order, sheet, or product changes.

### Changed

- the control demo now shows four `SHEET-N_FRONT` and four automatically mirrored `SHEET-N_BACK` schemes;
- the visible site, package metadata, screenshot tooling, documentation, and version manifest are synchronized to `0.3.0-alpha`;
- screenshot scenarios now assert M3 scheme content rather than only M2 capacity;
- M4 production totals are now the next active milestone.

### Verified

- each control scheme contains exactly 16 front and 16 back cells;
- every back is derived only from its corresponding front;
- a horizontal left-to-right turn maps `→` to `←`;
- unmatched final odd pages appear only as dash-only back cells;
- file 119 preserves complete `1/2` and `3/4` pairs;
- desktop and mobile Chromium screenshots display all eight schemes;
- the manual control layout remains a reference rather than a proven global optimum.

## Documentation handoff — 2026-07-24

### Added

- root `START_HERE.md` entry point for a new ChatGPT conversation or device;
- exact current-state record in `docs/CURRENT_STATE.md`;
- GitHub-only development workflow independent of a local clone or terminal;
- modular M3 implementation plan with explicit module boundaries and acceptance tests.

### Changed

- `AGENTS.md` requires GitHub-first auditing and prohibits relying on chat memory or local files;
- README exposes the continuation entry point and distinguishes GitHub Actions verification from optional local checks.

## 0.2.0-alpha — 2026-07-24

### Added

- A4, A5, A6 and custom finished-product presets;
- bleed and additional inter-item gap controls;
- explicit common-cut and separated-cut modes;
- product occupied-size calculation;
- uniform placement candidates at 0° and 90°;
- deterministic maximum-capacity selection;
- used and unused edge dimensions for each candidate;
- visual capacity grid with numbered positions;
- exact source page-pair expansion, including dash-only backs for unmatched odd pages;
- page-pair table preserving source-file order and quantities;
- M2 control facts in `data/control-case.json`;
- unit tests for capacity, rotation, bleed, gap and page pairs.

### Changed

- GitHub Pages presents M2 capacity and page-pair results;
- central configuration includes product presets, production spacing defaults and limits;
- release-news preparation reads a generic milestone marker;
- screenshot scenarios prove the M2 result on desktop and mobile;
- version synchronized to `0.2.0-alpha` across the site, package metadata and documentation.

### Verified

- `608 × 431` printable area with A6 `105 × 148`, zero bleed and common cut gives `5 × 2 = 10` at 0°;
- the same case gives `4 × 4 = 16` at 90° and selects 90°;
- 2 mm bleed expands A6 occupied size to `109 × 152`;
- common cut rejects non-zero bleed;
- a 3-page file expands to `1/2` and `3/-`;
- the 20-file control dataset expands to 35 page pairs.

## 0.1.0-alpha — 2026-07-24

### Added

- first working browser calculator stage;
- central runtime configuration in `src/config.js`;
- real current post-trim sheet presets;
- custom pre-trim sheet input with 2 mm per-side default;
- uniform and individual sheet-trim controls;
- non-printable press-margin controls;
- source, post-trim and printable-area calculation;
- order parser for `file | quantity | pages | note`;
- file, run-length and print-pair summaries;
- control-dataset loading;
- Node built-in tests for sheet geometry and order parsing;
- isolated Playwright screenshot tooling;
- read-only GitHub Actions screenshot workflow;
- uNews publication and screenshot-provenance documentation;
- `news/` queue contract.

### Changed

- GitHub Pages landing page became the first working M1 interface;
- `uImposition · v{version}` became a clickable home-page logo;
- the visible page title and logo version load from `VERSION.json`;
- the settings panel opens by default and can collapse to an eye-style emblem.

### Verified

- `620 × 450` before trim becomes `616 × 446`;
- `616 × 446` post-trim preset is not trimmed twice;
- default press margins produce `608 × 431`;
- the 20-file control dataset produces 35 print pairs;
- zero runtime dependencies are required for the calculator.

## 0.0.2-docs — 2026-07-24

### Added

- synchronized `VERSION.json`, `VERSION.md`, `CHANGELOG.md` and versioning policy;
- dynamic version display on GitHub Pages.

### Changed

- repository state updated after complete public project setup.

## 0.0.1-docs — 2026-07-24

### Added

- Russian-first bilingual repository documentation;
- full Russian and English technical specifications;
- architecture, configuration, algorithm, test and roadmap documents;
- business and monetization model;
- proprietary commercial license notice;
- contribution policy for a public proprietary project;
- repository description, website and topic recommendations;
- current post-trim sheet presets;
- explicit sheet-trim model;
- one-scheme-per-PDF-page requirement;
- 20-file control dataset;
- GitHub Pages landing page published from `main` / root;
- centralized configuration example;
- `.gitignore` and `.nojekyll`.
