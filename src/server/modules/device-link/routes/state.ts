// Desvincular, desconectar, reconectar y confirmar el vínculo (capítulo 03, R5 y R2.6; diseño de 03,
// § 7 y § 10.2). Todo sobre el vínculo de la sesión que pregunta: nunca uno que venga en el cuerpo.
import type { CheckResponse, Side } from '@ferrebress/shared/contracts/device-link';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import { type DeviceLinkContext, targetsOf } from '../context.ts';
import { afterEnding, keyOf, pairingTopic } from '../lifecycle.ts';
import { otherSide, type Pairing, sideOf, viewOf } from '../rules.ts';
import { deviceLinkSettings } from '../settings.ts';

// El vínculo de la sesión del pedido, y de qué lado está.
async function mine(ctx: DeviceLinkContext, c: Context) {
  const session = sessionOf(c);
  const pairing = await ctx.members.pairingOf(session.userId, session.deviceId);
  return pairing ? { pairing, side: sideOf(session) } : undefined;
}

async function unpair(ctx: DeviceLinkContext, c: Context) {
  const found = await mine(ctx, c);
  if (!found) return fail(c, 409, 'not-paired');
  const { db, events } = ctx.platform;
  const ended = await events.transaction(db, (trx) => ctx.dataIn(trx).remove([found.pairing.id]));
  afterEnding(ctx, ended);
  for (const pairing of ended)
    ctx.record(c, 'device-link.unpaired', {
      targets: [{ kind: 'person', id: pairing.userId }, ...targetsOf(pairing)],
      data: { from: found.side },
    });
  return c.json({ ok: true });
}

// Desconectar o reconectar (R5.1, R5.2): queda guardado, y el otro lado se entera si escucha.
async function setPaused(ctx: DeviceLinkContext, c: Context, paused: boolean) {
  const found = await mine(ctx, c);
  if (!found) return fail(c, 409, 'not-paired');
  const at = paused ? ctx.platform.clock.now() : null;
  const updated = (await ctx.data.setPaused(found.pairing.id, at)) as Pairing;
  ctx.members.known(updated);
  const other: Side = otherSide(found.side);
  ctx.platform.realtime.publish(pairingTopic, keyOf(updated.id, other), {
    pairing: viewOf(updated, other),
  });
  return c.json({ pairing: viewOf(updated, found.side) });
}

// La confirmación (§ 7): el vínculo de ahora y, con la huella DTLS del otro, si el otro lado de esta
// conexión sigue en regla. Cuenta como uso de la sesión que pregunta (R2.5), sin consultas.
async function check(ctx: DeviceLinkContext, c: Context) {
  const found = await mine(ctx, c);
  if (!found) return c.json<CheckResponse>({});
  const { pairing, side } = found;
  ctx.members.useSession(pairing.id, side, sessionOf(c).id);
  const fingerprint = c.req.query('fp');
  const view = viewOf(pairing, side);
  if (fingerprint === undefined) return c.json<CheckResponse>({ pairing: view });
  const other = otherSide(side);
  const otherSession = ctx.members.sessionOf(pairing.id, other);
  const inRule =
    otherSession !== undefined &&
    ctx.platform.sessions.isOpen(otherSession) &&
    ctx.members.fingerprintOf(pairing.id, other) === fingerprint;
  return c.json<CheckResponse>({ pairing: view, peer: inRule ? 'ok' : 'gone' });
}

export function registerStateRoutes(ctx: DeviceLinkContext): void {
  const { http, sessions } = ctx.platform;
  const checks = ctx.limit(
    (c) => [`device-link:check:${sessionOf(c).id}`],
    deviceLinkSettings.limits.check,
  );
  http.post('/api/device-link/unpair', sessions.require, (c) => unpair(ctx, c));
  http.post('/api/device-link/pause', sessions.require, (c) => setPaused(ctx, c, true));
  http.post('/api/device-link/resume', sessions.require, (c) => setPaused(ctx, c, false));
  http.get('/api/device-link/check', sessions.require, checks, (c) => check(ctx, c));
}
