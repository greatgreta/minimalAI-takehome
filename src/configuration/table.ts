// The token table: pure formatters (unit-tested) plus a small DOM renderer. Every value is read
// from the brand profile and the resolved config; nothing here is hard-coded.

import type { AgentConfig } from '../config/codec';
import type { BrandProfile } from '../brands/profiles';
import { VIBE_LABEL, type AnswerId } from './script';

export type Cell =
  | { kind: 'text'; text: string }
  | { kind: 'colour'; hex: string; suffix: string };

export interface TableRow {
  id: string;
  label: string;
  cell: Cell;
}

/** First family of a CSS font stack, without quotes: "'Some Font', serif" gives Some Font. */
export function familyName(stack: string): string {
  return stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
}

export function tokenRows(p: BrandProfile): TableRow[] {
  const t = p.tokens;
  const r = t.shape.radius;
  const colour = (id: string, label: string, hex: string, suffix = ''): TableRow => ({
    id,
    label,
    cell: { kind: 'colour', hex, suffix },
  });
  return [
    colour('bg', 'Background', t.color.bg),
    colour('ink', 'Ink (text)', t.color.ink),
    colour('surface', 'Surface (cards, footer band)', t.color.surface),
    colour('accent', `Accent (${p.descriptors.accentName})`, t.color.accent, `, used as a ${p.descriptors.accentUse}`),
    {
      id: 'radii',
      label: 'Radii',
      cell: {
        kind: 'text',
        text: `about ${r.sm} / ${r.md} / ${r.lg} px${r.pill >= 100 ? ', plus a pill shape' : ''}`,
      },
    },
    {
      id: 'fonts',
      label: 'Fonts',
      cell: {
        kind: 'text',
        text: `${familyName(t.type.display.family)} (headings) and ${familyName(t.type.body.family)} (body), as stand-ins for the real fonts`,
      },
    },
  ];
}

const PLACEMENT_LABEL = { floating: 'Floating', docked: 'Docked' } as const;
const OPENING_LABEL = { greets: 'Says hello', silent: 'Waits for the shopper' } as const;

/** The rows added when the user answers a question, read from the resolved config. */
export function answerRow(id: AnswerId, config: AgentConfig): TableRow {
  switch (id) {
    case 'placement':
      return { id, label: 'Placement', cell: { kind: 'text', text: PLACEMENT_LABEL[config.behaviour.placement] } };
    case 'opening':
      return { id, label: 'Opening', cell: { kind: 'text', text: OPENING_LABEL[config.behaviour.opening] } };
    case 'vibe':
      return { id, label: 'Vibe', cell: { kind: 'text', text: `${VIBE_LABEL}, Energy ${config.sliders.energy}` } };
  }
}

function td(cls?: string): HTMLTableCellElement {
  const c = document.createElement('td');
  if (cls) c.className = cls;
  return c;
}

export function renderRow(row: TableRow, highlight: boolean): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.dataset.row = row.id;
  if (highlight) tr.classList.add('is-new');
  const label = td();
  label.textContent = row.label;
  const value = td();
  if (row.cell.kind === 'text') {
    value.textContent = row.cell.text;
  } else {
    const dot = document.createElement('span');
    dot.className = 'cfg-dot';
    dot.style.background = row.cell.hex;
    const chip = document.createElement('code');
    chip.className = 'cfg-chip';
    chip.textContent = row.cell.hex;
    value.append(dot, chip);
    if (row.cell.suffix) value.append(document.createTextNode(row.cell.suffix));
  }
  tr.append(label, value);
  return tr;
}

export function createTable(valueHeader: string): { el: HTMLTableElement; body: HTMLTableSectionElement } {
  const el = document.createElement('table');
  el.className = 'cfg-table';
  const head = el.createTHead().insertRow();
  for (const text of ['Token', valueHeader]) {
    const th = document.createElement('th');
    th.textContent = text;
    head.append(th);
  }
  const body = el.createTBody();
  return { el, body };
}
