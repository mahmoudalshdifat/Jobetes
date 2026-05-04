import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // Gemini live-call paths are not exercised offline; mock + prompt-builders are.
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/provider.ts'],
      thresholds: { lines: 75, functions: 75, branches: 70, statements: 75 },
    },
  },
});
