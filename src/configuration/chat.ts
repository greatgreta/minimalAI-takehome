// The right-hand chat widget: message list, typing indicator and the locked composer. It only
// renders; the page decides what happens on Send.

import { arrowIcon, micIcon, plusIcon } from './icons';

const PLACEHOLDER = 'Ask anything or attach a reference';

export class Chat {
  readonly el = document.createElement('div');
  readonly #log = document.createElement('div');
  readonly #form = document.createElement('form');
  readonly #input = document.createElement('input');
  readonly #send = document.createElement('button');
  readonly #mic = document.createElement('span');
  #typing: HTMLElement | null = null;
  #queued = false;

  constructor(private readonly onSend: () => void) {
    this.el.className = 'cfg-chat';

    this.#log.className = 'cfg-chat-log';
    this.#log.setAttribute('role', 'log');
    this.#log.setAttribute('aria-live', 'polite');

    this.#form.className = 'cfg-composer';
    this.#input.type = 'text';
    this.#input.readOnly = true;
    this.#input.setAttribute('aria-readonly', 'true');
    this.#input.setAttribute('aria-label', 'Message');
    this.#input.placeholder = PLACEHOLDER;
    this.#input.autocomplete = 'off';

    const plus = document.createElement('span');
    plus.className = 'cfg-composer-icon';
    plus.innerHTML = plusIcon;
    this.#mic.className = 'cfg-composer-icon';
    this.#mic.innerHTML = micIcon;
    this.#send.type = 'submit';
    this.#send.className = 'cfg-send';
    this.#send.setAttribute('aria-label', 'Send');
    this.#send.innerHTML = arrowIcon;
    this.#send.hidden = true;

    const row = document.createElement('div');
    row.className = 'cfg-composer-row';
    row.append(plus, this.#mic, this.#send);
    this.#form.append(this.#input, row);
    this.#form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.#queued) this.onSend();
    });

    this.el.append(this.#log, this.#form);
  }

  addAgent(text: string): void {
    this.#append('cfg-msg cfg-msg--agent', text);
  }

  addUser(text: string): void {
    this.#append('cfg-msg cfg-msg--user', text);
  }

  setTyping(on: boolean): void {
    if (on && !this.#typing) {
      const t = document.createElement('div');
      t.className = 'cfg-typing';
      t.setAttribute('aria-label', 'Typing');
      t.innerHTML = '<span></span><span></span><span></span>';
      this.#typing = t;
      this.#log.append(t);
      this.#scroll();
    } else if (!on && this.#typing) {
      this.#typing.remove();
      this.#typing = null;
    }
  }

  /** Prefill the composer with the scripted reply, or clear it (label null). */
  queue(label: string | null): void {
    this.#queued = label !== null;
    this.#input.value = label ?? '';
    this.#send.hidden = label === null;
    this.#mic.hidden = label !== null;
    if (label !== null) this.#send.focus();
  }

  /** Append a code block with its own Copy control; returns the button so the page can wire it. */
  addSnippet(code: string, note: string): HTMLButtonElement {
    const wrap = document.createElement('div');
    wrap.className = 'cfg-snippet';
    const box = document.createElement('pre');
    box.className = 'cfg-code';
    box.tabIndex = 0;
    box.setAttribute('aria-label', 'Agent code');
    const codeEl = document.createElement('code');
    codeEl.textContent = code;
    box.append(codeEl);
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'cfg-copy';
    copy.textContent = 'Copy code';
    const noteEl = document.createElement('p');
    noteEl.className = 'cfg-note';
    noteEl.textContent = note;
    wrap.append(box, copy, noteEl);
    this.#log.append(wrap);
    this.#scroll();
    return copy;
  }

  clear(): void {
    this.#log.replaceChildren();
    this.#typing = null;
    this.queue(null);
  }

  #append(cls: string, text: string): void {
    const m = document.createElement('div');
    m.className = cls;
    m.textContent = text;
    this.#log.append(m);
    this.#scroll();
  }

  #scroll(): void {
    this.#log.scrollTop = this.#log.scrollHeight;
  }
}
