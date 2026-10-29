// Las pruebas de captura de las pantallas aprobadas (Carlos: que ningún cambio las modifique sin
// que se vea). Corren en cada subida, en la imagen de Playwright de Docker, la misma con la que se
// sacaron las capturas de referencia, para que el dibujo de las letras no cambie de una máquina a
// otra (diseño de 01, § 12).
import { defineConfig } from '@playwright/test';

const port = 4187;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  retries: 0,
  timeout: 20_000,
  reporter: 'list',
  outputDir: '../../test-results/screens',
  snapshotPathTemplate: '{testDir}/references/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled', caret: 'hide' } },
  use: { baseURL: `http://localhost:${port}`, contextOptions: { reducedMotion: 'reduce' } },
  webServer: {
    command: 'node serve.ts',
    cwd: import.meta.dirname,
    // El manual de prueba: las capturas del manual no cambian cuando cambia el de verdad.
    env: { SCREENS_PORT: String(port), MANUAL_DIR: 'tests/manual/fixture' },
    url: `http://localhost:${port}/api/start`,
    timeout: 60_000,
  },
});
