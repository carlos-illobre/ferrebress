// Cerrar sesiones y cortar celulares de una persona (02 · R5.3 a R5.7; 04 · R6 a R8): la misma lógica
// para Usuarios, que corta a la persona elegida con su permiso, y para lo mío, que corta a la de la
// sesión (diseño de 04b, § 3). Quién es la persona lo dice la ruta; acá nunca sale del pedido.
import type { ErrorCode } from '@ferrebress/shared/contracts/errors';
import type { ClosedResponse, CutResponse } from '@ferrebress/shared/contracts/users';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { accessData } from './data.ts';

// Desde dónde se cortó, para la auditoría: la tarjeta de Usuarios, «Se perdió un celular» o lo mío.
export type From = 'card' | 'lost' | 'settings';

// Un rechazo, anotado una vez por minuto por motivo y persona, como los de las personas (02 · R6.1).
export function refuse(
  ctx: SignInContext,
  c: Context,
  userId: string,
  status: 403 | 404 | 409,
  code: ErrorCode,
) {
  ctx.recordOnce(c, `access:${code}:${sessionOf(c).userId}`, 'users.rejected', {
    targets: [{ kind: 'person', id: userId }],
    data: { reason: code },
  });
  return fail(c, status, code);
}

// «Cerrar» una (`id`) o «Cerrar todas» (nulo), nunca la del pedido (R5.3, R5.4). Una que ya estaba
// cerrada no es un error; una que no es de esa persona, o que no existe, da 404 (02, § 4).
export async function closeSessions(
  ctx: SignInContext,
  c: Context,
  userId: string,
  id: string | null,
  from: From,
) {
  const asking = sessionOf(c);
  if (id && (await ctx.store.findById(id))?.userId !== userId)
    return refuse(ctx, c, userId, 404, 'not-found');
  ctx.store.beginClose();
  const { events, db, clock } = ctx.platform;
  // En una transacción con el aviso: quien escucha (el vínculo) termina lo suyo junto o nada.
  const closed = await events.transaction(db, async (trx, publish) => {
    const rows = await accessData(trx as never).closeSessions(userId, id, asking.id, clock.now());
    if (rows.length > 0)
      await publish('sessions.revoked', { userId, deviceIds: rows.map((row) => row.deviceId) });
    return rows;
  });
  const ids = closed.map((row) => row.id);
  ctx.store.ended(ids, userId, 'revoked');
  const type = id ? 'session.closed' : 'sessions.closed-all';
  if (ids.length > 0)
    ctx.record(c, type, {
      targets: [{ kind: 'person', id: userId }],
      data: { sessions: ids.length, ...(from === 'settings' && { from }) },
    });
  return c.json<ClosedResponse>({ closed: ids.length });
}

// «Quitar» y «Cortar» (R5.6, R5.7) el celular que nombra `key`: las sesiones de esa persona en ese
// celular y su huella ahí. El celular desde el que se pide se deja con «Salir», salvo quitarle la
// huella a uno mismo (04 · R6.2), que va por `removeHere`.
export async function cutPhone(
  ctx: SignInContext,
  c: Context,
  { userId, key, from }: { userId: string; key: string; from: From },
) {
  const asking = sessionOf(c);
  const phone = await accessData(ctx.platform.db as never).phoneOf(userId, key);
  if (!phone) return refuse(ctx, c, userId, 404, 'not-found');
  if (phone.deviceId === asking.deviceId) {
    const own = userId === asking.userId && from !== 'lost' && phone.id !== null;
    return own ? removeHere(ctx, c, from) : refuse(ctx, c, userId, 409, 'self');
  }
  ctx.store.beginClose();
  const { events, db, clock } = ctx.platform;
  const cause = from === 'lost' ? 'cut' : 'removed';
  const done = await events.transaction(db, async (trx, publish) => {
    const result = await accessData(trx as never).cutPhone(userId, phone.deviceId, clock.now());
    await publish('passkey.removed', { userId, deviceId: phone.deviceId, cause });
    return result;
  });
  ctx.store.ended(done.sessionIds, userId, 'revoked');
  ctx.phoneOwners.delete(phone.deviceId);
  ctx.people.forget([userId]);
  const response = { sessions: done.sessionIds.length, passkey: done.passkey };
  const type = from === 'lost' ? 'phone.cut' : 'passkey.removed';
  ctx.record(c, type, {
    targets: [{ kind: 'person', id: userId }],
    data: { ...response, ...(from === 'settings' && { from }) },
  });
  return c.json<CutResponse>(response);
}

// Quitar la huella del celular que se está usando (04 · R6.2, E42): deja de entrar con ella y de
// aprobar computadoras, y se le apaga «Trabajar sin conexión»; no cierra ninguna sesión ni el vínculo
// (§ 12, 5), porque no es un celular perdido.
export async function removeHere(ctx: SignInContext, c: Context, from: From) {
  const { userId, deviceId } = sessionOf(c);
  const passkey = await accessData(ctx.platform.db as never).removePasskey(userId, deviceId);
  ctx.phoneOwners.delete(deviceId);
  ctx.people.forget([userId]);
  const response = { sessions: 0, passkey };
  if (passkey)
    ctx.record(c, 'passkey.removed', {
      targets: [{ kind: 'person', id: userId }],
      data: { ...response, ...(from === 'settings' && { from }) },
    });
  return c.json<CutResponse>(response);
}
