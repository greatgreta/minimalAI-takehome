// Demo navigation. This is NOT part of the agent: it is neutral chrome that lets a reviewer hop
// between the two store replicas and the configuration page. It is deliberately not brand-styled
// and does not use any --agent-* token.
//
// Overlap rules with the agent:
//  - z-index sits above the page but below the agent panel (agent host is 1000).
//  - It exposes its height as --demo-bar-h; pages lift the agent launcher above it at <= 640px.
//  - It hides while the agent panel is open at <= 480px (agent:open / agent:close) and returns on close.
//  - A docked panel sits flush to the bottom edge, so it also hides the bar when that panel is
//    expanded or the viewport is narrower than DOCKED_CLEARANCE (agent:expand).

const DOCKED_CLEARANCE = 1120;

export type DemoPage = 'graza' | 'maurten' | 'configuration';

const LINKS: Array<{ id: DemoPage; label: string; href: string }> = [
  { id: 'graza', label: 'Graza', href: '/' },
  { id: 'maurten', label: 'Maurten', href: '/maurten' },
  { id: 'configuration', label: 'Configuration', href: '/configuration' },
];

const CSS = `
/* Space the bar occupies from the viewport bottom: 12px gap + 46px bar. */
:root { --demo-bar-h: 58px; }
body { padding-bottom: calc(var(--demo-bar-h) + 24px); }
.demo-bar {
  position: fixed;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  z-index: 900;
  display: flex;
  gap: 4px;
  padding: 4px;
  max-width: calc(100vw - 24px);
  background: #ffffff;
  border: 1px solid #d0d0d0;
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  font: 500 13px/1 system-ui, sans-serif;
}
.demo-bar a {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  color: #222222;
  text-decoration: none;
  white-space: nowrap;
}
.demo-bar a:hover { background: #eeeeee; }
.demo-bar a[aria-current="page"] { background: #222222; color: #ffffff; }
.demo-bar a:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.demo-bar[data-agent-open="true"] { display: none; }
`;

export function mountDemoBar(current: DemoPage): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const nav = document.createElement('nav');
  nav.className = 'demo-bar';
  nav.setAttribute('aria-label', 'Demo navigation');
  for (const l of LINKS) {
    const a = document.createElement('a');
    a.href = l.href;
    a.textContent = l.label;
    if (l.id === current) a.setAttribute('aria-current', 'page');
    nav.append(a);
  }
  document.body.append(nav);

  // Agent events bubble and are composed, so they reach the document.
  const state = { open: false, docked: false, expanded: false };
  const update = () => {
    const hide =
      state.open &&
      (matchMedia('(max-width: 480px)').matches ||
        (state.docked && (state.expanded || innerWidth < DOCKED_CLEARANCE)));
    if (hide) nav.setAttribute('data-agent-open', 'true');
    else nav.removeAttribute('data-agent-open');
  };
  document.addEventListener('agent:open', (e) => {
    state.open = true;
    state.docked = (e as CustomEvent).detail?.placement === 'docked';
    update();
  });
  document.addEventListener('agent:close', () => {
    state.open = false;
    update();
  });
  document.addEventListener('agent:expand', (e) => {
    state.expanded = Boolean((e as CustomEvent).detail?.expanded);
    update();
  });
  addEventListener('resize', update);
}
