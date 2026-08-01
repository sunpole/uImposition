# Concept D zero-overflow responsive contract

The corrected Concept D must obey these rules before visual acceptance.

## Global containment

- `html`, `body`, `.app`, `.workspace`, `.screen`, `.surface` use `max-width: 100%` and `min-width: 0` where applicable.
- `overflow-x: hidden` is a final guard, not a substitute for correct sizing.
- No direct child of the page may use a fixed minimum width larger than the viewport.
- Buttons in responsive grid rows must be included in the grid track calculation, not positioned beyond the scroller.

## Allowed horizontal scrollers

Only these elements may scroll horizontally:

- `.presets-scroll`;
- `.facts-scroll`;
- `.orders-table-scroll`.

Every allowed scroller has:

- `width: 100%`;
- `max-width: 100%`;
- `min-width: 0`;
- `overflow-x: auto`;
- `overscroll-behavior-inline: contain`.

## Quick entry

Desktop: one dense row.

Mobile:

- two-column responsive field grid;
- name and primary action span the full width;
- no internal 790–930 px field canvas;
- no field or button can leave the viewport;
- full technical fields remain available in a compact disclosure panel.

## Order table

- the viewport itself never overflows the page;
- only the table canvas scrolls;
- number and name columns may be sticky;
- their `left` offsets are derived from fixed CSS variables and verified at each breakpoint;
- the table returns to `scrollLeft = 0` on initial load and when changing the sheet preset.

## Required widths

320, 360, 390, 412, 430, 768, 1024, 1366 and 1920 CSS px.

## Runtime assertion for prototype review

The prototype displays a visible warning when global page overflow is detected during resize or orientation change.
