// Las capturas y el clip del manual (diseño del manual, § 3), en la imagen de Playwright de Docker
// (tests/screens/run.ts --config). Arma la aplicación sin el manual (MANUAL_MEDIA=pending): las
// capturas no lo muestran, y así un capítulo nuevo se puede armar antes de tener sus capturas.
import { defineConfig } from '@playwright/test';

const port = 4189;

export default defineConfig({
  testDir: '.',
  testMatch: ['capture.ts', 'clip.ts'],
  fullyParallel: true,
  retries: 0,
  timeout: 60_000,
  reporter: 'list',
  outputDir: '../../test-results/manual',
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: 'node ../screens/serve.ts',
    cwd: import.meta.dirname,
    env: { SCREENS_PORT: String(port), MANUAL_MEDIA: 'pending' },
    url: `http://localhost:${port}/api/start`,
    timeout: 90_000,
  },
});
