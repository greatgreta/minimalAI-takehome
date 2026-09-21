// Writes docs/screens/*.png using the system Chrome via Playwright. Serves the production build,
// so run `npm run build` first (the npm script does not do it, to keep this fast to re-run).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORT = 4174;
const base = `http://localhost:${PORT}`;
mkdirSync('docs/screens', { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('preview server did not start');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const send = async (page) => {
  await page.locator('minimal-agent .composer button[type="submit"]:not([disabled])').click();
  await sleep(4200);
};
const tap = async (page, label) => {
  await page.locator('minimal-agent .btn:not([aria-disabled="true"])', { hasText: label }).last().click();
  await sleep(3200);
};

// Bring each store to its obstacle turn.
const scripts = {
  '/': async (page) => {
    await send(page); // Sizzle does not fit salads and bread
    await send(page); // price question, Drizzle card, trio escape route
  },
  '/maurten': async (page) => {
    await send(page);
    await tap(page, 'No');
    await send(page); // postcode -> the gel restocks too late
  },
};

async function shoot(browser, route, viewport, file) {
  const page = await browser.newPage({ viewport });
  await page.goto(base + route);
  await page.locator('minimal-agent .launcher').click();
  await sleep(600);
  await scripts[route](page);
  await page.screenshot({ path: `docs/screens/${file}` });
  await page.close();
}

try {
  await waitForServer();
  const browser = await chromium.launch({ channel: 'chrome' });
  const desktop = { width: 1440, height: 900 };
  const mobile = { width: 375, height: 812 };
  await shoot(browser, '/', desktop, 'home-graza.png');
  await shoot(browser, '/maurten', desktop, 'home-maurten.png');
  await shoot(browser, '/', mobile, 'store-graza-375.png');
  await shoot(browser, '/maurten', mobile, 'store-maurten-375.png');
  await browser.close();
  console.log('wrote docs/screens/*.png');
} finally {
  stop();
}
