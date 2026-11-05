// Presentarse y el respaldo (diseño de 03, § 4.3 y § 4.4; capítulo 03, R3): el servidor pasa la oferta
// y la respuesta de WebRTC, revisadas, y los mensajes del respaldo, sin guardarlos ni abrirlos. Solo
// entre los dos lados del vínculo de la sesión que pide, y solo si el otro escucha (E38, E39). Anota
// la huella DTLS de cada lado, que la confirmación pide (§ 7), y que espejaron (R2.2).
import { relayBody, reportBody, signalBody } from '@ferrebress/shared/contracts/device-link';
import type { Context } from 'hono';
import type * as z from 'zod/mini';
import { deviceCodes } from '../../../platform/device.ts';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { DeviceLinkContext } from '../context.ts';
import { keyOf, pairingTopic } from '../lifecycle.ts';
import { otherSide, sideOf } from '../rules.ts';
import { checkSdp } from '../sdp.ts';
import { deviceLinkSettings } from '../settings.ts';

// El vínculo de quien pide y la clave del otro lado, si el otro escucha; si no, por qué.
async function toOther(ctx: DeviceLinkContext, c: Context) {
  const session = sessionOf(c);
  const pairing = await ctx.members.pairingOf(session.userId, session.deviceId);
  if (!pairing) return { refused: fail(c, 409, 'not-paired') };
  const side = sideOf(session);
  const other = otherSide(side);
  if (ctx.platform.realtime.listeners(pairingTopic, keyOf(pairing.id, other)) === 0)
    return { refused: fail(c, 409, 'peer-absent') };
  ctx.members.mirroredNow(pairing.id, ctx.platform.clock.now());
  return { pairing, side, other };
}

async function signal(ctx: DeviceLinkContext, c: Context, body: z.infer<typeof signalBody>) {
  const target = await toOther(ctx, c);
  if ('refused' in target) return target.refused;
  const checked = checkSdp(body.sdp);
  if (!checked) return fail(c, 400, 'bad-request');
  const { pairing, side, other } = target;
  ctx.members.registerFingerprint(pairing.id, side, checked.fingerprint);
  ctx.members.useSession(pairing.id, side, sessionOf(c).id);
  ctx.platform.realtime.publish(pairingTopic, keyOf(pairing.id, other), {
    signal: { attempt: body.attempt, kind: body.kind, sdp: checked.sdp },
  });
  return c.json({ ok: true });
}

// El respaldo: por el servidor, la seguridad la pone el servidor en cada lote (§ 4.3): el otro lado
// tiene que estar escuchando con una sesión abierta.
async function relay(ctx: DeviceLinkContext, c: Context, messages: unknown[]) {
  const target = await toOther(ctx, c);
  if ('refused' in target) return target.refused;
  const { pairing, other } = target;
  const otherSession = ctx.members.sessionOf(pairing.id, other);
  if (!otherSession || !ctx.platform.sessions.isOpen(otherSession))
    return fail(c, 409, 'peer-gone');
  // Se cuentan los mensajes y los KB: muchos chicos o pocos grandes cuestan lo mismo de datos.
  const { relay: window, relayKb } = deviceLinkSettings.limits;
  const id = sessionOf(c).id;
  const kb = Math.ceil(JSON.stringify(messages).length / 1024);
  const counts = [
    ...messages.map(() => [`device-link:relay:${id}`, window] as const),
    ...Array.from({ length: kb }, () => [`device-link:relay-kb:${id}`, relayKb] as const),
  ];
  for (const [key, limit] of counts)
    if (!ctx.platform.limiter.hit(key, limit).allowed) return ctx.tooMany(c, limit.windowMs);
  ctx.platform.realtime.publish(pairingTopic, keyOf(pairing.id, other), { relay: messages });
  return c.json({ ok: true });
}

// Por qué no se logró el directo: una línea en el registro, en números y listas cerradas (§ 15).
async function report(ctx: DeviceLinkContext, c: Context, body: z.infer<typeof reportBody>) {
  const session = sessionOf(c);
  const pairing = await ctx.members.pairingOf(session.userId, session.deviceId);
  if (!pairing) return fail(c, 409, 'not-paired');
  const device = deviceCodes((name) => c.req.header(name));
  console.info(
    JSON.stringify({ event: 'device-link.report', ...body, side: sideOf(session), device }),
  );
  return c.json({ ok: true });
}

export function registerMeetRoutes(ctx: DeviceLinkContext): void {
  const { http, sessions } = ctx.platform;
  const { limits } = deviceLinkSettings;
  const bySession = (topic: string) => (c: Context) => [`device-link:${topic}:${sessionOf(c).id}`];
  const signalled = readBody(bySchema(signalBody));
  const relayed = readBody(bySchema(relayBody));
  const reported = readBody(bySchema(reportBody));
  http.post(
    '/api/device-link/signal',
    sessions.require,
    ctx.limit(bySession('signal'), limits.signal),
    signalled.step,
    (c) => signal(ctx, c, signalled.of(c)),
  );
  http.post('/api/device-link/relay', sessions.require, relayed.step, (c) =>
    relay(ctx, c, relayed.of(c).messages),
  );
  http.post(
    '/api/device-link/report',
    sessions.require,
    ctx.limit(bySession('report'), limits.report),
    reported.step,
    (c) => report(ctx, c, reported.of(c)),
  );
}
