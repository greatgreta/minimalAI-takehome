// Maurten store replica: a shop grid built from the reference's structure (hairline flat tiles,
// name and category, no prices). Wordmark is plain text; tiles are flat colour blocks, no imagery.
// Brand values are allowed in this file (replica styling); the agent knows nothing about them.

import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import { maurtenProducts } from '../catalogue/maurten';

const CSS = `
.mt { background: #FFFFFF; color: #050505; font-family: 'Inter', sans-serif; font-size: 13px; min-height: 100vh; }
.mt * { box-sizing: border-box; }
.mt a { color: inherit; text-decoration: none; }
.mt-head { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 14px 16px; }
.mt-mark { font-weight: 500; }
.mt-nav { display: flex; gap: 20px; color: #767676; }
.mt-nav .on { color: #050505; }
.mt-right { display: flex; gap: 20px; justify-content: flex-end; color: #767676; }
.mt-bag { background: none; border: 0; padding: 0; font: inherit; color: #050505; cursor: pointer; }
.mt-intro { display: grid; grid-template-columns: 1fr 2fr 1fr; padding: 40px 16px 56px; gap: 16px; }
.mt-intro p { margin: 0; font-size: 20px; line-height: 1.3; max-width: 30ch; }
.mt-filters { display: flex; gap: 16px; padding: 0 16px 16px; color: #767676; flex-wrap: wrap; }
.mt-filters .on { color: #050505; }
.mt-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; padding: 0 8px 56px; }
.mt-tile { border: 1px solid #E6E6E6; background: #FAFAFA; display: flex; flex-direction: column; }
.mt-block { aspect-ratio: 1 / 1.1; margin: 16px; background: #EDEDED; }
.mt-block.dark { background: #1A1A1A; }
.mt-block.link { background: transparent; border: 1px solid #E6E6E6; display: grid; place-items: center; color: #767676; }
.mt-meta { padding: 0 8px 10px; font-size: 11px; line-height: 1.35; }
.mt-meta span { display: block; color: #767676; }
@media (max-width: 900px) { .mt-grid { grid-template-columns: repeat(3, 1fr); } .mt-intro { grid-template-columns: 1fr; } }
@media (max-width: 640px) {
  .mt-head { grid-template-columns: 1fr auto; }
  .mt-nav { display: none; }
  .mt-grid { grid-template-columns: repeat(2, 1fr); }
  :root { --agent-offset-bottom: calc(var(--demo-bar-h) + 12px); }
}
`;

export function renderMaurtenStore(root: HTMLElement): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const tile = (p: (typeof maurtenProducts)[number], i: number) =>
    p.kind === 'link'
      ? `<a class="mt-tile" href="${p.href}" target="_blank" rel="noopener"><div class="mt-block link">Link</div><div class="mt-meta">${p.name}<span>${p.category}</span></div></a>`
      : `<div class="mt-tile"><div class="mt-block${i % 2 ? ' dark' : ''}"></div><div class="mt-meta">${p.name}<span>${p.category}</span></div></div>`;

  root.innerHTML = `
  <div class="mt">
    <header class="mt-head">
      <div class="mt-mark">Maurten</div>
      <nav class="mt-nav" aria-label="Store"><a class="on" href="#">Shop</a><a href="#">Education</a><a href="#">Inspire</a><a href="#">Events</a></nav>
      <div class="mt-right"><a href="#">Membership</a><button class="mt-bag" type="button">Bag (<span data-bag>0</span>)</button></div>
    </header>
    <main>
      <section class="mt-intro"><div>Country: Netherlands</div><p>Fuel for long efforts, without the guesswork.</p><div></div></section>
      <nav class="mt-filters" aria-label="Filter"><a class="on" href="#">All</a><a href="#">Gels</a><a href="#">Drink Mixes</a><a href="#">Solids</a><a href="#">Bicarb</a></nav>
      <section class="mt-grid">${maurtenProducts.map(tile).join('')}</section>
    </main>
  </div>`;

  const count = root.querySelector<HTMLElement>('[data-bag]')!;
  document.addEventListener('agent:add-to-cart', () => {
    count.textContent = String(Number(count.textContent) + 1);
  });
}
