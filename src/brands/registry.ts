// Brand registry. Maps a brand id to its token set. The config codec resolves tokens through
// this map, so the agent code never names a brand. Phase 2 registers graza + maurten.

import type { Tokens } from '../tokens/schema';
import { neutral } from './neutral';

export const DEFAULT_BRAND = 'neutral';

const registry = new Map<string, Tokens>([['neutral', neutral]]);

export function registerBrand(id: string, tokens: Tokens): void {
  registry.set(id, tokens);
}

export function hasBrand(id: string): boolean {
  return registry.has(id);
}

/** Look up a brand's tokens, falling back to the neutral brand for unknown ids. */
export function getBrandTokens(id: string): Tokens {
  return registry.get(id) ?? neutral;
}

export function brandIds(): string[] {
  return [...registry.keys()];
}
