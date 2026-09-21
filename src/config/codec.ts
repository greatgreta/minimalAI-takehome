// AgentConfig: the small, serialisable description a merchant pastes. It carries a brand id,
// the two sliders, optional manual overrides, behaviour, and promotions. resolveTokens runs the
// full pipeline (brand -> sliders -> overrides -> behaviour -> contrast guard) into ready tokens.

import type { Placement, Tokens } from '../tokens/schema';
import { cloneTokens } from '../tokens/schema';
import { applyEnergy, applyShape } from '../tokens/sliders';
import { guardContrast, type PairReport } from '../tokens/contrast';
import { getBrandTokens } from '../brands/registry';

export const CONFIG_VERSION = 1;

export interface AgentConfig {
  brand: string;
  sliders: { energy: number; shape: number };
  overrides: { accent?: string; font?: string; radius?: number };
  behaviour: {
    placement: Placement;
    opening: 'greets' | 'silent';
    understanding: 'in-chat' | 'strip';
  };
  promotions: { firstOrder: boolean };
}

export interface ResolvedConfig {
  config: AgentConfig;
  tokens: Tokens;
  report: PairReport[];
}

/** A sensible default config for a brand, seeded from that brand's own behaviour tokens. */
export function defaultConfig(brand: string): AgentConfig {
  const t = getBrandTokens(brand);
  return {
    brand,
    sliders: { energy: 0.5, shape: 0.5 },
    overrides: {},
    behaviour: {
      placement: t.placement,
      opening: t.behaviour.opening,
      understanding: t.behaviour.understanding,
    },
    promotions: { firstOrder: true },
  };
}

function applyOverrides(input: Tokens, overrides: AgentConfig['overrides']): Tokens {
  const t = cloneTokens(input);
  if (overrides.accent) t.color.accent = overrides.accent;
  if (overrides.font) {
    t.type.display.family = overrides.font;
    t.type.body.family = overrides.font;
    t.type.small.family = overrides.font;
  }
  if (overrides.radius !== undefined) {
    const k = Math.max(0, overrides.radius); // multiplier over the radius scale
    t.shape.radius = {
      sm: Math.round(t.shape.radius.sm * k),
      md: Math.round(t.shape.radius.md * k),
      lg: Math.round(t.shape.radius.lg * k),
      pill: t.shape.radius.pill,
    };
  }
  return t;
}

/** brand -> sliders -> overrides -> behaviour -> contrast guard. */
export function resolveTokens(config: AgentConfig): ResolvedConfig {
  let t = cloneTokens(getBrandTokens(config.brand));
  t = applyEnergy(t, config.sliders.energy);
  t = applyShape(t, config.sliders.shape);
  t = applyOverrides(t, config.overrides);

  t.placement = config.behaviour.placement;
  t.behaviour = {
    opening: config.behaviour.opening,
    understanding: config.behaviour.understanding,
  };

  const guarded = guardContrast(t);
  return { config, tokens: guarded.tokens, report: guarded.report };
}

// ---- base64url JSON codec (works in both browser and node) ------------------------------------

function toBase64Url(s: string): string {
  const b64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(s, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeConfig(config: AgentConfig): string {
  return toBase64Url(JSON.stringify({ v: CONFIG_VERSION, ...config }));
}

export function decodeConfig(encoded: string): AgentConfig {
  const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<AgentConfig> & { v?: number };
  if (parsed.v !== CONFIG_VERSION) {
    throw new Error(`Unsupported config version: ${String(parsed.v)}`);
  }
  const { v: _v, ...config } = parsed;
  void _v;
  return config as AgentConfig;
}

export function buildSnippet(config: AgentConfig, origin = ''): string {
  const src = `${origin}/agent.js`;
  return `<script src="${src}" data-config="${encodeConfig(config)}"></script>`;
}
