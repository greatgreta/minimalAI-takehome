// Brand registry. Maps a brand id to its token set and (optionally) its "pack": the data and
// conversation script for that brand. The agent resolves everything through this map, so agent
// code never names a brand. register.ts fills it.

import type { Tokens } from '../tokens/schema';
import type { Script } from '../agent/brain';
import { neutral, neutralPack } from './neutral';

export const DEFAULT_BRAND = 'neutral';

export interface BrandPack {
  /** Data that {placeholders} in the script resolve against. */
  data: unknown;
  /** Build the script for this brand from the resolved promotions. */
  script(promotions: { firstOrder: boolean }): Script;
}

const registry = new Map<string, Tokens>([['neutral', neutral]]);
const packs = new Map<string, BrandPack>([['neutral', neutralPack]]);

export function registerBrand(id: string, tokens: Tokens, pack?: BrandPack): void {
  registry.set(id, tokens);
  if (pack) packs.set(id, pack);
}

export function hasBrand(id: string): boolean {
  return registry.has(id);
}

/** Look up a brand's tokens, falling back to the neutral brand for unknown ids. */
export function getBrandTokens(id: string): Tokens {
  return registry.get(id) ?? neutral;
}

export function getBrandPack(id: string): BrandPack {
  return packs.get(id) ?? neutralPack;
}

export function brandIds(): string[] {
  return [...registry.keys()];
}
