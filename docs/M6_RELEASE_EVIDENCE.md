# M6 release evidence / Доказательства релиза M6

## Версия / Version

`0.6.0-alpha`

## Git history

- feature branch: `m6/0.6.0-alpha`;
- Pull Request: `#10`;
- release marker commit: `3efb8f311637c48ef2a3d2477e36eb511fed7b8b`;
- generated news/archive commit: `65d022c108940ec6d58b2bd4010c9ae78220996a`;
- workflow verification fix immediately after the generated commit: `91847cb98d9c15540fa01810c0fd6f78fa7fdead`;
- merge commit, rollback branch, tag, and GitHub prerelease are created only after the final PR head passes and enters `main`.

## Проверенный функциональный результат

```text
required pair quantity = 52870
capacity per sheet      = 16
paper lower bound       = ceil(52870 / 16) = 3305
constructed solution    = 3305
```

- physical sheets: `3305`;
- saving against manual layout: `90` sheets (`2.65%`);
- impositions: `56`;
- side-layout forms: `112`;
- press passes: `6610`;
- underproduction: `0`;
- pair overrun: `10`;
- complete-file overrun: `0`.

The valid construction reaches the universal capacity lower bound, so `3305` is the proven global physical-paper minimum for the control uniform-grid input. It is not a minimum-form solution.

## Дополнительные production regressions

- A6 landscape `148×105`, 32 pages, 4+4: `4×4` without rotation;
- A6 portrait `105×148`, 32 pages, 4+4: 90° rotation and `4×4`;
- one supplied mixed duplex containing `1×A4 + 2×A5 + 8×A6` inside `608×431`;
- A5, eight positions, quantities `400 / 700 / 4200`: proven lower bound `663`, total overrun `4`;
- one 4+4 imposition: `2` side-layout forms and `8` color plates.

## Release screenshot

- selected scenario: `m6-paper-minimum-telegram`;
- source commit: `3efb8f311637c48ef2a3d2477e36eb511fed7b8b`;
- image target: `#paperSolution` only;
- settings panel and transient toast are excluded only from the public feature image;
- file: `news/2026-07-25-uimposition-v0-6-0-alpha-proven-paper-minimum.png`;
- the image was opened and reviewed manually;
- it clearly shows `3305`, saving `90`, forms `112`, passes `6610`, pair overrun `10`, file overrun `0`, the lower-bound proof, and the `8 → 112` production trade-off.

Long desktop/mobile screenshots remain preserved as technical evidence and are not replaced by the focused Telegram image.

## Release news and uNews

- patchnote: `news/2026-07-25-uimposition-v0-6-0-alpha-proven-paper-minimum.md`;
- queued at: `2026-07-25T04:41:27Z`;
- uNews validation on the release-marker commit: success;
- Telegram copy is intentionally short and is stored in both the patchnote and release manifest;
- actual Telegram delivery remains the responsibility of the uNews GitHub Actions publication workflow after the files enter `main`.

## Permanent repository archive

Release directory:

`archive/development/0.6.0-alpha/`

Contents include:

- `release.json` — machine-readable checkpoint manifest;
- `uimposition-v0-6-0-alpha-evidence.zip` — final combined evidence archive;
- `historical/uimposition-m6-final-evidence-pre-focused-fix.zip`;
- `historical/uimposition-m6-focused-check-with-collapsed-settings.zip`;
- `historical/uimposition-m6-clean-focused-check.zip`.

The three historical ZIP files are the exact Action archives previously offered during development. They are retained intentionally under `docs/DEVELOPMENT_HISTORY_POLICY.md`. The final evidence ZIP also contains all six selected Chromium scenarios, both browser-generated PDFs, `pdfinfo` output, all Poppler-rendered pages, manifests, logs, the patchnote, selected image, release manifest, and the historical archives.

## Automated release after merge

`archive/development/0.6.0-alpha/release.json` declares:

- rollback branch: `release/v0.6.0-alpha`;
- immutable tag: `v0.6.0-alpha`;
- GitHub Release title: `uImposition v0.6.0-alpha`;
- prerelease: `true`;
- attached assets: focused PNG and final evidence ZIP.

`.github/workflows/publish-version-release.yml` runs only after the manifest enters `main`. It refuses to move an existing rollback branch or tag and creates the actual GitHub prerelease only when all referenced files exist.

## Boundary

M6 proves minimum physical paper for the control uniform-grid case and validates a supplied mixed-format arrangement. Automatic mixed-format packing, minimum forms, work-and-turn, user-defined objective hierarchy, Pareto alternatives, and folded-signature pagination remain M7 or later work.