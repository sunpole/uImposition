# uImposition — Full Technical Specification

Document version: **0.1**  
Status: **draft for approval before implementation**  
Primary project language: **Russian**  
Russian source specification: `TECHNICAL_SPECIFICATION_RU.md`

## 1. Purpose

uImposition is a browser-based service for calculating and documenting complex gang-run offset impositions. It must transform a list of print jobs into a verifiable production result:

1. optimization alternatives;
2. exact run length for each imposed sheet;
3. a separate front-form scheme;
4. an automatically generated back-form scheme;
5. run-coverage validation;
6. a visual browser report;
7. a multipage PDF with one scheme per page.

The application must not silently make debatable production decisions on behalf of the operator. It calculates valid alternatives, explains trade-offs, recommends a solution according to the user-defined priority order, and leaves the final decision to the user.

## 2. Primary user and workflow

The primary user is a prepress specialist who manually assembles the final imposition in Adobe InDesign or another layout application.

Typical workflow:

1. select or enter a sheet size;
2. configure sheet trimming;
3. configure non-printable press margins;
4. select finished size, bleed and cutting mode;
5. enter files, required quantities and page counts;
6. define the optimization priority hierarchy;
7. run the calculation;
8. compare several valid alternatives;
9. choose one alternative;
10. receive `SHEET-N_FRONT` and `SHEET-N_BACK` schemes;
11. use the schemes on screen, as screenshots, or as PDF pages.

## 3. First-version scope

### Included

- static web application;
- Russian and English user interface;
- Russian as the default language;
- editable job input;
- sheet, trimming, margin, product and bleed configuration;
- placement-capacity calculation;
- page-pair generation;
- separate front/back forms as the main mode;
- left-to-right sheet turn;
- head-direction arrows;
- automatic validation of front, back and quantities;
- several optimization alternatives;
- screenshot-ready schemes;
- PDF export;
- browser-local persistence;
- JSON import/export;
- GitHub Pages deployment.

### Excluded from the first version

- automatic parsing of INDD or PDF files;
- automatic creation of a production INDD/PDF imposition;
- server-side database;
- multi-user collaboration;
- print-cost calculation;
- ink-unit, control-strip, register-mark or makeready-sheet calculation;
- automatic press selection.

## 4. Terminology

**Source sheet** — physical sheet size before edge trimming.  
**Sheet trim** — material removed from the sheet edges.  
**Post-trim size** — actual sheet size used by the imposition template.  
**Non-printable margins** — press areas unavailable for imposed content.  
**Usable area** — post-trim size minus non-printable margins.  
**Finished item** — one final printed copy.  
**Print pair** — the front and matching back of one finished item.  
**Imposition** — one unique placement scheme.  
**Plate/form** — one unique printing plate or printing form.  
**Separate front/back forms** — front and back are separate forms.  
**Work-and-turn/work-and-tumble alternative** — a shared form mode considered only when technically valid.  
**Press pass** — one passage of one physical sheet through the press.  
**Overrun** — produced quantity above the requirement.  
**Underproduction** — produced quantity below the requirement; prohibited.

## 5. Sheet presets

Current post-trim template sizes:

| ID | Post-trim size, mm | Indicative source size with 2 mm removed from every edge |
|---|---:|---:|
| `616x446` | 616 × 446 | 620 × 450 |
| `616x466` | 616 × 466 | 620 × 470 |
| `636x448` | 636 × 448 | 640 × 452 |
| `646x466` | 646 × 466 | 650 × 470 |
| `650x313` | 650 × 313 | 654 × 317 |
| `716x326` | 716 × 326 | 720 × 330 |
| `716x336` | 716 × 336 | 720 × 340 |
| `716x516` | 716 × 516 | 720 × 520 |

The final column is only an arithmetic reference for the standard trim. It must not be treated as confirmed source-sheet data without user confirmation.

Every size must declare its stage:

- `beforeTrim`;
- `afterTrim`.

A post-trim preset must never be trimmed a second time.

## 6. Sheet trimming

Sheet trimming is independent from press margins.

Controls:

- enabled/disabled;
- default: 2 mm on every edge;
- uniform mode;
- independent left, right, top and bottom values;
- zero and fractional values.

Formulas:

`postTrimWidth = sourceWidth − trimLeft − trimRight`

`postTrimHeight = sourceHeight − trimTop − trimBottom`

The interface must always display the source size and the resulting size.

## 7. Non-printable press margins

Defaults:

- left: 4 mm;
- right: 4 mm;
- top: 2 mm;
- bottom: 13 mm.

`usableWidth = postTrimWidth − marginLeft − marginRight`

`usableHeight = postTrimHeight − marginTop − marginBottom`

## 8. Job data

Each job contains:

- internal ID;
- file number or name;
- required quantity;
- page count;
- finished width;
- finished height;
- bleed;
- cutting mode;
- optional note.

Finished-size presets:

- A4: 210 × 297 mm;
- A5: 148 × 210 mm;
- A6: 105 × 148 mm;
- custom.

## 9. Bleed and spacing

Preset bleed values:

- 0 mm;
- 2 mm;
- 5 mm;
- custom.

The system supports uniform or per-edge bleed values and either common-cut placement or a custom gap.

## 10. Page pairs

`pairCount = ceil(pageCount / 2)`

For pair `k`:

- front page: `2k − 1`;
- back page: `2k`, if it exists;
- otherwise the back value is `-`.

Examples:

- 2 pages: `1/2`;
- 3 pages: `1/2`, `3/-`;
- 4 pages: `1/2`, `3/4`;
- 5 pages: `1/2`, `3/4`, `5/-`.

The `-` marker is allowed only on back schemes.

## 11. Geometry

At minimum, the geometry engine evaluates:

1. unrotated placement;
2. 90-degree rotated placement.

For each alternative it returns columns, rows, total positions, used area and orientation.

`columns = floor((usableWidth + gap) / (positionWidth + gap))`

`rows = floor((usableHeight + gap) / (positionHeight + gap))`

`positions = columns × rows`

The geometry engine returns all valid alternatives; it does not make the final production choice.

## 12. Orientation arrows

The source head direction is `↑`.

Each occupied cell contains:

`file number, source page number, head-direction arrow`

Examples:

- `33,1 →`;
- `33,2 ←`;
- `119,1 ↑`.

For a horizontal left-to-right sheet turn:

- `↑` remains `↑`;
- `↓` remains `↓`;
- `→` becomes `←`;
- `←` becomes `→`.

For the control A6 case placed sideways:

- front: `→`;
- back: `←`.

## 13. Front/back mode

The main first-version mode uses separate front and back forms:

- one front plate/form;
- one back plate/form;
- the typical total is `impositions × 2`.

Shared-form work-and-turn or work-and-tumble options may be calculated later as explicit alternatives, subject to production constraints and clear trade-off reporting.

## 14. Fill order

Default fill order is row-major:

```text
1   2   3   4
5   6   7   8
9  10  11  12
13 14  15  16
```

Identical items should remain contiguous unless a higher-ranked optimization objective requires splitting them. Paper minimization is the default top priority.

## 15. Hard constraints

The following constraints are not user-sortable:

1. zero underproduction;
2. valid front page in every front cell;
3. correct paired back page or `-`;
4. correct mirror transformation;
5. correct arrows;
6. no `-` on front schemes;
7. identical front/back cell counts;
8. every selected scheme passes validation;
9. all dimensions and usable areas remain positive.

Full front occupancy may be configured as a hard mode. It is enabled for the control case.

## 16. Optimization priority hierarchy

Default order:

1. minimum physical paper;
2. minimum unique plates/forms;
3. minimum total overrun;
4. minimum press passes;
5. minimum job splitting across impositions;
6. contiguous identical cells;
7. minimum number of different jobs per imposition.

The user can reorder these priorities. Candidate solutions are compared lexicographically according to the selected order.

## 17. Alternatives and report

The program must present a compact set of materially different valid solutions:

- minimum paper;
- minimum plates/forms;
- minimum overrun;
- minimum press passes;
- assembly-friendly solution;
- recommended solution according to the user's hierarchy.

For each solution, display:

- physical sheets;
- impositions;
- plates/forms;
- press passes;
- total overrun;
- number and list of split jobs;
- a plain-language trade-off explanation.

## 18. Front generation

The front scheme is generated first. Every cell stores its row, column, job ID, file identifier, front page, arrow and print-pair ID. The `-` marker is prohibited.

## 19. Back generation

The back scheme is derived from the approved front scheme and is never optimized independently.

For a horizontal sheet turn:

- reverse columns within each row;
- preserve row order;
- replace each front page with its paired back page;
- transform the arrow;
- use `-` when no back page exists.

## 20. Quantity validation

For print pair `i`:

`produced_i = Σ(repetitions_i_on_imposition_m × runLength_m)`

Required condition:

`produced_i ≥ required_i`

`overrun_i = produced_i − required_i`

Any candidate with underproduction is rejected.

## 21. Browser output

Every scheme is rendered as an independent white card with a clear border. It includes:

- `SHEET-N_FRONT` or `SHEET-N_BACK`;
- run length;
- source size;
- post-trim size;
- usable area;
- finished size;
- bleed;
- grid;
- file number, page number and arrow in every cell;
- validation status.

A “scheme only” mode hides controls and navigation so the card can be captured directly as a screenshot.

## 22. PDF export

Main export rule:

**one PDF page = one scheme**.

Sequence:

1. sheet 1 front;
2. sheet 1 back;
3. sheet 2 front;
4. sheet 2 back;
5. continue in order.

Supported page modes:

- fit to A4;
- preserve the sheet aspect ratio;
- custom page size.

The summary report is exported separately and must not interrupt the one-scheme-per-page document.

## 23. Configuration

All editable values and production defaults live in `src/config.js`. Other modules must not contain unexplained magic numbers or duplicated production rules.

Configuration groups include:

- languages and labels;
- sheet presets;
- size stage;
- trimming;
- press margins;
- finished sizes;
- bleed and gaps;
- turn modes;
- arrow mappings;
- fill order;
- hard constraints;
- optimization priorities;
- search limits;
- scheme styling;
- PDF export;
- file naming;
- local storage.

## 24. Settings panel

The settings panel is positioned in a screen corner. It opens on every page load, collapses through an eye button, leaves a small emblem when collapsed, and does not preserve its collapsed state after refresh. Production values are stored independently.

## 25. Bilingual requirements

- Russian is the default language;
- English is an accurate professional translation;
- language switching does not reload the page;
- data structures are language-neutral;
- labels come from the configured translation dictionary.

## 26. Persistence

The first version uses `localStorage`, JSON project import/export, a data-schema version and a clear/reset action.

## 27. Architecture

Planned modules:

- `config.js`;
- `geometry.js`;
- `orders.js`;
- `page-pairs.js`;
- `optimizer.js`;
- `imposition.js`;
- `reverse-side.js`;
- `orientation.js`;
- `validation.js`;
- `report.js`;
- `renderer.js`;
- `pdf-export.js`;
- `storage.js`;
- `i18n.js`.

## 28. Required tests

Tests must cover trimming, usable area, rotation and capacity, page pairs, no front `-`, back mirroring, arrows, run coverage, overrun, plate count, priority ordering, one-scheme-per-PDF-page output and bilingual labels.

## 29. Control dataset

`data/control-case.json` contains the current 20-file control case.

Manual reference result:

- 35 print pairs;
- zero underproduction;
- 4 impositions;
- 8 plates/forms;
- 3395 physical sheets;
- 6790 press passes;
- total overrun 1450.

These values are a validated manual reference, not a proven global optimum until the full optimizer is implemented.

## 30. Acceptance criteria for the first useful release

The release is accepted when the control dataset produces correct print pairs, a valid 4 × 4 control geometry, validated fronts and mirrored backs, correct arrows, zero underproduction, screenshot-ready cards, one-scheme-per-page PDF output, centralized configuration, Russian and English UI/documentation, local operation and GitHub Pages deployment.
