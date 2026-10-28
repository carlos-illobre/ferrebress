// Lo que hace la computadora para entrar con el celular (R2.5; diseño de 01, § 5): abre su
// pantalla, escucha por un canal los códigos que le manda el servidor y, cuando el celular
// aprueba, cambia el permiso por su sesión. El canal y el permiso están atados a la computadora
// por una cookie que nunca va en el QR.
import { claimCodeBody } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { streamSSE } from 'hono/streaming';
import { fail } from '../../../../platform/http.ts';
import type { SignInContext } from '../../context.ts';
import { deviceLabel } from '../../device.ts';
import { openSession, proofKeyOf } from '../../sessions/open.ts';
import { codeSettings } from '../../settings.ts';
import type { Screen, ScreenEvent } from './screens.ts';

const cookie = {
  name: 'sign-in-screen',
  options: { prefix: 'host', path: '/', secure: true },
} as const;

const screenOf = (ctx: SignInContext, c: Context) => {
  const id = getCookie(c, cookie.name, 'host');
  return id ? ctx.screens.get(id) : undefined;
};

export function registerComputerRoutes(ctx: SignInContext): void {
  const { http } = ctx.platform;

  http.post('/api/sign-in/codes', (c) => {
    const ip = c.get('ipAddress');
    const blocked = ctx.throttle(c, [`codes:open:${ip}`], codeSettings.openPerIp);
    if (blocked) return blocked;
    const screen = ctx.screens.open(ip, deviceLabel(c.req.header('User-Agent')));
    if (!screen) return ctx.tooMany(c, codeSettings.codeTtlMs);
    setCookie(c, cookie.name, screen.id, { ...cookie.options, httpOnly: true, sameSite: 'Strict' });
    return c.json({ ok: true });
  });

  http.get('/api/realtime/sign-in-codes', (c) => {
    const screen = screenOf(ctx, c);
    return screen
      ? streamSSE(c, (stream) => serveScreen(ctx, screen, stream))
      : fail(c, 404, 'not-found');
  });

  http.post('/api/sign-in/codes/claim', (c) => claim(ctx, c));
}

// La computadora cambia el permiso de un uso por su sesión, con la cookie de su pantalla.
async function claim(ctx: SignInContext, c: Context) {
  const body = claimCodeBody.safeParse(await c.req.json());
  const screen = screenOf(ctx, c);
  const proofPublicKey = body.success ? proofKeyOf(body.data.proofPublicKey) : undefined;
  if (!body.success || !screen || !proofPublicKey) return fail(c, 400, 'bad-request');
  const permit = ctx.permits.take(body.data.permit);
  const user = permit?.screenId === screen.id ? await ctx.users.findById(permit.userId) : undefined;
  if (!user?.active) {
    ctx.record(c, 'sign-in.rejected', { data: { method: 'qr', reason: 'invalid-permit' } });
    return fail(c, 401, 'not-authorized');
  }
  ctx.screens.close(screen.id);
  deleteCookie(c, cookie.name, cookie.options);
  const session = await openSession(ctx, c, {
    userId: user.id,
    proofPublicKey,
    label: screen.deviceLabel,
    data: { method: 'qr' },
  });
  return c.json({ person: ctx.person(user), sessionId: session.id, offerPasskey: false });
}

type Stream = Parameters<Parameters<typeof streamSSE>[1]>[0];

// El canal de una pantalla: le manda un código nuevo cada minuto mientras nadie lo leyó, y lo
// que pasa con la reserva. Se cierra cuando la computadora lo cierra (entró, o la pestaña dejó de
// estar a la vista); con él se cierra la pantalla. Hay uno solo por pantalla: uno nuevo (la
// computadora que se reconecta) corta el anterior sin cerrarla.
async function serveScreen(ctx: SignInContext, screen: Screen, stream: Stream) {
  // Despierta la espera antes de tiempo: «No soy yo» o la computadora que cierra el canal.
  let nudge = Promise.withResolvers<void>();
  const send = (event: ScreenEvent) =>
    stream.writeSSE({ event: event.type, data: JSON.stringify(event) });
  screen.notify = (event) => {
    void send(event);
    if (event.type === 'cancelled') nudge.resolve();
  };
  const channel = { stop: () => stream.abort() };
  const replaced = screen.channel;
  screen.channel = channel;
  replaced?.stop();
  stream.onAbort(() => {
    if (screen.channel === channel) ctx.screens.close(screen.id);
    nudge.resolve();
  });
  while (!stream.aborted) {
    if (ctx.screens.expireReservation(screen)) await send({ type: 'cancelled' });
    if (!screen.reservation) await send({ type: 'code', code: ctx.screens.newCode(screen) });
    const until =
      screen.reservation?.until ?? ctx.platform.clock.now().getTime() + codeSettings.codeTtlMs;
    await Promise.race([nudge.promise, ctx.wait(until - ctx.platform.clock.now().getTime())]);
    nudge = Promise.withResolvers<void>();
  }
}
