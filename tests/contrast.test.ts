import { describe, it, expect } from 'vitest';
import { guardContrast, AA_TEXT } from '../src/tokens/contrast';
import { contrastHex } from '../src/tokens/color';
import { cloneTokens } from '../src/tokens/schema';
import { neutral } from '../src/brands/neutral';

describe('contrast guard', () => {
  it('reports every text pair (never silently fails)', () => {
    const { report } = guardContrast(neutral);
    expect(report.length).toBe(7);
    for (const r of report) {
      expect(r).toHaveProperty('label');
      expect(typeof r.passes).toBe('boolean');
    }
  });

  it('nudges a too-light foreground until it meets 4.5:1', () => {
    const t = cloneTokens(neutral);
    t.color.ink = '#AAAAAA'; // ~1.9:1 on white, fails
    const before = contrastHex('#AAAAAA', t.color.bg);
    expect(before).toBeLessThan(AA_TEXT);

    const { tokens, report } = guardContrast(t);
    const inkPair = report.find((r) => r.fg === 'ink' && r.bg === 'bg')!;
    expect(inkPair.adjusted).toBe(true);
    expect(inkPair.passes).toBe(true);
    expect(contrastHex(tokens.color.ink, tokens.color.bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('leaves already-passing pairs untouched', () => {
    const { tokens, report } = guardContrast(neutral);
    const inkPair = report.find((r) => r.fg === 'ink' && r.bg === 'bg')!;
    expect(inkPair.adjusted).toBe(false);
    expect(tokens.color.ink).toBe(neutral.color.ink);
  });

  it('preserves hue while only moving lightness', () => {
    const t = cloneTokens(neutral);
    t.color.inkMuted = '#8AD1FF'; // light blue, fails on white
    const { tokens } = guardContrast(t);
    // Still recognisably blue: blue channel remains the dominant one.
    const hex = tokens.color.inkMuted.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    expect(b).toBeGreaterThan(r);
  });
});
