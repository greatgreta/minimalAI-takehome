// <minimal-agent>: the one custom element. Open Shadow DOM, styled only through --agent-* custom
// properties (adoptedStyleSheets). Configured by a `config` attribute (the Phase 1 codec); changing
// that attribute re-resolves tokens and restarts the conversation. Never names a brand.

import '../brands/register';
import { getBrandPack } from '../brands/registry';
import { decodeConfig, defaultConfig, resolveTokens, type AgentConfig } from '../config/codec';
import { emitCssText } from '../tokens/emit';
import type { Tokens } from '../tokens/schema';
import { ScriptedBrain, type BrainState, type Constraint, type Turn } from './brain';
import { resolvePlaceholders } from './transcript';
import { AGENT_CSS } from './styles';
import {
  Composer,
  ConstraintStrip,
  ItemView,
  Launcher,
  type ComposerParts,
  type Handlers,
  type Item,
} from './components';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class MinimalAgent extends HTMLElement {
  static observedAttributes = ['config'];

  #root: ShadowRoot;
  #vars = new CSSStyleSheet();
  #base = new CSSStyleSheet();

  #config!: AgentConfig;
  #tokens!: Tokens;
  #data: unknown = {};
  #brain!: ScriptedBrain;
  #state!: BrainState;

  #items: Item[] = [];
  #constraints: Constraint[] = [];
  #open = false;
  #minimised = false;
  #expanded = false;
  #busy = false;
  #typing = false;
  #greeted = false;
  #usedBranches = new Set<string>();
  #epoch = 0;

  // structure
  #wrap = document.createElement('div');
  #launcher!: HTMLButtonElement;
  #panel = document.createElement('section');
  #title = document.createElement('div');
  #list = document.createElement('div');
  #stripHost = document.createElement('div');
  #composer!: ComposerParts;
  #btnMin = document.createElement('button');
  #btnExpand = document.createElement('button');
  #btnClose = document.createElement('button');

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#base.replaceSync(AGENT_CSS);
    this.#root.adoptedStyleSheets = [this.#base, this.#vars];
  }

  connectedCallback(): void {
    this.#configure();
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue && this.isConnected) this.#configure();
  }

  // ---- configuration ------------------------------------------------------------------------

  #readConfig(): AgentConfig {
    const raw = this.getAttribute('config');
    if (raw) {
      try {
        return decodeConfig(raw);
      } catch {
        /* fall through to the neutral default */
      }
    }
    return defaultConfig('neutral');
  }

  #configure(): void {
    this.#config = this.#readConfig();
    const resolved = resolveTokens(this.#config);
    this.#tokens = resolved.tokens;
    this.#vars.replaceSync(`:host {\n${emitCssText(this.#tokens)}\n}`);

    const pack = getBrandPack(this.#config.brand);
    this.#data = pack.data;
    this.#brain = new ScriptedBrain(pack.script(this.#config.promotions));

    this.#build();
    this.#restart();
  }

  #restart(): void {
    this.#epoch++;
    this.#state = this.#brain.initial();
    this.#items = [];
    this.#constraints = [];
    this.#busy = false;
    this.#typing = false;
    this.#greeted = false;
    this.#usedBranches.clear();
    this.#renderAll();
    if (this.#open) this.#greetIfNeeded();
  }

  // ---- structure ----------------------------------------------------------------------------

  #build(): void {
    const t = this.#tokens;
    const docked = t.placement === 'docked';
    this.#wrap = document.createElement('div');
    this.#wrap.className = docked ? 'docked' : 'floating';

    const label = t.voice.launcher ?? (docked ? 'Agent' : 'Ask');
    this.#launcher = Launcher(label);
    this.#launcher.addEventListener('click', () => this.#setOpen(true));

    this.#panel = document.createElement('section');
    this.#panel.className = 'panel';
    this.#panel.setAttribute('role', 'dialog');
    this.#panel.setAttribute('aria-label', t.voice.title ?? 'Agent');

    const header = document.createElement('div');
    header.className = 'header';
    this.#title = document.createElement('div');
    this.#title.className = 'title';
    this.#title.textContent = t.voice.title ?? 'Agent';
    header.append(this.#title);

    const mk = (btn: HTMLButtonElement, text: string, aria: string, cls = '') => {
      btn.type = 'button';
      btn.className = `icon-btn ${cls}`.trim();
      btn.textContent = text;
      btn.setAttribute('aria-label', aria);
      return btn;
    };
    this.#btnMin = mk(document.createElement('button'), '_', 'Minimise', 'min');
    this.#btnExpand = mk(document.createElement('button'), '[ ]', 'Expand', 'expand');
    this.#btnClose = mk(document.createElement('button'), 'x', 'Close', 'close');
    this.#btnMin.addEventListener('click', () => {
      this.#minimised = !this.#minimised;
      this.#applyState();
    });
    this.#btnExpand.addEventListener('click', () => {
      this.#expanded = !this.#expanded;
      this.#applyState();
    });
    this.#btnClose.addEventListener('click', () => this.#setOpen(false));
    // Docked panels get minimise / expand / close; floating panels only close.
    if (docked) header.append(this.#btnMin, this.#btnExpand);
    header.append(this.#btnClose);

    const body = document.createElement('div');
    body.className = 'body';
    this.#list = document.createElement('div');
    this.#list.className = 'list';
    this.#list.setAttribute('role', 'log');
    this.#list.setAttribute('aria-live', 'polite');
    this.#stripHost = document.createElement('div');

    this.#composer = Composer(t.voice.placeholder, 'Scripted demo', 'Reset');
    this.#composer.root.addEventListener('submit', (e) => {
      e.preventDefault();
      this.#send();
    });
    this.#composer.reset.addEventListener('click', () => this.#restart());

    body.append(this.#list, this.#stripHost, this.#composer.root);
    this.#panel.append(header, body);
    this.#wrap.append(this.#launcher, this.#panel);
    this.#root.replaceChildren(this.#wrap);
    this.#applyState();
  }

  #applyState(): void {
    this.#panel.hidden = !this.#open;
    this.#launcher.hidden = this.#open;
    this.#launcher.setAttribute('aria-expanded', String(this.#open));
    this.#panel.classList.toggle('minimised', this.#minimised);
    this.#panel.classList.toggle('expanded', this.#expanded);
  }

  // ---- open / close -------------------------------------------------------------------------

  #setOpen(open: boolean): void {
    if (this.#open === open) return;
    this.#open = open;
    if (open) this.#minimised = false;
    this.#applyState();
    this.#emit(open ? 'agent:open' : 'agent:close');
    if (open) this.#greetIfNeeded();
    else this.#launcher.focus();
  }

  #greetIfNeeded(): void {
    if (this.#greeted) return;
    this.#greeted = true;
    const greeting = this.#tokens.voice.greeting;
    if (this.#tokens.behaviour.opening === 'greets' && greeting) {
      void this.#play([{ kind: 'text', from: 'agent', text: greeting }]);
    }
  }

  // ---- events -------------------------------------------------------------------------------

  #emit(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // ---- script interaction -------------------------------------------------------------------

  #pendingReplyId(): string | null {
    const p = this.#brain.pending(this.#state);
    return p && p.kind === 'reply' ? p.id : null;
  }

  #handlers(): Handlers {
    const canTap = (id: string) =>
      !this.#busy &&
      (id === this.#pendingReplyId() || (this.#brain.isBranch(id) && !this.#usedBranches.has(id)));
    return {
      canTap,
      stale: (step) => step < this.#state.index,
      used: (id) => this.#usedBranches.has(id),
      onLink: (href) => this.#emit('agent:open-link', { href }),
      onTap: (replyId, meta) => {
        if (this.#busy) return;
        if (replyId === undefined) {
          meta.event?.(); // standalone action (checkout handoff, add a product): no script change
          return;
        }
        if (!canTap(replyId)) return;
        if (replyId !== this.#pendingReplyId()) this.#usedBranches.add(replyId);
        meta.event?.();
        void this.#advance({ type: 'reply', id: replyId });
      },
    };
  }

  #send(): void {
    if (this.#busy) return;
    const pending = this.#brain.pending(this.#state);
    if (!pending || pending.kind !== 'text') return;
    const typed = this.#composer.input.value.trim();
    void this.#advance({ type: 'send', text: typed });
  }

  async #advance(event: { type: 'send'; text?: string } | { type: 'reply'; id: string }): Promise<void> {
    const out = this.#brain.next(event, this.#state);
    this.#state = out.state;
    const turns = out.turns.slice();
    // Typing is allowed; the script advances regardless, but we show what the user typed.
    if (event.type === 'send' && event.text && turns[0]?.kind === 'text' && turns[0].from === 'user') {
      turns[0] = { ...turns[0], text: event.text };
    }
    this.#composer.input.value = '';
    await this.#play(turns, out.step);
  }

  async #play(turns: Turn[], step = -1): Promise<void> {
    const epoch = ++this.#epoch;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const unit = reduced ? 0 : this.#tokens.motion.duration;
    const r = (s: string) => resolvePlaceholders(s, this.#data);
    this.#busy = true;
    this.#renderComposer();

    for (const turn of turns) {
      const fromUser = turn.kind === 'text' && turn.from === 'user';
      if (!fromUser && unit > 0) {
        this.#typing = true;
        this.#renderList();
        await sleep(turn.kind === 'text' ? unit * 3 : unit);
        if (epoch !== this.#epoch) return;
        this.#typing = false;
      }
      this.#push(turn, r, step);
      this.#renderAll(false);
    }

    this.#busy = false;
    this.#renderAll();
  }

  #push(turn: Turn, r: (s: string) => string, step: number): void {
    switch (turn.kind) {
      case 'text':
        this.#items.push({ kind: 'message', from: turn.from, text: r(turn.text) });
        break;
      case 'understanding': {
        const parsed = turn.parsed.map((c) => ({ label: r(c.label), value: r(c.value) }));
        this.#constraints = parsed;
        // The brand token decides placement: in-chat shows a message, strip only updates the strip.
        if (this.#tokens.behaviour.understanding === 'in-chat') {
          this.#items.push({ kind: 'chips', lead: r(this.#tokens.voice.understandingLead ?? ''), parsed });
        }
        break;
      }
      case 'quickReplies':
        this.#items.push({
          kind: 'replies',
          options: turn.options.map((o) => ({ id: o.id, label: r(o.label) })),
          step,
        });
        break;
      case 'insightCard': {
        const { kind: _k, ...card } = turn;
        void _k;
        this.#items.push({ kind: 'card', card: this.#resolveCard(card as never, r), step });
        break;
      }
      case 'action':
        this.#items.push({
          kind: 'action',
          action: turn.action,
          productId: turn.productId,
          label: r(turn.label),
          replyId: turn.replyId,
          step,
        });
        break;
    }
  }

  #resolveCard(card: import('./brain').InsightCard, r: (s: string) => string): import('./brain').InsightCard {
    switch (card.variant) {
      case 'compare':
        return {
          ...card,
          title: r(card.title),
          rows: card.rows.map((row) => ({ label: r(row.label), value: r(row.value) })),
          note: card.note ? r(card.note) : undefined,
        };
      case 'why':
        return { ...card, title: r(card.title), body: r(card.body) };
      case 'link':
        return { ...card, title: r(card.title) };
      case 'productAction':
        return {
          ...card,
          title: r(card.title),
          lines: card.lines.map(r),
          action: { ...card.action, label: r(card.action.label) },
        };
    }
  }

  // ---- rendering ----------------------------------------------------------------------------

  #renderAll(scroll = true): void {
    this.#renderList(scroll);
    this.#renderStrip();
    this.#renderComposer();
  }

  #renderList(scroll = true): void {
    const h = this.#handlers();
    const dispatch = (n: string, d?: unknown) => this.#emit(n, d);
    const nodes = this.#items
      .map((item) => ItemView(item, h, dispatch))
      .filter((n): n is HTMLElement => n !== null);
    if (this.#typing) {
      const t = document.createElement('div');
      t.className = 'typing';
      t.textContent = '...';
      nodes.push(t);
    }
    this.#list.replaceChildren(...nodes);
    if (scroll) this.#list.scrollTop = this.#list.scrollHeight;
  }

  #renderStrip(): void {
    if (this.#tokens.behaviour.understanding !== 'strip') {
      this.#stripHost.replaceChildren();
      return;
    }
    this.#stripHost.replaceChildren(ConstraintStrip('Context', 'Nothing yet', this.#constraints));
  }

  #renderComposer(): void {
    const pending = this.#brain.pending(this.#state);
    const canSend = !this.#busy && pending !== null && pending.kind === 'text';
    this.#composer.send.disabled = !canSend;
    this.#composer.input.disabled = this.#busy;
    if (canSend && pending && pending.kind === 'text') {
      // Pre-fill the next scripted user line. Typing over it is allowed.
      this.#composer.input.value = resolvePlaceholders(pending.text, this.#data);
    } else if (!this.#busy) {
      this.#composer.input.value = '';
    }
  }
}

if (!customElements.get('minimal-agent')) {
  customElements.define('minimal-agent', MinimalAgent);
}
