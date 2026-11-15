/** Saif Yusuff: UC-8 browser sign-in, six-shelter display, empty state, and sign-out. */
import { test, expect } from '@playwright/test';
async function signIn(page) {
  await page.getByLabel('Staff email').fill('jdoe@richardson.example');
  await page.getByLabel('Password', { exact: true }).fill('pw-rich');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
test('UC-8 protected dashboard, fixture values and sign-out', async ({ page }) => {
  await page.goto('/saif-demo.html?fixture=true');
  await expect(page.getByRole('table')).toHaveCount(0);
  await signIn(page);
  await expect(page.getByRole('row')).toHaveCount(7);
  await expect(page.getByRole('row').filter({ hasText: 'Richardson Animal Shelter' })).toContainText('Near Full');
  await expect(page.getByRole('row').filter({ hasText: 'Irving Animal Care Campus' })).toContainText('Outdated');
  await expect(page.locator('nav li')).toHaveText(['Home', 'My Dogs', 'Settings']);
  await page.screenshot({ path: 'test-results/saif-dashboard.png', fullPage: true });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});
test('UC-8 empty shelter list', async ({ page }) => {
  await page.goto('/saif-demo.html?fixture=true&scenario=empty');
  await signIn(page);
  await expect(page.getByRole('status')).toHaveText('No shelter data available.');
  await page.screenshot({ path: 'test-results/saif-dashboard-empty.png', fullPage: true });
});
