// Confirmar una entrada sin conexión (15 · R3; diseño de 15, § 4): la firma de la huella sobre el
// desafío que armó el celular, de un solo uso por su `id`, y el plazo medido con lo que sabe el
// servidor. Lo que no prueba nada (una huella que no existe, una firma que no verifica) no ocupa
// fila: se anota una vez por ventana. Si se confirma y es la sesión que la persona tiene ahora en el
// celular, se abre la sesión; si ya salió o entró otra, solo se anota.
import {
  type OfflineSignInBody,
  offlineChallenge,
  offlineSignInBody,
} from '@ferrebress/shared/contracts/offline-sign-in';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { Context } from 'hono';
import type { Kysely } from 'kysely';
import { fail } from '../../../platform/http.ts';
import type { User } from '../../users/index.ts';
import type { SignInContext } from '../context.ts';
import type { Passkey } from '../passkeys/data.ts';
import { verifyAssertion } from '../passkeys/webauthn.ts';
import { openSession, proofKeyOf } from '../sessions/open.ts';
import { signInSettings } from '../settings.ts';
import { type OfflineSignIn, type OfflineTables, offlineData } from './data.ts';
import { withOffline } from './flag.ts';
import { canWorkOffline, rejectionOf } from './rules.ts';

const { limits } = signInSettings;
type Data = ReturnType<typeof offlineData>;
type Confirming = { body: OfflineSignInBody; proof: Uint8Array; data: Data };

export function registerOfflineRoutes(ctx: SignInContext): Data {
  const data = offlineData(ctx.platform.db as Kysely<OfflineTables>);
  ctx.platform.http.post('/api/sign-in/offline', async (c) => {
    const body = offlineSignInBody.safeParse(await c.req.json());
    const proof = body.success ? proofKeyOf(body.data.proofPublicKey) : undefined;
    if (!body.success || !proof) return fail(c, 400, 'bad-request');
    const blocked = ctx.throttle(
      c,
      [`passkey:ip:${c.get('ipAddress')}`, `passkey:device:${c.get('deviceId')}`],
      limits.passkey,
    );
    return blocked ?? confirm(ctx, c, { body: body.data, proof, data });
  });
  return data;
}

const notConfirmed = (c: Context) => fail(c, 401, 'offline-not-confirmed');

async function confirm(ctx: SignInContext, c: Context, confirming: Confirming) {
  const { body, data } = confirming;
  const previous = await data.resultOf(body.id);
  if (previous) return repeated(ctx, c, body, previous);
  const response = body.response as unknown as AuthenticationResponseJSON;
  const passkey = await ctx.passkeys.findActive(response.id);
  const deviceId = c.get('deviceId') as string;
  if (!passkey || passkey.userId !== body.userId || passkey.deviceId !== deviceId) {
    recordOnce(ctx, c, { userId: body.userId, reason: 'unknown-passkey' });
    return notConfirmed(c);
  }
  const accountKey = `failed:passkey:${passkey.userId}`;
  if (ctx.platform.limiter.exceeded(accountKey, limits.failedPerAccount)) {
    return ctx.throttle(c, [accountKey], limits.failedPerAccount) as Response;
  }
  const challenge = await offlineChallenge({ ...body, deviceId, credentialId: response.id });
  const counter = await verifyAssertion(ctx, response, passkey, challenge);
  if (counter === undefined) {
    ctx.platform.limiter.hit(accountKey, limits.failedPerAccount);
    recordOnce(ctx, c, { userId: body.userId, reason: 'invalid-signature' });
    return notConfirmed(c);
  }
  await ctx.passkeys.markUsed(passkey.id, counter, ctx.platform.clock.now());
  return judge(ctx, c, confirming, passkey);
}

// La firma es de esa persona en ese celular: falta ver si sigue pudiendo y si llegó a tiempo.
async function judge(ctx: SignInContext, c: Context, confirming: Confirming, passkey: Passkey) {
  const { body, proof, data } = confirming;
  const now = ctx.platform.clock.now();
  const user = await ctx.users.findById(body.userId);
  await ctx.store.flush();
  const lastSession = await data.lastSessionOf(passkey.deviceId);
  const active = user?.active === true;
  const reason = rejectionOf({
    user: { active },
    allowed: active && canWorkOffline({ active }),
    lastSession,
    now,
    signedAt: new Date(body.signedAt),
    lastContactAt: new Date(body.lastContactAt),
  });
  const row: OfflineSignIn = {
    id: body.id,
    userId: body.userId,
    deviceId: passkey.deviceId,
    credentialId: passkey.id,
    signedAt: new Date(body.signedAt),
    receivedAt: now,
    lastContactAt: lastSession?.lastUsedAt ?? null,
    proofPublicKey: proof,
    result: reason ? 'rejected' : body.openSession ? 'confirmed' : 'ended',
    reason: reason ?? null,
    sessionId: null,
  };
  return finish(ctx, c, data, { row, user });
}

// Guarda la entrada y, si se confirmó como la sesión de ahora, la abre. Si otra confirmación de la
// misma entrada llegó a la vez y ganó, esta no deja nada.
async function finish(
  ctx: SignInContext,
  c: Context,
  data: Data,
  { row, user }: { row: OfflineSignIn; user: User | undefined },
) {
  const session =
    row.result === 'confirmed'
      ? await openSession(ctx, c, {
          userId: row.userId,
          proofPublicKey: row.proofPublicKey,
          data: { method: 'offline' },
        })
      : undefined;
  if (!(await data.insert({ ...row, sessionId: session?.id ?? null }))) {
    if (session) await ctx.store.close(session.id, 'sign-out');
    return fail(c, 409, 'offline-already-confirmed');
  }
  const type = row.result === 'rejected' ? 'sign-in.offline-rejected' : 'sign-in.offline-confirmed';
  ctx.record(c, type, { userId: row.userId, data: audited(row) });
  if (row.reason === 'deactivated') return fail(c, 401, 'not-authorized');
  if (row.result === 'rejected') return notConfirmed(c);
  if (!session) return c.json({ ended: true });
  // Con la sesión abierta, la persona existe.
  const person = await withOffline(ctx, c, ctx.person(user as User));
  return c.json({ person, sessionId: session.id, offerPasskey: false });
}

function repeated(ctx: SignInContext, c: Context, body: OfflineSignInBody, previous: string) {
  ctx.record(c, 'sign-in.offline-repeated', { userId: body.userId, data: { id: body.id } });
  return previous === 'rejected' ? notConfirmed(c) : fail(c, 409, 'offline-already-confirmed');
}

// Lo que va a la auditoría de una entrada sin conexión: la hora del celular, la de llegada y el
// último contacto con que se midió el plazo (revisión de seguridad, 6).
const audited = (row: OfflineSignIn) => ({
  id: row.id,
  result: row.result,
  ...(row.reason && { reason: row.reason }),
  signedAt: row.signedAt.toISOString(),
  lastContactAt: row.lastContactAt?.toISOString() ?? null,
});

// Lo que no prueba nada se anota una vez por ventana y por dirección, como los rechazos por límite.
function recordOnce(ctx: SignInContext, c: Context, fields: { userId: string; reason: string }) {
  const key = `audit:offline:${c.get('ipAddress')}`;
  if (!ctx.platform.limiter.hit(key, limits.throttledAudit).allowed) return;
  ctx.record(c, 'sign-in.offline-rejected', { data: { ...fields } });
}
