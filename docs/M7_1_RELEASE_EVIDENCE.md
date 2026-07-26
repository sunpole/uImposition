# M7.1 release evidence / Доказательства релиза M7.1

## Версия

`0.7.0-alpha.1`

## Git history

- feature branch: `m7.1/0.7.0-alpha.1`;
- Pull Request: `#12`;
- final pre-release functional head: `e18fdec6f528f962804ad121ac7bd25a266d0cb2`;
- release marker commit: `47699f1e97eeea1658ca41410094751d67db47ea`;
- generated news/archive commit: `c7c67f6b6944e62a4566b0223d54d0588ca6f1ed`;
- merge commit, rollback branch, tag and GitHub prerelease are created only after the full PR head passes and enters `main`.

## Реализованный результат

M7.1 содержит:

- 11 изменяемых целей;
- 6 неизменяемых жёстких ограничений;
- immutable decision profile;
- перемещение целей по индексу и смещению;
- лексикографическое сравнение;
- стабильное ранжирование;
- объяснение первой решающей цели;
- полную предварительную проверку метрик;
- прозрачную денежную модель BYN;
- отдельную короткую demo-страницу.

## Денежная формула

```text
sheetAreaM2  = widthMm × heightMm / 1 000 000
sheetWeightKg = sheetAreaM2 × grammageGsm / 1000
paperWeightKg = sheetWeightKg × physicalSheets
paperCost = paperWeightKg × paperPricePerKg
plateCost = colorPlates × colorPlatePrice
totalCost = paperCost + plateCost + layoutPreparationCost
```

Бумага считается от исходного закупаемого листа до зачистки.

## Иллюстративный regression fixture

Это не рабочий прайс:

```text
source sheet: 620 × 450 mm
grammage:     130 g/m²
paper:        4 BYN/kg
color plate:  15 BYN
```

### Компактный вариант

- physical sheets: `3395`;
- layout forms: `8`;
- color plates: `32`;
- paper weight: `123.13665 kg`;
- paper cost: `492.5466 BYN`;
- plate cost: `480 BYN`;
- estimated total: `972.5466 BYN`.

### Минимум бумаги

- physical sheets: `3305`;
- layout forms: `112`;
- color plates: `448`;
- paper weight: `119.87235 kg`;
- paper cost: `479.4894 BYN`;
- plate cost: `6720 BYN`;
- estimated total: `7199.4894 BYN`.

### Проверенный выбор

- `physicalSheets` first → `paper-minimum`;
- `estimatedTotalCost` first → `manual-compact`;
- `layoutForms` first → `manual-compact`.

Перестановка целей не меняет исходный набор вариантов и не запускает повторную генерацию.

## Quality checks

На final pre-release functional head `e18fdec6...`:

- Quality checks run: `30194840416` — success;
- Chromium run: `30194840414` — success;
- final screenshot/PDF artifact: `8629774523`;
- earlier functional artifact: `8629613473`.

Оба ZIP сохраняются в permanent repository archive как исторические материалы.

## Chromium и PDF regression

Финальный полный набор проверил:

- M5 scheme PDF download: `8` pages;
- M5 production report PDF: `6` pages;
- `pdfinfo` reads both PDFs;
- Poppler renders every PDF page;
- M6 desktop/mobile and focused paper-minimum scenarios;
- M7.1 cost-priority interaction scenario.

## Фокусный release screenshot

- scenario: `m7-decision-cost-priority`;
- source commit: `47699f1e97eeea1658ca41410094751d67db47ea`;
- image target: `#decisionProfileDemo` only;
- file: `news/2026-07-26-uimposition-v0-7-0-alpha-1-paper-cost-and-form-priorities.png`;
- Playwright starts with paper priority, clicks cost priority and validates the changed winner before capture;
- screenshot shows `3395`, `972.55 BYN`, `8` forms, cost first in the hierarchy, and both unchanged alternatives;
- image was opened and reviewed manually;
- no clipping, overlap or long full-page screenshot is used for Telegram.

## News and uNews

- patchnote: `news/2026-07-26-uimposition-v0-7-0-alpha-1-paper-cost-and-form-priorities.md`;
- queued at: `2026-07-26T08:36:38Z`;
- Telegram text is intentionally short;
- actual Telegram delivery remains the responsibility of the uNews publication workflow after merge to `main`.

## Permanent archive

Directory:

`archive/development/0.7.0-alpha.1/`

It contains:

- `release.json`;
- `uimposition-v0-7-0-alpha-1-evidence.zip`;
- `historical/uimposition-m7-1-functional-evidence.zip`;
- `historical/uimposition-m7-1-final-pre-release-evidence.zip`;
- focused PNG, patchnote, all seven Chromium scenarios, both PDFs, `pdfinfo`, Poppler pages, manifests and logs inside the final ZIP.

## Boundary

M7.1 provides the decision-order and cost foundation. It does not yet provide main-interface price inputs, normalized metrics for every generated solution, Pareto alternatives, work-and-turn, automatic mixed-format packing or project persistence. Those remain explicit later patches in `docs/REMAINING_WORK.md`.
