// Las pruebas del paquete, en un navegador simulado.
import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'keyboard', environment: 'happy-dom', include: ['src/**/*.test.ts'] },
});
