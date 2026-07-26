# uImposition 0.7.0-alpha.3 evidence

Date: 2026-07-26

This archive records the focused release evidence for M7.3.

## Confirmed scope

- strict Pareto frontier for normalized production alternatives;
- materially-different compact display set;
- real `compact manual` and proven `paper minimum` alternatives;
- paper-first / cost-first recommendation changes without regenerating impositions;
- selectable comparison reference;
- RU/EN advantage, tradeoff, and deciding-objective explanations;
- component cost deltas for paper, color plates, layout-form preparation, and total cost;
- complete monetary suppression when pricing is incomplete or incompatible;
- sanitized alternatives runtime state without raw layouts, candidates, planned runs, or paper solution;
- compact read-only alternatives panel on the main page.

## Exact release boundary

- Functional release commit: `d7767aa6ec3b875864ea7d8ef8110b4c3ca8686e`
- Focused screenshot source head: `a511af06e9e0c420134795637fab3d2825d21fa4`
- Release PR: `#33`
- Version: `0.7.0-alpha.3`
- Planned recovery branch: `release/v0.7.0-alpha.3`
- Planned immutable tag: `v0.7.0-alpha.3`

The release branch and tag must point to the functional release commit, not to the later publication-files commit.

## Focused Chromium evidence

- Scenario: `m7-real-alternatives-cost-first`
- Screenshot source file: `evidence/uimposition-m7-3-real-alternatives-cost-first.png`
- Release image: `news/2026-07-26-uimposition-v0-7-0-alpha-3-real-alternatives.jpg`
- Workflow run: `30217673620`
- Artifact: `uimposition-screenshots-33-1`
- Artifact ID: `8636282435`
- Artifact digest: `sha256:d7eee382a3819b69ba17599794b3b6c8bfbe1a1ef77ef5b4c8f653b0826042ee`
- Captured at: `2026-07-26T19:50:51.838Z`
- Viewport: `1280 × 1050`
- Screenshot selector: `#productionAlternatives`

## Verified user-visible result

The scenario:

1. enters `130 g/m²`, `4 BYN/kg`, `15 BYN/color plate`, and `0 BYN/layout preparation`;
2. loads the real control order and production report;
3. switches to cost-first;
4. confirms `2 Pareto · pricing ready`;
5. confirms `manual-compact` as the recommended solution;
6. confirms the physical-paper advantage of `paper-minimum`;
7. confirms the estimated-cost tradeoff;
8. confirms the component total delta `6 226,94 BYN`;
9. captures only the new M7.3 alternatives panel.

Verified alternatives:

| Priority | Recommended | Sheets | Layout forms | Color plates | Estimated total |
|---|---|---:|---:|---:|---:|
| Paper first | paper minimum | 3305 | 112 | 448 | 7199.4894 BYN |
| Cost first | compact manual | 3395 | 8 | 32 | 972.5466 BYN |

The paper minimum saves `90` sheets but costs `6226.9428 BYN` more under this evidence pricing profile. These values are regression evidence, not production defaults.

## SHA-256

- Focused PNG: `202f7f6f9baefc08aa72cff8796358ace44e3430a92de9556af11372c6b57e8f`
- Focused manifest line: `d5938b3f3ff760159e885591d628c4e29efb22e1186584ce6e32ba84caf59aca`
- uNews/Telegram JPEG: `bd9db0a5ec3f626bb4ad671588fec27df00a3ba461683d3555fa53edcc5a4bc3`
- Permanent evidence ZIP: `21eb6862485d443af93f4f7e70125376d28ff639ee6368df263617b32f4ed039`

## Checks before the release checkpoint merge

- `Quality checks`: success — workflow run `30217673635`;
- `Prepare uImposition release news`: success — workflow run `30217673622`;
- `Capture uImposition screenshots`: success — workflow run `30217673620`;
- Chromium capture: success;
- PDF verification and Poppler rendering: success;
- focused scenario assertions: success;
- legacy screenshot scenarios after version synchronization: success.

## Permanent evidence ZIP contents

The release archive contains only the focused M7.3 evidence needed for durable verification:

- focused PNG;
- focused manifest record;
- capture log;
- evidence README;
- `SHA256SUMS`.

The complete temporary GitHub Actions artifact remains identified above by workflow run, artifact ID, and digest.
