// La sesión en la aplicación (diseño de 01, § 6 y § 7): quién entró, guardado en el dispositivo para
// mostrarlo sin conexión, y salir con o sin conexión. Sin conexión, la salida queda pendiente,
// firmada con la llave de prueba, y se manda antes que cualquier otro pedido apenas se pueda.
import type { Person, SignInResponse } from '@ferrebress/shared/contracts/sign-in';
import { forgetProofKey, signWithProofKey } from '../../platform/proof-key.ts';
import { forget, readStored, store } from '../../platform/storage.ts';
import { createStore } from '../../platform/store.ts';
import { discardWork } from '../frame/index.ts';
import { signInApi } from './api.ts';
import { forgetGoogleChoice } from './google/messages.ts';

const sessionKey = 'session';
const pendingKey = 'pending-sign-out';

type Saved = { sessionId?: string; person: Person };
type Pending = { sessionId: string; signature: string; tappedAt: number };

export const person = createStore<Person | undefined>(readStored<Saved>(sessionKey)?.person);

export function signedIn({ person: who, sessionId }: SignInResponse): void {
  // Después de una sesión vencida, si entra otra persona, lo que había a medio hacer se descarta;
  // si es la misma, sigue donde estaba (E25, E26).
  const before = person.get();
  if (before && before.userId !== who.userId) discardWork();
  store(sessionKey, { sessionId, person: who });
  person.set(who);
}

// Lo que dijo /api/start al abrir: quién tiene la sesión ahora, o nadie.
export function confirmed(who: Person | undefined): void {
  const saved = readStored<Saved>(sessionKey);
  if (!who) forget(sessionKey);
  else store(sessionKey, { ...(saved?.person.userId === who.userId && saved), person: who });
  person.set(who);
}

export async function signOut(): Promise<void> {
  const saved = readStored<Saved>(sessionKey);
  forget(sessionKey);
  person.set(undefined);
  forgetGoogleChoice();
  const tappedAt = Date.now();
  const result = await signInApi.signOut();
  if (!result.ok && result.error === 'offline' && saved?.sessionId) {
    const signature = await signWithProofKey(`sign-out:${saved.sessionId}`);
    if (signature) store(pendingKey, { sessionId: saved.sessionId, signature, tappedAt });
  }
  await forgetProofKey();
}

// La salida que quedó sin mandar: va primero. Si sigue sin conexión, queda para la próxima.
export async function sendPendingSignOut(): Promise<void> {
  const pending = readStored<Pending>(pendingKey);
  if (!pending) return;
  const result = await signInApi.signOut(pending);
  if (result.ok || result.error !== 'offline') forget(pendingKey);
}

// Si este celular ya tiene una huella vinculada y si ya se le ofreció (R2.2: una sola vez). Lo sabe
// el dispositivo; el servidor igual controla todo.
const passkeyKey = 'passkey';
const offeredKey = 'passkey-offered';

export const hasPasskey = () => readStored<boolean>(passkeyKey) === true;
export const passkeyLinked = () => store(passkeyKey, true);
export const wasOffered = () => readStored<boolean>(offeredKey) === true;
export const offered = () => store(offeredKey, true);

// Se le ofrece la huella al llegar al marco (E06): lo muestra la aplicación encima del marco.
export const offerPasskey = createStore(false);
