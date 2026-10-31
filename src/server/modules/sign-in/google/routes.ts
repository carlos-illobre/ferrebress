// El primer pedido al abrir la aplicación y la entrada con Google (diseño de 01, § 4 y § 5).
import {
  googleSignInBody,
  type NonceResponse,
  type SignInResponse,
  type StartResponse,
} from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { byAddress, byAddressAndDevice, readBody } from '../../../platform/guards.ts';
import { fail, Refused } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { isPhone } from '../device.ts';
import { ownerOf, withOffline } from '../offline/phone-owner.ts';
import { canWorkOffline } from '../offline/rules.ts';
import { readSessionCookie } from '../sessions/cookie.ts';
import { openSession, withProofKey } from '../sessions/open.ts';
import { signInSettings } from '../settings.ts';
import { verifyGoogle } from './verify.ts';

const { limits } = signInSettings;

// Quién tiene la sesión de la cookie, si tiene, con `offline` si puede (15 · R1).
async function personOf(ctx: SignInContext, c: Context) {
  const token = readSessionCookie(c);
  const resolved = token ? await ctx.store.resolve(token) : undefined;
  if (resolved?.kind !== 'open') return undefined;
  const { userId, deviceId } = resolved.session;
  return withOffline(ctx, c, { person: await ctx.people.of(userId), deviceId });
}

export function registerGoogleRoutes(ctx: SignInContext): void {
  const { http, config } = ctx.platform;

  http.get('/api/start', ctx.limit(byAddress('start'), limits.start), async (c) => {
    const base = {
      environment: config.ENVIRONMENT,
      version: config.VERSION,
      googleClientId: config.GOOGLE_CLIENT_ID,
      googleScriptUrl: config.GOOGLE_SCRIPT_URL,
    };
    const who = await personOf(ctx, c);
    // El nonce va también con sesión: un celular sin huella vuelve a entrar con Google para
    // vincularla y hacer entrar a una computadora (R2.7).
    const googleNonce = ctx.nonces.issue(c.get('ipAddress'), true);
    if (!googleNonce) return ctx.tooMany(c, signInSettings.nonce.ttlMs);
    return c.json<StartResponse>({
      ...base,
      googleNonce,
      ...(who && { person: who }),
    });
  });

  // Solo un nonce nuevo, para la entrada que quedó abierta (01 · R2.1): lo más chico posible,
  // porque en el celular se paga con datos. Mismo límite que /api/start y ninguna consulta a la
  // base.
  http.get('/api/sign-in/google/nonce', ctx.limit(byAddress('start'), limits.start), (c) => {
    const nonce = ctx.nonces.issue(c.get('ipAddress'), true);
    if (!nonce) return ctx.tooMany(c, signInSettings.nonce.ttlMs);
    return c.json<NonceResponse>({ nonce });
  });

  const body = readBody(withProofKey(googleSignInBody));
  http.post(
    '/api/sign-in/google',
    body.step,
    ctx.limit(byAddressAndDevice('google'), limits.google),
    (c) => signInWithGoogle(ctx, c, body.of(c).credential, body.of(c).proofKey),
  );
}

async function signInWithGoogle(
  ctx: SignInContext,
  c: Context,
  credential: string,
  proofPublicKey: Uint8Array,
) {
  const identity = await verifyGoogle(credential, ctx.google);
  if (!identity) {
    ctx.record(c, 'sign-in.rejected', { data: { method: 'google', reason: 'invalid-credential' } });
    return fail(c, 401, 'not-authorized');
  }
  // Un pase bueno con un nonce vencido o ya usado: la entrada estuvo abierta mucho tiempo, o se
  // volvió a ella sin pedir otro. La aplicación pide uno nuevo y la persona vuelve a tocar Google.
  if (!ctx.nonces.take(identity.nonce)) {
    ctx.record(c, 'sign-in.rejected', { data: { method: 'google', reason: 'nonce' } });
    return fail(c, 401, 'sign-in-expired');
  }
  const accountKey = `failed:google:${identity.email.toLowerCase()}`;
  if (ctx.platform.limiter.exceeded(accountKey, limits.failedPerAccount)) {
    return ctx.throttle(c, [accountKey], limits.failedPerAccount) as Response;
  }
  const match = await ctx.users.matchGoogle(identity.subject, identity.email, identity.name);
  if (match.kind === 'not-authorized') {
    ctx.platform.limiter.hit(accountKey, limits.failedPerAccount);
    const data = {
      method: 'google',
      reason: match.reason,
      subject: identity.subject,
      ...(match.user && { storedSubject: match.user.googleSubject }),
    };
    ctx.record(c, 'sign-in.rejected', { email: identity.email, data });
    return fail(c, 403, 'not-authorized', { email: identity.email });
  }
  ctx.people.update(match.user);
  const session = await openSession(ctx, c, {
    userId: match.user.id,
    proofPublicKey,
    googleAt: ctx.platform.clock.now(),
    data: { method: 'google' },
    // La dieron de baja mientras entraba (02, § 5).
    refused: new Refused(403, 'not-authorized', { email: identity.email }),
  });
  // Se ofrece la huella a un celular sin huella vinculada (R2.2); la computadora nunca (R2.4).
  const phone = isPhone(c.req.header('User-Agent'), c.req.header('Sec-CH-UA-Mobile'));
  const owner = phone ? await ownerOf(ctx, session.deviceId) : undefined;
  const offerPasskey = phone && !owner;
  // Con su propia huella en este celular, puede prender «Trabajar sin conexión» (15 · R1).
  const offline = owner === match.user.id && canWorkOffline(match.user);
  return c.json<SignInResponse>({
    person: { ...ctx.person(match.user), ...(offline && { offline: true }) },
    sessionId: session.id,
    offerPasskey,
  });
}
