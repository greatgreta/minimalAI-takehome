# AI log

Running log kept for Greta. At the end of each phase: "Decision points" (where there was a
choice, what was chosen, and the alternative), plus any "Assumptions" and "Cut" notes.

---

## Phase 0 — Repo

### Decision points

- **Two Vite configs instead of one.** `vite.config.ts` builds the three pages (MPA);
  `vite.agent.config.ts` builds the agent as a single IIFE at `dist/agent.js`. `npm run build`
  runs pages first (empties `dist`), then the agent (append, `emptyOutDir: false`).
  Alternative: one config with a custom Rollup input for the IIFE — rejected because Vite's `lib`
  mode is the clean way to get an IIFE with `document.currentScript` support.
- **Clean URLs handled by a small plugin** (`vite/plugins.ts`) that rewrites `/maurten` ->
  `/maurten.html` etc. in both the dev and preview servers, matching Vercel's `cleanUrls`.
  Alternative: rely on Vercel only — rejected because then local `dev`/`preview` would 404 on the
  demo-bar links.
- **Dev serves `/agent.js`** via middleware that injects a module script pointing at the source
  entry, so the merchant snippet works in dev too. Production uses the real IIFE bundle.
- **Font stand-ins:** EB Garamond + DM Sans for Graza (serif display + humanist sans), Inter for
  Maurten (neutral grotesque), all via `@fontsource` (self-hosted). The brand fonts are licensed;
  these are visual stand-ins recorded here as required.

### Assumptions

- The agent snippet injector degrades to `data-brand="..."` in Phase 0 (codec/brands do not exist
  yet). Phase 2 rewires it to the real `buildSnippet` output (`data-config="..."`).
- `docs/screens/` is committed (not git-ignored) so the README can embed the generated shots. If
  Chromium is unavailable the shots are skipped and the README notes it.

### Cut

- None yet.

---

## Phase 1 — Tokens and config logic

### Decision points

- **Sliders are neutral at 0.5, not at 0.** Both `applyEnergy` and `applyShape` are the identity at
  0.5, so a brand shows its declared tokens at the middle of each slider and the slider pushes away
  from there. Alternative: 0 = brand default — rejected because it makes "more/less" asymmetric and
  hides half the range.
- **Shape lerps from the brand radius toward anchors.** At 0.5 the brand's own radius is used; below
  0.5 it blends toward a round anchor (12/20/30), above 0.5 toward a sharp anchor (2/4/8). Those
  anchors happen to equal Graza's and Maurten's radii, so each brand at 0.5 already sits at its
  natural roundness and the slider still reaches both extremes. Alternative: always replace radius
  with a pure anchor lerp — rejected because it makes the brand's declared radius dead.
- **Contrast guard nudges the text colour, not the background.** Backgrounds and accent fills are
  brand identity; only lightness of the text role is moved (hue + chroma held in OKLCH). Alternative:
  move whichever is cheaper — rejected as it can drift a brand's surfaces.
- **`overrides.radius` is a multiplier** over the radius scale (pill excluded), so it cannot break
  monotonicity. Alternative: an absolute md value with derived sm/lg — rejected as more surprising.
- **Codec base64url works in browser and node** via a `typeof Buffer` guard (Buffer in node,
  `btoa`/`atob` in the browser), so the same codec runs in the agent, the Vite plugin and tests.

### Assumptions

- A `neutral` brand + a brand `registry` were introduced now (normally Phase 2) so `resolveTokens`
  is testable and the agent has a real fallback when `data-config` is missing. Phase 2 registers
  graza + maurten into the same registry.
- Energy skips the accent-chroma step exactly at 0.5 to avoid hex round-trip drift (keeps 0.5 an
  exact identity).

### Cut

- None.
