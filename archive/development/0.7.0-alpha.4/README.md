# uImposition 0.7.0-alpha.4 evidence

Date: 2026-07-27

This archive records the focused release evidence for M7.4.

## Confirmed scope

- separate front/back forms and work-and-turn are distinct duplex strategies;
- operator modes: separate only, compare both, and work-and-turn only;
- one symmetric shared plate for two passes in the verified control case;
- mandatory even column count;
- mirrored front/back page-pair validation;
- horizontal turn direction validation;
- independent production report after both passes;
- mode-aware layout-form and color-plate totals;
- zero underproduction and zero overrun in the control case;
- operator pricing without production demo defaults;
- sanitized runtime state without raw reports, layouts, page pairs, or half-row structures;
- compact RU/EN comparison and factual `4 × 4` shared-plate preview.

## Exact release boundary

- Functional M7.4 merge commit: `20b17a8dd578be6777d50934f69c561b10363aca`
- Version checkpoint release commit: `a9bfb15492815851b89f5d1ba4b9786f26c4b7e1`
- Focused screenshot source head: `a0ed7da1bebaf607dbb9f0a2059d86d93e8ebc5f`
- Functional PR: `#39`
- Version PR: `#41`
- Version: `0.7.0-alpha.4`
- Planned recovery branch: `release/v0.7.0-alpha.4`
- Planned immutable tag: `v0.7.0-alpha.4`

The recovery branch and tag must point to the version checkpoint release commit, not to the later publication-files commit.

## Focused Chromium evidence

- Scenario: `m7-work-and-turn-control`
- Original focused PNG: `uimposition-m7-4-work-and-turn-control.png`
- Release image: `news/2026-07-27-uimposition-v0-7-0-alpha-4-work-and-turn.jpg`
- Workflow run: `30221001536`
- Artifact: `uimposition-screenshots-41-1`
- Artifact ID: `8637207390`
- Artifact digest: `sha256:4ba640a47648d2123dd160e914f4a10cb1692a38adcf989cfaff54655ce13614`
- Captured at: `2026-07-26T21:25:17.679Z`
- Screenshot source head: `a0ed7da1bebaf607dbb9f0a2059d86d93e8ebc5f`
- Viewport: `1440 × 1180`
- Screenshot selector: `#workAndTurnComparison`

The downloaded screenshot was visually reviewed. It clearly shows both strategies, exact production totals, the `2 → 1` form/plate reduction, the `15 BYN` evidence saving, the shared `4 × 4` plate, and the required technology warning.

## Verified user-visible result

The scenario:

1. enters `130 g/m²`, `4 BYN/kg`, `15 BYN/color plate`, and `0 BYN/layout preparation`;
2. selects comparison of both duplex strategies;
3. confirms pricing ready;
4. confirms `1000` physical sheets and `2000` press passes for both strategies;
5. confirms layout forms `2 → 1`;
6. confirms color plates `2 → 1` for `1+1`;
7. confirms zero underproduction and zero overrun;
8. confirms work-and-turn as recommended under the evidence pricing;
9. confirms the exact `15 BYN` saving;
10. confirms visible front/back page pairs on the shared plate.

Verified alternatives:

| Strategy | Sheets | Press passes | Layout forms | Color plates | Estimated total |
|---|---:|---:|---:|---:|---:|
| Separate front/back | 1000 | 2000 | 2 | 2 | 175.08 BYN |
| Work-and-turn | 1000 | 2000 | 1 | 1 | 160.08 BYN |

These values are regression evidence, not production defaults.

## Technology boundary

This checkpoint proves the horizontal work-and-turn model and the fixed A6 control case. It does not claim:

- a general automatic work-and-turn solver for arbitrary orders;
- vertical turning;
- automatic gripper or side-lay selection;
- automatic compatibility with a specific press;
- paper saving when both compared strategies use the same physical sheets.

## Checks before the release checkpoint merge

- `Quality checks`: success — workflow run `30221001476`;
- `Prepare uImposition release news`: success — workflow run `30221001532`;
- `Capture uImposition screenshots`: success — workflow run `30221001536`;
- full Chromium capture: success;
- PDF verification and Poppler rendering: success;
- focused scenario assertions: success;
- legacy regression scenarios after version synchronization: success.

## Integrity records

Generated repository assets:

- release JPEG SHA-256: `164b9c8a63d9972f3e74cfa7df40aefbedec3e6391eb7c59a0dec3490e706790`;
- permanent evidence ZIP SHA-256: `c31190b6df04c317b97bff1c135c7d00f88e667845c8296db0d14bb1d3f5dc71`.

The same hashes are stored in:

- `archive/development/0.7.0-alpha.4/SHA256SUMS.txt`.

The permanent ZIP contains:

- focused JPEG derived from the exact Playwright panel;
- focused manifest record;
- capture log;
- this evidence README;
- internal SHA-256 list.
