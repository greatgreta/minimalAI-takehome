import { test, expect } from '@playwright/test';

// Both stores at 375px: open the agent, no horizontal scroll, launcher + composer inside the
// viewport, and the launcher never overlaps the demo bar while the panel is closed.

const VIEWPORT = { width: 375, height: 812 };

for (const path of ['/', '/maurten']) {
  test.describe(`store ${path} at 375px`, () => {
    test.use({ viewport: VIEWPORT });

    test('launcher and demo bar do not overlap while closed', async ({ page }) => {
      await page.goto(path);
      const launcher = page.locator('minimal-agent .launcher');
      await expect(launcher).toBeVisible();
      const l = (await launcher.boundingBox())!;
      const b = (await page.locator('nav[aria-label="Demo navigation"]').boundingBox())!;
      const overlap = !(l.y + l.height <= b.y || b.y + b.height <= l.y || l.x + l.width <= b.x || b.x + b.width <= l.x);
      expect(overlap).toBe(false);
      expect(l.x + l.width).toBeLessThanOrEqual(VIEWPORT.width);
    });

    test('open agent: no horizontal scroll, launcher and composer inside the viewport', async ({ page }) => {
      await page.goto(path);
      const launcher = page.locator('minimal-agent .launcher');
      const lb = (await launcher.boundingBox())!;
      expect(lb.x).toBeGreaterThanOrEqual(0);
      expect(lb.x + lb.width).toBeLessThanOrEqual(VIEWPORT.width);
      expect(lb.y + lb.height).toBeLessThanOrEqual(VIEWPORT.height);

      await launcher.click();
      const input = page.locator('minimal-agent .composer input');
      await expect(input).toBeVisible();
      const ib = (await input.boundingBox())!;
      expect(ib.x).toBeGreaterThanOrEqual(0);
      expect(ib.x + ib.width).toBeLessThanOrEqual(VIEWPORT.width);
      expect(ib.y + ib.height).toBeLessThanOrEqual(VIEWPORT.height);

      const scrolls = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(scrolls).toBe(false);
    });

    test('demo bar hides while the panel is open and returns on close', async ({ page }) => {
      await page.goto(path);
      const bar = page.locator('nav[aria-label="Demo navigation"]');
      await page.locator('minimal-agent .launcher').click();
      await expect(bar).toBeHidden();
      await page.locator('minimal-agent .close').click();
      await expect(bar).toBeVisible();
    });
  });
}
