// Presentation helpers shared by tests and the DOM renderer. No brand values live here.
// resolvePlaceholders fills {a.b.c} from a data object; renderTranscript projects a script to
// plain text, honouring the brand's opening + understanding tokens (proof of "styled vs built").

import type { Constraint, Script, Turn } from './brain';
import type { Tokens } from '../tokens/schema';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatValue(v: unknown): string {
  if (v instanceof Date) return `${v.getUTCDate()} ${MONTHS[v.getUTCMonth()]}`;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  return '';
}

function getPath(data: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, data);
}

/** Replace every {a.b.c} in `text` with its resolved, formatted value from `data`. */
export function resolvePlaceholders(text: string, data: unknown): string {
  return text.replace(/\{([\w.]+)\}/g, (whole, path: string) => {
    const val = getPath(data, path);
    return val === undefined ? whole : formatValue(val);
  });
}

export function formatConstraint(c: Constraint): string {
  return c.value ? `${c.label}: ${c.value}` : c.label;
}

export function constraintsText(parsed: Constraint[]): string {
  return parsed.map(formatConstraint).join(' | ');
}

function turnLines(turn: Turn, tokens: Tokens, data: unknown): string[] {
  const r = (s: string) => resolvePlaceholders(s, data);
  switch (turn.kind) {
    case 'text':
      return [`${turn.from === 'user' ? 'User' : 'Agent'}: ${r(turn.text)}`];
    case 'quickReplies':
      return [`  [options: ${turn.options.map((o) => o.label).join(' | ')}]`];
    case 'understanding': {
      const chips = constraintsText(turn.parsed);
      if (tokens.behaviour.understanding === 'strip') {
        // Strip mode updates the context strip and shows nothing in the chat.
        return [`  [strip: ${r(chips)}]`];
      }
      const lead = tokens.voice.understandingLead ?? '';
      return [`Agent: ${r(lead)} [${r(chips)}]`.replace('  ', ' ')];
    }
    case 'insightCard': {
      if (turn.variant === 'compare') {
        const rows = turn.rows.map((row) => `${r(row.label)} ${r(row.value)}`).join(' | ');
        return [`  [card/compare: ${r(turn.title)} - ${rows}${turn.note ? ` (${r(turn.note)})` : ''}]`];
      }
      if (turn.variant === 'link') return [`  [card/link: ${r(turn.title)} -> ${turn.href}]`];
      if (turn.variant === 'why') return [`  [card/why: ${r(turn.title)} - ${r(turn.body)}]`];
      // productAction
      const lines = turn.lines.map(r).join('; ');
      return [`  [card/product: ${r(turn.title)} - ${lines}] [${r(turn.action.label)}]`];
    }
    case 'action':
      return [`  [action: ${turn.action}${turn.productId ? ` ${turn.productId}` : ''} - ${turn.label}]`];
    default:
      return [];
  }
}

/** Full plain-text projection of a script for a given brand (opening greeting included if greets). */
export function renderTranscript(script: Script, tokens: Tokens, data: unknown): string {
  const lines: string[] = [];
  if (tokens.behaviour.opening === 'greets' && tokens.voice.greeting) {
    lines.push(`Agent: ${resolvePlaceholders(tokens.voice.greeting, data)}`);
  }
  for (const step of script.steps) {
    if (step.input && step.input.kind === 'text') {
      lines.push(`User: ${resolvePlaceholders(step.input.text, data)}`);
    } else if (step.input && step.input.kind === 'reply') {
      lines.push(`User: ${resolvePlaceholders(step.input.label, data)}`);
    }
    for (const turn of step.turns) {
      lines.push(...turnLines(turn, tokens, data));
    }
  }
  return lines.join('\n');
}
