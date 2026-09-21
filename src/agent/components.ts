// Agent UI components: small pure DOM builders. All styling is class-based and resolved from
// tokens in styles.ts. Text is set via textContent, never innerHTML.

import type { Constraint, InsightCard, QuickReply } from './brain';

/** A rendered transcript entry. Text is already placeholder-resolved. */
export type Item =
  | { kind: 'message'; from: 'agent' | 'user'; text: string }
  | { kind: 'chips'; lead: string; parsed: Constraint[] }
  | { kind: 'replies'; options: QuickReply[]; step: number }
  | { kind: 'card'; card: InsightCard; step: number }
  | {
      kind: 'action';
      step: number;
      action: 'add-to-cart' | 'checkout';
      productId?: string;
      label: string;
      replyId?: string;
    };

export interface Handlers {
  /** Tap on a control. `replyId` advances the script (or plays a side branch); undefined is a handoff. */
  onTap(replyId: string | undefined, meta: { event?: () => void }): void;
  /** Whether a reply id can be played right now (the pending main reply, or an unused branch). */
  canTap(replyId: string): boolean;
  /** A control from a step the shopper has already moved past. It is hidden, not left greyed out. */
  stale(step: number): boolean;
  /** A side branch that has already been played. */
  used(replyId: string): boolean;
  onLink(href: string): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function Message(from: 'agent' | 'user', text: string): HTMLElement {
  return el('div', `msg ${from}`, text);
}

export function Chip(text: string): HTMLElement {
  return el('span', 'chip', text);
}

function constraintText(c: Constraint): string {
  return c.value ? `${c.label}: ${c.value}` : c.label;
}

/** In-chat understanding: lead-in plus chips, shown as an agent message. */
export function ConstraintChips(lead: string, parsed: Constraint[]): HTMLElement {
  const wrap = el('div', 'msg agent');
  if (lead) wrap.append(el('div', undefined, lead));
  const chips = el('div', 'chips');
  for (const c of parsed) chips.append(Chip(constraintText(c)));
  wrap.append(chips);
  return wrap;
}

/** Strip understanding: a context strip that sits above the composer. */
export function ConstraintStrip(label: string, empty: string, parsed: Constraint[]): HTMLElement {
  const strip = el('div', 'strip');
  strip.setAttribute('aria-label', label);
  strip.append(el('span', 'strip-label', label));
  if (parsed.length === 0) {
    strip.append(el('span', 'strip-label', empty));
  } else {
    for (const c of parsed) strip.append(Chip(constraintText(c)));
  }
  return strip;
}

function Button(label: string, primary: boolean, enabled: boolean, onClick: () => void): HTMLElement {
  const b = el('button', primary ? 'btn primary' : 'btn', label);
  b.type = 'button';
  b.setAttribute('aria-disabled', String(!enabled));
  b.addEventListener('click', () => {
    if (b.getAttribute('aria-disabled') !== 'true') onClick();
  });
  return b;
}

export function QuickReplies(options: QuickReply[], h: Handlers): HTMLElement {
  const row = el('div', 'replies');
  for (const o of options) {
    const enabled = h.canTap(o.id);
    const b = Button(o.label, false, enabled, () => h.onTap(o.id, {}));
    if (!enabled) b.title = 'Not part of this scripted demo';
    row.append(b);
  }
  return row;
}

export function ActionButton(
  item: Extract<Item, { kind: 'action' }>,
  h: Handlers,
  dispatch: (name: string, detail?: unknown) => void,
): HTMLElement {
  const isCheckout = item.action === 'checkout';
  // No reply id means a standalone action (checkout handoff, add a product): always available.
  const enabled = item.replyId === undefined || h.canTap(item.replyId);
  const row = el('div', 'replies');
  row.append(
    Button(item.label, true, enabled, () =>
      h.onTap(item.replyId, {
        event: () =>
          isCheckout
            ? dispatch('agent:checkout')
            : dispatch('agent:add-to-cart', { productId: item.productId }),
      }),
    ),
  );
  return row;
}

/** One card component, four variants. */
export function InsightCardView(
  card: InsightCard,
  h: Handlers,
  dispatch: (name: string, detail?: unknown) => void,
  stale = false,
): HTMLElement {
  const root = el('div', `card ${card.variant}`);
  root.append(el('div', 'card-title', card.title));

  switch (card.variant) {
    case 'compare': {
      const rows = el('div', 'card-rows');
      card.rows.forEach((r, i) => {
        const row = el('div', i === card.rows.length - 1 ? 'card-row diff' : 'card-row');
        row.append(el('span', undefined, r.label), el('span', undefined, r.value));
        rows.append(row);
      });
      root.append(rows);
      if (card.note) root.append(el('div', 'card-line', card.note));
      break;
    }
    case 'why':
      root.append(el('div', undefined, card.body));
      break;
    case 'link': {
      const a = el('a', undefined, card.href);
      a.href = card.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.addEventListener('click', () => h.onLink(card.href));
      root.append(a);
      break;
    }
    case 'productAction': {
      for (const line of card.lines) root.append(el('div', 'card-line', line));
      const a = card.action;
      if (stale) break; // already chosen: the shopper's message shows the choice
      const enabled = a.replyId === undefined || h.canTap(a.replyId);
      const row = el('div', 'replies');
      row.append(
        Button(a.label, true, enabled, () =>
          h.onTap(a.replyId, { event: () => dispatch('agent:add-to-cart', { productId: a.productId }) }),
        ),
      );
      root.append(row);
      break;
    }
  }
  return root;
}

export function ItemView(
  item: Item,
  h: Handlers,
  dispatch: (name: string, detail?: unknown) => void,
): HTMLElement | null {
  switch (item.kind) {
    case 'message':
      return Message(item.from, item.text);
    case 'chips':
      return ConstraintChips(item.lead, item.parsed);
    case 'replies':
      if (h.stale(item.step) || item.options.every((o) => h.used(o.id))) return null;
      return QuickReplies(item.options, h);
    case 'card':
      return InsightCardView(item.card, h, dispatch, h.stale(item.step));
    case 'action':
      if (item.replyId !== undefined && h.stale(item.step)) return null;
      return ActionButton(item, h, dispatch);
  }
}

export interface ComposerParts {
  root: HTMLElement;
  input: HTMLInputElement;
  send: HTMLButtonElement;
  reset: HTMLButtonElement;
}

export function Composer(placeholder: string, scriptedLabel: string, resetLabel: string): ComposerParts {
  const root = el('form', 'composer');
  const row = el('div', 'composer-row');
  const input = el('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  const send = el('button', 'btn primary', 'Send');
  send.type = 'submit';
  row.append(input, send);

  const meta = el('div', 'composer-meta');
  const reset = el('button', 'link-btn', resetLabel);
  reset.type = 'button';
  meta.append(el('span', undefined, scriptedLabel), reset);

  root.append(row, meta);
  return { root, input, send, reset };
}

export function Launcher(label: string): HTMLButtonElement {
  const b = el('button', 'launcher', label);
  b.type = 'button';
  b.setAttribute('aria-expanded', 'false');
  return b;
}
