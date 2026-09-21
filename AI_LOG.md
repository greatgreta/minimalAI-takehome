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

---

## Phase 3 - Agent runtime

### Decision points

- **Brand "packs" in the registry.** The agent asks the registry for `{data, script}` by brand id, so
  no brand is named in `src/agent`. `src/brands/register.ts` (a side-effect import) fills it, and the
  bundle therefore contains both brands' data. Alternative: one bundle per brand, rejected (thesis is
  one code path).
- **`replyId` on action buttons.** A card or action button carries the script reply id it plays.
  Buttons whose id is not the script's pending reply are shown disabled ("Not part of this scripted
  demo"), which is how "only the [Yes] path is scripted" and "Get the trio" behave. Checkout has no
  reply id: it only dispatches `agent:checkout` (handoff, no payment).
- **Composer honesty.** Pre-fills the next scripted user line; if the shopper types something else, the
  transcript shows their text and the script advances anyway. Reset restarts and replays the greeting.
- **Launcher hides while the panel is open** (both placements). Alternative: keep it as a toggle.
- **Fonts are not bundled in agent.js.** `@font-face` cannot live inside shadow DOM, so the host page
  loads the font stand-ins (done in Phase 4 via `@fontsource`). A merchant's page would load its own.
- **Buttons and the composer use the `md` radius token, not `pill`,** so Maurten reads square and
  Graza rounded from the same CSS. Launcher and chips keep `pill`/`sm`.
- **Understanding placement** is decided in the element from the `understanding` token; scripts never
  see it. In strip mode the strip is always visible ("Context / Nothing yet").
- **Dev `/agent.js`** is a tiny classic script that injects a module script for the source entry, so
  `document.currentScript.dataset.config` is NOT available in dev. Preview/production use the real
  IIFE. Assumption: acceptable for the take-home; use `npm run build && npm run preview` to see exact
  merchant behaviour.

### Assumptions

- Voice strings `voice.launcher` and `voice.title` are optional; defaults are the generic labels
  "Ask" (floating), "Agent" (docked), and title "Agent".
- Verified in the built-in browser at a narrow (~344px) viewport: both scripts play to the end, events
  fire, silent vs greeting opening, strip vs in-chat understanding, bottom-sheet layout.

### Cut

- None.

---

## Phase 4 - Store replicas, pages and demo bar

### Decision points

- **Replica fidelity.** Layout, type scale, spacing and colour system follow the references (Graza: cream
  page, olive ink, lime fill, serif display, rounded boxes, tabs, "meet the lineup"; Maurten: white
  5-column hairline grid, muted nav). Imagery is flat colour blocks, and I wrote all page copy myself
  (the Maurten intro line and Graza tab notes are original placeholders, not the sites' copy).
- **Maurten grid shows only the catalogue products** (9 tiles incl. "Fuel Planner" as a link tile), not
  the reference's full 40 items (bottles, flasks, collections were left out).
- **`--demo-bar-h` = 58px** (12px gap + 46px bar), so the launcher offset `var(--demo-bar-h) + 12px`
  clears the bar at <= 640px. Checked in the browser pane: bounding boxes do not overlap, no horizontal
  scroll. Docked Maurten launcher has no offset on desktop (sits flush at the bottom right).
- **Fonts:** latin subsets only (`@fontsource/*/latin-*.css`), imported by the store replicas, since
  `@font-face` cannot live in the agent's shadow DOM.
- **Demo bar colours are literal neutrals** in `src/demo-bar` (excluded from the no-brand-leak test on
  purpose). Hides at <= 480px while the agent panel is open, via `data-agent-open`.
- **Page-level `body {margin:0}`** inline in each html file so replicas are edge to edge.

### Assumptions

- Configuration page: neutral grey background, the unaffiliated line, the demo bar and an empty
  `<main id="config-root">`. Nothing else (Phase 5).

### Cut

- None.

---

## Phase 5 - Configuration page stub

Done as part of Phase 4 (page stub) plus the README section above. No controls, sliders or preview were designed.

### Decision points

- None beyond keeping the page strictly empty.

### Cut

- None.

---

## Phase 6 - Tests

### Decision points

- **Playwright uses the system Google Chrome** (`channel: 'chrome'`), so no browser download was needed
  even though no Playwright Chromium was installed. `@playwright/test` is a dev dependency (library only).
  Alternative: skip e2e per the "only if Chromium is available" rule; Chrome counted as available.
- **`npm run test` is Vitest only; e2e is `npm run test:e2e`** (needs `npm run build` first, serves the
  production build). Vitest only picks up `*.test.ts`, so `.spec.ts` files never run under it.
- **Screenshots at the obstacle turn:** Graza after two sends (Sizzle does not fit, then the Drizzle card
  and trio escape route are on screen); Maurten after the postcode (restock too late, compare card).
  Alternative for Graza: stop after the first send. `npm run shots` needs a prior `npm run build`.
- **Fuzz runs 300 seeded configs** (mulberry32, seed 20260921) across graza, maurten and neutral.
- **no-brand-leak scans `.ts` under src/agent and src/config** for hex colours, px radii, font names and
  brand names, and has a self-test proving each rule fires.

### Bug found by the fuzz test (fixed)

The contrast guard measured contrast on the unrounded OKLCH colour, but the emitted hex is 8-bit, so a
cyan accent with white `onAccent` landed at 4.47:1 while reporting a pass. The guard now measures the
quantised hex it will emit. Regression test added in `tests/contrast.test.ts`.

### Assumptions

- The no-brand-leak "px radius" rule is `radius ... <n>px` on one line; `var(--agent-radius-*)` passes.

### Cut

- None. (Playwright 375 spec, brand fuzz test and screenshots all built.)

---

## Phase 7 - Docs and deploy readiness

### Decision points

- **README embeds the two desktop shots at the top** and links the 375px shots, as asked.
- **Verified from a clean clone of the pushed repo** (`npm ci`, `npm test`, `npm run build`,
  `npm run preview`): `/`, `/maurten`, `/configuration` and `/agent.js` all return 200.
- **Vercel:** Framework Vite, build command `npm run build`, output directory `dist`. `vercel.json`
  sets `cleanUrls`. The snippet uses a relative `/agent.js`, so it works on any deployed origin.

### Assumptions

- `npm audit` reports vulnerabilities in dev tooling (Vite/Vitest transitive deps). Not addressed; none
  ship in `dist`.

### Cut

- None.

---

## Follow-up jobs (install fix, review walkthrough, fixes)

### Decision points

- **Install failure cause.** `npm error Invalid Version` came from `package-lock.json`: two nested optional
  platform packages (`@esbuild/win32-ia32`, `@rollup/rollup-openharmony-arm64`) had no `version` or
  `resolved`. They were written while my local npm cache was unreadable (EACCES/EEXIST under
  `~/.npm/_cacache`), so plain regeneration reproduced them. Fixed by regenerating with a throwaway
  `--cache`. `package.json` itself had no `packageManager`, `devEngines`, `overrides`, bad versions, and
  there is no `.npmrc`. Added `engines: {"node": ">=20"}`. Note: the first commit (6b5e285) did not fix it;
  the second (7ec016a) did. Your `~/.npm` cache has root-owned files; `sudo chown -R $(id -u):$(id -g)
  ~/.npm` would fix that (I did not run it).
- **Side branches for "Get the trio".** A `Script.branches` map plays a reply without advancing the main
  path, so the verbatim Graza copy and its snapshot are untouched. A branch's controls are standalone
  (no reply id), so "Add the trio" always dispatches `agent:add-to-cart {productId:'trio'}`.
- **Stale controls are hidden, not disabled.** Each rendered control records the step that will answer it;
  once the script is past that step it is removed. Unscripted siblings of a pending choice stay visible
  (dashed) so the demo stays honest about what is scripted.
- **New events:** `agent:open` now carries `{placement}` and a new `agent:expand {expanded}` event exists,
  both so the demo bar can step aside. The demo bar also hides for a docked panel below 1120px wide
  (spec said 480px); a docked panel sits flush to the bottom edge, so it would otherwise overlap the bar.
- **Elevation from tokens.** `box-shadow` uses `color-mix` on `--agent-ink`, so no brand value entered
  `src/agent`. The no-brand-leak test still passes.
- **Dev loader** hands `data-config` over on `window.__minimalAgentConfig`; the production IIFE still reads
  `document.currentScript`.

### Assumptions

- **Copy I wrote, not Greta's:** the reply to "Get the trio" is `The trio: {sizzle.name}, {drizzle.name},
  {frizzle.name}, {trio.price} EUR.` and the button label is `Add the trio`. Built only from data.
- The user echo for the branch is the option's own label ("Get the trio").
- Untouched: Maurten copy, the rest of the Graza copy, DECISIONS.md, the configuration page UI.

### Not fixed

- Graza launcher at 375 still floats over the page's "Add to bag" (a fixed widget covers content by
  design; only an elevation cue was added).
- Docked launcher is still a flush tab rather than a bottom bar; generic "Agent" panel title.
- `npm audit` findings in dev tooling; not addressed.
