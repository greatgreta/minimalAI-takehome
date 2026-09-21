import { test, expect, type Page } from '@playwright/test';
import { decodeConfig } from '../src/config/codec';

test.use({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
test.setTimeout(90_000);

// By class, not by name: the label changes to "Reading..." while the reading runs.
const readBtn = (page: Page) => page.locator('.cfg-read-btn');
const rows = (page: Page) => page.locator('.cfg-table tbody tr');
const send = (page: Page) => page.locator('.cfg-send');

const BLACK = 'rgb(0, 0, 0)';
const GREY = 'rgb(118, 118, 118)'; // #767676

/** The last chat item must sit fully inside the scroll area, clear of the composer, never sliced. */
async function expectChatNotClipped(page: Page) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const log = document.querySelector('.cfg-chat-log')!.getBoundingClientRect();
          const last = document.querySelector('.cfg-chat-inner')!.lastElementChild!.getBoundingClientRect();
          const composer = document.querySelector('.cfg-composer')!.getBoundingClientRect();
          // gaps in px: below the last line to the composer, and above it to the top of the scroll area
          return Math.round(Math.min(composer.top - last.bottom, last.top - log.top));
        }),
      { message: 'last chat item is clipped or hidden behind the composer' },
    )
    .toBeGreaterThanOrEqual(15);
}

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
    await expectChatNotClipped(page);
    await send(page).click();
  }
  await expect(rows(page)).toHaveCount(9);
  await expect(page.locator('.cfg-code')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.cfg-note')).toBeVisible();
  await expectChatNotClipped(page); // "Your settings are stored inside this code." fully above the composer
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

test('button: black when active, grey while reading and after, black again after Reset', async ({ page }) => {
  await gotoConfig(page);
  await expect(readBtn(page)).toHaveCSS('background-color', BLACK);
  await expect(readBtn(page)).toHaveCSS('color', 'rgb(255, 255, 255)');
  const box = (await readBtn(page).boundingBox())!;
  expect([Math.round(box.width), Math.round(box.height)]).toEqual([132, 40]);

  await readBtn(page).hover();
  await expect(readBtn(page)).toHaveCSS('background-color', 'rgb(38, 38, 38)'); // hover is visible

  await readBtn(page).focus();
  await page.keyboard.press('Tab'); // move away, then back with the keyboard to get a focus ring
  await page.keyboard.press('Shift+Tab');
  expect(await readBtn(page).evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid');

  await readBtn(page).click();
  await expect(readBtn(page)).toHaveCSS('background-color', GREY);
  await expect(readBtn(page)).toBeDisabled();
  await expect(rows(page)).toHaveCount(6, { timeout: 15_000 });
  await expect(readBtn(page)).toHaveText('Read my store');
  await expect(readBtn(page)).toHaveCSS('background-color', GREY); // still inactive until Reset
  await expect(readBtn(page)).toBeDisabled();

  await page.locator('.cfg-reset').click();
  await expect(readBtn(page)).toHaveCSS('background-color', BLACK);
  await expect(readBtn(page)).toBeEnabled();
});

test('card 1 content is inset 52px and the input flexes around the 132px button', async ({ page }) => {
  await gotoConfig(page);
  const card = (await page.locator('.cfg-read').boundingBox())!;
  const input = (await page.locator('.cfg-input').boundingBox())!;
  const btn = (await readBtn(page).boundingBox())!;
  expect(Math.round(input.x - card.x)).toBe(52);
  expect(Math.round(card.x + card.width - (btn.x + btn.width))).toBe(52);
  expect(Math.round(btn.width)).toBe(132);
  expect(Math.round(btn.x - (input.x + input.width))).toBe(12);
});

test('reading steps: left card, in order, dotted timeline, then the table replaces them', async ({ page }) => {
  await gotoConfig(page);
  await readBtn(page).click();
  const steps = page.locator('.cfg-widget--table .cfg-step');
  await expect(steps).toHaveText([
    'Finding your colours',
    'Matching your fonts',
    'Measuring your corners and buttons',
    'Building your agent',
  ]);
  await expect(page.locator('.cfg-read .cfg-step')).toHaveCount(0); // not in card 1 any more
  for (const w of ['.cfg-widget--table', '.cfg-widget--chat']) {
    expect(Math.round((await page.locator(w).boundingBox())!.height)).toBe(379); // both cards grew
  }
  // vertical: each step is below the previous one, left aligned inside 24px padding, 18px icons
  const boxes = await steps.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
  const card = (await page.locator('.cfg-widget--table').boundingBox())!;
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].top).toBeGreaterThan(boxes[i - 1].top);
  expect(Math.round(boxes[0].left - card.x)).toBe(25); // 24px padding plus the 1px card border
  const icon = (await steps.first().locator('svg').boundingBox())!;
  expect([Math.round(icon.width), Math.round(icon.height)]).toEqual([18, 18]);
  // dotted connector between consecutive steps only
  const connector = (i: number) =>
    steps.nth(i).evaluate((e) => {
      const c = getComputedStyle(e, '::after');
      return { style: c.borderLeftStyle, width: c.borderLeftWidth, color: c.borderLeftColor };
    });
  expect(await connector(0)).toEqual({ style: 'dotted', width: '1px', color: 'rgb(200, 200, 200)' });
  expect((await connector(3)).style).toBe('none');
  // pending steps are grey with a hollow ring, done steps black
  await expect(steps.nth(3)).toHaveCSS('color', GREY);
  await expect(page.locator('.cfg-step.is-done')).toHaveCount(4, { timeout: 8000 });
  await expect(steps.nth(0)).toHaveCSS('color', BLACK);
  // the table then takes the same widget and the steps are gone
  await expect(page.locator('.cfg-widget--table .cfg-table')).toBeVisible({ timeout: 8000 });
  await expect(steps).toHaveCount(0);
});

test('table is set in the page font and fills its widget', async ({ page }) => {
  await gotoConfig(page);
  await readBtn(page).click();
  await expect(rows(page)).toHaveCount(6, { timeout: 15_000 });
  const fonts = await page.evaluate(() =>
    ['.cfg-table', '.cfg-table th', '.cfg-table td', '.cfg-chip'].map((s) => getComputedStyle(document.querySelector(s)!).fontFamily),
  );
  for (const f of fonts) expect(f).toContain('ABC Areal');
  const widget = (await page.locator('.cfg-widget--table').boundingBox())!;
  const table = (await page.locator('.cfg-table').boundingBox())!;
  expect(Math.round(table.x - widget.x)).toBe(25); // 24px padding plus the card border
  expect(Math.round(widget.x + widget.width - (table.x + table.width))).toBe(25);
  await expect(page.locator('.cfg-table th').first()).toHaveCSS('background-color', 'rgb(250, 250, 250)');
  await expect(page.locator('.cfg-table td').first()).toHaveCSS('font-size', '13px');
});

test('send button: black 28px circle, exactly 16x16 arrow, focus ring, aria-label', async ({ page }) => {
  await gotoConfig(page);
  await readBtn(page).click();
  await expect(send(page)).toBeVisible({ timeout: 15_000 });
  await expect(send(page)).toHaveAttribute('aria-label', 'Send');
  await expect(send(page)).toHaveCSS('background-color', BLACK);
  const circle = (await send(page).boundingBox())!;
  expect([Math.round(circle.width), Math.round(circle.height)]).toEqual([28, 28]);
  const arrow = (await send(page).locator('svg').boundingBox())!;
  expect([Math.round(arrow.width), Math.round(arrow.height)]).toEqual([16, 16]);
  await expect(send(page)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  expect(await send(page).evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid');
});

test('chat is never clipped, at 1000px wide', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await gotoConfig(page);
  await runFlow(page); // checks after each question and after the final message
});
