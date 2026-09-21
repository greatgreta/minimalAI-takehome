// Writes docs/screens/configuration-empty.png (at load), configuration-reading.png (mid-reading, vertical
// steps with the dotted line) and configuration-filled.png (after the whole script, snippet visible) at 1440x1024. Needs a running preview: npm run build && npm run preview.
import { chromium } from '@playwright/test';

const base = process.env.BASE ?? 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
await page.goto(base + '/configuration');
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'docs/screens/configuration-empty.png' });

await page.locator('.cfg-read-btn').click();
await page.waitForTimeout(1500); // two of four steps ticked
await page.screenshot({ path: 'docs/screens/configuration-reading.png' });
for (let i = 0; i < 3; i++) {
  await page.locator('.cfg-send').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.cfg-send').click();
}
await page.locator('.cfg-code').waitFor({ timeout: 20000 });
// Scroll to the bottom so the demo bar sits in the reserved padding, clear of the cards.
await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: 'docs/screens/configuration-filled.png' });
await browser.close();
console.log('wrote docs/screens/configuration-empty.png, configuration-reading.png and configuration-filled.png');
