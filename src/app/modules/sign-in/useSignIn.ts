// Las formas de entrar desde la entrada: Google (R2.1) y la huella del celular (R2.3). Cada una crea
// antes la llave de prueba de la sesión nueva (ADR-015) y, si sale bien, deja la sesión guardada: la
// aplicación pasa sola al marco.
import type { SignInResponse } from '@ferrebress/shared/contracts/sign-in';
import type { ApiResult } from '../../platform/api.ts';
import { isPhone } from '../../platform/device.ts';
import { createProofKey } from '../../platform/proof-key.ts';
import { signInApi } from './api.ts';
import { type Notice, noticeOf } from './notice.ts';
import { offerPasskey, passkeyLinked, signedIn, wasOffered } from './session.ts';
import { signWithPasskey } from './webauthn.ts';

type Done = (result: ApiResult<SignInResponse>) => Notice | undefined;

// Lo común a todas: si entró, guarda la sesión; si no, devuelve el aviso que corresponde.
export const finish: Done = (result) => {
  if (!result.ok) return noticeOf(result);
  signedIn(result.data);
  return undefined;
};

export async function withGoogle(credential: string): Promise<Notice | undefined> {
  const result = await signInApi.google(credential, await createProofKey());
  if (result.ok && result.data.offerPasskey && isPhone() && !wasOffered()) offerPasskey.set(true);
  return finish(result);
}

// La huella de este celular.
export async function withPasskey(): Promise<Notice | undefined> {
  const options = await signInApi.passkeyOptions();
  if (!options.ok) return noticeOf(options);
  const response = await signWithPasskey(options.data);
  if (!response) return undefined;
  const result = await signInApi.passkey(response, await createProofKey());
  if (result.ok && isPhone()) passkeyLinked();
  return finish(result);
}
