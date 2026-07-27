# uImposition 0.7.0-alpha.5 evidence

Generated: 2026-07-27T04:18:53Z

This permanent archive records the M7.5 release checkpoint and its focused browser evidence.

## Exact release boundary

- Functional M7.5 baseline: `009451cce94d5cde05ee72305f30447aa65a646c`
- Version checkpoint release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`
- Focused screenshot source head: `a8db529c29e7b71a7809bb5f857d48cfde115597`
- Version PR: `#49`
- Version: `0.7.0-alpha.5`
- Recovery branch: `release/v0.7.0-alpha.5`
- Immutable tag: `v0.7.0-alpha.5`

The recovery branch and immutable tag must point to the version checkpoint commit. The later publication merge contains only release tooling, patchnote, image, manifest, hashes, and evidence.

## Confirmed M7.5 scope

- verified user production-plan catalog inside one shared product format, uniform grids, fitting 0°/90°, paper-minimum and dedicated-pair strategies, separate front/back forms, one shared duplex color specification, and complete page pairs;
- all feasible variants inside that documented scope stay in the catalog;
- filters change only the view;
- recommendation and explicit operator selection remain separate;
- selected-plan details and scheme/report PDF export;
- objective priority reranking reuses validated plans without rebuilding geometry.

The checkpoint does not claim a globally complete solver, a lower-bound proof outside explicitly proven cases, or compatibility with a particular press.

## Production invariants

- underproduction is forbidden;
- back layouts derive only from a validated front;
- missing cost never becomes zero;
- layout forms and color plates remain separate;
- recommendations never replace the operator's choice;
- fixtures and bounded searches are not described as automatic global solvers;
- geometric symmetry does not prove machine compatibility.

## Exact checks

- Quality run: `30236119913` — 173/173 tests, 0 failures;
- Quality artifact: `8641678651`, `uimposition-quality-49-1`;
- Quality digest: `sha256:7570c0a0c529d9994ea416d28cfefdbcfd688c8701fed09213b9c12642315f27`;
- Full Chromium/PDF run: `30236119914` — 16/16 scenarios;
- Full Chromium/PDF artifact: `8641691735`, `uimposition-screenshots-49-1`;
- Full Chromium/PDF digest: `sha256:1cf047532caf18e7d49a6464a8f4b339dcc2ea15c37eb6f6ca0581491b0d33df`;
- scheme PDF: 8 A4 pages, verified by pdfinfo and rendered with Poppler;
- production report PDF: 6 A4 pages, verified by pdfinfo and rendered with Poppler;
- focused evidence workflow run: `30236703966`;
- focused image captured at: `2026-07-27T04:18:46.632Z`.

The two exact-head Action archives are preserved under `historical/`.

## Focused screenshot

- Scenario: `m7-objective-priority-editor`
- Original: `uimposition-m7-5-objective-priority-editor.png`
- Release image: `news/2026-07-27-uimposition-v0-7-0-alpha-5-user-production-plans.png`
- Viewport: 1440 × 1180
- Selector: `#userObjectivePriorityEditor`

Desktop and mobile focused PNGs were visually reviewed. Text is readable without clipping or overflow; estimated cost is first; the panel reports four reused plans and zero regenerated plans; `uniform-r90-dedicated-pairs` remains a recommendation rather than an operator selection. No secrets or private data are visible.

## Integrity

- `SHA256SUMS.internal.txt` records the PNG, patchnote, release manifest, and this README inside the ZIP;
- `SHA256SUMS.txt` records the release PNG and the final evidence ZIP;
- the ZIP includes the six focused M7.5 Chromium scenarios, capture log and NDJSON manifest, patchnote, release manifest, README, internal hashes, and both historical exact-head Action archives.
