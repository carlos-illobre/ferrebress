// Lo que Usuarios ve y corta de las sesiones y las huellas de cada persona (02 · R5; diseño de 02,
// § 4): la tarjeta, «Cerrar», «Cerrar todas», «Quitar» y «Se perdió un celular», que es la misma
// operación que «Quitar». Todo con sesión, con los identificadores de la dirección en forma de UUID y
// con el límite de cambios por sesión. Cada rechazo queda en la auditoría.

import type { ErrorCode } from '@ferrebress/shared/contracts/errors';
import {
  type AccessResponse,
  type ClosedResponse,
  type CutResponse,
  cutBody,
  type LostPhonesResponse,
} from '@ferrebress/shared/contracts/users';
import type { Context } from 'hono';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail, uuidParams } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';
import { accessData } from './data.ts';
import { lostPhones } from './lost.ts';

// El mismo límite de cambios por sesión que las personas (02, § 9).
const changes = { max: 60, windowMs: 60_000 };
const time = (at: Date | null) => (at ? at.getTime() : null);

type Data = ReturnType<typeof accessData>;

export function registerAccessRoutes(ctx: SignInContext) {
  const { http, sessions } = ctx.platform;
  const data = accessData(ctx.platform.db as never);
  const limited = ctx.limit((c) => [`users:session:${sessionOf(c).id}`], changes);

  const ids = (...names: string[]) => uuidParams('id', ...names);
  http.get('/api/users/:id/access', sessions.require, ids(), (c) => access(ctx, data, c));
  http.post(
    '/api/users/:id/sessions/:sessionId/close',
    sessions.require,
    ids('sessionId'),
    limited,
    (c) => closeSessions(ctx, data, c, c.req.param('sessionId')),
  );
  http.post('/api/users/:id/sessions/close', sessions.require, ids(), limited, (c) =>
    closeSessions(ctx, data, c, null),
  );
  const cutting = readBody(bySchema(cutBody));
  const cutRoute = '/api/users/:id/phones/:phoneId/cut';
  http.post(cutRoute, sessions.require, ids('phoneId'), limited, cutting.step, (c) =>
    cut(ctx, data, c, cutting.of(c).from),
  );
  http.get('/api/lost-phones', sessions.require, async (c) =>
    c.json<LostPhonesResponse>(await lostPhones(ctx, data, sessionOf(c), ctx.platform.clock.now())),
  );
}

// La tarjeta: sus sesiones abiertas, sin la del pedido, y sus celulares con huella, sin los propios,
// que van en Configuración (R5.2, R5.5). El último uso, el de la memoria si es más nuevo (02, § 4).
async function access(ctx: SignInContext, data: Data, c: Context) {
  const asking = sessionOf(c);
  const userId = c.req.param('id') as string;
  const now = ctx.platform.clock.now();
  const open = await data.openSessionsOf(userId, asking.id, now, signInSettings.session);
  const phones = userId === asking.userId ? [] : await data.passkeysOf(userId);
  const lastUsed = (id: string, stored: Date) =>
    Math.max(stored.getTime(), ctx.store.lastUsedOf(id)?.getTime() ?? 0);
  return c.json<AccessResponse>({
    sessions: open.map((s) => ({
      ...s,
      createdAt: s.createdAt.getTime(),
      lastUsedAt: lastUsed(s.id, s.lastUsedAt),
    })),
    phones: phones.map((p) => ({
      ...p,
      createdAt: p.createdAt.getTime(),
      lastUsedAt: time(p.lastUsedAt),
    })),
  });
}

// Un rechazo, anotado una vez por minuto por motivo y persona, como los de las personas (R6.1).
function refuse(ctx: SignInContext, c: Context, status: 404 | 409, code: ErrorCode) {
  const target = c.req.param('id') as string;
  const key = `audit:access:${code}:${target}`;
  if (ctx.platform.limiter.hit(key, signInSettings.limits.throttledAudit).allowed)
    ctx.record(c, 'users.rejected', {
      userId: sessionOf(c).userId,
      data: { targetUserId: target, reason: code },
    });
  return fail(c, status, code);
}

// «Cerrar» una (`id`) o «Cerrar todas» (nulo), nunca la del pedido (R5.3, R5.4). Una que ya estaba
// cerrada no es un error; una que no es de esa persona, o que no existe, da 404 (02, § 4).
async function closeSessions(ctx: SignInContext, data: Data, c: Context, id: string | null) {
  const asking = sessionOf(c);
  const userId = c.req.param('id') as string;
  if (id && (await ctx.store.findById(id))?.userId !== userId)
    return refuse(ctx, c, 404, 'not-found');
  ctx.store.beginClose();
  const ids = await data.closeSessions(userId, id, asking.id, ctx.platform.clock.now());
  ctx.store.ended(ids, userId, 'revoked');
  const type = id ? 'session.closed' : 'sessions.closed-all';
  if (ids.length > 0)
    ctx.record(c, type, {
      userId: asking.userId,
      data: { targetUserId: userId, sessions: ids.length },
    });
  return c.json<ClosedResponse>({ closed: ids.length });
}

// «Quitar» y «Cortar» (R5.6, R5.7): las sesiones de esa persona en ese celular, y su huella ahí. El
// celular desde el que se pide se deja con «Salir».
async function cut(ctx: SignInContext, data: Data, c: Context, from: 'card' | 'lost') {
  const asking = sessionOf(c);
  const userId = c.req.param('id') as string;
  const phone = await data.phoneOf(userId, c.req.param('phoneId') as string);
  if (!phone) return refuse(ctx, c, 404, 'not-found');
  if (phone.deviceId === asking.deviceId) return refuse(ctx, c, 409, 'self');
  ctx.store.beginClose();
  const done = await data.cutPhone(userId, phone.deviceId, ctx.platform.clock.now());
  ctx.store.ended(done.sessionIds, userId, 'revoked');
  ctx.phoneOwners.delete(phone.deviceId);
  ctx.people.forget(userId);
  const response = { sessions: done.sessionIds.length, passkey: done.passkey };
  const type = from === 'card' ? 'passkey.removed' : 'phone.cut';
  ctx.record(c, type, { userId: asking.userId, data: { targetUserId: userId, ...response } });
  return c.json<CutResponse>(response);
}
