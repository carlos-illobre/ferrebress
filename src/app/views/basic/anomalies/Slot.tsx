// El lugar de Anomalías en el marco (06 · R9.2): baja su código recién al abrirla, así no pesa en el
// arranque. Sin red y sin poder bajarla, lo dice (necesita conexión, R9.6).
import { useLazy } from '../../../platform/view/lazy.ts';

const offline = 'Sin conexión: Anomalías vuelve sola cuando vuelva la conexión.';

export function AnomaliesSlot() {
  const screen = useLazy(() => import('./Anomalies.tsx'));
  if (screen === 'offline')
    return (
      <p class="admin-unloaded" role="status">
        {offline}
      </p>
    );
  return screen ? <screen.Anomalies /> : null;
}
