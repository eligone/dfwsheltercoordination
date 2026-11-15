/** Saif Yusuff: isolated UC-8 browser server; never reuse a different app on port 5173. */
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: 'saif-dashboard.spec.js',
  use: { baseURL: 'http://127.0.0.1:5188' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5188 --strictPort',
    url: 'http://127.0.0.1:5188/saif-demo.html',
    reuseExistingServer: false,
  },
});
