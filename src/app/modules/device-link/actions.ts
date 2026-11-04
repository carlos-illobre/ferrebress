// Lo que la persona hace con el vínculo desde el detalle (R4.2, R5): desconectar, reconectar, probar
// el directo y desvincular. Lo demás lo hace la máquina sola.
import { api } from '../../platform/server/api.ts';
import type { Runtime } from './runtime.ts';

export function linkActions(runtime: Runtime) {
  return {
    pause: () => runtime.dispatch({ type: 'pause', from: 'here' }),
    resume: () => runtime.dispatch({ type: 'resume', from: 'here' }),
    probe: () => runtime.dispatch({ type: 'probe' }),
    // R5.3: termina para los dos; el otro se entera por su adiós o por `l=`.
    async unpair(): Promise<boolean> {
      const result = await api('/api/device-link/unpair', {});
      if (result.ok) runtime.dispatch({ type: 'serverSaid', pairing: null });
      return result.ok;
    },
  };
}

export type LinkActions = ReturnType<typeof linkActions>;
