// Las pruebas de punta a punta (diseño de 01, § 12): pocas, en paralelo, sobre un solo ambiente
// que levanta stack/start.ts. Sin reintentos: una que falla se mira, no se repite hasta que pase.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  globalSetup: './stack/start.ts',
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  reporter: 'list',
  outputDir: '../../test-results',
  use: { screenshot: 'only-on-failure', trace: 'off' },
});
