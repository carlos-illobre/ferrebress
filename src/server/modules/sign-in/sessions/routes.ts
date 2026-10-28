// Salir (R5, diseño de 01, § 7): cierra la sesión de la cookie y, si la aplicación trae una
// salida que quedó pendiente sin conexión, también esa, probada con su llave de prueba.
import { signOutBody } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';
import { clearSessionCookie, readSessionCookie } from './cookie.ts';
import { signOutMessage, verifyProof } from './proof.ts';

export function registerSessionRoutes(ctx: SignInContext): void {
  ctx.platform.http.post('/api/sign-out', async (c) => {
    const body = signOutBody.safeParse(await c.req.json());
    if (!body.success) return fail(c, 400, 'bad-request');
    // La salida pendiente se busca en la base aunque no haya sesión: con el límite de los pedidos
    // sin sesión, por dirección (revisión de seguridad, 35).
    if (body.data.pending) {
      const blocked = ctx.throttle(
        c,
        [`sign-out:ip:${c.get('ipAddress')}`],
        signInSettings.limits.start,
      );
      if (blocked) return blocked;
    }
    await closeCookieSession(ctx, c);
    if (body.data.pending) await closePendingSession(ctx, c, body.data.pending);
    clearSessionCookie(c);
    return c.json({ ok: true });
  });
}

async function closeCookieSession(ctx: SignInContext, c: Context) {
  const token = readSessionCookie(c);
  const resolved = token ? await ctx.store.resolve(token) : undefined;
  if (resolved?.kind !== 'open') return;
  await ctx.store.close(resolved.session.id, 'sign-out');
  ctx.record(c, 'sign-out', { userId: resolved.session.userId });
}

// La salida que quedó pendiente sin conexión vale aunque la cookie ya sea de otra persona, si
// la firma es de la llave de prueba de esa sesión.
async function closePendingSession(
  ctx: SignInContext,
  c: Context,
  pending: { sessionId: string; signature: string; tappedAt?: number | undefined },
) {
  const session = await ctx.store.findById(pending.sessionId);
  if (!session || session.closedReason) return;
  const signature = Buffer.from(pending.signature, 'base64url');
  if (!verifyProof(session.proofPublicKey, signOutMessage(session.id), signature)) return;
  await ctx.store.close(session.id, 'sign-out');
  // La hora en que llegó es la del registro; la que trae es la del dispositivo cuando tocó «Salir».
  const { tappedAt } = pending;
  ctx.record(c, 'sign-out', {
    userId: session.userId,
    data: {
      pending: true,
      ...(tappedAt !== undefined && { tappedAt: new Date(tappedAt).toISOString() }),
    },
  });
}
