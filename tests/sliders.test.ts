import { describe, it, expect } from 'vitest';
import { applyEnergy, applyShape } from '../src/tokens/sliders';
import { neutral } from '../src/brands/neutral';

describe('applyEnergy', () => {
  it('is an identity at the neutral 0.5 position', () => {
    const t = applyEnergy(neutral, 0.5);
    expect(t.motion.duration).toBe(neutral.motion.duration);
    expect(t.shape.border).toBe(neutral.shape.border);
    expect(t.type.display.weight).toBe(neutral.type.display.weight);
    expect(t.color.accent).toBe(neutral.color.accent);
  });

  it('louder is snappier, heavier and thicker; calmer the reverse', () => {
    const loud = applyEnergy(neutral, 1);
    const calm = applyEnergy(neutral, 0);
    expect(loud.motion.duration).toBeLessThan(neutral.motion.duration);
    expect(calm.motion.duration).toBeGreaterThan(neutral.motion.duration);
    expect(loud.shape.border).toBeGreaterThanOrEqual(neutral.shape.border);
    expect(loud.type.display.weight).toBeGreaterThan(neutral.type.display.weight);
  });

  it('does not mutate the input', () => {
    const before = neutral.motion.duration;
    applyEnergy(neutral, 1);
    expect(neutral.motion.duration).toBe(before);
  });
});

describe('applyShape', () => {
  it('is an identity at the neutral 0.5 position', () => {
    const t = applyShape(neutral, 0.5);
    expect(t.shape.radius).toEqual(neutral.shape.radius);
  });

  it('reaches the round anchor at 0 and the sharp anchor at 1', () => {
    expect(applyShape(neutral, 0).shape.radius).toMatchObject({ sm: 12, md: 20, lg: 30 });
    expect(applyShape(neutral, 1).shape.radius).toMatchObject({ sm: 2, md: 4, lg: 8 });
  });

  it('keeps the radius scale monotonic across the range', () => {
    for (const s of [0, 0.25, 0.5, 0.75, 1]) {
      const r = applyShape(neutral, s).shape.radius;
      expect(r.sm).toBeLessThanOrEqual(r.md);
      expect(r.md).toBeLessThanOrEqual(r.lg);
    }
  });
});
