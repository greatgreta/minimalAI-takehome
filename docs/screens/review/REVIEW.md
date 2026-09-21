# Walkthrough review (before fixes)

The screenshots were removed from the repo to keep it small. Run node scripts/review.mjs <folder> against npm run preview to regenerate them.

Unaffiliated design exercise. Prices, offers and product data are fictional.

Method: `scripts/review.mjs` drives both stores click by click in system Chrome at 1440x900 and 375x812
against `npm run build && npm run preview`, screenshotting every step (files in this folder), and I
looked at every image. `findings.json` holds the automatic checks (overlap, clipping, scroll, console
errors, disabled buttons). Also probed the Graza launcher in `npm run dev` and at widths 1440, 1024,
800, 641, 600 and 375.

## HIGH

1. **Dev server runs the wrong brand (both stores).** In `npm run dev`, `/agent.js` is a tiny loader and
   the real entry is a module, so `document.currentScript` is null and `data-config` is never read.
   The agent mounts with no config and silently becomes the neutral brand: the Graza page gets a
   neutral agent (wrong greeting, wrong script), Maurten gets a floating instead of docked panel.
   Probe: `dev 1440 ... cfgAttr:false`, preview `cfgAttr:true`. This is the most likely reason the Graza
   launcher looks broken when run locally. The launcher itself opens and closes correctly in the
   production build at every width tested.
2. **"Get the trio" is a disabled quick reply (graza-desktop-05, graza-375-05).** Greyed out, does
   nothing, looks broken. The copy offers it as a choice next to "Just Drizzle".
3. **Stale disabled buttons stay in the transcript.**
   - graza-375-07: "Yes" and "No" remain greyed after the shopper answered; "No" was never usable.
   - graza-desktop-06/07: the card's "Just Drizzle" stays as a grey pill after it was used.
   - maurten-desktop-09-expanded: a grey "Add to cart" (card) sits directly above a black "Add to cart"
     (the shopper's message), which reads as a duplicate dead button.
   - maurten-desktop-09: "Yes"/"No" caffeine chips remain greyed at the top after "No".

## MEDIUM

4. **Maurten expanded panel covers the page header and overlaps the demo bar (maurten-desktop-09).**
   The expanded docked panel is the full viewport height, so the shop nav ("Events", "Membership",
   "Bag (1)") is clipped behind it, and it slides over the right of the demo bar ("Configu" is cut).
   The automatic check flags it. At 481 to about 1100px a normal docked panel also touches the bar.
5. **Graza launcher covers the page's "Add to bag" button at 375 (graza-375-01) and is lime on lime.**
   It floats above content (expected for a widget), but with a lime fill on a lime CTA it has no
   separation from the page, so it reads as part of the button row. No elevation cue on the launcher or
   the panel in either brand.
6. **Unscripted options look disabled rather than intentional.** "Yes" (caffeine) and "No" (first order)
   are greyed with only a hover tooltip. They are honest about the demo, but a viewer sees a dead button.
7. **Disabled controls fail contrast.** Opacity 0.45 on the disabled buttons gives text well under
   4.5:1 (disabled controls are exempt from WCAG, but they look washed out and unfinished in Graza).

## LOW

8. **Every page load logs a 404 in the console** (favicon request), on both stores and configuration.
9. **Docked launcher is a flush black tab, not a "text-labelled launcher in a bottom bar"**
   (maurten-desktop-01, maurten-375-01). Works, but it is the plainest part of the docked design.
10. **Panel title is the generic "Agent" in both brands** (no per-brand title token), and the panel
    header controls (`_`, `[ ]`, `x`) are text glyphs about 32px wide, under the 44px touch guideline at 375.
11. **Maurten opens on an empty panel** (maurten-desktop-02). Correct per the "silent" spec, but a large
    blank area with only "Context / Nothing yet".
12. **Focus.** After closing the panel focus returns to the launcher, but the launcher's focus ring is
    the same colour as its border in Graza (olive on lime), so it is weak (graza-desktop-09 shows focus
    already moved on to the demo bar, whose blue ring is clear).
13. **Configuration page is blank apart from the unaffiliated line** (configuration-desktop/375). Expected;
    the demo bar and current-page state are correct on all three pages.

## Checked and fine

- Launcher opens, closes, comes back and reopens on both stores at desktop and 375 (probe + screenshots).
- No horizontal scroll and nothing outside the viewport at any step. Launcher never overlaps the demo bar.
- 375 bottom sheet is full width; the demo bar hides while it is open and returns on close.
- Scripted flows complete on both stores, bag count increments on add-to-cart, checkout is a handoff.
- Demo bar: `aria-current` state is visible on each page, keyboard focus ring is clear.
