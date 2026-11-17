/** Saif Yusuff: UC-10 browser acceptance; changes use the existing mock transfer service. */
import { test, expect } from '@playwright/test';
async function signIn(page, shelter = 'rich') {
  const credentials = shelter === 'dal' ? ['staff@dallas.example', 'pw-dal'] : ['jdoe@richardson.example', 'pw-rich'];
  await page.getByLabel('Staff email').fill(credentials[0]);
  await page.getByLabel('Password', { exact: true }).fill(credentials[1]);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
test('TC-10-01/02 list, Completed record and authorized details', async ({ page }) => {
  await page.goto('/saif-demo.html?fixture=true');
  await signIn(page);
  await page.getByRole('button', { name: 'View my dogs' }).click();
  await expect(page.getByRole('row')).toHaveCount(4);
  const expectations = [['Biscuit','Pending','Collin County Animal Services'], ['Pepper','Accepted','Plano Animal Services'], ['Luna','Completed','Irving Animal Care Campus']];
  for (const [dog, status, shelter] of expectations) {
    const row = page.getByRole('row').filter({ hasText: dog });
    await expect(row).toContainText(status); await expect(row).toContainText(shelter);
  }
  await expect(page.locator('nav li')).toHaveText(['Home', 'My Dogs', 'Settings']);
  await page.screenshot({ path: 'test-results/saif-transfers-list.png', fullPage: true });
  await page.getByRole('button', { name: 'View Biscuit transfer details' }).click();
  const details = page.getByRole('region', { name: 'Transfer details for Biscuit' });
  for (const value of ['2026-11-03 14:20', '(972) 555-0103', 'staff@collin.example']) await expect(details).toContainText(value);
  await page.screenshot({ path: 'test-results/saif-transfers-details.png', fullPage: true });
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(details).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page.getByRole('heading', { name: 'Shared Dashboard' })).toBeVisible();
});
test('TC-10-03 updates list and open details without a page reload', async ({ page }) => {
  await page.goto('/saif-demo.html?fixture=true&view=dogs');
  await signIn(page);
  await page.getByRole('button', { name: 'View Biscuit transfer details' }).click();
  await page.evaluate(async () => {
    window.uc10PageMarker = 'same document';
    // Fixture only: simulate the receiving staff acting elsewhere in this in-memory instance.
    const { app } = await import('/src/features/saif/demo.jsx');
    app.auth.signIn('staff@collin.example', 'pw-collin');
    try { app.transfers.accept('T-301'); }
    finally { app.auth.signIn('jdoe@richardson.example', 'pw-rich'); }
  });
  await expect(page.getByRole('row').filter({ hasText: 'Biscuit' })).toContainText('Accepted');
  await expect(page.getByRole('region')).toContainText('Accepted');
  expect(await page.evaluate(() => window.uc10PageMarker)).toBe('same document');
  await page.screenshot({ path: 'test-results/saif-transfers-live.png', fullPage: true });
});
test('TC-10-03/04 Dallas empty list and unauthorized detail refusal', async ({ page }) => {
  await page.goto('/saif-demo.html?fixture=true&view=dogs&request=T-301');
  await expect(page.getByRole('table')).toHaveCount(0);
  await signIn(page, 'dal');
  await expect(page.getByRole('status')).toHaveText('No active transfers.');
  await expect(page.getByRole('alert')).toHaveText('You can only update your own shelter.');
  for (const value of ['Biscuit', 'Pepper', 'Luna', 'staff@collin.example']) await expect(page.getByText(value, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/saif-transfers-denied.png', fullPage: true });
});
test('session loss removes open details and returns to sign-in', async ({ page }) => {
  await page.goto('/saif-demo.html?fixture=true&view=dogs&request=T-301');
  await signIn(page);
  await expect(page.getByRole('region')).toBeVisible();
  await page.evaluate(async () => {
    const { app } = await import('/src/features/saif/demo.jsx'); app.auth.signOut();
  });
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('region')).toHaveCount(0);
});
