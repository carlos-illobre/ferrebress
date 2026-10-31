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
          // Una base PGlite por archivo, que arranca desde una ya creada al empezar (es lo que más
          // tarda); en una máquina lenta igual tarda unos segundos.
          globalSetup: ['src/server/testing/pglite-template.ts'],
          setupFiles: ['src/server/testing/setup.ts'],
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
      // src/app/main.tsx monta la aplicación en la página y src/app/google-button.ts, el marco del
      // botón de Google; src/app/sw.ts conecta los eventos del service worker con
      // platform/offline/worker.ts; src/server/testing/pglite-template.ts corre antes de las
      // pruebas, fuera de ellas. Las configuraciones no son código.
      exclude: [
        'tools/cli.ts',
        'src/server/main.ts',
        'src/server/first-administrator.ts',
        'src/app/main.tsx',
        'src/app/sw.ts',
        'src/app/google-button.ts',
        'src/server/testing/pglite-template.ts',
        '**/*.config.ts',
        '**/*.test.{ts,tsx}',
      ],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
