// Aprobar la entrada de la computadora desde el celular (R2.5, R2.7; diseño de 01, § 5): desde la
// misma red y siempre con la huella, firmada para el desafío de esta reserva. Con la huella ya
// vinculada, una sola huella hace entrar también al celular si no tenía sesión (E16); sin huella
// vinculada, el celular que entró con Google la vincula en ese momento y esa huella aprueba
// (E16b). Entrar con Google no alcanza para aprobar.
import { type ApproveCodeBody, approveCodeBody } from '@ferrebress/shared/contracts/sign-in';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import type { Context } from 'hono';
import { fail } from '../../../../platform/http.ts';
import type { SignInContext } from '../../context.ts';
import {
  cannotLink,
  challengeOf,
  checkAssertion,
  savePasskey,
  verifyRegistration,
} from '../../passkeys/webauthn.ts';
import { openSession, proofKeyOf } from '../../sessions/open.ts';
import { optionalSession } from '../../sessions/require.ts';
import { signInSettings } from '../../settings.ts';
import type { Screen } from '../computer/screens.ts';
import { sameNetwork } from '../network.ts';

type Approval = { userId: string } | Response;

type ApproveBody = ApproveCodeBody;

// La pantalla reservada para este pedido, si sigue esperando, es de la misma red y la huella
// firmó su desafío; si no, la respuesta que corresponde, anotada en la auditoría.
function reservedScreen(
  ctx: SignInContext,
  c: Context,
  body: ApproveBody,
): Required<Screen> | Response {
  const rejected = (reason: string) =>
    ctx.record(c, 'sign-in.rejected', { data: { method: 'qr', reason } });
  const screen = ctx.screens.byReservation(body.secret);
  if (!screen) {
    rejected('code-expired');
    return fail(c, 410, 'code-expired');
  }
  if (!sameNetwork(screen.ipAddress, c.get('ipAddress'))) {
    ctx.record(c, 'code.rejected', { data: { reason: 'other-network' } });
    return fail(c, 409, 'other-network');
  }
  const reserved = screen as Required<Screen>;
  if (challengeOf(body.response as never) === reserved.reservation.challenge) return reserved;
  rejected('other-challenge');
  return fail(c, 401, 'not-authorized');
}

export function registerApproveRoute(ctx: SignInContext): void {
  ctx.platform.http.post('/api/sign-in/codes/approve', async (c) => {
    // Aprobar es un intento con la huella: el mismo límite (R2.9).
    const blocked = ctx.throttle(
      c,
      [`passkey:ip:${c.get('ipAddress')}`, `passkey:device:${c.get('deviceId')}`],
      signInSettings.limits.passkey,
    );
    if (blocked) return blocked;
    const body = approveCodeBody.safeParse(await c.req.json());
    if (!body.success) return fail(c, 400, 'bad-request');
    const screen = reservedScreen(ctx, c, body.data);
    if (screen instanceof Response) return screen;
    const { challenge } = screen.reservation;
    const approval =
      body.data.kind === 'registration'
        ? await withNewPasskey(ctx, c, body.data.response as never, challenge)
        : await withPasskey(
            ctx,
            c,
            body.data.response as never,
            challenge,
            body.data.proofPublicKey,
          );
    return approval instanceof Response ? approval : grant(ctx, c, screen, approval.userId);
  });
}

// La computadora recibe por su canal el permiso de un uso, que cambia por su sesión.
function grant(ctx: SignInContext, c: Context, screen: Screen, userId: string) {
  ctx.screens.release(screen);
  // Sin tope total y reemplazando al anterior de la pantalla, siempre hay permiso (context.ts).
  const permit = ctx.permits.issue(screen.id, { screenId: screen.id, userId }) as string;
  screen.notify?.({ type: 'approved', permit });
  ctx.record(c, 'code.approved', { userId });
  return c.json({ ok: true });
}

// E16b: el celular entró con Google y vincula la huella ahora; esa huella aprueba.
async function withNewPasskey(
  ctx: SignInContext,
  c: Context,
  response: RegistrationResponseJSON,
  challenge: string,
): Promise<Approval> {
  const session = await optionalSession(ctx, c);
  if (!session) return fail(c, 401, 'session-closed', { reason: 'unknown' });
  const refused = cannotLink(ctx, c, session);
  if (refused) return refused;
  const credential = await verifyRegistration(ctx, response, challenge);
  if (!credential) return fail(c, 401, 'not-authorized');
  return (await savePasskey(ctx, c, session, credential)) ?? { userId: session.userId };
}

// E13, E16: la huella ya vinculada. Si el celular no tenía sesión, entra también.
async function withPasskey(
  ctx: SignInContext,
  c: Context,
  response: AuthenticationResponseJSON,
  challenge: string,
  proofPublicKey: string | undefined,
): Promise<Approval> {
  const passkey = await ctx.passkeys.findActive(response.id);
  if (!passkey) return fail(c, 401, 'not-authorized');
  const user = await checkAssertion(ctx, c, passkey, response, challenge);
  if (user instanceof Response) return user;
  return (await optionalSession(ctx, c))
    ? { userId: user.id }
    : signInPhone(ctx, c, user.id, proofPublicKey);
}

async function signInPhone(
  ctx: SignInContext,
  c: Context,
  userId: string,
  proofPublicKey: string | undefined,
): Promise<Approval> {
  const key = proofKeyOf(proofPublicKey);
  if (!key) return fail(c, 400, 'bad-request');
  await openSession(ctx, c, {
    userId,
    proofPublicKey: key,
    data: { method: 'passkey', via: 'qr' },
  });
  return { userId };
}
