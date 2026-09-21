// Brand profiles: what the configuration page "reads" from a merchant's store. The page imports
// this and nothing else from src/brands, so it carries no brand values of its own. Brand values are
// allowed here (this is src/brands).

import './register'; // makes the brand id resolvable by the config codec
import type { Tokens } from '../tokens/schema';
import { graza } from './graza';

export interface BrandProfile {
  id: string;
  name: string;
  /** Live domain as the store serves it. */
  domain: string;
  tokens: Tokens;
  /** One-sentence description of the look, used in the agent's first message. */
  summary: string;
  /** The "chatty and vibrant" vibe as slider positions. */
  sliders: { energy: number; shape: number };
  descriptors: { accentName: string; accentUse: string };
}

export const grazaProfile: BrandProfile = {
  id: 'graza',
  name: 'Graza',
  domain: 'www.graza.co',
  tokens: graza,
  summary: 'Warm cream background, deep olive text, one lime accent, soft rounded corners.',
  // The Graza tokens carry no slider values, so the vibe is defined here: more energy, and shape
  // left at the neutral 0.5 so the built agent keeps the brand's own radii.
  sliders: { energy: 0.7, shape: 0.5 },
  descriptors: { accentName: 'lime', accentUse: 'fill only' },
};
