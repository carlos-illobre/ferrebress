import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tools/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['tools/**/*.ts', 'src/**/*.{ts,tsx}'],
      // tools/cli.ts solo elige el control y sale con su resultado (ADR-016).
      exclude: ['tools/cli.ts', '**/*.test.{ts,tsx}'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
