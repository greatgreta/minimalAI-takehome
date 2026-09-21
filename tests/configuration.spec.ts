import { test, expect, type Page } from '@playwright/test';
import { decodeConfig } from '../src/config/codec';

test.use({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
test.setTimeout(90_000);

// By class, not by name: the label changes to "Reading..." while the reading runs.
const readBtn = (page: Page) => page.locator('.cfg-read-btn');
const rows = (page: Page) => page.locator('.cfg-table tbody tr');
const send = (page: Page) => page.locator('.cfg-send');

async function gotoConfig(page: Page) {
  await page.goto('/configuration');
  await expect(page.locator('.cfg-input')).toBeVisible();
}

async function expectEmpty(page: Page) {
  await expect(page.locator('.cfg-ghost')).toHaveCount(2);
  await expect(page.locator('.cfg-ghost').first()).toHaveText('Waiting for your store');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.locator('.cfg-step')).toHaveCount(0);
  await expect(page.locator('.cfg-msg')).toHaveCount(0);
  await expect(page.locator('.cfg-typing')).toHaveCount(0);
  await expect(page.locator('.cfg-snippet')).toHaveCount(0);
  await expect(readBtn(page)).toBeEnabled();
  await expect(readBtn(page)).toHaveText('Read my store');
  await expect(page.locator('.cfg-reset')).toBeHidden();
}

async function runFlow(page: Page) {
  await readBtn(page).click();
  await expect(rows(page)).toHaveCount(6, { timeout: 15_000 });
  await expect(page.locator('.cfg-msg--agent').first()).toContainText("I've read www.graza.co", { timeout: 15_000 });
  for (const label of ['Floating, please.', 'Say hello first.', 'Chatty and vibrant, like Graza.']) {
    await expect(send(page)).toBeVisible({ timeout: 15_000 });
    await expect(send(page)).toBeFocused();
    await expect(page.locator('.cfg-composer input')).toHaveValue(label);
    await send(page).click();
  }
  await expect(rows(page)).toHaveCount(9);
  await expect(page.locator('.cfg-code')).toBeVisible({ timeout: 15_000 });
}

test('scripted flow: read, answer three questions, copy the real snippet, reset, run again', async ({ page }) => {
  await gotoConfig(page);
  await expect(page.locator('.cfg-input')).toHaveValue('www.graza.co');
  await expect(page.locator('.cfg-input')).toHaveAttribute('readonly', '');
  await expect(page.locator('.cfg-input')).toHaveAttribute('aria-readonly', 'true');
  await expectEmpty(page);

  await runFlow(page);
  await expect(rows(page).nth(6)).toContainText('Floating');
  await expect(rows(page).nth(7)).toContainText('Says hello');
  await expect(rows(page).nth(8)).toContainText('Energy 0.7');

  await page.getByRole('button', { name: 'Copy code' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  const encoded = clip.match(/data-config="([^"]+)"/)![1];
  expect(clip).toContain(`${new URL(page.url()).origin}/agent.js`);
  const config = decodeConfig(encoded);
  expect(config.brand).toBe('graza');
  expect(config.behaviour.placement).toBe('floating');
  expect(config.behaviour.opening).toBe('greets');
  expect(config.sliders.energy).toBe(0.7);
  expect(config.sliders.shape).toBe(0.5);
  // The box shows the same full text that is copied.
  expect(await page.locator('.cfg-code').innerText()).toBe(clip);

  await page.locator('.cfg-reset').click();
  await expectEmpty(page);
  await expect(readBtn(page)).toBeFocused();

  await runFlow(page); // and it runs again
});

test('reset mid-reading leaves nothing behind', async ({ page }) => {
  await gotoConfig(page);
  await readBtn(page).click();
  await expect(readBtn(page)).toBeDisabled();
  await expect(readBtn(page)).toHaveText('Reading...');
  await expect(page.locator('.cfg-step')).toHaveCount(4);
  await page.waitForTimeout(900);
  await page.locator('.cfg-reset').click();
  await expectEmpty(page);
  await page.waitForTimeout(4500); // longer than the whole reading and first messages
  await expectEmpty(page);
});

test('reset mid-conversation leaves nothing behind', async ({ page }) => {
  await gotoConfig(page);
  await readBtn(page).click();
  await expect(send(page)).toBeVisible({ timeout: 15_000 });
  await send(page).click(); // answer one question; the next agent message is being typed
  await expect(page.locator('.cfg-typing')).toHaveCount(1);
  await page.locator('.cfg-reset').click();
  await expectEmpty(page);
  await page.waitForTimeout(3000);
  await expectEmpty(page);
  await expect(page.locator('.cfg-composer')).toHaveCount(0); // the chat is gone, not just emptied
});

test('reset works at the end, after the snippet has been copied', async ({ page }) => {
  await gotoConfig(page);
  await runFlow(page);
  await page.getByRole('button', { name: 'Copy code' }).click();
  await page.locator('.cfg-reset').click();
  await expectEmpty(page);
  await page.waitForTimeout(2500); // past the 2s "Copied" timer
  await expectEmpty(page);
});

test('375px: stacked cards and no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoConfig(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await expect(page.locator('.cfg-rail')).toBeHidden();
  await readBtn(page).click();
  await expect(rows(page)).toHaveCount(6, { timeout: 15_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
