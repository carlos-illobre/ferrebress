// Mandar lo pendiente, en orden, antes que cualquier otro pedido (diseño de 15, § 5): la salida
// pendiente y después cada entrada sin conexión. Solo la última, si es la sesión que el celular
// tiene ahora, pide abrir sesión, firmado con la llave de prueba (que no se puede copiar); así una
// entrada de una persona nunca pisa la sesión de otra. Si el servidor no la confirma, aparece la
// entrada encima de lo que había (R3.2), también después de recargar. Nunca corren dos envíos a la
// vez, y si el servidor pide esperar, se vuelve a probar solo.
import { offlineOpenMessage } from '@ferrebress/shared/contracts/offline-sign-in';
import type { SignInResponse } from '@ferrebress/shared/contracts/sign-in';
import { signWithProofKey } from '../../../platform/device/proof-key.ts';
import type { ApiResult } from '../../../platform/server/api.ts';
import { signInApi } from '../api.ts';
import {
  confirmed,
  offlineRejected,
  offlineSession,
  sendPendingSignOut,
  signedIn,
} from '../session.ts';
import { disableOffline } from './option.ts';
import { dropEntry, type Entry, entries } from './pending.ts';

// «Probá después»: la entrada sigue pendiente.
const later = new Set(['offline', 'too-many-attempts', 'update-required', 'unexpected']);
const retryEveryMs = 60_000;

let sending: Promise<void> | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;

export function sendPending(): Promise<void> {
  sending ??= send().finally(() => {
    sending = undefined;
  });
  return sending;
}

// Con red, el servidor pidió esperar (o falló): se vuelve a probar en un rato. Sin red, lo hace
// quien espera a que vuelva (useReconnect).
function retryLater(result: ApiResult<unknown>): void {
  if (result.ok || result.error === 'offline' || result.error === 'update-required') return;
  const seconds = Number(result.retryAfterSeconds);
  clearTimeout(retry);
  retry = setTimeout(() => void sendPending(), seconds > 0 ? seconds * 1000 : retryEveryMs);
}

async function send(): Promise<void> {
  await sendPendingSignOut();
  for (const entry of entries()) {
    const { ended: _, ...sent } = entry;
    const open = !entry.ended && offlineSession() === entry.id;
    const openSignature = open ? await signWithProofKey(offlineOpenMessage(entry.id)) : undefined;
    const result = await signInApi.offline({
      ...sent,
      openSession: !!openSignature,
      ...(openSignature && { openSignature }),
    });
    if (!result.ok && later.has(result.error)) return retryLater(result);
    dropEntry(entry.id);
    if (open) await settle(result, entry);
  }
}

async function settle(result: ApiResult<SignInResponse | { ended: true }>, entry: Entry) {
  if (result.ok && 'person' in result.data) return signedIn(result.data);
  if (!result.ok && result.error === 'not-authorized') {
    disableOffline();
    return offlineRejected('not-authorized');
  }
  // Ya se había confirmado y la respuesta se perdió: si la cookie llegó, todo sigue.
  if (!result.ok && result.error === 'offline-already-confirmed') {
    const start = await signInApi.start();
    const who = start.ok ? start.data.person : undefined;
    if (who?.userId === entry.userId) return confirmed(who);
  }
  offlineRejected('offline-not-confirmed');
}

// Lo que quedó de una prueba a otra.
export const stopRetrying = () => clearTimeout(retry);
