# uImposition Next UI — Concept C

Date: 2026-08-01

## Preview

Exact checkpoint:

`https://raw.githack.com/sunpole/uImposition/eb0e54cdb877ca110971dc3540e01f4c0f50b0ce/design/next-ui-c/index.html`

Fallback:

`https://htmlpreview.github.io/?https://github.com/sunpole/uImposition/blob/eb0e54cdb877ca110971dc3540e01f4c0f50b0ce/design/next-ui-c/index.html`

## Status

Design-only prototype. Production `/app/` is unchanged.

Previous concepts remain preserved:

- Concept A: `design/archive/next-ui-concept-a`;
- Concept B: `design/archive/next-ui-concept-b`.

## Core idea

Concept C is an operator matrix rather than a CRM-style table with controls inside every row.

- every order row is exactly 19 px high;
- the number column uses `minmax(2ch, max-content)`;
- values `01`–`99` consume only two digit widths;
- `100` and larger values expand the shared grid column automatically;
- the file-name column is 104 px on desktop, 82 px on mobile and 74 px on very narrow screens;
- the full name remains available in the selected-row focus bar and native title tooltip;
- row actions are removed from the 19 px row;
- selecting a row opens a separate 33 px action group with edit, duplicate, enable and delete controls;
- 40 rows are generated for realistic density review.

## New workflow

`Input → Validation → Calculation → Imposition → Printing → Output`

The order matrix supports four column lenses:

- Order;
- Print;
- Result;
- All.

This lets a narrow phone show a useful subset instead of forcing every production field into one extremely wide viewport.

## Visual direction

- warm paper background;
- deep green production shell;
- turquoise active states;
- orange warnings;
- low-contrast separators;
- inline SVG icon system;
- no external fonts, icon packages or runtime dependencies.

## Required review

Review on the same Samsung Galaxy A57 used for Concepts A and B.

Check:

1. whether 19 px remains readable;
2. how many rows are simultaneously visible;
3. whether 82 px is enough for the short file-name preview;
4. whether the full name in the focus bar is sufficient;
5. whether switching lenses is faster than horizontal scrolling through all columns;
6. whether the warm green/orange theme fits a production application;
7. whether the selected-row action bar is more usable than buttons inside every row.
