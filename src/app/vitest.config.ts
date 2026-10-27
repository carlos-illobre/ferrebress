// Las pruebas de la aplicación: como las ve la persona, en un navegador simulado (ADR-005).
import preact from '@preact/preset-vite';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [preact()],
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify('app-test') },
  test: {
    name: 'app',
    environment: 'happy-dom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**'],
    setupFiles: ['testing/setup.ts'],
  },
});
