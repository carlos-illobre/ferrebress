// Entrar con la huella del celular (R2.2; diseño de 01, § 5): el desafío es de un solo uso, la
// huella tiene que ser de verdad, el contador no puede retroceder y la persona tiene que seguir
// activa (E03). Los fallos de una huella que existe cuentan para esa cuenta y frenan solo la
// huella, no Google (R2.10).
import {
  type PasskeySignInBody,
  passkeySignInBody,
  type SignInResponse,
} from '@ferrebress/shared/contracts/sign-in';
import {
  type AuthenticationResponseJSON,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { decodeClientDataJSON } from '@simplewebauthn/server/helpers';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { deviceLabel } from '../device.ts';
import { writeSessionCookie } from '../sessions/cookie.ts';
import { isProofKey } from '../sessions/proof.ts';
import { signInSettings } from '../settings.ts';
import type { Passkey } from './data.ts';

const { limits } = signInSettings;

export function registerPasskeySignInRoutes(ctx: SignInContext): void {
  const { http } = ctx.platform;
  const throttle = (c: Context) =>
    ctx.throttle(
      c,
      [`passkey:device:${c.get('deviceId')}`, `passkey:ip:${c.get('ipAddress')}`],
      limits.passkey,
    );

  http.post('/api/sign-in/passkey/options', async (c) => {
    const blocked = throttle(c);
    if (blocked) return blocked;
    const challenge = ctx.challenges.issue(c.get('ipAddress'), { purpose: 'sign-in' });
    if (!challenge) return ctx.tooMany(c, signInSettings.challenge.ttlMs);
    return c.json(
      await generateAuthenticationOptions({
        rpID: ctx.relyingParty.id,
        challenge: Buffer.from(challenge, 'base64url'),
        userVerification: 'required',
      }),
    );
  });

  http.post('/api/sign-in/passkey', async (c) => {
    const body = passkeySignInBody.safeParse(await c.req.json());
    if (
      !body.success ||
      !c.get('deviceId') ||
      !isProofKey(Buffer.from(body.data.proofPublicKey, 'base64url'))
    ) {
      return fail(c, 400, 'bad-request');
    }
    return throttle(c) ?? signInWithPasskey(ctx, c, body.data);
  });
}

// La huella que firmó, si existe y el desafío es uno que dio el servidor para entrar.
async function findPasskey(ctx: SignInContext, response: AuthenticationResponseJSON) {
  try {
    const { challenge } = decodeClientDataJSON(response.response.clientDataJSON);
    const issued = ctx.challenges.take(challenge);
    const passkey =
      issued?.purpose === 'sign-in' ? await ctx.passkeys.findActive(response.id) : undefined;
    return passkey && { passkey, challenge };
  } catch {
    return undefined;
  }
}

async function signInWithPasskey(ctx: SignInContext, c: Context, body: PasskeySignInBody) {
  const response = body.response as unknown as AuthenticationResponseJSON;
  const found = await findPasskey(ctx, response);
  const reject = (reason: string, userId?: string) => {
    ctx.record(c, 'sign-in.rejected', {
      ...(userId && { userId }),
      data: { method: 'passkey', reason },
    });
    return fail(c, 401, 'not-authorized');
  };
  if (!found) return reject('unknown-passkey');
  const accountKey = `failed:passkey:${found.passkey.userId}`;
  if (ctx.platform.limiter.exceeded(accountKey, limits.failedPerAccount)) {
    return ctx.throttle(c, [accountKey], limits.failedPerAccount) as Response;
  }
  const counter = await verify(ctx, response, found.passkey, found.challenge);
  if (counter === undefined) {
    ctx.platform.limiter.hit(accountKey, limits.failedPerAccount);
    return reject('invalid-signature', found.passkey.userId);
  }
  await ctx.passkeys.markUsed(found.passkey.id, counter, ctx.platform.clock.now());
  const user = await ctx.users.findById(found.passkey.userId);
  if (!user?.active) return reject('inactive', found.passkey.userId);
  const { token, session } = await ctx.store.create({
    userId: user.id,
    deviceId: c.get('deviceId'),
    deviceLabel: deviceLabel(c.req.header('User-Agent')),
    ipAddress: c.get('ipAddress'),
    proofPublicKey: Buffer.from(body.proofPublicKey, 'base64url'),
    googleAt: null,
  });
  writeSessionCookie(c, token);
  ctx.record(c, 'sign-in.succeeded', { userId: user.id, data: { method: 'passkey' } });
  return c.json<SignInResponse>({
    person: ctx.person(user),
    sessionId: session.id,
    offerPasskey: false,
  });
}

// El contador nuevo, o undefined si la firma, el origen o la verificación no cierran.
async function verify(
  ctx: SignInContext,
  response: AuthenticationResponseJSON,
  passkey: Passkey,
  challenge: string,
) {
  try {
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ctx.relyingParty.origin,
      expectedRPID: ctx.relyingParty.id,
      requireUserVerification: true,
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
      },
    });
    return result.verified ? result.authenticationInfo.newCounter : undefined;
  } catch {
    return undefined;
  }
}
