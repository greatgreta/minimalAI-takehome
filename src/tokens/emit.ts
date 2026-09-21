// Emit resolved tokens as --agent-* CSS custom properties.
// The agent element consumes ONLY these variables, so brand look-and-feel is data, not code.

import type { Tokens, TypeStyle } from './schema';

/** Nested radius rule: an inner corner inside a padded outer corner. */
export function innerRadius(outer: number, padding: number): number {
  return Math.max(outer - padding, 2);
}

function typeVars(prefix: string, s: TypeStyle): Record<string, string> {
  return {
    [`--agent-${prefix}-family`]: s.family,
    [`--agent-${prefix}-weight`]: String(s.weight),
    [`--agent-${prefix}-size`]: `${s.size}rem`,
    [`--agent-${prefix}-line`]: String(s.lineHeight),
  };
}

/** Resolved tokens -> a flat map of custom property name -> value. */
export function emitVars(t: Tokens): Record<string, string> {
  // Density drives spacing; padding also feeds the nested-radius rule.
  const pad = Math.round(16 * t.density);
  const gap = Math.round(10 * t.density);

  return {
    // colour
    '--agent-bg': t.color.bg,
    '--agent-surface': t.color.surface,
    '--agent-ink': t.color.ink,
    '--agent-ink-muted': t.color.inkMuted,
    '--agent-line': t.color.line,
    '--agent-accent': t.color.accent,
    '--agent-on-accent': t.color.onAccent,
    '--agent-danger': t.color.danger,
    '--agent-success': t.color.success,

    // type
    ...typeVars('display', t.type.display),
    ...typeVars('body', t.type.body),
    ...typeVars('small', t.type.small),

    // shape
    '--agent-radius-sm': `${t.shape.radius.sm}px`,
    '--agent-radius-md': `${t.shape.radius.md}px`,
    '--agent-radius-lg': `${t.shape.radius.lg}px`,
    '--agent-radius-pill': `${t.shape.radius.pill}px`,
    // nested corners (card inside panel, chip inside strip)
    '--agent-radius-md-inner': `${innerRadius(t.shape.radius.md, pad)}px`,
    '--agent-radius-lg-inner': `${innerRadius(t.shape.radius.lg, pad)}px`,
    '--agent-radius-dock': `${t.shape.dock}px`,
    '--agent-shadow': t.shape.shadow,
    '--agent-border': `${t.shape.border}px`,

    // motion
    '--agent-duration': `${t.motion.duration}ms`,
    '--agent-easing': t.motion.easing,

    // spacing / density
    '--agent-density': String(t.density),
    '--agent-pad': `${pad}px`,
    '--agent-gap': `${gap}px`,
  };
}

/** Serialize the var map into a CSS declaration block body (no selector). */
export function emitCssText(t: Tokens): string {
  const vars = emitVars(t);
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
}
