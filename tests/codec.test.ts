import { describe, it, expect } from 'vitest';
import {
  encodeConfig,
  decodeConfig,
  resolveTokens,
  buildSnippet,
  defaultConfig,
  type AgentConfig,
} from '../src/config/codec';

const sample: AgentConfig = {
  brand: 'neutral',
  sliders: { energy: 0.7, shape: 0.2 },
  overrides: { accent: '#FF3366', radius: 1.5 },
  behaviour: { placement: 'docked', opening: 'silent', understanding: 'strip' },
  promotions: { firstOrder: false },
};

describe('codec', () => {
  it('round-trips encode -> decode', () => {
    const back = decodeConfig(encodeConfig(sample));
    expect(back).toEqual(sample);
  });

  it('produces base64url (no +, /, or = padding)', () => {
    const s = encodeConfig(sample);
    expect(s).not.toMatch(/[+/=]/);
  });

  it('rejects an unknown version', () => {
    const bad = Buffer.from(JSON.stringify({ v: 999, brand: 'neutral' })).toString('base64url');
    expect(() => decodeConfig(bad)).toThrow(/version/i);
  });

  it('resolveTokens runs the pipeline and applies behaviour + overrides', () => {
    const { tokens, report } = resolveTokens(sample);
    expect(tokens.placement).toBe('docked');
    expect(tokens.behaviour.opening).toBe('silent');
    expect(tokens.behaviour.understanding).toBe('strip');
    expect(report.length).toBe(7);
    // accent override flows through (chroma may shift via energy, but hue stays reddish)
    const hex = tokens.color.accent.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    expect(r).toBeGreaterThan(g);
  });

  it('buildSnippet embeds a decodable data-config', () => {
    const snippet = buildSnippet(sample, 'https://example.com');
    expect(snippet).toContain('src="https://example.com/agent.js"');
    const m = snippet.match(/data-config="([^"]+)"/);
    expect(m).toBeTruthy();
    expect(decodeConfig(m![1])).toEqual(sample);
  });

  it('defaultConfig seeds behaviour from the brand tokens', () => {
    const cfg = defaultConfig('neutral');
    expect(cfg.sliders).toEqual({ energy: 0.5, shape: 0.5 });
    expect(cfg.behaviour.placement).toBe('floating');
  });
});
