// Para probar las pantallas del vínculo: un vínculo de mentira con su estado, el ancho de la ventana y
// la aplicación de atrás que el diálogo deja inerte.
import { type Mock, vi } from 'vitest';
import { linkRuntime } from '../modules/device-link/current.ts';
import type { PairingState } from '../modules/device-link/machine/types.ts';
import type { Runtime } from '../modules/device-link/runtime.ts';
import { createStore, type Store } from '../platform/store.ts';

type FakeRuntime = { state: Store<PairingState>; dispatch: Mock; roundTripMs: Mock };

export function fakeRuntime(state: PairingState): FakeRuntime {
  const runtime = {
    state: createStore<PairingState>(state),
    dispatch: vi.fn(),
    roundTripMs: vi.fn(async () => 12),
  };
  linkRuntime.set(runtime as unknown as Runtime);
  return runtime;
}

export const narrow = (on: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query.includes('max-width'),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

// El diálogo deja inerte a la aplicación de atrás: la prueba dibuja adentro de ella.
export const inApp = () => {
  const app = document.getElementById('app') ?? document.createElement('div');
  app.id = 'app';
  document.body.append(app);
  return { container: app.appendChild(document.createElement('div')) };
};
