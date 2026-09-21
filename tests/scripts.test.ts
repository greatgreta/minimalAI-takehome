import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildGrazaScript } from '../src/scripts/graza';
import { buildMaurtenScript } from '../src/scripts/maurten';
import { grazaCatalogue } from '../src/catalogue/graza';
import { maurtenCatalogue } from '../src/catalogue/maurten';
import { graza } from '../src/brands/graza';
import { maurten } from '../src/brands/maurten';
import { renderTranscript } from '../src/agent/transcript';
import { ScriptedBrain, type Script } from '../src/agent/brain';
import { cloneTokens } from '../src/tokens/schema';

const grazaScript = (firstOrder = true, data = grazaCatalogue) =>
  buildGrazaScript({ data, promotions: { firstOrder } });

describe('graza script', () => {
  it('renders the expected transcript', () => {
    expect(renderTranscript(grazaScript(), graza, grazaCatalogue)).toMatchSnapshot();
  });

  it('derives trio.separate and trio.saving from prices', () => {
    expect(grazaCatalogue.trio.separate).toBe(46);
    expect(grazaCatalogue.trio.saving).toBe(6);
  });

  it('branch (a): says "Same price" only when prices are equal', () => {
    const same = renderTranscript(grazaScript(), graza, grazaCatalogue);
    expect(same).toContain('Same price, 16 EUR each');

    const data = { ...grazaCatalogue, sizzle: { ...grazaCatalogue.sizzle, price: 18 } };
    const diff = renderTranscript(grazaScript(true, data), graza, data);
    expect(diff).not.toContain('Same price');
    expect(diff).toContain('Not the same: Sizzle 18 EUR, Drizzle 16 EUR.');
  });

  it('harvest lines render only when drizzle.harvest is current', () => {
    const data = { ...grazaCatalogue, drizzle: { ...grazaCatalogue.drizzle, harvest: 'old' } };
    const t = renderTranscript(grazaScript(true, data), graza, data);
    expect(t).not.toContain('current harvest');
    expect(t).not.toContain('Current harvest');
    expect(renderTranscript(grazaScript(), graza, grazaCatalogue)).toContain('current harvest');
  });

  it('branch (b): final turn depends on the first-order promotion', () => {
    expect(renderTranscript(grazaScript(true), graza, grazaCatalogue)).toContain('10% off');
    const off = renderTranscript(grazaScript(false), graza, grazaCatalogue);
    expect(off).toContain("Welcome, then. Check out when you're ready.");
    expect(off).not.toContain('% off');
  });

  it('greets with the brand greeting', () => {
    const t = renderTranscript(grazaScript(), graza, grazaCatalogue);
    expect(t.split('\n')[0]).toBe("Agent: Hey! Looking for an oil? Tell me what's cooking.");
  });
});

describe('maurten script', () => {
  const script = buildMaurtenScript();

  it('renders the expected transcript', () => {
    expect(renderTranscript(script, maurten, maurtenCatalogue)).toMatchSnapshot();
  });

  it('obstacle invariants hold', () => {
    const { gel160, gel100, race, daysLeft } = maurtenCatalogue;
    expect(gel160.arrives!.getTime()).toBeLessThan(race.deadline.getTime());
    expect(gel100.restock!.getTime()).toBeGreaterThan(race.deadline.getTime());
    expect(daysLeft).toBeGreaterThan(0);
    expect(maurtenCatalogue.carbsDiff).toBe(15);
  });

  it('silent opening means no agent turn first', () => {
    expect(maurten.behaviour.opening).toBe('silent');
    const t = renderTranscript(script, maurten, maurtenCatalogue);
    expect(t.startsWith('User:')).toBe(true);
  });

  it('catalogue uses only the allowed product names', () => {
    const names = maurtenCatalogue.products.map((p) => p.name);
    expect(names).toContain('Fuel Planner');
    expect(names).toContain('Gel 100');
    expect(names).toContain('Gel 160');
    for (const p of maurtenCatalogue.products) expect(p.verified).toBe(false);
  });
});

describe('script invariants (both brands)', () => {
  const scripts: Record<string, Script> = {
    graza: grazaScript(),
    maurten: buildMaurtenScript(),
  };

  it('every understanding turn has a non-empty parsed list', () => {
    for (const script of Object.values(scripts)) {
      for (const step of script.steps) {
        for (const turn of step.turns) {
          if (turn.kind === 'understanding') expect(turn.parsed.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('the brand token decides understanding placement, not the script', () => {
    const asStrip = cloneTokens(graza);
    asStrip.behaviour.understanding = 'strip';
    expect(renderTranscript(grazaScript(), graza, grazaCatalogue)).toContain("Here's what I'm hearing:");
    const stripped = renderTranscript(grazaScript(), asStrip, grazaCatalogue);
    expect(stripped).not.toContain("Here's what I'm hearing:");
    expect(stripped).toContain('[strip:');
  });

  it('script files contain no literal price, date, count or claim', () => {
    for (const file of ['src/scripts/graza.ts', 'src/scripts/maurten.ts']) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/\d\s*(g|%|EUR|ml|days)\b/);
      expect(src, file).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  it('script files never reference the understanding token or lead', () => {
    for (const file of ['src/scripts/graza.ts', 'src/scripts/maurten.ts']) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/understandingLead/);
      expect(src).not.toMatch(/behaviour\.understanding/);
    }
  });

  it('ScriptedBrain walks a script to completion and resets', () => {
    const brain = new ScriptedBrain(buildMaurtenScript());
    let state = brain.initial();
    let done = false;
    let guard = 0;
    while (!done && guard++ < 20) {
      const out = brain.next({ type: 'send' }, state);
      state = out.state;
      done = out.done;
    }
    expect(done).toBe(true);
    expect(brain.next({ type: 'reset' }, state).state.index).toBe(0);
  });
});

describe('postcode privacy', () => {
  it('validates in memory and never reaches storage, cookies or network', () => {
    const setItem = vi.fn();
    const fetchSpy = vi.fn();
    const cookieSet = vi.fn();
    vi.stubGlobal('localStorage', { setItem, getItem: vi.fn() });
    vi.stubGlobal('sessionStorage', { setItem, getItem: vi.fn() });
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('document', {
      get cookie() {
        return '';
      },
      set cookie(v: string) {
        cookieSet(v);
      },
    });

    // The one and only use: an in-memory regex check while the script plays.
    const { postcode } = maurtenCatalogue;
    expect(postcode.regex.test(postcode.demo)).toBe(true);
    expect(postcode.regex.test('nope')).toBe(false);
    renderTranscript(buildMaurtenScript(), maurten, maurtenCatalogue);

    expect(setItem).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
