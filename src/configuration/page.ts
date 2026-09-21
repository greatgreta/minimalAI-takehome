// The configuration page. Everything here is scripted and deterministic; there is no network. The
// table values come from the brand profile, and the snippet comes from the real config codec.

import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-600.css';
import './fonts.css';
import './styles.css';

import { buildSnippet } from '../config/codec';
import { mountDemoBar } from '../demo-bar/demo-bar';
import type { BrandProfile } from '../brands/profiles';
import { readStore } from './read-store';
import { Chat } from './chat';
import { tickIcon, pendingIcon } from './icons';
import { createTable, renderRow, answerRow, tokenRows } from './table';
import {
  READING_STEPS,
  SNIPPET_NOTE,
  chatSteps,
  complete,
  finishReading,
  initialState,
  isFinalStep,
  queuedReply,
  resolveConfig,
  send,
  startReading,
  type FlowState,
} from './script';

const GHOST = 'Waiting for your store';
const STEP_MS = 600;
const ROW_MS = 120;
const TYPING_MS = 600;
const COPIED_MS = 2000;

/** One cancellable clock: after reset() nothing scheduled earlier can run or resume. */
class Clock {
  #epoch = 0;
  #timers = new Set<number>();

  get epoch(): number {
    return this.#epoch;
  }

  /** Resolves after ms; never resolves if the clock was cancelled meanwhile (so callers just stop). */
  wait(ms: number): Promise<void> {
    const epoch = this.#epoch;
    return new Promise((resolve) => {
      const id = window.setTimeout(() => {
        this.#timers.delete(id);
        if (epoch === this.#epoch) resolve();
      }, ms);
      this.#timers.add(id);
    });
  }

  cancel(): void {
    this.#epoch++;
    for (const id of this.#timers) clearTimeout(id);
    this.#timers.clear();
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

async function main(): Promise<void> {
  const root = document.getElementById('config-root')!;
  const profile: BrandProfile = await readStore();
  const clock = new Clock();
  let state: FlowState = initialState();

  // ---- static structure --------------------------------------------------------------------
  const head = el('div', 'cfg-head');
  head.append(
    el('h1', 'cfg-title', 'Make your own agent'),
    el('p', 'cfg-sub', "Paste your store's address. We read how your brand looks and sounds, then build a shopping agent that feels like part of your site."),
  );

  const card = el('section', 'cfg-card cfg-read');
  const form = el('form', 'cfg-form');
  const input = el('input', 'cfg-input');
  input.type = 'text';
  input.value = profile.domain;
  input.readOnly = true;
  input.setAttribute('aria-readonly', 'true');
  input.setAttribute('aria-label', 'Store address');
  input.placeholder = 'https://www.yourstore.com';
  const readBtn = el('button', 'cfg-read-btn', 'Read my store');
  readBtn.type = 'submit';
  form.append(input, readBtn);
  const resetBtn = el('button', 'cfg-reset', 'Reset');
  resetBtn.type = 'button';
  resetBtn.hidden = true;
  const steps = el('ol', 'cfg-steps');
  steps.setAttribute('aria-live', 'polite');
  card.append(
    el('h2', 'cfg-card-title', 'Copy and paste your e-commerce website'),
    el('p', 'cfg-card-body', "Paste the address of your online store. We read the colours, fonts, corner shapes and button styles your shoppers already see, and turn them into an agent that matches. You review everything before it goes live."),
    form,
    el('p', 'cfg-helper', 'We only look at what any visitor can see. Nothing on your site changes until you add the code yourself.'),
    resetBtn,
    steps,
  );

  const row = el('div', 'cfg-row');
  const left = el('section', 'cfg-card cfg-widget cfg-widget--table');
  const right = el('section', 'cfg-card cfg-widget cfg-widget--chat');
  row.append(left, right);
  root.replaceChildren(head, card, row);

  const table = createTable(`${profile.name} value`);
  const chat = new Chat(() => void onSend());

  // ---- state helpers -----------------------------------------------------------------------
  const showGhost = () => {
    left.replaceChildren(el('p', 'cfg-ghost', GHOST));
    right.replaceChildren(el('p', 'cfg-ghost', GHOST));
    row.classList.remove('is-open');
  };

  const config = () => resolveConfig(profile, state);

  function reset(): void {
    clock.cancel();
    state = initialState();
    steps.replaceChildren();
    table.body.replaceChildren();
    chat.clear();
    showGhost();
    readBtn.textContent = 'Read my store';
    readBtn.disabled = false;
    resetBtn.hidden = true;
    readBtn.focus();
  }

  // ---- reading -----------------------------------------------------------------------------
  async function read(): Promise<void> {
    if (state.phase !== 'idle') return;
    state = startReading(state);
    readBtn.textContent = 'Reading...';
    readBtn.disabled = true;
    resetBtn.hidden = false;

    const items = READING_STEPS.map((label) => {
      const li = el('li', 'cfg-step');
      const icon = el('span', 'cfg-step-icon');
      icon.innerHTML = pendingIcon;
      li.append(icon, el('span', undefined, label));
      return { li, icon };
    });
    steps.replaceChildren(...items.map((i) => i.li));

    for (const it of items) {
      await clock.wait(STEP_MS);
      it.li.classList.add('is-done');
      it.icon.innerHTML = tickIcon;
    }

    await clock.wait(STEP_MS / 2);
    steps.replaceChildren(); // the band is empty again once the reading is done
    state = finishReading(state);
    readBtn.textContent = 'Read my store';

    // The table card and the chat card open together; the composer appears with the table.
    row.classList.add('is-open');
    const wrap = el('div', 'cfg-table-wrap');
    wrap.append(table.el);
    left.replaceChildren(wrap);
    right.replaceChildren(chat.el);
    for (const r of tokenRows(profile)) {
      await clock.wait(ROW_MS);
      table.body.append(renderRow(r, false));
    }
    await presentStep();
  }

  // ---- chat --------------------------------------------------------------------------------
  async function presentStep(): Promise<void> {
    const step = chatSteps(profile)[state.step];
    for (const text of step.agent) {
      chat.setTyping(true);
      await clock.wait(TYPING_MS);
      chat.setTyping(false);
      chat.addAgent(text);
    }
    if (isFinalStep(profile, state)) {
      const code = buildSnippet(config(), location.origin);
      const copy = chat.addSnippet(code, SNIPPET_NOTE);
      copy.addEventListener('click', async () => {
        const epoch = clock.epoch;
        await copyText(code);
        if (epoch !== clock.epoch) return;
        copy.textContent = 'Copied';
        await clock.wait(COPIED_MS);
        copy.textContent = 'Copy code';
      });
      state = complete(state);
      return;
    }
    const reply = queuedReply(profile, state);
    chat.queue(reply ? reply.label : null);
  }

  async function onSend(): Promise<void> {
    const reply = queuedReply(profile, state);
    if (!reply) return;
    chat.queue(null);
    chat.addUser(reply.label);
    state = send(profile, state);
    table.body.append(renderRow(answerRow(reply.id, config()), true));
    await presentStep();
  }

  // ---- wiring ------------------------------------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void read();
  });
  resetBtn.addEventListener('click', reset);

  showGhost();
  mountDemoBar('configuration');
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

void main();
