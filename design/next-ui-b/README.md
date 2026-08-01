# uImposition Next UI — Concept B

Date: 2026-08-01

## Preview

Exact checkpoint:

`https://raw.githack.com/sunpole/uImposition/492b7ef972866d3ef5d5ade3d463854fd5d12cec/design/next-ui-b/index.html`

Fallback preview:

`https://htmlpreview.github.io/?https://github.com/sunpole/uImposition/blob/492b7ef972866d3ef5d5ade3d463854fd5d12cec/design/next-ui-b/index.html`

## Status

Design-only interactive prototype. Production `/app/`, solver, PDFs and current user data are unchanged.

## Preserved Concept A

The first prototype remains preserved in:

`design/archive/next-ui-concept-a`

Its exact HTML checkpoint remains:

`8352aba911983c20f21a69d622731d89ef207740`

## What changed from Concept A

- default order-row height reduced from 36 px to 29 px;
- Ultra density reduces it to 26 px;
- 30 order rows are generated for realistic density review;
- the wide left information sidebar is removed;
- sheet, machine and production totals live in one compact signal bar;
- desktop navigation becomes a narrow icon rail;
- mobile navigation remains a bottom dock;
- order flow is restructured as `Order → Optimization → Layout → Production → Output`;
- order name and actions stay in a 42 px top bar;
- row actions use centered inline SVG icons on a consistent 24×24 coordinate system;
- first columns and the actions column remain sticky;
- the selected row and selected production plan share one inspector;
- old CSS, `m3.css`, current `/app/` DOM and JavaScript style injection are not used.

## Required owner review

Review at 320, 360, 390, 430, 768 and desktop widths.

Focus on:

1. real number of visible order rows;
2. whether 29 px is still too high;
3. whether 26 px remains readable and tappable;
4. whether sticky actions are useful on mobile;
5. whether the signal bar is more useful than a sidebar;
6. whether the five-stage workflow matches actual production work;
7. which information should be permanently visible in the top and bottom navigation.
