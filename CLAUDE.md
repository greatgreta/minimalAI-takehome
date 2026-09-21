# Minimal AI take-home - working rules

Unaffiliated design exercise. Prices, offers and product data are fictional.

Thesis: **styled vs built**. Two brands (Graza, Maurten) look AND behave differently
because their tokens differ, never because the code forks. Same agent code for every brand.

## Hard rules

- Brand names (Graza, Maurten, Sizzle, Drizzle, Frizzle, Gel 100, ...) appear only as text in
  `data`/fixtures and page copy. No logos, mascots, product art, or copied site copy. Product tiles
  are flat colour blocks. One real Graza product photo is allowed, in the Graza replica hero only
  (`src/assets/graza-hero*.webp`, third-party, private exercise). No other brand photography anywhere.
- Every page and `README.md` carry the line:
  "Unaffiliated design exercise. Prices, offers and product data are fictional."
- Do NOT create, edit or scaffold `DECISIONS.md`. Greta writes it herself.
- No brand value (hex, px radius, font name, brand name) inside `src/agent` or `src/config`.
  Values live only in `src/brands/*.ts` and tokens code. A test enforces this.
  `src/hosts` and `src/demo-bar` are excluded on purpose (replica styling and neutral demo chrome).
- Scripts contain no literal price, date, count or claim. Everything comes from `data` via
  `{placeholders}`.
- `_reference/` is git-ignored. Never commit personal data.
- Fonts: self-hosted stand-ins via `@fontsource` (the brand fonts are licensed).
- Stack: Vite + TypeScript + Vitest. No UI framework: vanilla TS and custom elements.
- Use no em dashes in any file or copy.
- Ask before anything destructive. Never change git config. Never force push.

## Architecture

- `dist/agent.js`: ONE custom element (`<minimal-agent>`) with Shadow DOM, styled only through
  `--agent-*` CSS custom properties. Same code for every brand.
- `/` is the Graza replica, `/maurten` the Maurten replica. Each embeds the agent with the exact
  `<script>` snippet a merchant would paste.
- A floating demo bar (bottom centre, neutral chrome) switches Graza / Maurten / Configuration.
- Scripted, deterministic conversations per brand (no LLM).
- Token pipeline, sliders, contrast guard, config codec and snippet builder, all tested, with no UI.
