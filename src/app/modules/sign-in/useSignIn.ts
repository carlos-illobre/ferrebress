// Las formas de entrar desde la entrada: Google (R2.1) y la huella del celular (R2.2). Cada una crea
// antes la llave de prueba de la sesión nueva (ADR-015) y, si sale bien, deja la sesión guardada: la
// aplicación pasa sola al marco.
import type { SignInResponse } from '@ferrebress/shared/contracts/sign-in';
import { isPhone } from '../../platform/device/device.ts';
import { createProofKey } from '../../platform/device/proof-key.ts';
import type { ApiResult } from '../../platform/server/api.ts';
import { createStore } from '../../platform/store.ts';
import { waitSettings } from '../../platform/waiting.ts';
import { signInApi } from './api.ts';
import { type Notice, noticeOf } from './notice.ts';
import { signWithPasskey } from './passkeys/webauthn.ts';
import { offerPasskey, passkeyLinked, signedIn, wasOffered } from './session.ts';

type Done = (result: ApiResult<SignInResponse>) => Notice | undefined;

export type Way = 'google' | 'passkey' | 'phone';

// Cómo se está entrando, para la espera «Entrando» (R2.11). Empieza cuando quién es ya quedó
// confirmado (el pase de Google, la huella puesta o el permiso del celular) y dura hasta que el
// servidor abre la sesión; lo que tarda menos de 300 ms no la muestra (00 · R7.1).
export const entering = createStore<Way | undefined>(undefined);

export async function enteringWith<T>(way: Way, task: () => Promise<T>): Promise<T> {
  const shown = setTimeout(() => entering.set(way), waitSettings.markAfterMs);
  try {
    return await task();
  } finally {
    clearTimeout(shown);
    entering.set(undefined);
  }
}

// Lo común a todas: si entró, guarda la sesión; si no, devuelve el aviso que corresponde.
export const finish: Done = (result) => {
  if (!result.ok) return noticeOf(result);
  signedIn(result.data);
  return undefined;
};

// `offer`: si se ofrece la huella después (R2.2); no cuando entra para leer el código de una
// computadora, que ya pide vincularla en su hoja (R2.7).
export async function withGoogle(credential: string, offer = true): Promise<Notice | undefined> {
  const result = await enteringWith('google', async () =>
    signInApi.google(credential, await createProofKey()),
  );
  const firstTime = result.ok && !wasOffered(result.data.person.userId);
  if (offer && firstTime && result.data.offerPasskey && isPhone()) offerPasskey.set(true);
  return finish(result);
}

// La huella de este celular.
export async function withPasskey(): Promise<Notice | undefined> {
  const options = await signInApi.passkeyOptions();
  if (!options.ok) return noticeOf(options);
  const response = await signWithPasskey(options.data);
  if (!response) return undefined;
  const result = await enteringWith('passkey', async () =>
    signInApi.passkey(response, await createProofKey()),
  );
  if (result.ok && isPhone()) passkeyLinked();
  return finish(result);
}
