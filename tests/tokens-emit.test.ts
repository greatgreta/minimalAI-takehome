import { describe, it, expect } from 'vitest';
import { emitVars, emitCssText, innerRadius } from '../src/tokens/emit';
import { neutral } from '../src/brands/neutral';

describe('emit', () => {
  it('emits --agent-* custom properties for colour, type, shape, motion', () => {
    const v = emitVars(neutral);
    expect(v['--agent-bg']).toBe('#FFFFFF');
    expect(v['--agent-ink']).toBe('#1A1A1A');
    expect(v['--agent-accent']).toBe('#2563EB');
    expect(v['--agent-body-size']).toBe('0.95rem');
    expect(v['--agent-body-weight']).toBe('400');
    expect(v['--agent-radius-md']).toBe('12px');
    expect(v['--agent-duration']).toBe('200ms');
    expect(v['--agent-easing']).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('applies the nested radius rule: inner = max(outer - padding, 2)', () => {
    expect(innerRadius(20, 16)).toBe(4);
    expect(innerRadius(3, 16)).toBe(2); // clamps, never negative
    expect(innerRadius(30, 10)).toBe(20);
  });

  it('emits derived inner radii from the density-driven padding', () => {
    const v = emitVars(neutral); // density 1 -> pad 16
    // md 12 -> inner max(12-16,2)=2 ; lg 16 -> inner max(16-16,2)=2
    expect(v['--agent-radius-md-inner']).toBe('2px');
    expect(v['--agent-radius-lg-inner']).toBe('2px');
  });

  it('serializes to a declaration block', () => {
    const css = emitCssText(neutral);
    expect(css).toContain('--agent-bg: #FFFFFF;');
    expect(css.split('\n').length).toBeGreaterThan(10);
  });
});
