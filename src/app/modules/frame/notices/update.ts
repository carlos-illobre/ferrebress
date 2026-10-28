// La versión nueva (00 · R5). La aplicación se entera por las respuestas del servidor (R5.1). Recién
// abierta se actualiza sola (R5.2); en uso avisa y se puede cerrar hasta la próxima vez que se abra
// (R5.3, R5.4); en segundo plano, con nada a medio hacer, se actualiza sola (R5.6). Si el servidor
// ya no la entiende, se bloquea hasta actualizar (R5.5).
import { newVersion } from '../../../platform/server/api.ts';
import { createStore } from '../../../platform/store.ts';
import { showToast } from '../../../ui/toast/Toast.tsx';
import { texts } from '../texts.ts';
import { halfDone } from '../work.ts';

export const dismissed = createStore(false);

const reloadedKey = 'ferrebress.reloaded-for';
const updatedKey = 'ferrebress.updated';

// Volver a cargar trae la versión nueva. Se anota para decirlo al volver.
export function update(): void {
  try {
    sessionStorage.setItem(updatedKey, '1');
  } catch {
    // Sin sessionStorage solo no se dice «Versión nueva» al volver.
  }
  location.reload();
}

// Al volver de actualizar, lo dice una vez.
export function announceUpdate(): void {
  try {
    if (sessionStorage.getItem(updatedKey) !== '1') return;
    sessionStorage.removeItem(updatedKey);
    showToast(texts.update.done, 'check');
  } catch {
    // Sin sessionStorage no se dice: la aplicación igual está actualizada.
  }
}

// Recién abierta: si el servidor tiene otra versión, se actualiza antes de que se use. Una sola vez
// por versión del servidor, para no recargar sin fin si la página que llega sigue siendo la vieja.
export function updateOnOpen(serverVersion: string): boolean {
  if (!newVersion.get()) return false;
  try {
    if (sessionStorage.getItem(reloadedKey) === serverVersion) return false;
    sessionStorage.setItem(reloadedKey, serverVersion);
  } catch {
    return false;
  }
  location.reload();
  return true;
}

// En segundo plano, con una versión nueva esperando y nada a medio hacer, se actualiza sola.
export function watchBackground(): () => void {
  const hidden = () => {
    if (document.visibilityState === 'hidden' && newVersion.get() && !halfDone()) update();
  };
  document.addEventListener('visibilitychange', hidden);
  return () => document.removeEventListener('visibilitychange', hidden);
}
