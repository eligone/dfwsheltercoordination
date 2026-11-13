import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

// Unit + component tests (ADR-0009). End-to-end tests in e2e/ are run by Playwright, not Vitest.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.test.{js,jsx}'],
      testTimeout: 30000, // NTC-04 and NTC-06 run 20 to 30 timed requests (about 10 s each)
      coverage: { provider: 'v8', include: ['src/services/**', 'src/features/**'], reporter: ['text', 'html'] },
    },
  }),
);
