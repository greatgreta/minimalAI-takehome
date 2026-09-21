# Review status after fixes

Unaffiliated design exercise. Prices, offers and product data are fictional.

Same walkthrough as `../review/` (`scripts/review.mjs`), re-run after the fixes: 0 automatic findings
(was 4). Items are numbered as in `../review/REVIEW.md`.

| # | Issue | Status |
|---|-------|--------|
| 1 | Dev server mounts the neutral brand | Fixed (dev loader hands over data-config) |
| 2 | "Get the trio" disabled | Fixed (side branch, data-only reply, add-to-cart for the trio) |
| 3 | Stale disabled buttons stay in the chat | Fixed (hidden once the shopper has moved on) |
| 4 | Maurten expanded panel covers header and demo bar | Fixed (height cap, bar steps aside) |
| 5 | Graza launcher lime on lime | Partly fixed (elevation shadow); it still floats over the page CTA at 375 |
| 6 | Unscripted options look dead | Partly fixed (dashed outline, hidden once stale); still disabled while pending |
| 7 | Disabled contrast | Improved (opacity 0.6); disabled controls are exempt from WCAG |
| 8 | Console 404 on load | Fixed (empty favicon link) |
| 9 | Docked launcher is a flush tab, not a bottom bar | Not fixed (design work) |
| 10 | Generic "Agent" title; small header buttons | Touch targets fixed at 375; title not changed (needs a voice token value) |
| 11 | Maurten opens on an empty panel | Not changed (matches the silent-opening spec) |
| 12 | Launcher focus ring | Not changed (olive ring on lime has enough contrast) |
| 13 | Configuration page blank | Not changed (by design) |
