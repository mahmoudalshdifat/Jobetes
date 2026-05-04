import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/main.tsx',
          'src/global.d.ts',
          'src/test-setup.ts',
          'src/observability.ts',
        ],
        // Web's behavioral coverage comes primarily from Playwright E2E +
        // axe a11y tests; jsdom unit-tests cover the App-level smoke and
        // a11y. Component-level coverage is intentionally low here to avoid
        // duplicating what E2E already verifies in a real browser.
        thresholds: { lines: 25, functions: 25, branches: 25, statements: 25 },
      },
    },
  }),
);
