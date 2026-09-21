import { describe, it, expect } from 'vitest';
import '../src/brands/register';
import { resolveTokens, type AgentConfig } from '../src/config/codec';
import { contrastHex } from '../src/tokens/color';
import { TEXT_PAIRS } from '../src/tokens/schema';
import { emitVars } from '../src/tokens/emit';
import { AA_TEXT } from '../src/tokens/contrast';

// Small seeded PRNG (mulberry32) so failures are reproducible.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (r: () => number) =>
  '#' +
  [0, 1, 2]
    .map(() =>
      Math.floor(r() * 256)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

function randomConfig(r: () => number): AgentConfig {
  const brands = ['graza', 'maurten', 'neutral'];
  return {
    brand: brands[Math.floor(r() * brands.length)],
    sliders: { energy: r(), shape: r() },
    overrides: {
      ...(r() < 0.7 ? { accent: hex(r) } : {}),
      ...(r() < 0.3 ? { font: 'serif' } : {}),
      ...(r() < 0.6 ? { radius: r() * 3 } : {}),
    },
    behaviour: {
      placement: r() < 0.5 ? 'floating' : 'docked',
      opening: r() < 0.5 ? 'greets' : 'silent',
      understanding: r() < 0.5 ? 'in-chat' : 'strip',
    },
    promotions: { firstOrder: r() < 0.5 },
  };
}

describe('brand fuzz', () => {
  const r = rng(20260921);
  const runs = Array.from({ length: 300 }, () => randomConfig(r));

  it('every text pair is >= 4.5:1 after the guard', () => {
    for (const cfg of runs) {
      const { tokens, report } = resolveTokens(cfg);
      for (const p of TEXT_PAIRS) {
        const ratio = contrastHex(tokens.color[p.fg], tokens.color[p.bg]);
        expect(ratio, `${p.label} ${JSON.stringify(cfg)}`).toBeGreaterThanOrEqual(AA_TEXT);
      }
      expect(report.every((x) => x.passes)).toBe(true);
    }
  });

  it('the radius scale is monotonic', () => {
    for (const cfg of runs) {
      const { sm, md, lg, pill } = resolveTokens(cfg).tokens.shape.radius;
      expect(sm).toBeLessThanOrEqual(md);
      expect(md).toBeLessThanOrEqual(lg);
      expect(lg).toBeLessThanOrEqual(pill);
    }
  });

  it('nested radius is never negative', () => {
    for (const cfg of runs) {
      const v = emitVars(resolveTokens(cfg).tokens);
      for (const k of ['--agent-radius-md-inner', '--agent-radius-lg-inner']) {
        expect(parseFloat(v[k]), k).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
