// Where the auto-mounting entry finds its config. In the production IIFE, document.currentScript is
// the merchant's <script data-config="...">. A module (dev loader) has no currentScript, so the
// loader hands the value over on a window global instead.

export const CONFIG_HANDOFF = '__minimalAgentConfig';

export function readMountConfig(
  script: { dataset: DOMStringMap } | null,
  win: Record<string, unknown>,
): string | undefined {
  const fromScript = script?.dataset.config;
  if (fromScript) return fromScript;
  const handoff = win[CONFIG_HANDOFF];
  return typeof handoff === 'string' && handoff ? handoff : undefined;
}
