// Vincular la huella de un celular (R2.2, R2.3, R2.4; diseño de 01, § 5): solo desde un celular,
// con la sesión abierta y habiendo pasado por Google hace menos de 5 minutos.
import { linkPasskeyBody } from '@ferrebress/shared/contracts/sign-in';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { fail } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { requireSession } from '../sessions/require.ts';
import type { Session } from '../sessions/store.ts';
import { signInSettings } from '../settings.ts';
import {
  cannotLink,
  challengeOf,
  registrationOptions,
  savePasskey,
  verifyRegistration,
} from './webauthn.ts';

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
    if (!challenge) return ctx.tooMany(c, signInSettings.challenge.ttlMs);
    return c.json(await registrationOptions(ctx, session, challenge));
  });

  http.post('/api/passkeys', async (c) => {
    const session = await requireSession(ctx, c);
    if (session instanceof Response) return session;
    const body = linkPasskeyBody.safeParse(await c.req.json());
    if (!body.success) return fail(c, 400, 'bad-request');
    const refused = cannotLink(ctx, c, session);
    if (refused) return refused;
    const credential = await verifyLink(
      ctx,
      session,
      body.data.response as unknown as RegistrationResponseJSON,
    );
    if (!credential) {
      ctx.record(c, 'passkey.rejected', { userId: session.userId, data: { reason: 'invalid' } });
      return fail(c, 400, 'bad-request');
    }
    return (await savePasskey(ctx, c, session, credential)) ?? c.json({ ok: true });
  });
}

// La credencial nueva, si el desafío es uno que se dio para vincular en esta sesión y la
// respuesta cierra.
async function verifyLink(
  ctx: SignInContext,
  session: Session,
  response: RegistrationResponseJSON,
) {
  const challenge = challengeOf(response);
  const issued = challenge && ctx.challenges.take(challenge);
  const ours = issued && issued.purpose === 'link' && issued.sessionId === session.id;
  return ours ? verifyRegistration(ctx, response, challenge) : undefined;
}
