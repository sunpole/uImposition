# Concept D mobile overflow finding

Date: 2026-08-01
Device evidence: Samsung Galaxy A57 screenshot supplied by the owner.

## Confirmed defect

The first Concept D checkpoint allows content to escape the mobile viewport. The visible causes are structural, not cosmetic:

- the quick-entry region contains a fixed wide internal grid;
- the add button is a separate third grid column and can remain outside the visible area;
- the desktop table relies on a very large minimum width;
- sticky columns and the horizontal scroll position can make the first visible cells appear cut off;
- the page lacks a strict global overflow contract and automated overflow assertion.

## Required invariant

At every supported width:

`document.documentElement.scrollWidth <= document.documentElement.clientWidth`

Global horizontal scrolling is forbidden. Only explicitly marked internal scrollers may be wider than the viewport:

- preset strip;
- technical/live summary strips;
- order table viewport.

Quick order entry must reflow inside the viewport and must not use a fixed 790–930 px minimum width on mobile.
