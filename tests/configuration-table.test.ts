import { describe, it, expect } from 'vitest';
import { grazaProfile, type BrandProfile } from '../src/brands/profiles';
import { answerRow, familyName, tokenRows } from '../src/configuration/table';
import { defaultConfig } from '../src/config/codec';
import { cloneTokens } from '../src/tokens/schema';

const text = (row: ReturnType<typeof tokenRows>[number]) =>
  row.cell.kind === 'text' ? row.cell.text : `${row.cell.hex}${row.cell.suffix}`;

describe('token table formatter', () => {
  it('produces the six rows with the exact wording', () => {
    const rows = tokenRows(grazaProfile);
    expect(rows.map((r) => [r.label, text(r)])).toEqual([
      ['Background', '#F6E6D9'],
      ['Ink (text)', '#3C422E'],
      ['Surface (cards, footer band)', '#FFF4EC'],
      ['Accent (lime)', '#D1E030, used as a fill only'],
      ['Radii', 'about 12 / 20 / 30 px, plus a pill shape'],
      ['Fonts', 'EB Garamond (headings) and DM Sans (body), as stand-ins for the real fonts'],
    ]);
  });

  it('reads every value from the profile (nothing hard-coded)', () => {
    const tokens = cloneTokens(grazaProfile.tokens);
    tokens.color.bg = '#010203';
    tokens.shape.radius = { sm: 1, md: 2, lg: 3, pill: 4 };
    tokens.type.display.family = "'Other Serif', serif";
    const other: BrandProfile = {
      ...grazaProfile,
      tokens,
      descriptors: { accentName: 'teal', accentUse: 'highlight' },
    };
    const rows = tokenRows(other).map((r) => [r.label, text(r)]);
    expect(rows[0]).toEqual(['Background', '#010203']);
    expect(rows[3][0]).toBe('Accent (teal)');
    expect(rows[3][1]).toContain('used as a highlight');
    expect(rows[4][1]).toBe('about 1 / 2 / 3 px'); // no pill wording for a non-pill radius
    expect(rows[5][1]).toContain('Other Serif (headings)');
  });

  it('extracts the first family from a CSS font stack', () => {
    expect(familyName("'Some Font', Georgia, serif")).toBe('Some Font');
    expect(familyName('system-ui, sans-serif')).toBe('system-ui');
  });

  it('formats the answer rows from the resolved config', () => {
    const config = defaultConfig(grazaProfile.id);
    config.behaviour.placement = 'floating';
    config.behaviour.opening = 'greets';
    config.sliders = { energy: 0.7, shape: 0.5 };
    expect(text(answerRow('placement', config))).toBe('Floating');
    expect(text(answerRow('opening', config))).toBe('Says hello');
    expect(text(answerRow('vibe', config))).toBe('Chatty and vibrant, Energy 0.7');
    config.behaviour.placement = 'docked';
    expect(text(answerRow('placement', config))).toBe('Docked');
  });
});
