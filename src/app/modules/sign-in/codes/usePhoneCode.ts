// El celular lee el código de una computadora (R2.5, R2.7; diseño de 01, § 5). Lo reserva y pide la
// huella, que es la confirmación: con ella entra la computadora y, si el celular no tenía sesión,
// también el celular. Al entrar, la hoja se cierra sin avisar (R2.11). Sin huella vinculada y sin
// sesión, primero entra con Google, y recién ahí lee el código, porque la huella nueva se crea con
// el desafío de esa computadora.
import type { Person, ReadCodeResponse } from '@ferrebress/shared/contracts/sign-in';
import { useEffect, useState } from 'preact/hooks';
import { createProofKey } from '../../../platform/device/proof-key.ts';
import type { ApiResult } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { type ApproveBody, signInApi } from '../api.ts';
import { type Notice, noticeOf } from '../notice.ts';
import { createPasskey, signWithPasskey } from '../passkeys/webauthn.ts';
import { confirmed, hasPasskey, passkeyLinked, person } from '../session.ts';

type Json = Record<string, unknown>;

export type PhoneCode =
  | { step: 'none' }
  // Sin huella, primero entra con Google (R2.7); `before` es quién estaba, para esperar el nuevo.
  | { step: 'sign-in-first'; code: string; before: Person | undefined }
  | { step: 'ask'; read: ReadCodeResponse }
  | { step: 'other-network' }
  | { step: 'expired' }
  | { step: 'no-passkey' }
  // Demasiados intentos o una cuenta que no puede entrar: lo mismo que dice la entrada (E03, R2.9).
  | { step: 'refused'; notice: Notice };

const none: PhoneCode = { step: 'none' };

// Lo que no salió: otra red, lo que diría la entrada, o que el código ya no sirve.
function failed(result: ApiResult<unknown>): PhoneCode {
  if (!result.ok && result.error === 'other-network') return { step: 'other-network' };
  const notice = noticeOf(result);
  return notice && notice.kind !== 'expired' ? { step: 'refused', notice } : { step: 'expired' };
}

// `who`: quién tiene la sesión ahora; si el servidor pide que primero entre con Google (con sesión
// y sin huella, R2.7), se espera a que entre de nuevo.
async function read(code: string, who: Person | undefined): Promise<PhoneCode> {
  const result = await signInApi.readCode(code);
  if (result.ok) return { step: 'ask', read: result.data };
  if (result.error === 'sign-in-first') return { step: 'sign-in-first', code, before: who };
  return result.error === 'offline' ? none : failed(result);
}

// La huella: la que ya está vinculada, o una nueva si el servidor mandó cómo crearla (R2.7).
async function approval(
  read: ReadCodeResponse,
  signedIn: boolean,
): Promise<ApproveBody | undefined> {
  if (read.registration) {
    const response = await createPasskey(read.registration as Json);
    return response && { secret: read.secret, kind: 'registration', response };
  }
  const response = await signWithPasskey(read.authentication as Json);
  if (!response) return undefined;
  return {
    secret: read.secret,
    kind: 'assertion',
    response,
    ...(!signedIn && { proofPublicKey: await createProofKey() }),
  };
}

async function approve(read: ReadCodeResponse, signedIn: boolean): Promise<PhoneCode> {
  const body = await approval(read, signedIn);
  if (!body) {
    await signInApi.cancel(read.secret);
    return { step: 'no-passkey' };
  }
  const result = await signInApi.approve(body);
  if (!result.ok) return failed(result);
  passkeyLinked();
  if (!signedIn) {
    const start = await signInApi.start();
    if (start.ok) confirmed(start.data.person);
  }
  return none;
}

export function usePhoneCode() {
  const [state, setState] = useState<PhoneCode>(none);
  const who = useStore(person);

  // Recién entró con Google: ahora sí lee el código que estaba esperando.
  useEffect(() => {
    if (state.step === 'sign-in-first' && who && who !== state.before)
      void read(state.code, who).then(setState);
  }, [who, state]);

  return {
    state,
    async scanned(code: string) {
      if (!who && !hasPasskey()) setState({ step: 'sign-in-first', code, before: who });
      else setState(await read(code, who));
    },
    async touch() {
      if (state.step === 'ask') setState(await approve(state.read, who !== undefined));
    },
    async notMe() {
      if (state.step === 'ask') await signInApi.cancel(state.read.secret);
      setState(none);
    },
    close: () => setState(none),
  };
}
