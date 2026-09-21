// Static stylesheet for the agent. Every visual value is a var(--agent-*) token; the only literals
// are structural (layout sizes, z-index, 0/100%). Brand look-and-feel is entirely token-driven.

export const AGENT_CSS = `
:host {
  all: initial;
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
  color: var(--agent-ink);
  font-family: var(--agent-body-family);
  font-size: var(--agent-body-size);
  font-weight: var(--agent-body-weight);
  line-height: var(--agent-body-line);
}
* { box-sizing: border-box; }
button, input { font: inherit; color: inherit; }
[hidden] { display: none !important; }
:focus-visible { outline: 2px solid var(--agent-ink); outline-offset: 2px; }

.launcher, .panel {
  pointer-events: auto;
  /* elevation cue from the ink token, so a launcher stays distinct from a same-coloured host button */
  box-shadow: 0 2px 10px color-mix(in srgb, var(--agent-ink) 22%, transparent);
}

/* ---------- launcher ---------- */
.launcher {
  position: absolute;
  right: 16px;
  bottom: var(--agent-offset-bottom, 16px);
  min-height: 48px;
  padding: 0 calc(var(--agent-pad) * 1.25);
  border: var(--agent-border) solid var(--agent-line);
  border-radius: var(--agent-radius-pill);
  background: var(--agent-accent);
  color: var(--agent-on-accent);
  font-weight: var(--agent-display-weight);
  cursor: pointer;
  transition: transform var(--agent-duration) var(--agent-easing);
}
.launcher:hover { transform: translateY(-2px); }
.docked .launcher {
  right: 0;
  bottom: var(--agent-offset-bottom, 0px);
  border-radius: var(--agent-radius-md) 0 0 0;
  border-right: 0;
  border-bottom: 0;
}

/* ---------- panel ---------- */
.panel {
  position: absolute;
  right: 16px;
  bottom: calc(var(--agent-offset-bottom, 16px) + 60px);
  width: min(380px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--agent-bg);
  border: var(--agent-border) solid var(--agent-line);
  border-radius: var(--agent-radius-lg);
  animation: rise var(--agent-duration) var(--agent-easing);
}
.docked .panel {
  right: 0;
  bottom: var(--agent-offset-bottom, 0px);
  width: min(420px, 100vw);
  height: min(620px, calc(100vh - 24px));
  border-right: 0;
  border-bottom: 0;
  border-radius: var(--agent-radius-md) 0 0 0;
}
.docked .panel.expanded { width: min(640px, 100vw); height: min(760px, calc(100vh - 96px)); }
.panel.minimised { height: auto; }
.panel.minimised .body { display: none; }

@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.header {
  display: flex;
  align-items: center;
  gap: var(--agent-gap);
  padding: var(--agent-gap) var(--agent-pad);
  border-bottom: var(--agent-border) solid var(--agent-line);
  background: var(--agent-surface);
}
.title {
  flex: 1;
  font-family: var(--agent-display-family);
  font-size: var(--agent-display-size);
  font-weight: var(--agent-display-weight);
  line-height: var(--agent-display-line);
}
.icon-btn {
  min-width: 32px;
  min-height: 32px;
  padding: 0 var(--agent-gap);
  background: transparent;
  border: var(--agent-border) solid transparent;
  border-radius: var(--agent-radius-sm);
  cursor: pointer;
}
.icon-btn:hover { border-color: var(--agent-line); }

.body { flex: 1; min-height: 0; display: flex; flex-direction: column; }

/* ---------- messages ---------- */
.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--agent-gap);
  padding: var(--agent-pad);
}
.msg {
  max-width: 88%;
  padding: var(--agent-gap) calc(var(--agent-pad) * 0.8);
  border-radius: var(--agent-radius-md);
  overflow-wrap: anywhere;
  animation: rise var(--agent-duration) var(--agent-easing);
}
.msg.agent { align-self: flex-start; background: var(--agent-surface); border: var(--agent-border) solid var(--agent-line); }
.msg.user { align-self: flex-end; background: var(--agent-accent); color: var(--agent-on-accent); }
.typing { align-self: flex-start; color: var(--agent-ink-muted); font-size: var(--agent-small-size); }

/* ---------- chips / strip ---------- */
.chips { display: flex; flex-wrap: wrap; gap: calc(var(--agent-gap) * 0.6); margin-top: calc(var(--agent-gap) * 0.6); }
.chip {
  padding: 2px var(--agent-gap);
  font-size: var(--agent-small-size);
  border: var(--agent-border) solid var(--agent-line);
  border-radius: var(--agent-radius-pill);
  background: var(--agent-bg);
}
.strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--agent-gap) * 0.6);
  padding: calc(var(--agent-gap) * 0.7) var(--agent-pad);
  border-top: var(--agent-border) solid var(--agent-line);
  background: var(--agent-surface);
  font-size: var(--agent-small-size);
}
.strip-label { color: var(--agent-ink-muted); margin-right: var(--agent-gap); }
.strip .chip { border-radius: var(--agent-radius-sm); }

/* ---------- quick replies + buttons ---------- */
.replies { display: flex; flex-wrap: wrap; gap: var(--agent-gap); }
.btn {
  min-height: 36px;
  padding: 0 var(--agent-pad);
  border: var(--agent-border) solid var(--agent-line);
  border-radius: var(--agent-radius-md);
  background: var(--agent-bg);
  cursor: pointer;
  transition: transform var(--agent-duration) var(--agent-easing);
}
.btn.primary { background: var(--agent-accent); color: var(--agent-on-accent); }
.btn:hover:not([aria-disabled="true"]) { transform: translateY(-1px); }
.btn[aria-disabled="true"] { opacity: 0.6; border-style: dashed; cursor: default; }

/* ---------- insight card ---------- */
.card {
  align-self: stretch;
  padding: var(--agent-pad);
  background: var(--agent-surface);
  border: var(--agent-border) solid var(--agent-line);
  border-radius: var(--agent-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--agent-gap);
  animation: rise var(--agent-duration) var(--agent-easing);
}
.card-title { font-family: var(--agent-display-family); font-size: var(--agent-display-size); font-weight: var(--agent-display-weight); line-height: var(--agent-display-line); }
.card-line { font-size: var(--agent-small-size); color: var(--agent-ink-muted); }
.card-rows { display: grid; gap: calc(var(--agent-gap) * 0.5); }
.card-row { display: flex; justify-content: space-between; gap: var(--agent-gap); padding: calc(var(--agent-gap) * 0.5) var(--agent-gap); border-radius: var(--agent-radius-md-inner); background: var(--agent-bg); }
.card-row.diff { color: var(--agent-success); font-weight: var(--agent-display-weight); }
.card a { color: var(--agent-ink); }

/* ---------- composer ---------- */
.composer { border-top: var(--agent-border) solid var(--agent-line); padding: var(--agent-gap) var(--agent-pad); display: flex; flex-direction: column; gap: calc(var(--agent-gap) * 0.6); }
.composer-row { display: flex; gap: var(--agent-gap); }
.composer input {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  padding: 0 var(--agent-pad);
  background: var(--agent-bg);
  border: var(--agent-border) solid var(--agent-line);
  border-radius: var(--agent-radius-md);
}
.composer-meta { display: flex; justify-content: flex-end; align-items: center; font-size: var(--agent-small-size); color: var(--agent-ink-muted); }
.link-btn { background: none; border: 0; padding: 0; text-decoration: underline; cursor: pointer; }

/* ---------- small screens: full-width bottom sheet ---------- */
@media (max-width: 480px) {
  .panel, .docked .panel, .docked .panel.expanded {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: min(86vh, 640px);
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    border-radius: var(--agent-radius-lg) var(--agent-radius-lg) 0 0;
  }
  .panel.minimised, .docked .panel.minimised { height: auto; }
  .expand { display: none; }
  .icon-btn { min-width: 44px; min-height: 44px; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
`;
