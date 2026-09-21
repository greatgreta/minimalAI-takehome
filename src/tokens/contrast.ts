// Contrast guard. For every text/background pair, nudge the text lightness (in OKLCH, keeping
// hue and chroma) until the WCAG ratio is >= 4.5:1. Never silently fails: it reports every pair,
// including any it could not satisfy even at the lightness extremes.

import { cloneTokens, TEXT_PAIRS, type ColorTokens, type Tokens } from './schema';
import { contrastRatio, oklchToRgb, parseHex, rgbToOklch, toHex, type RGB } from './color';

export const AA_TEXT = 4.5;

export interface PairReport {
  label: string;
  fg: keyof ColorTokens;
  bg: keyof ColorTokens;
  before: number;
  after: number;
  adjusted: boolean;
  passes: boolean;
}

export interface GuardResult {
  tokens: Tokens;
  report: PairReport[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Move a foreground colour's lightness until it meets `target` contrast against `bg`. */
function nudgeForeground(
  fgHex: string,
  bg: RGB,
  target: number,
): { hex: string; contrast: number } {
  const { L, C, h } = rgbToOklch(parseHex(fgHex));
  const contrastAt = (LL: number) => contrastRatio(oklchToRgb({ L: LL, C, h }), bg);

  let best = contrastAt(L);
  if (best >= target) return { hex: fgHex, contrast: best };

  // Head toward whichever extreme yields more contrast against this background.
  const dir = contrastAt(0.98) >= contrastAt(0.02) ? 1 : -1;
  const step = 0.005;
  let L2 = L;
  let bestL = L;
  for (let i = 0; i < 220; i++) {
    L2 += dir * step;
    if (L2 < 0 || L2 > 1) break;
    const c = contrastAt(L2);
    if (c > best) {
      best = c;
      bestL = L2;
    }
    if (c >= target) break;
  }
  return { hex: toHex(oklchToRgb({ L: bestL, C, h })), contrast: best };
}

export function guardContrast(input: Tokens, target = AA_TEXT): GuardResult {
  const tokens = cloneTokens(input);
  const report: PairReport[] = [];

  for (const pair of TEXT_PAIRS) {
    const bgRgb = parseHex(tokens.color[pair.bg]);
    const beforeHex = tokens.color[pair.fg];
    const before = contrastRatio(parseHex(beforeHex), bgRgb);

    if (before >= target) {
      report.push({
        label: pair.label,
        fg: pair.fg,
        bg: pair.bg,
        before: round2(before),
        after: round2(before),
        adjusted: false,
        passes: true,
      });
      continue;
    }

    const { hex, contrast } = nudgeForeground(beforeHex, bgRgb, target);
    tokens.color[pair.fg] = hex;
    report.push({
      label: pair.label,
      fg: pair.fg,
      bg: pair.bg,
      before: round2(before),
      after: round2(contrast),
      adjusted: hex.toLowerCase() !== beforeHex.toLowerCase(),
      passes: contrast >= target,
    });
  }

  return { tokens, report };
}
