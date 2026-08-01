# uImposition Next UI — Concept D

Date: 2026-08-01

## Core idea

The primary screen is a fast production estimate desk, not a full CRM dashboard.

The target workflow is:

1. choose one of the visible sheet presets;
2. verify compact technical sheet/margin information;
3. enter one product line;
4. immediately see preliminary n-up, sheets, forms, plates and cost;
5. add the line to the order;
6. repeat or paste a large TXT order;
7. open detailed variants, layouts, production or export only when needed.

A simple order should produce a useful first estimate in roughly 5–10 seconds of operator interaction.

## Preview

Exact checkpoint:

`https://raw.githack.com/sunpole/uImposition/d3889c434ca81e6b848fa5309a0db53d3ead4fb9/design/next-ui-d/index.html`

Fallback:

`https://htmlpreview.github.io/?https://github.com/sunpole/uImposition/blob/d3889c434ca81e6b848fa5309a0db53d3ead4fb9/design/next-ui-d/index.html`

## Preserved designs

- current production UI: unchanged;
- Concept A: `design/archive/next-ui-concept-a`;
- Concept B: `design/archive/next-ui-concept-b`;
- Concept C: `design/archive/next-ui-concept-c`.

## Main screen structure

### 1. Sheet preset strip

Ten immediate presets plus `Custom sheet`.

The custom sheet dialog includes sheet width/height and four non-printing margins.

### 2. Compact 58 px information band

Left half:

- physical sheet;
- printable field;
- margins;
- trimming;
- press preset.

Right half:

- preliminary items per sheet;
- sheet count;
- form count;
- plate count;
- preliminary cost.

### 3. Quick order entry

One horizontally stable row containing:

- name;
- width and height;
- quantity;
- kinds;
- pages;
- front/back colors;
- bleed;
- cut mode;
- reverse mode.

Changes update the preliminary result immediately.

### 4. Existing order lines

Compact 19 px rows remain below the quick-entry line.

Selecting a line opens a separate safe action bar rather than placing tiny buttons inside a 19 px row.

### 5. Deep functionality

Bottom navigation opens:

- Quick estimate;
- Variants;
- Layouts;
- Production;
- Output.

## Bulk TXT prototype

The TXT dialog accepts one line per product using this design-only format:

`name;width;height;quantity;kinds;pages;front;back;bleed`

The production implementation must use the official repository TXT contract instead of this demonstration parser.

## Honesty boundary

The live calculations in this standalone concept are a visual interaction prototype. They use a simplified local estimate and are not the production solver, production costing model or proof of optimality.

The concept does not import current `/app/` CSS, `m3.css`, production application state or solver modules.
