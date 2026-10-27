// Las pruebas unitarias y su cobertura del 100 % (ADR-005, ADR-016).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tools/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    // PGlite tarda unos segundos en arrancar en una máquina lenta: una base por archivo.
    hookTimeout: 30_000,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['tools/**/*.ts', 'src/**/*.{ts,tsx}'],
      // Solo conectan lo que se prueba con el proceso (ADR-016): tools/cli.ts elige el control y
      // sale con su resultado; src/server/main.ts lee el .env y abre el puerto.
      exclude: ['tools/cli.ts', 'src/server/main.ts', '**/*.test.{ts,tsx}'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
