import { test, expect } from '@playwright/test';

// The Graza hero photo: loads, never overflows, never overlaps the price block or the launcher, and
// a 375px phone downloads the small variant only.
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['375', { width: 375, height: 812 }]] as const) {
  test(`graza hero photo at ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const downloaded: string[] = [];
    page.on('response', (r) => /graza-hero.*\.webp/.test(r.url()) && downloaded.push(r.url()));
    await page.goto('/');

    const img = page.locator('.gz-hero img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', 'Graza Frizzle, Sizzle, Drizzle and spray olive oil bottles');
    await expect(img).toHaveAttribute('width', '1296');
    await expect(img).toHaveAttribute('height', '1500');
    expect(await img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);

    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);

    const hero = (await page.locator('.gz-hero').boundingBox())!;
    for (const sel of ['.gz-price', '.gz-title']) {
      const b = (await page.locator(sel).boundingBox())!;
      const hit = !(hero.y + hero.height <= b.y || b.y + b.height <= hero.y || hero.x + hero.width <= b.x || b.x + b.width <= hero.x);
      expect(hit, `hero overlaps ${sel}`).toBe(false);
    }
    const l = (await page.locator('minimal-agent .launcher').boundingBox())!;
    expect(!(hero.y + hero.height <= l.y || l.y + l.height <= hero.y || hero.x + hero.width <= l.x || l.x + l.width <= hero.x)).toBe(false);

    if (name === '375') {
      expect(downloaded.some((u) => u.includes('graza-hero-800'))).toBe(true);
      expect(downloaded.some((u) => /graza-hero-(?!800)/.test(u))).toBe(false);
    }
  });
}
