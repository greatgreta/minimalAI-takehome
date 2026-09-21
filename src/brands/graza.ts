// Graza brand tokens. Measured from the reference; brand values are allowed to live here.
// Warm, rounded, playful. Lime is a FILL only (lime text on cream is ~1.2:1 and fails), so the
// accent role carries lime and onAccent carries the dark olive ink that sits on top of it.

import type { Tokens } from '../tokens/schema';

export const graza: Tokens = {
  color: {
    bg: '#F6E6D9',
    surface: '#FFF4EC',
    ink: '#3C422E',
    inkMuted: '#6E7355',
    line: '#3C422E', // line = ink, drawn at 1px
    accent: '#D1E030', // lime, fill only
    onAccent: '#3C422E',
    danger: '#A63D2E',
    success: '#4B7A3F',
  },
  type: {
    display: { family: "'EB Garamond', Georgia, serif", weight: 500, size: 1.5, lineHeight: 1.15 },
    body: { family: "'DM Sans', system-ui, sans-serif", weight: 400, size: 0.95, lineHeight: 1.5 },
    small: { family: "'DM Sans', system-ui, sans-serif", weight: 400, size: 0.8, lineHeight: 1.4 },
  },
  shape: { radius: { sm: 12, md: 20, lg: 30, pill: 999 }, border: 1 },
  density: 1.05,
  motion: { duration: 240, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' },
  placement: 'floating',
  behaviour: { opening: 'greets', understanding: 'in-chat' },
  voice: {
    launcher: 'Chat with Olive',
    placeholder: "Tell me what you're cooking...",
    greeting: "Hey! Looking for an oil? Tell me what's cooking.",
    understandingLead: "Here's what I'm hearing:",
  },
};
