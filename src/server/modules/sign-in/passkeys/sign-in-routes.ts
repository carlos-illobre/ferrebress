// Entrar con la huella del celular (R2.2; diseño de 01, § 5): el desafío es de un solo uso, la
// huella tiene que ser de verdad, el contador no puede retroceder y la persona tiene que seguir
// activa (E03). Los fallos de una huella que existe cuentan para esa cuenta y frenan solo la
// huella, no Google (R2.10).
import {
  type PasskeySignInBody,
  passkeySignInBody,
  type SignInResponse,
} from '@ferrebress/shared/contracts/sign-in';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { canWorkOffline } from '../offline/rules.ts';
import { openSession, proofKeyOf } from '../sessions/open.ts';
import { signInSettings } from '../settings.ts';
import { authenticationOptions, challengeOf, checkAssertion } from './webauthn.ts';

const { limits } = signInSettings;

export function registerPasskeySignInRoutes(ctx: SignInContext): void {
  const { http } = ctx.platform;
  const throttle = (c: Context) =>
    ctx.throttle(
      c,
      [`passkey:ip:${c.get('ipAddress')}`, `passkey:device:${c.get('deviceId')}`],
      limits.passkey,
    );

  http.post('/api/sign-in/passkey/options', async (c) => {
    const blocked = throttle(c);
    if (blocked) return blocked;
    const challenge = ctx.challenges.issue(c.get('ipAddress'), { purpose: 'sign-in' });
    if (!challenge) return ctx.tooMany(c, signInSettings.challenge.ttlMs);
    return c.json(await authenticationOptions(ctx, challenge));
  });

  http.post('/api/sign-in/passkey', async (c) => {
    const body = passkeySignInBody.safeParse(await c.req.json());
    const proofPublicKey = body.success ? proofKeyOf(body.data.proofPublicKey) : undefined;
    if (!body.success || !proofPublicKey) return fail(c, 400, 'bad-request');
    return throttle(c) ?? signInWithPasskey(ctx, c, body.data, proofPublicKey);
  });
}

// La huella que firmó, si existe y el desafío es uno que dio el servidor para entrar.
async function findPasskey(ctx: SignInContext, response: AuthenticationResponseJSON) {
  const challenge = challengeOf(response);
  const issued = challenge && ctx.challenges.take(challenge);
  const passkey =
    issued && issued.purpose === 'sign-in' && (await ctx.passkeys.findActive(response.id));
  return passkey ? { passkey, challenge: challenge as string } : undefined;
}

async function signInWithPasskey(
  ctx: SignInContext,
  c: Context,
  body: PasskeySignInBody,
  proofPublicKey: Uint8Array,
) {
  const response = body.response as unknown as AuthenticationResponseJSON;
  const found = await findPasskey(ctx, response);
  if (!found) {
    ctx.record(c, 'sign-in.rejected', { data: { method: 'passkey', reason: 'unknown-passkey' } });
    return fail(c, 401, 'not-authorized');
  }
  const user = await checkAssertion(ctx, c, found.passkey, response, found.challenge);
  if (user instanceof Response) return user;
  const session = await openSession(ctx, c, {
    userId: user.id,
    proofPublicKey,
    data: { method: 'passkey' },
  });
  return c.json<SignInResponse>({
    // Entró con su propia huella en este celular (15 · R1).
    person: {
      ...ctx.person(user),
      ...(found.passkey.deviceId === c.get('deviceId') &&
        canWorkOffline(user) && { offline: true }),
    },
    sessionId: session.id,
    offerPasskey: false,
  });
}
