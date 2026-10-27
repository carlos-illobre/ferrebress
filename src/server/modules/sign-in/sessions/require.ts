// Lo que exige una sesión abierta: la cookie de un pase que sigue valiendo. Si no, dice por qué
// está cerrada, así la aplicación muestra la entrada encima de lo que había (R3.4, R3.5).
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { readSessionCookie } from './cookie.ts';
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
