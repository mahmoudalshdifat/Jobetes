import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // main.ts is the bot wiring (Telegram lifecycle) — exercised in E2E only.
      exclude: ['src/**/*.test.ts', 'src/main.ts', 'src/codespace.ts', 'src/stt.ts'],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
