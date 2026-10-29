// Mandar lo pendiente, en orden, antes que cualquier otro pedido (diseño de 15, § 5): la salida
// pendiente y después cada entrada sin conexión. Solo la última, si es la sesión que el celular
// tiene ahora, abre sesión en el servidor; así una entrada de una persona nunca pisa la sesión de
// otra. Si el servidor no la confirma, aparece la entrada encima de lo que había (R3.2).
import type { SignInResponse } from '@ferrebress/shared/contracts/sign-in';
import { type ApiResult, sessionClosed } from '../../../platform/server/api.ts';
import { signInApi } from '../api.ts';
import { confirmed, offlineSession, sendPendingSignOut, signedIn } from '../session.ts';
import { dropEntry, type Entry, entries } from './pending.ts';
import { disableOffline } from './permit.ts';

// «Probá después»: la entrada sigue pendiente.
const later = new Set(['offline', 'too-many-attempts', 'update-required', 'unexpected']);

export async function sendPending(): Promise<void> {
  await sendPendingSignOut();
  for (const entry of entries()) {
    const open = !entry.ended && offlineSession() === entry.id;
    const { ended: _, ...sent } = entry;
    const result = await signInApi.offline({ ...sent, openSession: open });
    if (!result.ok && later.has(result.error)) return;
    dropEntry(entry.id);
    if (open) await settle(result, entry);
  }
}

async function settle(result: ApiResult<SignInResponse | { ended: true }>, entry: Entry) {
  if (result.ok) return signedIn(result.data as SignInResponse);
  if (result.error === 'not-authorized') {
    disableOffline();
    return sessionClosed.set('not-authorized');
  }
  // Ya se había confirmado y la respuesta se perdió: si la cookie llegó, todo sigue.
  if (result.error === 'offline-already-confirmed') {
    const start = await signInApi.start();
    const who = start.ok ? start.data.person : undefined;
    if (who?.userId === entry.userId) return confirmed(who);
  }
  sessionClosed.set('offline-not-confirmed');
}
