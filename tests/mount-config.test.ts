import { describe, it, expect } from 'vitest';
import { readMountConfig, CONFIG_HANDOFF } from '../src/agent/mount-config';

describe('readMountConfig', () => {
  it('prefers the script tag data-config (production IIFE)', () => {
    expect(readMountConfig({ dataset: { config: 'abc' } }, { [CONFIG_HANDOFF]: 'zzz' })).toBe('abc');
  });
  it('falls back to the dev loader handoff when there is no currentScript', () => {
    expect(readMountConfig(null, { [CONFIG_HANDOFF]: 'from-dev' })).toBe('from-dev');
  });
  it('returns undefined when neither is present (neutral default)', () => {
    expect(readMountConfig(null, {})).toBeUndefined();
    expect(readMountConfig({ dataset: {} }, { [CONFIG_HANDOFF]: 42 })).toBeUndefined();
  });
});
