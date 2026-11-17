// Las pruebas de rendimiento (diseño de 08, § 11 y § 12): aparte de las rápidas (ADR-005), porque
// tardan y miden tiempos de la máquina. Corren con `pnpm perf`, contra la misma base de pruebas.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/server/**/*.perf.ts'],
    globalSetup: ['src/server/testing/pglite-template.ts'],
    setupFiles: ['src/server/testing/setup.ts'],
    hookTimeout: 120_000,
    testTimeout: 300_000,
  },
});
