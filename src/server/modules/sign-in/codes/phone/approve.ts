// Aprobar la entrada de la computadora desde el celular (R2.5, R2.7; diseño de 01, § 5): desde la
// misma red y siempre con la huella, firmada para el desafío de esta reserva. Con la huella ya
// vinculada, una sola huella hace entrar también al celular si no tenía sesión (E16); sin huella
// vinculada, el celular que entró con Google la vincula en ese momento y esa huella aprueba
// (E16b). Entrar con Google no alcanza para aprobar.
import { type ApproveCodeBody, approveCodeBody } from '@ferrebress/shared/contracts/sign-in';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import type { Context } from 'hono';
import { byAddressAndDevice, bySchema, readBody } from '../../../../platform/guards.ts';
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

// Quién aprobó, y con qué huella.
type Approval = { userId: string; passkeyId: string } | Response;

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
  const body = readBody(bySchema(approveCodeBody));
  ctx.platform.http.post(
    '/api/sign-in/codes/approve',
    // Aprobar es un intento con la huella: el mismo límite (R2.9).
    ctx.limit(byAddressAndDevice('passkey'), signInSettings.limits.passkey),
    body.step,
    (c) => approve(ctx, c, body.of(c)),
  );
}

async function approve(ctx: SignInContext, c: Context, body: ApproveBody) {
  const screen = reservedScreen(ctx, c, body);
  if (screen instanceof Response) return screen;
  const { challenge } = screen.reservation;
  const approval =
    body.kind === 'registration'
      ? await withNewPasskey(ctx, c, body.response as never, challenge)
      : await withPasskey(ctx, c, body.response as never, challenge, body.proofPublicKey);
  return approval instanceof Response ? approval : grant(ctx, c, screen, approval);
}

// La computadora recibe por su canal el permiso de un uso, que cambia por su sesión.
function grant(
  ctx: SignInContext,
  c: Context,
  screen: Screen,
  { userId, passkeyId }: { userId: string; passkeyId: string },
) {
  ctx.screens.release(screen);
  // Sin tope total y reemplazando al anterior de la pantalla, siempre hay permiso (context.ts).
  const approval = { screenId: screen.id, userId, approvedBy: passkeyId };
  const permit = ctx.permits.issue(screen.id, approval) as string;
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
  return (
    (await savePasskey(ctx, c, session, credential)) ?? {
      userId: session.userId,
      passkeyId: credential.id,
    }
  );
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
    ? { userId: user.id, passkeyId: passkey.id }
    : signInPhone(ctx, c, { userId: user.id, passkeyId: passkey.id }, proofPublicKey);
}

async function signInPhone(
  ctx: SignInContext,
  c: Context,
  { userId, passkeyId }: { userId: string; passkeyId: string },
  proofPublicKey: string | undefined,
): Promise<Approval> {
  const key = proofKeyOf(proofPublicKey);
  if (!key) return fail(c, 400, 'bad-request');
  await openSession(ctx, c, {
    userId,
    proofPublicKey: key,
    passkeyId,
    data: { method: 'passkey', via: 'qr' },
  });
  return { userId, passkeyId };
}
