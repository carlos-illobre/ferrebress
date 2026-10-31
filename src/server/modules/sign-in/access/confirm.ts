// Volver a confirmar quién es, con Google o con la huella, sin salir ni abrir otra sesión (02 · R3.8;
// diseño de 02, § 13): autorizar y dar de alta lo piden si pasaron más de 5 minutos. Google y la
// huella tienen que ser de la misma persona de la sesión; si no, se rechaza y se anota.
import { confirmGoogleBody, confirmPasskeyBody } from '@ferrebress/shared/contracts/sign-in';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { Context } from 'hono';
import { byAddressAndDevice, bySchema, readBody } from '../../../platform/guards.ts';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { verifyGoogle } from '../google/verify.ts';
import { authenticationOptions, challengeOf, checkAssertion } from '../passkeys/webauthn.ts';
import { signInSettings } from '../settings.ts';
import { accessData } from './data.ts';

const { limits } = signInSettings;

export function registerConfirmRoutes(ctx: SignInContext) {
  registerConfirmGoogle(ctx);
  registerConfirmPasskey(ctx);
}

// Ya confirmó: la sesión se pone al día en la base y en la memoria.
async function confirmed(ctx: SignInContext, c: Context, field: 'googleAt' | 'passkeyAt') {
  const at = ctx.platform.clock.now();
  const column = field === 'googleAt' ? 'google_at' : 'passkey_at';
  await accessData(ctx.platform.db as never).confirm(sessionOf(c).id, column, at);
  ctx.store.confirmed(sessionOf(c).id, field, at);
  return c.json({ ok: true });
}

function refused(ctx: SignInContext, c: Context, method: string) {
  ctx.record(c, 'session.confirm-rejected', { userId: sessionOf(c).userId, data: { method } });
  return fail(c, 403, 'not-authorized');
}

// Con Google: un pase con un `nonce` que dio el servidor, de la misma cuenta de Google.
function registerConfirmGoogle(ctx: SignInContext) {
  const google = readBody(bySchema(confirmGoogleBody));
  const limit = ctx.limit(byAddressAndDevice('google'), limits.google);
  const { http, sessions } = ctx.platform;
  http.post('/api/session/confirm/google', sessions.require, google.step, limit, async (c) => {
    const identity = await verifyGoogle(google.of(c).credential, ctx.google);
    if (!identity || !ctx.nonces.take(identity.nonce)) return refused(ctx, c, 'google');
    const user = await ctx.users.findById(sessionOf(c).userId);
    return user?.googleSubject === identity.subject
      ? confirmed(ctx, c, 'googleAt')
      : refused(ctx, c, 'google');
  });
}

// Con la huella: un desafío dado para esta sesión, firmado con una huella de la misma persona.
function registerConfirmPasskey(ctx: SignInContext) {
  const { http, sessions } = ctx.platform;
  const limit = ctx.limit(byAddressAndDevice('passkey'), limits.passkey);
  http.post('/api/session/confirm/passkey/options', sessions.require, limit, async (c) => {
    const challenge = ctx.challenges.issue(c.get('ipAddress'), {
      purpose: 'confirm',
      sessionId: sessionOf(c).id,
    });
    if (!challenge) return ctx.tooMany(c, signInSettings.challenge.ttlMs);
    return c.json(await authenticationOptions(ctx, challenge));
  });
  const passkey = readBody(bySchema(confirmPasskeyBody));
  http.post('/api/session/confirm/passkey', sessions.require, passkey.step, limit, async (c) => {
    const response = passkey.of(c).response as unknown as AuthenticationResponseJSON;
    const challenge = challengeOf(response);
    const issued = challenge && ctx.challenges.take(challenge);
    const ours = issued && issued.purpose === 'confirm' && issued.sessionId === sessionOf(c).id;
    const found = ours && (await ctx.passkeys.findActive(response.id));
    if (!found || found.userId !== sessionOf(c).userId) return refused(ctx, c, 'passkey');
    const user = await checkAssertion(ctx, c, found, response, challenge as string);
    return user instanceof Response ? user : confirmed(ctx, c, 'passkeyAt');
  });
}
