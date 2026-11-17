/** Gallery discovery and real rendered wireframe exports, using the team's Frame component. */
import { test, expect } from '@playwright/test';
for (const [file, states] of [['shared-dashboard', ['default', 'outdated', 'empty']], ['my-dogs', ['default', 'details', 'empty']]]) {
  test(`Saif ${file} uses the team gallery and renders each state`, async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto(`/#saif/${file}`);
    await expect(page.getByRole('link', { name: 'Saif · UC-8 / UC-10' })).toHaveAttribute('href', './saif-demo.html');
    const frames = page.locator('figure');
    await expect(frames).toHaveCount(states.length);
    for (let i = 0; i < states.length; i++) {
      const frame = frames.nth(i);
      await expect(frame.locator('figcaption')).toContainText(`state: ${states[i]}`);
      await expect(frame.locator('nav li')).toHaveText(['Home', 'My Dogs', 'Settings']);
      expect(await frame.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await frame.screenshot({ path: `test-results/saif-wireframes/${file}-${states[i]}.png` });
    }
  });
}
