// Vincular con el botón (capítulo 03, R1.3, R1.4, R1.6; diseño de 03, § 10.3): el celular lee el
// código del QR de la computadora; si es de otra persona no lo gasta (así nadie bloquea a otro
// apuntándole con su celular); si alguno ya tenía vínculo, pregunta antes con un boleto; si no, vincula.
import {
  acceptBody,
  type ReadCodeResponse,
  readCodeBody,
} from '@ferrebress/shared/contracts/device-link';
import type { Context } from 'hono';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail } from '../../../platform/http.ts';
import { type RequestSession, sessionOf } from '../../../platform/session.ts';
import type { DeviceLinkContext, Ticket } from '../context.ts';
import { afterPairing, pair } from '../lifecycle.ts';
import { type Device, replacedBy, replacesOf, viewOf } from '../rules.ts';
import { deviceLinkSettings } from '../settings.ts';
import { codeTopic } from '../topics.ts';

const deviceOfSession = (session: RequestSession): Device => ({
  userId: session.userId,
  deviceId: session.deviceId,
  label: session.deviceLabel,
  isPhone: session.isPhone,
});

// La computadora dueña del código: su sesión abierta, que tiene que ser de la misma persona.
function computerOf(ctx: DeviceLinkContext, ownerSessionId: string) {
  return ctx.platform.sessions.isOpen(ownerSessionId) ? ownerSessionId : undefined;
}

async function link(ctx: DeviceLinkContext, c: Context, ticket: Ticket) {
  const { db, events, clock } = ctx.platform;
  const paired = await events.transaction(db, async (trx) =>
    pair(ctx.dataIn(trx), ticket.phone, ticket.computer, 'button', clock.now()),
  );
  afterPairing(ctx, paired, { kind: 'person', userId: ticket.phone.userId });
  ctx.platform.realtime.publish(codeTopic, ticket.computerSessionId, {
    paired: viewOf(paired.pairing, 'computer'),
  });
  ctx.codes.stop(ticket.computerSessionId);
  return c.json<ReadCodeResponse>({ pairing: viewOf(paired.pairing, 'phone') });
}

async function read(ctx: DeviceLinkContext, c: Context, code: string) {
  const session = sessionOf(c);
  if (!session.isPhone) return fail(c, 400, 'not-a-phone');
  const outcome = ctx.codes.peek(code);
  if (typeof outcome === 'string') return fail(c, 410, outcome);
  // Un código vigente es de una computadora que lo escucha con su sesión abierta: vale 60 s y deja de
  // valer en cuanto esa sesión termina. Se mira acá: el canal recién se cierra en el próximo latido.
  if (!computerOf(ctx, outcome.owner)) return fail(c, 410, 'code-expired');
  const computer = ctx.computers.get(outcome.owner) as Device;
  if (computer.userId !== session.userId) {
    ctx.recordOnce(c, `other-account:${session.id}`, 'device-link.rejected', {
      targets: [{ kind: 'person', id: computer.userId }],
      data: { reason: 'other-account' },
    });
    return fail(c, 403, 'other-account');
  }
  ctx.codes.take(code);
  const phone = deviceOfSession(session);
  const existing = await ctx.data.forDevices(session.userId, [phone.deviceId, computer.deviceId]);
  const replaced = replacedBy(existing, phone, computer);
  const ticket: Ticket = {
    phoneSessionId: session.id,
    computerSessionId: outcome.owner,
    phone,
    computer,
    replaces: replaced.map((pairing) => pairing.id).sort(),
  };
  if (replaced.length === 0) return link(ctx, c, ticket);
  const key = ctx.tickets.issue(session.id, ticket) as string;
  return c.json<ReadCodeResponse>({ ticket: key, replaces: replacesOf(replaced, phone, computer) });
}

// Aceptar reemplazar: con la misma sesión del celular, la computadora todavía abierta y los mismos
// vínculos a reemplazar que cuando se preguntó.
async function accept(ctx: DeviceLinkContext, c: Context, key: string) {
  const session = sessionOf(c);
  const ticket = ctx.tickets.take(key);
  if (!ticket || ticket.phoneSessionId !== session.id || !computerOf(ctx, ticket.computerSessionId))
    return fail(c, 410, 'code-expired');
  const { phone, computer } = ticket;
  const existing = await ctx.data.forDevices(session.userId, [phone.deviceId, computer.deviceId]);
  const now = replacedBy(existing, phone, computer)
    .map((pairing) => pairing.id)
    .sort();
  if (now.join() !== ticket.replaces.join()) return fail(c, 410, 'code-expired');
  return link(ctx, c, ticket);
}

export function registerCodeRoutes(ctx: DeviceLinkContext): void {
  const { http, sessions } = ctx.platform;
  const limit = ctx.limit(
    (c) => [`device-link:read:${sessionOf(c).id}`],
    deviceLinkSettings.limits.read,
  );
  const code = readBody(bySchema(readCodeBody));
  const ticket = readBody(bySchema(acceptBody));
  http.post('/api/device-link/codes/read', sessions.require, limit, code.step, (c) =>
    read(ctx, c, code.of(c).code),
  );
  http.post('/api/device-link/codes/accept', sessions.require, limit, ticket.step, (c) =>
    accept(ctx, c, ticket.of(c).ticket),
  );
}
