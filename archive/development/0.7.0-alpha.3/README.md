# uImposition `0.7.0-alpha.3` — permanent release evidence

## Release boundary

- milestone: `M7.3`;
- release type: alpha prerelease;
- focused scenario: `m7-real-alternatives-cost-first`;
- screenshot/source commit: `5de3a972b153d0dfa4924028d22068e59b521606`;
- generated news/evidence commit: `ad63495f5755a30f33acad4f6fa0d00000076da1`;
- next isolated milestone: `M7.4` work-and-turn.

Work-and-turn is not part of this archive.

## Permanent files

- `release.json` — machine-readable release manifest;
- `uimposition-v0-7-0-alpha-3-evidence.zip` — screenshots, PDF evidence, patchnote, image and manifest;
- `news/2026-07-26-uimposition-v0-7-0-alpha-3-real-pareto-alternatives.md` — uNews/Telegram patchnote;
- `news/2026-07-26-uimposition-v0-7-0-alpha-3-real-pareto-alternatives.png` — focused Playwright image.

## Verified user result

The real control order exposes two zero-underproduction Pareto alternatives:

| Metric | Compact manual | Paper minimum |
|---|---:|---:|
| Physical sheets | 3395 | 3305 |
| Layout forms | 8 | 112 |
| Color plates | 32 | 448 |
| Press passes | 6790 | 6610 |
| Pair overrun | 1450 | 10 |
| Split orders | 2 | 19 |
| Illustrative total | 972.5466 BYN | 7199.4894 BYN |

Paper-first recommends paper minimum; cost-first recommends compact manual. Changing priority or comparison reference does not regenerate production alternatives.

## Tooling note

During release preparation the screenshot pipeline produced `manifest.ndjson`, while the legacy release script expected `manifest.json`. The release branch updates `tools/news/prepare-release.mjs` to support both formats. The successful generated evidence commit proves the compatibility fix.
