# R3 acceptance blocker task

## Source of truth

GitHub repository `sunpole/uImposition`, branch `main`, Issue #77 and owner feedback from 2026-07-31.

## Goal

Finish the accepted operator-first `/app/` before root cutover and `0.7.0-alpha.6`.

## Required work

1. Fresh error lifecycle: obsolete uniform-compatibility messages disappear when the latest input revision is valid.
2. Persistent desktop top navigation: Order / Alternatives / Layout on every screen.
3. Verify production back-side mirroring and add Front / Back / Front + Back viewing modes.
4. Use more of 1920 px desktop width and remove unnecessary small vertical scroll at 1920×1080 without shrinking readable text.
5. Add atomic UTF-8 TXT template download and multi-row import with row/field validation.
6. Expose existing lossless objective priorities and presets in `/app/`: paper, cost, forms/plates, passes, overrun and production simplicity.
7. Keep front and back color counts independent and support uniform asymmetric duplex jobs such as 4+1 and 1+4.

## Boundaries

Do not add mixed-format packing, arbitrary mixed-color groups, generalized simplex/odd-page/work-and-turn search, root cutover, version bump or release in this patch.

## Completion record

Fill after exact-head Quality, Chromium/PDF evidence, manual screenshot inspection and repeat owner acceptance.
