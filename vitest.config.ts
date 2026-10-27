// Las pruebas unitarias y su cobertura del 100 % (ADR-005, ADR-016): el servidor, lo compartido y
// los controles corren en Node; la aplicación, en un navegador simulado (src/app/vitest.config.ts).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['tools/**/*.test.ts', 'src/server/**/*.test.ts', 'src/shared/**/*.test.ts'],
          // PGlite tarda unos segundos en arrancar en una máquina lenta: una base por archivo.
          hookTimeout: 30_000,
          testTimeout: 30_000,
        },
      },
      'src/app',
    ],
    coverage: {
      provider: 'v8',
      include: ['tools/**/*.ts', 'src/**/*.{ts,tsx}'],
      // Solo conectan lo que se prueba con el proceso o el navegador (ADR-016): tools/cli.ts elige
      // el control y sale con su resultado; src/server/main.ts lee el .env y abre el puerto;
      // src/app/main.tsx monta la aplicación en la página. Las configuraciones no son código.
      exclude: [
        'tools/cli.ts',
        'src/server/main.ts',
        'src/app/main.tsx',
        '**/*.config.ts',
        '**/*.test.{ts,tsx}',
      ],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
