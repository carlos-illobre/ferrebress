// Vincular la huella de un celular (R2.2, R2.3, R2.4; diseño de 01, § 5): solo desde un celular,
// con la sesión abierta y habiendo pasado por Google hace menos de 5 minutos. La huella tiene
// que ser de verdad (verificación), y un celular queda con una sola cuenta.
import { linkPasskeyBody } from '@ferrebress/shared/contracts/sign-in';
import {
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { decodeClientDataJSON } from '@simplewebauthn/server/helpers';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { User } from '../../users/index.ts';
import type { SignInContext } from '../context.ts';
import { isPhone } from '../device.ts';
import { requireSession } from '../sessions/require.ts';
import type { Session } from '../sessions/store.ts';
import { linkPasskeyWithinMs } from '../settings.ts';

const es256 = -7;

// Por qué esta sesión no puede vincular una huella ahora, o undefined si puede. Que el celular
// ya tenga otra cuenta lo dice la base al guardar.
function cannotLink(ctx: SignInContext, c: Context, session: Session): Response | undefined {
  if (!isPhone(c.req.header('User-Agent'), c.req.header('Sec-CH-UA-Mobile')))
    return fail(c, 400, 'bad-request');
  const recentGoogle =
    session.googleAt &&
    ctx.platform.clock.now().getTime() - session.googleAt.getTime() < linkPasskeyWithinMs;
  if (!recentGoogle) return fail(c, 403, 'not-authorized');
  return undefined;
}

export function registerLinkRoutes(ctx: SignInContext): void {
  const { http } = ctx.platform;

  http.post('/api/passkeys/options', async (c) => {
    const session = await requireSession(ctx, c);
    if (session instanceof Response) return session;
    const refused = cannotLink(ctx, c, session);
    if (refused) return refused;
    const challenge = ctx.challenges.issue(c.get('ipAddress'), {
      purpose: 'link',
      sessionId: session.id,
    });
    if (!challenge) return ctx.tooMany(c, 60_000);
    // Con la sesión abierta, la persona existe.
    const user = (await ctx.users.findById(session.userId)) as User;
    return c.json(
      await generateRegistrationOptions({
        rpName: 'Ferrebress',
        rpID: ctx.relyingParty.id,
        userName: user.email,
        userID: Buffer.from(session.userId.replaceAll('-', ''), 'hex'),
        challenge: Buffer.from(challenge, 'base64url'),
        attestationType: 'none',
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        supportedAlgorithmIDs: [es256],
      }),
    );
  });

  http.post('/api/passkeys', async (c) => {
    const session = await requireSession(ctx, c);
    if (session instanceof Response) return session;
    const body = linkPasskeyBody.safeParse(await c.req.json());
    if (!body.success) return fail(c, 400, 'bad-request');
    const refused = cannotLink(ctx, c, session);
    if (refused) return refused;
    return link(ctx, c, session, body.data.response as unknown as RegistrationResponseJSON);
  });
}

async function link(
  ctx: SignInContext,
  c: Context,
  session: Session,
  response: RegistrationResponseJSON,
) {
  const challenge = challengeOf(response);
  const issued = challenge && ctx.challenges.take(challenge);
  const verified =
    issued &&
    issued.purpose === 'link' &&
    issued.sessionId === session.id &&
    (await verify(ctx, response, challenge));
  if (!verified) {
    ctx.record(c, 'passkey.rejected', { userId: session.userId, data: { reason: 'invalid' } });
    return fail(c, 400, 'bad-request');
  }
  const now = ctx.platform.clock.now();
  await ctx.passkeys.revokeOwn(session.userId, session.deviceId, now);
  const { id, publicKey, counter } = verified.credential;
  const passkey = { id, userId: session.userId, deviceId: session.deviceId, publicKey, counter };
  if (!(await ctx.passkeys.insert(passkey, now))) {
    ctx.record(c, 'passkey.rejected', {
      userId: session.userId,
      data: { reason: 'phone-has-other-account' },
    });
    return fail(c, 409, 'phone-has-other-account');
  }
  ctx.record(c, 'passkey.linked', { userId: session.userId });
  return c.json({ ok: true });
}

function challengeOf(response: RegistrationResponseJSON): string | undefined {
  try {
    return decodeClientDataJSON(response.response.clientDataJSON).challenge;
  } catch {
    return undefined;
  }
}

async function verify(ctx: SignInContext, response: RegistrationResponseJSON, challenge: string) {
  try {
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ctx.relyingParty.origin,
      expectedRPID: ctx.relyingParty.id,
      requireUserVerification: true,
      supportedAlgorithmIDs: [es256],
    });
    // Sin verificar, la biblioteca no trae la credencial.
    return result.registrationInfo;
  } catch {
    return undefined;
  }
}
