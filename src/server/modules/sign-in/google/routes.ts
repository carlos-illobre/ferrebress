// El primer pedido al abrir la aplicación y la entrada con Google (diseño de 01, § 4 y § 5).
import {
  googleSignInBody,
  type SignInResponse,
  type StartResponse,
} from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { isPhone } from '../device.ts';
import { readSessionCookie } from '../sessions/cookie.ts';
import { openSession, proofKeyOf } from '../sessions/open.ts';
import { signInSettings } from '../settings.ts';
import { verifyGoogle } from './verify.ts';

const { limits } = signInSettings;

export function registerGoogleRoutes(ctx: SignInContext): void {
  const { http, config } = ctx.platform;

  http.get('/api/start', async (c) => {
    const ip = c.get('ipAddress');
    const blocked = ctx.throttle(c, [`start:ip:${ip}`], limits.start);
    if (blocked) return blocked;
    const base = {
      environment: config.ENVIRONMENT,
      version: config.VERSION,
      googleClientId: config.GOOGLE_CLIENT_ID,
      googleScriptUrl: config.GOOGLE_SCRIPT_URL,
    };
    const token = readSessionCookie(c);
    const resolved = token ? await ctx.store.resolve(token) : undefined;
    const who =
      resolved?.kind === 'open' ? await ctx.people.of(resolved.session.userId) : undefined;
    // El nonce va también con sesión: un celular sin huella vuelve a entrar con Google para
    // vincularla y hacer entrar a una computadora (R2.7).
    const googleNonce = ctx.nonces.issue(ip, true);
    if (!googleNonce) return ctx.tooMany(c, signInSettings.nonce.ttlMs);
    return c.json<StartResponse>({
      ...base,
      googleNonce,
      ...(who && { person: who }),
    });
  });

  http.post('/api/sign-in/google', async (c) => {
    const body = googleSignInBody.safeParse(await c.req.json());
    const proofPublicKey = body.success ? proofKeyOf(body.data.proofPublicKey) : undefined;
    if (!body.success || !proofPublicKey) return fail(c, 400, 'bad-request');
    const blocked = ctx.throttle(
      c,
      [`google:ip:${c.get('ipAddress')}`, `google:device:${c.get('deviceId')}`],
      limits.google,
    );
    if (blocked) return blocked;
    return signInWithGoogle(ctx, c, body.data.credential, proofPublicKey);
  });
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
  });
  // Se ofrece la huella a un celular sin huella vinculada (R2.2); la computadora nunca (R2.4).
  const phone = isPhone(c.req.header('User-Agent'), c.req.header('Sec-CH-UA-Mobile'));
  const offerPasskey = phone && !(await ctx.passkeys.findActiveByDevice(session.deviceId));
  return c.json<SignInResponse>({
    person: ctx.person(match.user),
    sessionId: session.id,
    offerPasskey,
  });
}
