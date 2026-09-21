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
