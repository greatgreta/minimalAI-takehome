import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The agent and the config logic must be brand-blind: no hex colours, px radii, font names or
// brand names. Values live only in src/brands/*.ts and the tokens code. src/hosts and
// src/demo-bar are excluded on purpose (replica styling and neutral demo chrome).

const RULES: Array<{ name: string; re: RegExp }> = [
  { name: 'hex colour', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'px radius', re: /radius[^;\n]*\d+(\.\d+)?px/i },
  { name: 'font name', re: /\b(EB Garamond|Garamond|DM Sans|Inter|Helvetica|Arial|Georgia)\b/ },
  {
    name: 'brand name',
    re: /\b(Graza|Maurten|Sizzle|Drizzle|Frizzle|Gel 100|Gel 160|Drink Mix)\b/i,
  },
];

export function findLeaks(source: string): string[] {
  return RULES.filter((r) => r.re.test(source)).map((r) => r.name);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('no brand leak', () => {
  it('detects each kind of leak (the scanner itself works)', () => {
    expect(findLeaks('color: #D1E030;')).toContain('hex colour');
    expect(findLeaks('border-radius: 12px;')).toContain('px radius');
    expect(findLeaks("font-family: 'Inter'")).toContain('font name');
    expect(findLeaks('const b = "Graza"')).toContain('brand name');
    expect(findLeaks('border-radius: var(--agent-radius-md);')).toEqual([]);
  });

  for (const dir of ['src/agent', 'src/config']) {
    it(`${dir} contains no brand values`, () => {
      const files = walk(dir);
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        expect(findLeaks(readFileSync(file, 'utf8')), file).toEqual([]);
      }
    });
  }
});
