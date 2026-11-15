/**
 * anais-match-flow.spec.js - end-to-end test (Playwright, Chromium) for UC-5 then UC-7, plus the NFR-5 timing.
 * Purpose: in a real browser, find a match for Duke (large), check the ranked list appears within 5 s with a
 * 300 ms Mapping delay per shelter, pick the top shelter (Irving) and send the request; it must show Pending.
 * Run: PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test e2e/anais-match-flow.spec.js
 * Owner/creator: Anais Elizabeth Gonzalez. AI-assisted draft (Claude Code); reviewed and run by the owner.
 */
import { test, expect } from '@playwright/test';

test('TC-7-01 + NTC-06 (end-to-end): Find Match for Duke, results within 5 s, send to Irving, status Pending', async ({ page }) => {
  await page.goto('/anais-demo.html?delayMs=300');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home');
  await page.getByRole('button', { name: 'Find Match' }).click();

  // UC-5 steps 1-3: choose the dog; the size is filled from its record.
  await page.getByLabel('Dog', { exact: true }).selectOption('Duke (D-1051)');
  await expect(page.getByLabel('Dog size', { exact: true })).toHaveValue('large');

  // UC-5 steps 4-6 and NFR-5: ranked results within 5 seconds.
  const started = Date.now();
  await page.getByRole('button', { name: 'Find Match' }).click();
  const firstRow = page.getByRole('row').nth(1);
  await expect(firstRow).toContainText('Irving Animal Care Campus', { timeout: 5000 });
  const elapsed = Date.now() - started;
  console.log(`NTC-06 (browser): results shown after ${elapsed} ms`);
  expect(elapsed).toBeLessThanOrEqual(5000);
  await expect(page.getByRole('row')).toHaveCount(5); // header + Irving, Carrollton, Collin, Dallas
  await expect(page.getByText('Plano Animal Services')).toHaveCount(0);

  // UC-7: pick Irving, see its details, send the request.
  await firstRow.getByRole('button', { name: 'Request Transfer' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Request Dog Transfer');
  await expect(page.getByText('(972) 555-0105')).toBeVisible();
  await expect(page.getByLabel('Dog ID', { exact: true })).toHaveValue('D-1051');
  await page.getByLabel('Notes', { exact: true }).fill('Needs daily meds; 2-week supply included');
  await page.getByRole('button', { name: 'Send Request' }).click();

  await expect(page.getByText('Transfer request sent.')).toBeVisible();
  await expect(page.getByText('Pending', { exact: true })).toBeVisible();
  await expect(page.getByText(/Request T-303 for dog D-1051/)).toBeVisible();
});
