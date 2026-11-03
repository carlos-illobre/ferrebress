// matchMedia de mentira: cada prueba dice qué contesta a cada consulta (el ancho, reducir movimiento)
// y puede avisar que cambió, como al girar el celular.
import { vi } from 'vitest';

export function stubMedia(answer: (query: string) => boolean) {
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return answer(query);
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
  return {
    changed: () => {
      for (const listener of listeners) listener();
    },
  };
}

export const narrowOnly = (query: string) => query.includes('max-width');
