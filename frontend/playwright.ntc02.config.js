
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'ntc-02.spec.js',
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5180',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm.cmd run dev -- --host 127.0.0.1 --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180/hoang-demo.html',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
