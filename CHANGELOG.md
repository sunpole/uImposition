# Changelog

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

- GitHub Pages landing page is now the first working M1 interface;
- `uImposition · v{version}` is a clickable home-page logo;
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
- two-column Russian/English repository overview;
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
