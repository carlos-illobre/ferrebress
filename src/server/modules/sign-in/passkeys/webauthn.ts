// Lo de la huella que usan entrar, vincular y aprobar un código QR (diseño de 01, § 5): armar los
// pedidos para el navegador, verificar sus respuestas y guardar una huella nueva. Siempre con
// verificación de verdad (la huella, no solo tocar) y ES256, la que usan los celulares.
import { product } from '@ferrebress/shared/contracts/product';
import {
  type AuthenticationResponseJSON,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { decodeClientDataJSON } from '@simplewebauthn/server/helpers';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { User } from '../../users/index.ts';
import type { SignInContext } from '../context.ts';
import { isPhone } from '../device.ts';
import type { Session } from '../sessions/store.ts';
import { linkPasskeyWithinMs, signInSettings } from '../settings.ts';
import type { Passkey } from './data.ts';

const es256 = -7;
type Credential = { id: string; publicKey: Uint8Array; counter: number };

// El desafío que firmó el navegador, o undefined si la respuesta no se puede leer.
export function challengeOf(response: {
  response: { clientDataJSON: string };
}): string | undefined {
  try {
    return decodeClientDataJSON(response.response.clientDataJSON).challenge;
  } catch {
    return undefined;
  }
}

// Por qué esta sesión no puede vincular una huella ahora, o undefined si puede (R2.2, R2.4). Que
// el celular ya tenga otra cuenta lo dice la base al guardar.
export function cannotLink(ctx: SignInContext, c: Context, session: Session): Response | undefined {
  if (!isPhone(c.req.header('User-Agent'), c.req.header('Sec-CH-UA-Mobile')))
    return fail(c, 400, 'bad-request');
  const since = session.googleAt && ctx.platform.clock.now().getTime() - session.googleAt.getTime();
  return since !== null && since < linkPasskeyWithinMs ? undefined : fail(c, 403, 'not-authorized');
}

export async function registrationOptions(ctx: SignInContext, session: Session, challenge: string) {
  // Con la sesión abierta, la persona existe.
  const user = (await ctx.users.findById(session.userId)) as User;
  return generateRegistrationOptions({
    rpName: product.name,
    rpID: ctx.relyingParty.id,
    userName: user.email,
    userID: Buffer.from(session.userId.replaceAll('-', ''), 'hex'),
    challenge: Buffer.from(challenge, 'base64url'),
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    supportedAlgorithmIDs: [es256],
  });
}

export const authenticationOptions = (ctx: SignInContext, challenge: string) =>
  generateAuthenticationOptions({
    rpID: ctx.relyingParty.id,
    challenge: Buffer.from(challenge, 'base64url'),
    userVerification: 'required',
  });

const expected = (ctx: SignInContext, challenge: string) => ({
  expectedChallenge: challenge,
  expectedOrigin: ctx.relyingParty.origin,
  expectedRPID: ctx.relyingParty.id,
  requireUserVerification: true,
});

// La credencial nueva, o undefined si no cierra.
export async function verifyRegistration(
  ctx: SignInContext,
  response: RegistrationResponseJSON,
  challenge: string,
): Promise<Credential | undefined> {
  try {
    const result = await verifyRegistrationResponse({
      response,
      ...expected(ctx, challenge),
      supportedAlgorithmIDs: [es256],
    });
    // Sin verificar, la biblioteca no trae la credencial.
    return result.registrationInfo?.credential;
  } catch {
    return undefined;
  }
}

// El contador nuevo, o undefined si la firma, el origen o la verificación no cierran.
export async function verifyAssertion(
  ctx: SignInContext,
  response: AuthenticationResponseJSON,
  passkey: Passkey,
  challenge: string,
): Promise<number | undefined> {
  try {
    const credential = {
      id: passkey.id,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: passkey.counter,
    };
    const result = await verifyAuthenticationResponse({
      response,
      ...expected(ctx, challenge),
      credential,
    });
    return result.verified ? result.authenticationInfo.newCounter : undefined;
  } catch {
    return undefined;
  }
}

// Guarda la huella nueva de este celular para la persona de la sesión. Volver a vincular
// reemplaza la anterior; si el celular ya tiene otra cuenta, responde el error (R2.3, E09).
export async function savePasskey(
  ctx: SignInContext,
  c: Context,
  session: Session,
  credential: Credential,
) {
  const now = ctx.platform.clock.now();
  await ctx.passkeys.revokeOwn(session.userId, session.deviceId);
  const passkey = { ...credential, userId: session.userId, deviceId: session.deviceId };
  // El celular se llama como su sesión: «Chrome en Android» (02 · R5.5).
  const saved = await ctx.passkeys.insert(passkey, now, session.deviceLabel);
  if (saved) ctx.phoneOwners.set(session.deviceId, session.userId);
  else ctx.phoneOwners.delete(session.deviceId);
  if (!saved) {
    ctx.record(c, 'passkey.rejected', {
      userId: session.userId,
      data: { reason: 'phone-has-other-account' },
    });
    return fail(c, 409, 'phone-has-other-account');
  }
  ctx.record(c, 'passkey.linked', { userId: session.userId });
  return undefined;
}

// La huella firmó este desafío y la persona sigue activa: devuelve la persona, o la respuesta
// que corresponde. Las firmas que no cierran cuentan para el límite de esa cuenta, que frena
// solo la huella (R2.10, E20c).
export async function checkAssertion(
  ctx: SignInContext,
  c: Context,
  passkey: Passkey,
  response: AuthenticationResponseJSON,
  challenge: string,
): Promise<User | Response> {
  const { failedPerAccount } = signInSettings.limits;
  const accountKey = `failed:passkey:${passkey.userId}`;
  const reject = (reason: string) => {
    ctx.record(c, 'sign-in.rejected', {
      userId: passkey.userId,
      data: { method: 'passkey', reason },
    });
    return fail(c, 401, 'not-authorized');
  };
  if (ctx.platform.limiter.exceeded(accountKey, failedPerAccount)) {
    return ctx.throttle(c, [accountKey], failedPerAccount) as Response;
  }
  const counter = await verifyAssertion(ctx, response, passkey, challenge);
  if (counter === undefined) {
    ctx.platform.limiter.hit(accountKey, failedPerAccount);
    return reject('invalid-signature');
  }
  await ctx.passkeys.markUsed(passkey.id, counter, ctx.platform.clock.now());
  const user = await ctx.users.findById(passkey.userId);
  return user?.active ? user : reject('inactive');
}
