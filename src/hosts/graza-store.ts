// Graza store replica: a product-page layout (The Trio) built from the reference's structure,
// type scale, spacing and colour system. Wordmark is plain text; imagery is flat colour blocks, except
// the one real product photo in the hero (third-party, allowed for this private exercise only).
// Brand values are allowed in this file (replica styling); the agent knows nothing about them.

import '@fontsource/eb-garamond/latin-500.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-600.css';
import { grazaCatalogue as c } from '../catalogue/graza';
import heroLarge from '../assets/graza-hero.webp';
import heroSmall from '../assets/graza-hero-800.webp';

// Intrinsic size of the large variant, so the browser reserves the space before it loads.
const HERO_W = 1296;
const HERO_H = 1500;

const CSS = `
.gz { --cream: #F6E6D9; --paper: #FFF4EC; --olive: #3C422E; --lime: #D1E030; --lime-2: #B9C81E; --bottle: #2F3A22;
  background: var(--cream); color: var(--olive); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
.gz * { box-sizing: border-box; }
.gz a { color: inherit; }
.gz-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 32px; }
.gz-mark { font-family: 'EB Garamond', serif; font-weight: 500; font-size: 2.2rem; letter-spacing: 0.02em; text-transform: uppercase; }
.gz-nav { display: flex; align-items: center; gap: 24px; font-size: 0.85rem; }
.gz-nav a { text-decoration: none; }
.gz-cart { border: 1px solid var(--olive); border-radius: 999px; padding: 6px 14px; background: transparent; font: inherit; color: inherit; cursor: pointer; }
.gz-product { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; padding: 0 32px 48px; align-items: start; }
.gz-gallery { display: grid; grid-template-columns: 56px 1fr; gap: 12px; }
.gz-thumbs { display: flex; flex-direction: column; gap: 10px; }
.gz-thumb { width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--olive); }
.gz-hero { aspect-ratio: ${HERO_W} / ${HERO_H}; overflow: hidden; border-radius: 0; background: #C4BBB3; }
/* The box takes the photo's own shape, so there is no letterbox and therefore no seam: the photo's
   backdrop is mottled (corners sampled from #9E948C to #E6E0D9), so no single flat colour can match
   it. #C4BBB3 (mean of the top strip) is only the placeholder shown while the image loads. */
.gz-hero img { display: block; width: 100%; height: 100%; object-fit: contain; }
.gz-info { max-width: 460px; margin: 0 auto; text-align: center; }
.gz-title { font-family: 'EB Garamond', serif; font-weight: 500; font-size: 2.4rem; line-height: 1.05; margin: 8px 0 16px; }
.gz-price { font-size: 0.95rem; margin-bottom: 8px; }
.gz-price s { opacity: 0.7; margin-right: 8px; }
.gz-add { width: 100%; min-height: 48px; margin: 12px 0; border: 1px solid var(--olive); border-radius: 30px; background: var(--lime); color: var(--olive); font: 600 1rem 'DM Sans', sans-serif; cursor: pointer; }
.gz-box { border: 1px solid var(--olive); border-radius: 20px; background: var(--paper); padding: 14px 18px; margin: 12px 0; font-size: 0.85rem; text-align: left; }
.gz-tabs { display: flex; margin-top: 20px; }
.gz-tab { flex: 1; padding: 8px; border: 1px solid var(--olive); border-bottom: 0; border-radius: 12px 12px 0 0; background: var(--paper); font: 600 0.72rem 'DM Sans', sans-serif; text-transform: uppercase; color: var(--olive); cursor: pointer; }
.gz-tab[aria-selected="true"] { background: var(--olive); color: var(--paper); }
.gz-panel { border: 1px solid var(--olive); border-radius: 0 0 20px 20px; background: var(--paper); padding: 18px; text-align: left; font-size: 0.85rem; line-height: 1.55; }
.gz-panel h4 { margin: 14px 0 4px; font-size: 0.8rem; text-transform: uppercase; }
.gz-panel h4:first-child { margin-top: 0; }
.gz-lineup { text-align: center; padding: 24px 32px 64px; }
.gz-lineup h2 { font-family: 'EB Garamond', serif; font-weight: 500; font-size: 2.4rem; text-transform: uppercase; margin: 16px 0 32px; }
.gz-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
.gz-col h3 { font-family: 'EB Garamond', serif; font-weight: 500; font-size: 2rem; margin: 0 0 8px; }
.gz-pill { display: inline-block; padding: 6px 18px; border: 1px solid var(--olive); border-radius: 999px; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 16px; }
.gz-tile { aspect-ratio: 5 / 6; border-radius: 20px; margin-bottom: 14px; }
.gz-col p { font-size: 0.85rem; line-height: 1.55; margin: 0; }
.gz-foot { border-top: 1px solid var(--olive); background: var(--paper); padding: 24px 32px; text-align: center; font-size: 0.8rem; }
@media (max-width: 800px) {
  .gz-head { padding: 12px 16px; flex-wrap: wrap; }
  .gz-nav { gap: 14px; order: 3; width: 100%; }
  .gz-product { grid-template-columns: 1fr; padding: 0 16px 32px; gap: 24px; }
  .gz-gallery { grid-template-columns: 1fr; }
  .gz-thumbs { flex-direction: row; order: 2; }
  .gz-cols { grid-template-columns: 1fr; }
  .gz-lineup { padding: 16px 16px 40px; }
  .gz-title, .gz-lineup h2 { font-size: 1.9rem; }
}
@media (max-width: 640px) { :root { --agent-offset-bottom: calc(var(--demo-bar-h) + 12px); } }
`;

const TABS: Record<string, string> = {
  Details: `<h4>${c.sizzle.name}: ${c.sizzle.size}</h4><p>Everyday cooking oil, mellow and easy.</p>
    <h4>${c.drizzle.name}: ${c.drizzle.size}</h4><p>Finishing oil, made to be eaten raw.</p>
    <h4>${c.frizzle.name}: ${c.frizzle.size}</h4><p>Neutral, high-heat oil for the hot pan.</p>`,
  Harvest: '<p>Placeholder harvest notes for this design exercise.</p>',
  Uses: '<p>Placeholder usage notes for this design exercise.</p>',
  Refills: '<p>Placeholder refill notes for this design exercise.</p>',
};

export function renderGrazaStore(root: HTMLElement): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  root.innerHTML = `
  <div class="gz">
    <header class="gz-head">
      <div class="gz-mark">Graza</div>
      <nav class="gz-nav" aria-label="Store">
        <a href="#">Shop</a><a href="#">Get Refills</a><a href="#">About</a>
        <button class="gz-cart" type="button">Cart [<span data-bag>0</span>]</button>
      </nav>
    </header>
    <main>
      <section class="gz-product">
        <div class="gz-gallery">
          <div class="gz-thumbs" aria-hidden="true">
            ${['#8E9A5B', '#C9A227', '#7A4B2A', '#3C422E', '#D1E030', '#B5651D'].map((k) => `<span class="gz-thumb" style="background:${k}"></span>`).join('')}
          </div>
          <div class="gz-hero">
            <img
              src="${heroLarge}"
              srcset="${heroSmall} 800w, ${heroLarge} ${HERO_W}w"
              sizes="(max-width: 800px) 100vw, 55vw"
              width="${HERO_W}"
              height="${HERO_H}"
              alt="Graza Frizzle, Sizzle, Drizzle and spray olive oil bottles"
              decoding="async"
            />
          </div>
        </div>
        <div class="gz-info">
          <h1 class="gz-title">The Trio<br />Sizzle, Drizzle &amp; Frizzle Set</h1>
          <div class="gz-price"><s>${c.trio.separate} EUR</s><strong>${c.trio.price} EUR</strong></div>
          <div class="gz-box">Delivery: every 1 month. Skip, edit or cancel anytime.</div>
          <button class="gz-add" type="button" data-add>Add to bag</button>
          <div class="gz-tabs" role="tablist">
            ${Object.keys(TABS).map((t, i) => `<button class="gz-tab" role="tab" type="button" data-tab="${t}" aria-selected="${i === 0}">${t}</button>`).join('')}
          </div>
          <div class="gz-panel" data-panel>${TABS.Details}</div>
        </div>
      </section>
      <section class="gz-lineup">
        <h2>Meet the lineup</h2>
        <div class="gz-cols">
          <div class="gz-col"><h3>${c.sizzle.name}</h3><span class="gz-pill">Cooking oil</span><div class="gz-tile" style="background:#E4CB1E"></div><p>Mellow, all-purpose oil for roasting and sauteing.</p></div>
          <div class="gz-col"><h3>${c.drizzle.name}</h3><span class="gz-pill">Finishing oil</span><div class="gz-tile" style="background:#8FBF4F"></div><p>Bold and fresh, made for salads, dips and finishing.</p></div>
          <div class="gz-col"><h3>${c.frizzle.name}</h3><span class="gz-pill">High heat cooking oil</span><div class="gz-tile" style="background:#C9D93A"></div><p>Neutral flavour and a high smoke point for the hot pan.</p></div>
        </div>
      </section>
    </main>
    <footer class="gz-foot">Unaffiliated design exercise. Prices, offers and product data are fictional.</footer>
  </div>`;

  const count = root.querySelector<HTMLElement>('[data-bag]')!;
  const bump = () => {
    count.textContent = String(Number(count.textContent) + 1);
  };
  root.querySelector('[data-add]')!.addEventListener('click', bump);
  document.addEventListener('agent:add-to-cart', bump);

  const panel = root.querySelector<HTMLElement>('[data-panel]')!;
  root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      panel.innerHTML = TABS[btn.dataset.tab!];
    });
  });
}
