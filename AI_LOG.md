# AI log

Running log kept for Greta. At the end of each phase: "Decision points" (where there was a
choice, what was chosen, and the alternative), plus any "Assumptions" and "Cut" notes.

---

## Phase 0 - Repo

### Decision points

- **Two Vite configs instead of one.** `vite.config.ts` builds the three pages (MPA);
  `vite.agent.config.ts` builds the agent as a single IIFE at `dist/agent.js`. `npm run build`
  runs pages first (empties `dist`), then the agent (append, `emptyOutDir: false`).
  Alternative: one config with a custom Rollup input for the IIFE - rejected because Vite's `lib`
  mode is the clean way to get an IIFE with `document.currentScript` support.
- **Clean URLs handled by a small plugin** (`vite/plugins.ts`) that rewrites `/maurten` ->
  `/maurten.html` etc. in both the dev and preview servers, matching Vercel's `cleanUrls`.
  Alternative: rely on Vercel only - rejected because then local `dev`/`preview` would 404 on the
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

## Phase 1 - Tokens and config logic

### Decision points

- **Sliders are neutral at 0.5, not at 0.** Both `applyEnergy` and `applyShape` are the identity at
  0.5, so a brand shows its declared tokens at the middle of each slider and the slider pushes away
  from there. Alternative: 0 = brand default - rejected because it makes "more/less" asymmetric and
  hides half the range.
- **Shape lerps from the brand radius toward anchors.** At 0.5 the brand's own radius is used; below
  0.5 it blends toward a round anchor (12/20/30), above 0.5 toward a sharp anchor (2/4/8). Those
  anchors happen to equal Graza's and Maurten's radii, so each brand at 0.5 already sits at its
  natural roundness and the slider still reaches both extremes. Alternative: always replace radius
  with a pure anchor lerp - rejected because it makes the brand's declared radius dead.
- **Contrast guard nudges the text colour, not the background.** Backgrounds and accent fills are
  brand identity; only lightness of the text role is moved (hue + chroma held in OKLCH). Alternative:
  move whichever is cheaper - rejected as it can drift a brand's surfaces.
- **`overrides.radius` is a multiplier** over the radius scale (pill excluded), so it cannot break
  monotonicity. Alternative: an absolute md value with derived sm/lg - rejected as more surprising.
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

---

## Phase 2 - Brands, data, scripts

### Decision points

- **Scripts are builder functions, not constants.** `buildGrazaScript({data, promotions})` decides the
  two documented branches (same price, harvest, first-order offer) at build time from data and config;
  the copy stays verbatim with `{placeholders}`. Alternative: put conditions in the renderer, which
  would leak Graza logic into the shared agent.
- **Brand name comes from data** (`{brandName}` in the catalogue) so scripts carry no brand literal
  beyond the product names the copy requires.
- **"Just Drizzle" is both a card action button and the scripted user tap** (step input `reply`). The
  copy lists `[Just Drizzle] [Get the trio]` together; I render the first as the card's action and the
  second as a quick reply. Alternative: both as quick replies. Only "Just Drizzle" advances the script.
- **`understanding` turns emit `parsed` in both brands.** The transcript projection (used by tests, and
  the pattern for the Phase 3 renderer) reads the `understanding` token and `voice.understandingLead`;
  scripts never do. A test flips the token on Graza and shows the chat lead-in disappearing.
- **Maurten catalogue names:** read from the reference grid. Kept only Gel 100, Gel 100 Caf 100, Gel 160,
  Drink Mix 160/320, Solid 160, Solid C160, Bicarb System, plus "Fuel Planner" as a link. Dropped
  bottles, flasks and collections from the replica grid to keep it small. Alternative: include all.
- **Brand registry side-effect module** (`src/brands/register.ts`) registers graza + maurten; the Vite
  plugin and the agent entry import it. The agent itself never names a brand.
- **Snippet injector now uses the real codec**: pages contain `buildSnippet(defaultConfig(brand), '')`
  (relative `/agent.js`, so it works on any host).

### Assumptions

- Fallback final Graza line "Welcome, then. Check out when you're ready." is NOT Greta's copy (as
  instructed). Used when the offer is absent or `promotions.firstOrder` is off.
- `inkMuted` and `danger`/`success` for Graza are not specified; I chose values that pass 4.5:1 on the
  cream surfaces (the contrast guard also enforces it).
- Fuel Planner URL and the "Prepare for your marathon" URL are marked TODO verify.
- Removed all em dashes from files written so far (rule: none in any file).
- From Phase 2 the commit trailer reads "Claude Sonnet 5" because the session model changed and the
  harness attribution instruction changed with it.

### Cut

- None.
