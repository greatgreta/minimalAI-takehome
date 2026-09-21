import { test, expect } from '@playwright/test';

// The docked (Maurten) panel header has exactly two window controls: minimise "_" and close "x".

for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['375', { width: 375, height: 812 }]] as const) {
  test(`maurten header controls at ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // The agent honours reduced motion, so the slide-in cannot skew the measurements below.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/maurten');
    await page.locator('minimal-agent .launcher').click();

    const controls = page.locator('minimal-agent .header .icon-btn');
    await expect(controls).toHaveCount(2);
    await expect(controls.nth(0)).toHaveAttribute('aria-label', 'Minimise');
    await expect(controls.nth(1)).toHaveAttribute('aria-label', 'Close');
    await expect(controls.nth(0)).toHaveText('_');
    await expect(controls.nth(1)).toHaveText('x');

    // Same row, no overlap, inside the header, spaced apart.
    const a = (await controls.nth(0).boundingBox())!;
    const b = (await controls.nth(1).boundingBox())!;
    const header = (await page.locator('minimal-agent .header').boundingBox())!;
    expect(Math.abs(a.y + a.height / 2 - (b.y + b.height / 2))).toBeLessThanOrEqual(1);
    expect(b.x).toBeGreaterThanOrEqual(a.x + a.width);
    expect(b.x + b.width).toBeLessThanOrEqual(header.x + header.width);
    if (name === '375') {
      for (const box of [a, b]) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Keyboard: Close -> Shift+Tab -> Minimise -> Tab -> Close, each with a visible focus ring.
    const active = () =>
      page.evaluate(() => {
        const e = document.querySelector('minimal-agent')!.shadowRoot!.activeElement as HTMLElement | null;
        const c = e ? getComputedStyle(e) : null;
        return { label: e?.getAttribute('aria-label') ?? null, outline: c ? `${c.outlineStyle} ${c.outlineWidth}` : null };
      });
    await controls.nth(1).focus();
    await page.keyboard.press('Shift+Tab');
    expect(await active()).toEqual({ label: 'Minimise', outline: 'solid 2px' });
    await page.keyboard.press('Tab');
    expect(await active()).toEqual({ label: 'Close', outline: 'solid 2px' });

    // Both still work.
    await controls.nth(0).click();
    await expect(page.locator('minimal-agent .panel')).toHaveClass(/minimised/);
    await controls.nth(0).click();
    await controls.nth(1).click();
    await expect(page.locator('minimal-agent .panel')).toBeHidden();
  });
}

test('graza floating panel has only a close control', async ({ page }) => {
  await page.goto('/');
  await page.locator('minimal-agent .launcher').click();
  await expect(page.locator('minimal-agent .header .icon-btn')).toHaveCount(1);
});
