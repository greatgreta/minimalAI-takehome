import { grazaProfile, type BrandProfile } from '../brands/profiles';

// Scripted for the demo; a real version would call an extraction service. No network access here.
export async function readStore(): Promise<BrandProfile> {
  return grazaProfile;
}
