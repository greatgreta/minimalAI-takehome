import { test, expect } from '@playwright/test';

const box = (loc: import('@playwright/test').Locator) => loc.boundingBox();
const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  !(a.y + a.height <= b.y || b.y + b.height <= a.y || a.x + a.width <= b.x || b.x + b.width <= a.x);

// Docked (Maurten) panel: never covers the store header, never overlaps a visible demo bar.
for (const width of [1440, 1024, 800]) {
  test(`maurten docked panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/maurten');
    const bar = page.locator('nav[aria-label="Demo navigation"]');
    const panel = page.locator('minimal-agent .panel');
    await page.locator('minimal-agent .launcher').click();

    const p = (await box(panel))!;
    const header = (await box(page.locator('.mt-head')))!;
    expect(p.y, 'panel must not cover the store header').toBeGreaterThanOrEqual(header.y + header.height);
    if (await bar.isVisible()) {
      expect(overlap(p, (await box(bar))!), 'panel overlaps a visible demo bar').toBe(false);
    }
    await page.locator('minimal-agent .close').click();
    await expect(bar).toBeVisible();
  });
}

test('graza floating panel never touches the demo bar', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/');
  await page.locator('minimal-agent .launcher').click();
  const p = (await box(page.locator('minimal-agent .panel')))!;
  const bar = page.locator('nav[aria-label="Demo navigation"]');
  if (await bar.isVisible()) expect(overlap(p, (await box(bar))!), 'panel overlaps a visible demo bar').toBe(false);
});
