// One pixel comparison of /configuration against the Figma references in _reference/ (git-ignored),
// at 1440x1024, with the demo bar hidden (the design has none). Writes docs/screens/
// configuration-compare.png (reference | ours | difference) and prints a report.
//   node scripts/compare-config.mjs            (against http://localhost:4173, run npm run preview first)
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:4173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

async function shot() {
  await page.addStyleTag({ content: '.demo-bar{display:none !important}' });
  return (await page.screenshot()).toString('base64');
}

await page.goto(base + '/configuration');
await page.evaluate(() => document.fonts.ready);
await sleep(300);
const ours1 = await shot();

// Filled state: the moment the table is complete and the composer is showing (before the first message).
await page.getByRole('button', { name: /read my store/i }).click();
await page.locator('.cfg-table tbody tr').nth(5).waitFor();
await sleep(150);
const ours2 = await shot();

const refs = ['_reference/config-desktop-1.png', '_reference/config-desktop-2.png'].map((f) => readFileSync(f).toString('base64'));

const result = await page.evaluate(async ([refs, ours]) => {
  const load = async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); return i; };
  const out = [];
  const W = 1440, H = 1024;
  const sheet = document.createElement('canvas'); sheet.width = W * 3 + 40; sheet.height = H * 2 + 20;
  const sx = sheet.getContext('2d'); sx.fillStyle = '#888'; sx.fillRect(0, 0, sheet.width, sheet.height);
  for (let k = 0; k < 2; k++) {
    const [a, b] = await Promise.all([load(refs[k]), load(ours[k])]);
    const ca = document.createElement('canvas'); ca.width = W; ca.height = H; const xa = ca.getContext('2d'); xa.drawImage(a, 0, 0);
    const cb = document.createElement('canvas'); cb.width = W; cb.height = H; const xb = cb.getContext('2d'); xb.drawImage(b, 0, 0);
    const da = xa.getImageData(0, 0, W, H), db = xb.getImageData(0, 0, W, H);
    const diff = xb.createImageData(W, H);
    let differing = 0, sum = 0; const rows = new Array(H).fill(0);
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      sum += d;
      if (d > 24) { differing++; rows[((i / 4) / W) | 0]++; }
      const v = 255 - Math.min(255, d * 4);
      diff.data[i] = 255; diff.data[i + 1] = v; diff.data[i + 2] = v; diff.data[i + 3] = 255;
    }
    // bands of rows with many differing pixels
    const bands = []; let start = -1;
    for (let y = 0; y <= H; y++) { const hit = y < H && rows[y] > 6; if (hit && start < 0) start = y; if (!hit && start >= 0) { bands.push([start, y - 1]); start = -1; } }
    out.push({ state: k === 0 ? 'empty' : 'filled', differingPct: +(100 * differing / (W * H)).toFixed(2), meanAbs: +(sum / (W * H * 4 / 4) / 3 * 3 / 3).toFixed(2), bands: bands.slice(0, 14) });
    const y0 = k * (H + 20);
    sx.drawImage(ca, 0, y0); sx.drawImage(cb, W + 20, y0);
    const cd = document.createElement('canvas'); cd.width = W; cd.height = H; cd.getContext('2d').putImageData(diff, 0, 0);
    sx.drawImage(cd, (W + 20) * 2, y0);
  }
  return { out, sheet: sheet.toDataURL('image/png').split(',')[1] };
}, [refs, [ours1, ours2]]);

writeFileSync('docs/screens/configuration-compare.png', Buffer.from(result.sheet, 'base64'));
for (const o of result.out) console.log(o.state, JSON.stringify(o));
await browser.close();
