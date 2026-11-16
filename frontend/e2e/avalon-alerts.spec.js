/**
 * avalon-alerts.spec.js - end-to-end tests (Playwright, Chromium) for UC-14 and UC-15.
 * Purpose: in a real browser, open the inbox from Home, open alert A-90 (count drops to 1), then in Notification
 * Preferences add a contact, reject a bad email, save, and see a failed delivery. Also the empty inbox for Dallas.
 * Run: PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test e2e/avalon-alerts.spec.js
 * Owner/creator: Avalon Austin. AI-assisted draft; the owner reviews and runs it.
 */
import { test, expect } from '@playwright/test';

test('TC-14-01 + TC-14-02 (end-to-end): inbox shows 3 alerts and 2 unread; opening A-90 shows Collin\'s contact and leaves 1 unread', async ({ page }) => {
  await page.goto('/avalon-demo.html');
  await page.getByRole('button', { name: 'Open alerts' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alerts');
  await expect(page.getByRole('list', { name: 'Alert list' }).getByRole('listitem')).toHaveCount(3);
  await expect(page.getByText('2 unread')).toBeVisible();

  await page.getByRole('button', { name: 'View Match found for Biscuit (D-1042)' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('(972) 555-0103 · staff@collin.example')).toBeVisible();
  await expect(dialog.getByText('Request T-301: Pending')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('1 unread')).toBeVisible();
});

test('TC-14-04 (end-to-end): Dallas staff see the empty inbox', async ({ page }) => {
  await page.goto('/avalon-demo.html?user=dal');
  await page.getByRole('button', { name: 'Open alerts' }).click();
  await expect(page.getByText('No notifications')).toBeVisible();
  await expect(page.getByText("You're all caught up. New alerts will appear here.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
});

test('TC-15-01 + TC-15-02 (end-to-end): bad email refused, valid email added and saved', async ({ page }) => {
  await page.goto('/avalon-demo.html');
  await page.getByRole('button', { name: 'Notification Preferences' }).click();
  await page.getByRole('button', { name: 'Add phone number or email' }).click();
  await page.getByLabel(/Email address/).fill('intake@richardson');
  await page.getByRole('button', { name: 'Add contact' }).click();
  await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
  await page.getByLabel(/Email address/).fill('intake2@richardson.example');
  await page.getByRole('button', { name: 'Add contact' }).click();
    await expect(page.getByRole('cell', { name: 'intake2@richardson.example', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Preferences saved.')).toBeVisible();
});

test('TC-15-05 (end-to-end): a failed delivery shows the status and the retry note', async ({ page }) => {
  await page.goto('/avalon-demo.html?scenario=failed-delivery');
  await page.getByRole('button', { name: 'Notification Preferences' }).click();
  await expect(page.getByText('Delivery failed')).toBeVisible();
  await expect(page.getByText('Retried 3 times. Failure logged.')).toBeVisible();
});
