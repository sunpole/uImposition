# Changelog

## 0.0.2-docs — 2026-07-24

### Added

- machine-readable `VERSION.json`;
- bilingual human-readable `VERSION.md`;
- bilingual versioning policy in `docs/VERSIONING.md`;
- explicit current milestone, next milestone and production-readiness fields;
- mandatory version synchronization rules for development agents.

### Changed

- current documentation version raised from `0.0.1-docs` to `0.0.2-docs`;
- `AGENTS.md` now treats `VERSION.json`, `VERSION.md` and `CHANGELOG.md` as synchronized version sources;
- next functional target fixed as `0.1.0-alpha` / M1.

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

### Changed

- GitHub Pages deployment uses the configured `main` branch directly instead of a redundant Actions workflow.
