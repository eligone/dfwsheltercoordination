
/**
 * NTC-02: Capacity Update Performance
 * Requirement: NFR-2
 * Author: Hoang Pham
 *
 * Twenty runs, simulated 500 ms service delay.
 * Maximum permitted response time: 2000 ms.
 */

import { test, expect } from '@playwright/test';

test('NTC-02: 20 capacity updates within 2 seconds', async ({ page }) => {
  const times = [];

  for (let i = 0; i < 20; i++) {
    // Reload for a fresh Richardson shelter dataset.
    await page.goto('/hoang-demo.html?delayMs=500');

    const input = page.getByRole('textbox', {
      name: 'Available kennels'
    });

    // Alternate valid values to exercise the save workflow.
    const capacity = i % 2 === 0 ? 5 : 10;

    await input.fill(String(capacity));
    await page.getByRole('button', {
      name: 'Save changes'
    }).click();

    const dialog = page.getByRole('dialog', {
      name: 'Confirm capacity update'
    });

    await expect(dialog).toBeVisible();

    const start = performance.now();

    await dialog.getByRole('button', {
      name: 'Confirm'
    }).click();

    // Wait until the capacity shown in the card is updated.
    await expect(
      page.getByText(String(capacity), { exact: true }).first()
    ).toBeVisible();

    const elapsed = performance.now() - start;
    times.push(elapsed);

    console.log(
      `Run ${i + 1}: ${elapsed.toFixed(2)} ms`
    );

    expect(elapsed).toBeLessThanOrEqual(2000);
  }

  const max = Math.max(...times);
  const average = times.reduce((a, b) => a + b, 0) / times.length;

  console.log(`Maximum: ${max.toFixed(2)} ms`);
  console.log(`Average: ${average.toFixed(2)} ms`);
});
