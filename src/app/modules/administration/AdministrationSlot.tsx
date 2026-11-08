// El lugar de Administración en el marco: baja el código de la pantalla recién al abrirla, así no pesa
// en el arranque. Sin red y sin poder bajarla, lo dice (Administración necesita conexión, R1.6).
import { useLazy } from '../../platform/lazy.ts';

// Su texto vive acá y no en texts.ts: este archivo va en el arranque y texts.ts no.
const offline = 'Sin conexión: Administración vuelve sola cuando vuelva la conexión.';

export function AdministrationSlot() {
  const screen = useLazy(() => import('./screens/Administration/Administration.tsx'));
  if (screen === 'offline')
    return (
      <p class="admin-unloaded" role="status">
        {offline}
      </p>
    );
  return screen ? <screen.Administration /> : null;
}
