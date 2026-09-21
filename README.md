# Minimal AI take-home

Unaffiliated design exercise. Prices, offers and product data are fictional.

**Thesis: styled vs built.** One embeddable agent, two brands. Graza and Maurten look AND behave
differently because their *tokens* differ, never because the code forks.

## What this is

- `dist/agent.js` - one custom element (`<minimal-agent>`, Shadow DOM) styled only through
  `--agent-*` CSS custom properties. Same code for every brand.
- `/` - Graza store replica, embedding the agent with the exact `<script>` a merchant would paste.
- `/maurten` - Maurten store replica, same agent, different tokens.
- `/configuration` - configuration page (design to be added later).
- A neutral demo bar (bottom centre) switches between the three.

## Run

```bash
npm i
npm run dev       # dev server (clean URLs: /, /maurten, /configuration)
npm run build     # builds the pages + dist/agent.js
npm run preview   # serves the production build
npm test          # unit tests (Vitest)
```

## Status

Scaffold in progress - see `AI_LOG.md` for phase-by-phase decisions.

The token pipeline, sliders, contrast guard, config codec and `buildSnippet` are built and tested
without a UI, so the configuration page can be wired to them later.

## Structure

```
src/tokens/     token schema, CSS emitter, OKLCH contrast guard, sliders
src/config/     AgentConfig codec + snippet builder
src/brands/     brand token configs (the only place brand values live, with tokens code)
src/catalogue/  fictional product data (every field verified:false)
src/agent/      the embeddable custom element (styled only via --agent-* vars)
src/scripts/    deterministic per-brand conversations
src/hosts/      store replicas (brand values allowed here)
src/demo-bar/   neutral demo navigation
```
