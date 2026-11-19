import { expect, test } from '@playwright/test';

async function signIn(page, email, password) {
  await page.getByLabel('Staff email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Shared Dashboard' })).toBeVisible();
}

const signInRichardson = (page) => signIn(page, 'jdoe@richardson.example', 'pw-rich');

test('capacity, matching, alert handoff and transfer status share one browser session', async ({ page }) => {
  await page.goto('/app.html');
  await signInRichardson(page);
  await page.getByRole('button', { name: 'Update Capacity' }).click();
  await page.getByRole('textbox', { name: 'Available kennels' }).fill('0');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Capacity updated', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Find Match', exact: true }).click();
  await expect(page.getByText(/Your shelter is marked Full/)).toBeVisible();
  await page.getByLabel('Dog', { exact: true }).selectOption('Duke (D-1051)');
  await page.getByLabel('Dog size', { exact: true }).selectOption('large');
  await page.getByRole('button', { name: 'Find Match', exact: true }).click();
  await page.getByRole('row', { name: /Collin County/ }).getByRole('button', { name: 'Request Transfer' }).click();
  await page.getByRole('button', { name: 'Send Request' }).click();
  await expect(page.getByText('Transfer request sent.')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await signIn(page, 'staff@collin.example', 'pw-collin');
  await page.getByRole('button', { name: /^Alerts/ }).click();
  await page.getByRole('button', { name: 'View Transfer request for Duke (D-1051)' }).click();
  await page.getByRole('button', { name: 'Open transfer request' }).click();
  await expect(page.getByRole('heading', { name: 'Request T-303' })).toBeVisible();
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await expect(page.getByText('Transfer request accepted.')).toBeVisible();
  await expect(page.getByTestId('my-available')).toHaveText('39');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await signInRichardson(page);
  await expect(page.getByRole('row', { name: /Richardson Animal Shelter/ })).toContainText('Full');
  await page.getByRole('button', { name: 'My Dogs', exact: true }).click();
  await expect(page.getByRole('row', { name: /Duke/ })).toContainText('Accepted');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Capacity History' }).click();
  await page.getByLabel('Select a time range').selectOption({ label: 'Past month' });
  await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toHaveText('0');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  expect((await downloading).suggestedFilename()).toMatch(/\.pdf$/);
});

test('dashboard controls, shelter details and notification preferences are reachable', async ({ page }) => {
  await page.goto('/app.html');
  await signInRichardson(page);
  await page.getByLabel('Search shelters').fill('McKinney');
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByLabel('Capacity status').selectOption('Full');
  await expect(page.getByText('No matching shelters found.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByLabel('Sort by').selectOption('Available kennels (most first)');
  await expect(page.getByRole('row').nth(1)).toContainText('Irving');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByText('Dashboard refreshed.')).toBeVisible();
  await page.getByRole('button', { name: 'Collin County Animal Services' }).click();
  await expect(page.getByText('40 of 110')).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Notification Preferences' }).click();
  await expect(page.getByText('Notification Preferences', { exact: true })).toBeVisible();
});
