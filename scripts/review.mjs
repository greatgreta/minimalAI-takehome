// Click-by-click walkthrough of both stores at desktop and 375px, with a numbered screenshot at
// every step, plus /configuration and the demo bar states. Also records objective checks
// (overlap, clipping, scroll, console errors, dead buttons) to <out>/findings.json.
//
//   node scripts/review.mjs docs/screens/review            (against http://localhost:4173)
//   BASE=http://localhost:4173 node scripts/review.mjs docs/screens/review-after
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = process.argv[2] ?? 'docs/screens/review';
const base = process.env.BASE ?? 'http://localhost:4173';
mkdirSync(out, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, 375: { width: 375, height: 812 } };
const findings = [];
const note = (where, what) => findings.push({ where, what });

const pad = (n) => String(n).padStart(2, '0');

// Objective checks that run at every step.
async function probe(page, where) {
  const r = await page.evaluate(() => {
    const host = document.querySelector('minimal-agent');
    const sr = host?.shadowRoot;
    const rect = (el) => {
      if (!el || el.hidden) return null;
      const b = el.getBoundingClientRect();
      return b.width && b.height ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
    };
    const launcher = rect(sr?.querySelector('.launcher'));
    const panel = rect(sr?.querySelector('.panel'));
    const bar = rect(document.querySelector('.demo-bar'));
    const composer = rect(sr?.querySelector('.composer input'));
    const clipped = [...(sr?.querySelectorAll('.msg, .card, .btn, .chip, .title') ?? [])]
      .filter((e) => e.scrollWidth > e.clientWidth + 1)
      .map((e) => e.className + ':' + e.textContent.slice(0, 30));
    return {
      vw: innerWidth,
      vh: innerHeight,
      hscroll: document.documentElement.scrollWidth > innerWidth,
      launcher,
      panel,
      bar,
      composer,
      clipped,
    };
  });
  const overlap = (a, b) => a && b && !(a.y + a.h <= b.y || b.y + b.h <= a.y || a.x + a.w <= b.x || b.x + b.w <= a.x);
  if (r.hscroll) note(where, 'horizontal scroll');
  if (overlap(r.launcher, r.bar)) note(where, 'launcher overlaps demo bar');
  if (overlap(r.panel, r.bar)) note(where, 'panel overlaps demo bar');
  for (const [name, b] of [['launcher', r.launcher], ['panel', r.panel], ['composer', r.composer]]) {
    if (b && (b.x < -1 || b.y < -1 || b.x + b.w > r.vw + 1 || b.y + b.h > r.vh + 1)) {
      note(where, `${name} outside viewport ${JSON.stringify(b)}`);
    }
  }
  if (r.clipped.length) note(where, 'clipped text: ' + r.clipped.join(' | '));
  return r;
}

async function run(browser, store, vpName) {
  const page = await browser.newPage({ viewport: VIEWPORTS[vpName] });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  const route = store === 'graza' ? '/' : '/maurten';
  let n = 0;
  const shot = async (label) => {
    n += 1;
    const name = `${store}-${vpName}-${pad(n)}-${label}`;
    await page.screenshot({ path: `${out}/${name}.png` });
    await probe(page, name);
  };
  const agent = (sel, opts) => page.locator(`minimal-agent ${sel}`, opts);

  await page.goto(base + route);
  await sleep(500);
  await shot('launcher');

  // Does the launcher open the panel?
  await agent('.launcher').click();
  await sleep(4000);
  const opened = await agent('.panel').isVisible();
  if (!opened) note(`${store}-${vpName}`, 'launcher click does not open the panel');
  await shot('panel-open');

  // Close and reopen (the launcher must come back and work again).
  await agent('.close').click();
  await sleep(300);
  if (!(await agent('.launcher').isVisible())) note(`${store}-${vpName}`, 'launcher not visible after close');
  await shot('closed-again');
  await agent('.launcher').click();
  await sleep(600);

  const send = async (label) => {
    const btn = agent('.composer button[type="submit"]');
    if (await btn.isDisabled()) return note(`${store}-${vpName}`, `send disabled at step ${label}`);
    await btn.click();
    await sleep(4500);
    await shot(label);
  };
  const tap = async (text, label) => {
    const b = agent('.btn', { hasText: text }).last();
    const disabled = (await b.getAttribute('aria-disabled')) === 'true';
    if (disabled) note(`${store}-${vpName}`, `button "${text}" is disabled (looks dead) at step ${label}`);
    await b.click();
    await sleep(3500);
    await shot(label);
  };

  if (store === 'graza') {
    await send('user-1-agent-turns');
    await send('obstacle-price-card');
    // Every visible reply/button: is it enabled?
    const trio = agent('.btn', { hasText: 'Get the trio' });
    if (await trio.count()) {
      const dis = (await trio.first().getAttribute('aria-disabled')) === 'true';
      if (dis) note(`${store}-${vpName}`, '"Get the trio" is disabled, looks broken');
    }
    await tap('Just Drizzle', 'just-drizzle');
    await tap('Yes', 'first-order-yes-final');
  } else {
    await send('user-1-strip');
    await tap('No', 'caffeine-no');
    await send('postcode-obstacle');
    await tap('Add to cart', 'add-to-cart');
    const bagBefore = await page.locator('[data-bag]').first().textContent();
    if (bagBefore === '0') note(`${store}-${vpName}`, 'bag count did not increment after add-to-cart');
    await tap('Checkout', 'checkout-final');
  }

  // Docked-only controls.
  if (store === 'maurten') {
    if (vpName === 'desktop') {
      await agent('.expand').click();
      await sleep(400);
      await shot('expanded');
      await agent('.expand').click();
      await agent('.min').click();
      await sleep(400);
      await shot('minimised');
      await agent('.min').click();
    }
  }

  // Reset works?
  await agent('.link-btn').click();
  await sleep(2500);
  await shot('after-reset');

  // Keyboard focus visibility on the launcher.
  await agent('.close').click();
  await sleep(300);
  await page.keyboard.press('Tab');
  await shot('tab-focus');

  if (errors.length) note(`${store}-${vpName}`, 'console errors: ' + errors.join(' | '));
  await page.close();
}

async function extras(browser) {
  for (const vp of ['desktop', '375']) {
    const page = await browser.newPage({ viewport: VIEWPORTS[vp] });
    await page.goto(base + '/configuration');
    await sleep(400);
    await page.screenshot({ path: `${out}/configuration-${vp}.png` });
    await probe(page, `configuration-${vp}`);
    for (const [label, path] of [['graza', '/'], ['maurten', '/maurten'], ['configuration', '/configuration']]) {
      await page.goto(base + path);
      await sleep(300);
      await page.locator('.demo-bar').screenshot({ path: `${out}/demobar-${vp}-current-${label}.png` });
    }
    await page.goto(base + '/');
    await page.locator('.demo-bar a').nth(1).focus();
    await page.locator('.demo-bar').screenshot({ path: `${out}/demobar-${vp}-focus.png` });
    await page.close();
  }
}

const browser = await chromium.launch({ channel: 'chrome' });
for (const store of ['graza', 'maurten']) for (const vp of ['desktop', '375']) await run(browser, store, vp);
await extras(browser);
await browser.close();
writeFileSync(`${out}/findings.json`, JSON.stringify(findings, null, 2));
console.log(`wrote ${out}; ${findings.length} automatic findings`);
for (const f of findings) console.log('-', f.where, ':', f.what);
