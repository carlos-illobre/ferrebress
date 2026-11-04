// Lo que hace la computadora para entrar con el celular (R2.5; diseño de 01, § 5): abre su
// pantalla, escucha los códigos que le manda el servidor por el tema `sign-in.codes` del canal común
// (diseño de 03, § 3) y, cuando el celular aprueba, cambia el permiso por su sesión. El tema y el
// permiso están atados a la computadora por una cookie que nunca va en el QR.
import { claimCodeBody, openScreenBody } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { deviceLabel } from '../../../../platform/device.ts';
import { fail } from '../../../../platform/http.ts';
import type { SignInContext } from '../../context.ts';
import { openSession, proofKeyOf } from '../../sessions/open.ts';
import { codeSettings } from '../../settings.ts';

const cookie = {
  name: 'sign-in-screen',
  options: { prefix: 'host', path: '/', secure: true },
} as const;

export const screenOf = (ctx: SignInContext, c: Context) => {
  const id = getCookie(c, cookie.name, 'host');
  return id ? ctx.screens.get(id) : undefined;
};

export function registerComputerRoutes(ctx: SignInContext): void {
  const { http } = ctx.platform;

  http.post('/api/sign-in/codes', async (c) => {
    const body = openScreenBody.safeParse(await c.req.json());
    return body.success ? openScreen(ctx, c, body.data.tab) : fail(c, 400, 'bad-request');
  });

  http.post('/api/sign-in/codes/claim', (c) => claim(ctx, c));
}

// Recargar la entrada o volver a su pestaña no cuenta para los topes de pantallas: reemplaza la de
// esa pestaña, con un tope propio más alto. Una pestaña nueva sí cuenta.
function openScreen(ctx: SignInContext, c: Context, tab: string | undefined) {
  const ip = c.get('ipAddress');
  const owner = tab && `${c.get('deviceId')}:${tab}`;
  const previous = owner ? ctx.screens.ownedBy(owner) : undefined;
  const blocked = previous
    ? ctx.throttle(c, [`codes:reopen:${ip}`], codeSettings.reopenPerIp)
    : ctx.throttle(c, [`codes:open:${ip}`], codeSettings.openPerIp);
  if (blocked) return blocked;
  if (previous) ctx.screens.drop(previous);
  const screen = ctx.screens.open(ip, deviceLabel(c.req.header('User-Agent')), owner);
  if (!screen) return ctx.tooMany(c, codeSettings.codeTtlMs);
  setCookie(c, cookie.name, screen.id, { ...cookie.options, httpOnly: true, sameSite: 'Strict' });
  return c.json({ ok: true });
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
    approvedBy: (permit as { approvedBy: string }).approvedBy,
    data: { method: 'qr' },
  });
  const person = await ctx.people.of(user.id, user);
  return c.json({ person, sessionId: session.id, offerPasskey: false });
}
