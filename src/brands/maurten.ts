// Maurten brand tokens. Clinical, monochrome, docked. Accent is the ink itself (black fills,
// white text on them). Terse voice: numbers first, no exclamation marks, no emoji.

import type { Tokens } from '../tokens/schema';

export const maurten: Tokens = {
  color: {
    bg: '#FFFFFF',
    surface: '#FAFAFA',
    ink: '#050505',
    inkMuted: '#767676',
    line: '#E6E6E6',
    accent: '#050505', // accent = ink
    onAccent: '#FFFFFF',
    danger: '#AE0000',
    success: '#107839',
  },
  type: {
    display: { family: "'Inter', system-ui, sans-serif", weight: 600, size: 1.2, lineHeight: 1.25 },
    body: { family: "'Inter', system-ui, sans-serif", weight: 400, size: 0.9, lineHeight: 1.5 },
    small: { family: "'Inter', system-ui, sans-serif", weight: 400, size: 0.78, lineHeight: 1.4 },
  },
  shape: {
    radius: { sm: 2, md: 4, lg: 8, pill: 999 },
    border: 1,
    dock: 0, // square, flush to the edge
    shadow: '0 1px 2px color-mix(in srgb, var(--agent-ink) 10%, transparent)', // minimal
  },
  density: 0.95,
  motion: { duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  placement: 'docked',
  behaviour: { opening: 'silent', understanding: 'strip' },
  voice: {
    launcher: 'Ask Maurten',
    title: 'Ask Maurten',
    placeholder: 'Ask Maurten...',
  },
};
