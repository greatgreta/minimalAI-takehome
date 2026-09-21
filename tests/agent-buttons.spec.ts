import { test, expect, type Page } from '@playwright/test';

// The launcher and every scripted button must DO something, on both stores at desktop and 375px.
// No enabled-looking dead buttons: after each step, controls from earlier steps are gone.

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, '375': { width: 375, height: 812 } };
const agent = (page: Page, sel: string) => page.locator(`minimal-agent ${sel}`);
const bag = (page: Page) => page.locator('[data-bag]').first();
const listText = (page: Page) => agent(page, '.list').innerText();

async function settle(page: Page) {
  // The composer is enabled again once the agent has finished "typing".
  await expect(agent(page, '.composer input')).toBeEnabled({ timeout: 15000 });
}

async function send(page: Page) {
  await agent(page, '.composer button[type="submit"]:not([disabled])').click();
  await settle(page);
}

async function tap(page: Page, text: string) {
  await agent(page, '.btn:not([aria-disabled="true"])').filter({ hasText: text }).last().click();
  await settle(page);
}

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`buttons at ${vpName}`, () => {
    test.use({ viewport });

    for (const [name, path] of [['graza', '/'], ['maurten', '/maurten']] as const) {
      test(`${name}: the launcher opens and closes the panel, repeatedly`, async ({ page }) => {
        await page.goto(path);
        for (let i = 0; i < 2; i++) {
          await agent(page, '.launcher').click();
          await expect(agent(page, '.panel')).toBeVisible();
          await expect(agent(page, '.launcher')).toBeHidden();
          await agent(page, '.close').click();
          await expect(agent(page, '.panel')).toBeHidden();
          await expect(agent(page, '.launcher')).toBeVisible();
        }
      });
    }

    test('graza: every scripted button does something and none is left dead', async ({ page }) => {
      await page.goto('/');
      const events: string[] = [];
      await page.exposeFunction('record', (e: string) => events.push(e));
      await page.evaluate(() => {
        for (const n of ['agent:add-to-cart', 'agent:checkout']) {
          document.addEventListener(n, (e) => (window as any).record(n + ':' + JSON.stringify((e as CustomEvent).detail)));
        }
      });
      await agent(page, '.launcher').click();
      await send(page); // friend picked Sizzle
      await send(page); // price question, card, trio offer

      // "Get the trio" plays a data-only reply with an add-to-cart, and does not advance the script.
      await tap(page, 'Get the trio');
      await expect(agent(page, '.list')).toContainText('The trio: Sizzle, Drizzle, Frizzle, 40 EUR.');
      await expect(agent(page, '.btn').filter({ hasText: 'Get the trio' })).toHaveCount(0);
      await expect(bag(page)).toHaveText('0');
      await tap(page, 'Add the trio');
      await expect(bag(page)).toHaveText('1');
      expect(events).toContain('agent:add-to-cart:{"productId":"trio"}');

      // The main path continues where it was.
      await tap(page, 'Just Drizzle');
      await expect(bag(page)).toHaveText('2');
      expect(events).toContain('agent:add-to-cart:{"productId":"drizzle"}');
      await tap(page, 'Yes');
      await expect(agent(page, '.list')).toContainText('10% off your next order');

      // No stale greyed-out controls: the only disabled button left is the unscripted sibling, and
      // it is gone once the shopper has moved on.
      await expect(agent(page, '.btn[aria-disabled="true"]')).toHaveCount(0);
      expect(await listText(page)).not.toMatch(/\bNo\b\s*$/m);
    });

    test('maurten: every scripted button does something and none is left dead', async ({ page }) => {
      await page.goto('/maurten');
      const events: string[] = [];
      await page.exposeFunction('record', (e: string) => events.push(e));
      await page.evaluate(() => {
        for (const n of ['agent:add-to-cart', 'agent:checkout']) {
          document.addEventListener(n, (e) => (window as any).record(n + ':' + JSON.stringify((e as CustomEvent).detail)));
        }
      });
      await agent(page, '.launcher').click();
      await send(page);
      await tap(page, 'No');
      await send(page); // postcode
      await tap(page, 'Add to cart');
      await expect(bag(page)).toHaveText('1');
      expect(events).toContain('agent:add-to-cart:{"productId":"gel160"}');
      await tap(page, 'Checkout');
      expect(events).toContain('agent:checkout:null');

      // The card's own "Add to cart" is gone once chosen; only the message shows the choice.
      await expect(agent(page, '.btn[aria-disabled="true"]')).toHaveCount(0);
      await expect(agent(page, '.btn').filter({ hasText: 'Add to cart' })).toHaveCount(0);
    });
  });
}
