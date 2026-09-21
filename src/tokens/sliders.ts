// Two pure "personality" sliders over the tokens. Both are neutral (identity) at 0.5, so a
// brand shows its own values at the middle and the sliders push away from there.
//   applyEnergy(t, 0..1)  calm -> loud
//   applyShape(t, 0..1)   round -> sharp

import { cloneTokens, type RadiusScale, type Tokens } from './schema';
import { oklchToRgb, parseHex, rgbToOklch, toHex } from './color';

// Radius anchors the shape slider reaches at its extremes.
const ROUND_ANCHOR: RadiusScale = { sm: 12, md: 20, lg: 30, pill: 999 };
const SHARP_ANCHOR: RadiusScale = { sm: 2, md: 4, lg: 8, pill: 999 };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Signed slider value in [-1, 1]; 0 at the neutral 0.5 position. */
function signed(v: number): number {
  return (clamp(v, 0, 1) - 0.5) * 2;
}

function scaleChroma(hex: string, factor: number): string {
  const { L, C, h } = rgbToOklch(parseHex(hex));
  return toHex(oklchToRgb({ L, C: Math.max(0, C * factor), h }));
}

export function applyEnergy(input: Tokens, energy: number): Tokens {
  const t = cloneTokens(input);
  const e = signed(energy); // -1 calm .. +1 loud

  // Motion: louder is snappier, calmer is slower.
  t.motion.duration = Math.round(clamp(t.motion.duration * (1 - 0.5 * e), 80, 600));

  // Border weight: louder thickens the line.
  t.shape.border = clamp(Math.round(t.shape.border + (e > 0 ? e : 0)), 1, 3);

  // Type weight contrast: louder pushes the display weight up.
  t.type.display.weight = Math.round(clamp(t.type.display.weight + e * 200, 300, 900) / 50) * 50;

  // Accent usage: louder saturates the accent, calmer mutes it.
  // Skip at the neutral position so 0.5 is an exact identity (no hex round-trip drift).
  if (e !== 0) t.color.accent = scaleChroma(t.color.accent, 1 + e * 0.3);

  return t;
}

/** Blend the radius scale from the brand value toward the round or sharp anchor. */
export function applyShape(input: Tokens, shape: number): Tokens {
  const t = cloneTokens(input);
  const s = clamp(shape, 0, 1);
  const base = input.shape.radius;

  const blend = (anchor: RadiusScale, amt: number): RadiusScale => ({
    sm: Math.round(lerp(base.sm, anchor.sm, amt)),
    md: Math.round(lerp(base.md, anchor.md, amt)),
    lg: Math.round(lerp(base.lg, anchor.lg, amt)),
    pill: Math.round(lerp(base.pill, anchor.pill, amt)),
  });

  if (s < 0.5) {
    t.shape.radius = blend(ROUND_ANCHOR, (0.5 - s) * 2);
  } else if (s > 0.5) {
    t.shape.radius = blend(SHARP_ANCHOR, (s - 0.5) * 2);
  }
  return t;
}
