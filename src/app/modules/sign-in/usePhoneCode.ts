// El celular lee el código de una computadora (R2.5, R2.7; diseño de 01, § 5). Lo reserva y pide la
// huella, que es la confirmación: con ella entra la computadora y, si el celular no tenía sesión,
// también el celular. Sin huella vinculada y sin sesión, primero entra con Google, y recién ahí lee
// el código, porque la huella nueva se crea con el desafío de esa computadora.
import type { ReadCodeResponse } from '@ferrebress/shared/contracts/sign-in';
import { useEffect, useState } from 'preact/hooks';
import { createProofKey } from '../../platform/proof-key.ts';
import { useStore } from '../../platform/store.ts';
import { type ApproveBody, signInApi } from './api.ts';
import { confirmed, hasPasskey, passkeyLinked, person } from './session.ts';
import { createPasskey, signWithPasskey } from './webauthn.ts';

type Json = Record<string, unknown>;

export type PhoneCode =
  | { step: 'none' }
  | { step: 'sign-in-first'; code: string }
  | { step: 'ask'; read: ReadCodeResponse }
  | { step: 'done'; label: string }
  | { step: 'other-network' }
  | { step: 'expired' }
  | { step: 'no-passkey' };

const none: PhoneCode = { step: 'none' };

async function read(code: string): Promise<PhoneCode> {
  const result = await signInApi.readCode(code);
  if (result.ok) return { step: 'ask', read: result.data };
  if (result.error === 'other-network') return { step: 'other-network' };
  return result.error === 'offline' ? none : { step: 'expired' };
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
  if (!result.ok)
    return result.error === 'other-network' ? { step: 'other-network' } : { step: 'expired' };
  passkeyLinked();
  if (!signedIn) {
    const start = await signInApi.start();
    if (start.ok) confirmed(start.data.person);
  }
  return { step: 'done', label: read.computer.label };
}

export function usePhoneCode() {
  const [state, setState] = useState<PhoneCode>(none);
  const who = useStore(person);

  // Recién entró con Google: ahora sí lee el código que estaba esperando.
  useEffect(() => {
    if (state.step === 'sign-in-first' && who) void read(state.code).then(setState);
  }, [who, state]);

  return {
    state,
    async scanned(code: string) {
      if (!who && !hasPasskey()) setState({ step: 'sign-in-first', code });
      else setState(await read(code));
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
