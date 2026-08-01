# Owner feedback for Next UI

Date: 2026-08-01
Device used for review: Samsung Galaxy A57, normal browser/device settings, economy mode disabled.

## Accepted from Concept A

- the overall direction is interesting and worth preserving;
- bottom mobile navigation is useful;
- the interface may become the basis of a professional application.

## Required corrections

1. Order table rows must be lower and denser.
   - Concept A default 36 px is too high.
   - A realistic order may contain 20–30 product kinds.
   - Target range for further review: 26–30 px.
2. The application must feel like a compact professional tool, not a spacious website.
3. Top-right action icons must use a professional consistent icon system.
4. Icons must be centered inside their controls and never escape the button bounds.
5. Preserve Concept A as a checkpoint; do not overwrite it.
6. Create a second, structurally different direction rather than only restyling Concept A.
7. The second direction should be:
   - more progressive;
   - more informative;
   - contemporary but practical;
   - structured like a mature product refined through repeated use;
   - even denser;
   - based on a reconsidered application workflow.

## Concept B response

- default row height: 29 px;
- ultra row height: 26 px;
- 30 generated rows for density testing;
- unified inline SVG icon system;
- top action buttons use CSS grid centering;
- action icons share one viewBox and stroke system;
- desktop icon rail replaces the wide sidebar;
- production facts move to a horizontal signal bar;
- workflow becomes `Order → Optimization → Layout → Production → Output`;
- sticky first columns and sticky action column remain on mobile;
- production `/app/` remains unchanged.
