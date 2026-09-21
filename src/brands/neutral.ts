// Neutral fallback brand. Used when the agent mounts with no data-config, and as a plain base
// for token-pipeline tests. Brand values are allowed to live here (this is src/brands).

import type { Tokens } from '../tokens/schema';

export const neutral: Tokens = {
  color: {
    bg: '#FFFFFF',
    surface: '#F5F5F5',
    ink: '#1A1A1A',
    inkMuted: '#666666',
    line: '#E0E0E0',
    accent: '#2563EB',
    onAccent: '#FFFFFF',
    danger: '#B00020',
    success: '#146C2E',
  },
  type: {
    display: { family: 'system-ui, sans-serif', weight: 600, size: 1.25, lineHeight: 1.3 },
    body: { family: 'system-ui, sans-serif', weight: 400, size: 0.95, lineHeight: 1.5 },
    small: { family: 'system-ui, sans-serif', weight: 400, size: 0.8, lineHeight: 1.4 },
  },
  shape: {
    radius: { sm: 8, md: 12, lg: 16, pill: 999 },
    border: 1,
    dock: 12,
    shadow: '0 2px 10px color-mix(in srgb, var(--agent-ink) 22%, transparent)',
  },
  density: 1,
  motion: { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  placement: 'floating',
  behaviour: { opening: 'greets', understanding: 'in-chat' },
  voice: {
    placeholder: 'Ask a question...',
    greeting: 'Hi. How can I help?',
    understandingLead: "Here's what I'm hearing:",
  },
};

// Minimal pack so the neutral default has a (tiny) conversation. Imported type-only to avoid a cycle.
export const neutralPack: import('./registry').BrandPack = {
  data: {},
  script: () => ({
    steps: [
      {
        input: { kind: 'text', text: 'Hello' },
        turns: [
          {
            kind: 'text',
            from: 'agent',
            text: 'This is the neutral default. Paste a snippet with a brand config to see a brand.',
          },
        ],
      },
    ],
  }),
};
