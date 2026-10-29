// La sesión en la aplicación (diseño de 01, § 6 y § 7): quién entró, guardado en el dispositivo para
// mostrarlo sin conexión, y salir con o sin conexión. Sin conexión, la salida queda pendiente,
// firmada con la llave de prueba, y se manda antes que cualquier otro pedido apenas se pueda.
import {
  type Person,
  type SignInResponse,
  signOutMessage,
} from '@ferrebress/shared/contracts/sign-in';
import { forgetProofKey, signWithProofKey } from '../../platform/device/proof-key.ts';
import { forget, readStored, store } from '../../platform/device/storage.ts';
import { createStore } from '../../platform/store.ts';
import { discardWork, updateOnSignIn } from '../frame/index.ts';
import { signInApi } from './api.ts';
import { forgetGoogleChoice } from './google/messages.ts';
import { endEntry } from './offline/pending.ts';

const sessionKey = 'session';
const pendingKey = 'pending-sign-out';

// `offlineId`: la sesión se abrió sin conexión y el servidor todavía no la confirmó (15 · R2).
type Saved = { sessionId?: string; offlineId?: string; person: Person };
type Pending = { sessionId: string; signature: string; tappedAt: number };

export const person = createStore<Person | undefined>(readStored<Saved>(sessionKey)?.person);

export const signedIn = ({ person: who, sessionId }: SignInResponse) =>
  enter({ sessionId, person: who });

// Entró sin conexión con la huella (15 · R2.6): la sesión queda abierta hasta que el servidor la
// confirme.
export const signedInOffline = (who: Person, offlineId: string) =>
  enter({ offlineId, person: who });

export const offlineSession = (): string | undefined => readStored<Saved>(sessionKey)?.offlineId;

function enter(saved: Saved): void {
  const who = saved.person;
  // Después de una sesión vencida, si entra otra persona, lo que había a medio hacer se descarta;
  // si es la misma, sigue donde estaba (E25, E26).
  const before = person.get();
  if (before && before.userId !== who.userId) discardWork();
  store(sessionKey, saved);
  // Con una versión nueva, se actualiza ahora, antes de mostrar el marco (00 · R5.2); salvo que
  // esté por ofrecerse la huella, que se perdería al recargar: ahí avisa, como en uso.
  // Sin conexión, no: la versión nueva se aplica al volver.
  if (!saved.offlineId && !offerPasskey.get() && updateOnSignIn()) return;
  person.set(who);
}

// Recién vinculada su huella, la persona puede prender «Trabajar sin conexión» (15 · R1).
export function canGoOffline(): void {
  const saved = readStored<Saved>(sessionKey);
  if (!saved) return;
  const who = { ...saved.person, offline: true as const };
  store(sessionKey, { ...saved, person: who });
  person.set(who);
}

// Lo que dijo /api/start al abrir: quién tiene la sesión ahora, o nadie.
export function confirmed(who: Person | undefined): void {
  const saved = readStored<Saved>(sessionKey);
  if (!who) forget(sessionKey);
  else {
    // Con el servidor diciendo quién es, la sesión ya no es una sin confirmar.
    const { offlineId: _, ...kept } = saved?.person.userId === who.userId ? saved : { person: who };
    store(sessionKey, { ...kept, person: who });
  }
  person.set(who);
}

export async function signOut(): Promise<void> {
  const saved = readStored<Saved>(sessionKey);
  forget(sessionKey);
  person.set(undefined);
  forgetGoogleChoice();
  // Salir de una sesión sin conexión: la entrada se manda igual, para la auditoría (15 · E21).
  if (saved?.offlineId) endEntry(saved.offlineId);
  const tappedAt = Date.now();
  const result = await signInApi.signOut();
  if (!result.ok && result.error === 'offline' && saved?.sessionId) {
    const signature = await signWithProofKey(signOutMessage(saved.sessionId));
    if (signature) store(pendingKey, { sessionId: saved.sessionId, signature, tappedAt });
  }
  await forgetProofKey();
}

// Si hay una salida sin mandar: mientras haya, ningún otro pedido sale antes que ella.
export const hasPendingSignOut = (): boolean => readStored<Pending>(pendingKey) !== undefined;

// La salida que quedó sin mandar: va primero. Si sigue sin conexión, queda para la próxima.
export async function sendPendingSignOut(): Promise<void> {
  const pending = readStored<Pending>(pendingKey);
  if (!pending) return;
  const result = await signInApi.signOut(pending);
  if (result.ok || result.error !== 'offline') forget(pendingKey);
}

// Si este celular ya tiene una huella vinculada, y a quiénes ya se les ofreció en él (R2.2: una
// sola vez por persona, la primera vez que entra). Lo sabe el dispositivo; el servidor igual
// controla todo.
const passkeyKey = 'passkey';
const offeredKey = 'passkey-offered-to';

export const hasPasskey = () => readStored<boolean>(passkeyKey) === true;
export const passkeyLinked = () => store(passkeyKey, true);
const offeredTo = () => readStored<string[]>(offeredKey) ?? [];
export const wasOffered = (userId: string) => offeredTo().includes(userId);
export const offered = (userId: string) => {
  if (!wasOffered(userId)) store(offeredKey, [...offeredTo(), userId]);
};

// Se le ofrece la huella al llegar al marco (E06): lo muestra la aplicación encima del marco.
export const offerPasskey = createStore(false);
