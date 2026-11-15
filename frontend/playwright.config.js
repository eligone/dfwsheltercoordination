import { defineConfig } from '@playwright/test';

// End-to-end tests (ADR-0009): start the Vite dev server and run in Chromium only.
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
});
