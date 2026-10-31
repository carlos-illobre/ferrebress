// Lo que exige una sesión abierta: la cookie de un pase que sigue valiendo. Si no, dice por qué
// está cerrada, así la aplicación muestra la entrada encima de lo que había (R3.4, R3.5).
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { RequestSession } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';
import { readSessionCookie } from './cookie.ts';
import { confirmedAtOf } from './rules.ts';
import type { Session } from './store.ts';

export async function requireSession(ctx: SignInContext, c: Context): Promise<Session | Response> {
  const token = readSessionCookie(c);
  const resolved = token
    ? await ctx.store.resolve(token)
    : { kind: 'closed' as const, reason: 'unknown' as const };
  return resolved.kind === 'open'
    ? resolved.session
    : fail(c, 401, 'session-closed', { reason: resolved.reason });
}

// La sesión abierta del pedido, si tiene; para lo que se puede hacer con o sin sesión.
export async function optionalSession(
  ctx: SignInContext,
  c: Context,
): Promise<Session | undefined> {
  const token = readSessionCookie(c);
  const resolved = token ? await ctx.store.resolve(token) : undefined;
  return resolved?.kind === 'open' ? resolved.session : undefined;
}

// La sesión del pedido para cualquier módulo (diseño de 02, § 3), con el límite de las cookies que no
// son de ninguna sesión, por dirección (02, § 9): pasado el límite, ni se consulta la base.
export async function requestSession(
  ctx: SignInContext,
  c: Context,
): Promise<RequestSession | Response> {
  const key = `session:unknown:${c.get('ipAddress')}`;
  const window = signInSettings.limits.unknownSession;
  if (ctx.platform.limiter.exceeded(key, window)) return ctx.throttle(c, [key], window) as Response;
  const token = readSessionCookie(c);
  const resolved = token ? await ctx.store.resolve(token) : undefined;
  if (resolved?.kind !== 'open') {
    const reason = resolved?.reason ?? 'unknown';
    if (token && reason === 'unknown') ctx.platform.limiter.hit(key, window);
    return fail(c, 401, 'session-closed', { reason });
  }
  const { session } = resolved;
  const confirmedAt = confirmedAtOf(session);
  return { id: session.id, userId: session.userId, deviceId: session.deviceId, confirmedAt };
}
