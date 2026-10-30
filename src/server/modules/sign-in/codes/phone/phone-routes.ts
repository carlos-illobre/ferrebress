// Lo que hace el celular con el código de la computadora (R2.5, R2.7; diseño de 01, § 5): solo
// en la misma red que la computadora; leerlo lo reserva y muestra qué computadora pide entrar;
// «No soy yo» la devuelve al código. Aprobar está en approve.ts.

import { randomBytes } from 'node:crypto';
import {
  cancelCodeBody,
  type ReadCodeResponse,
  readCodeBody,
} from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { bySchema, readBody } from '../../../../platform/guards.ts';
import { fail } from '../../../../platform/http.ts';
import type { SignInContext } from '../../context.ts';
import { authenticationOptions, cannotLink, registrationOptions } from '../../passkeys/webauthn.ts';
import { optionalSession } from '../../sessions/require.ts';
import { codeSettings } from '../../settings.ts';
import type { Screen } from '../computer/screens.ts';
import { sameNetwork } from '../network.ts';
import { registerApproveRoute } from './approve.ts';

export function registerPhoneRoutes(ctx: SignInContext): void {
  const { http } = ctx.platform;

  const body = readBody(bySchema(readCodeBody));
  const limited = ctx.limit((c) => [`codes:read:${c.get('ipAddress')}`], codeSettings.readPerIp);
  http.post('/api/sign-in/codes/read', body.step, limited, async (c) => {
    const found = ctx.screens.find(body.of(c).code);
    if (typeof found === 'string') {
      ctx.record(c, 'sign-in.rejected', { data: { method: 'qr', reason: found } });
      return fail(c, 410, found);
    }
    if (!sameNetwork(found.ipAddress, c.get('ipAddress'))) {
      ctx.record(c, 'code.rejected', { data: { reason: 'other-network' } });
      return fail(c, 409, 'other-network');
    }
    if (await mustSignInFirst(ctx, c)) return fail(c, 409, 'sign-in-first');
    return c.json<ReadCodeResponse>(await read(ctx, c, found));
  });

  http.post('/api/sign-in/codes/cancel', async (c) => {
    const body = cancelCodeBody.safeParse(await c.req.json());
    const screen = body.success ? ctx.screens.byReservation(body.data.secret) : undefined;
    if (!screen) return fail(c, 410, 'code-expired');
    ctx.screens.release(screen);
    screen.notify?.({ type: 'cancelled' });
    ctx.record(c, 'code.cancelled');
    return c.json({ ok: true });
  });

  registerApproveRoute(ctx);
}

// Con sesión y sin huella, la huella nueva solo se crea recién pasado por Google: si no puede
// vincularla ahora, primero entra, sin reservar el código (R2.7, tercer punto).
async function mustSignInFirst(ctx: SignInContext, c: Context): Promise<boolean> {
  const session = await optionalSession(ctx, c);
  if (!session || (await ctx.passkeys.findActiveByDevice(session.deviceId))) return false;
  return cannotLink(ctx, c, session) !== undefined;
}

async function read(ctx: SignInContext, c: Context, screen: Screen): Promise<ReadCodeResponse> {
  const session = await optionalSession(ctx, c);
  const holdMs = codeSettings.holdMs;
  const challenge = randomBytes(32).toString('base64url');
  const reservation = ctx.screens.reserve(screen, challenge, holdMs);
  screen.notify?.({ type: 'read' });
  ctx.record(c, 'code.read', { ...(session && { userId: session.userId }) });
  const canLink =
    session &&
    !cannotLink(ctx, c, session) &&
    !(await ctx.passkeys.findActiveByDevice(session.deviceId));
  return {
    secret: reservation.secret,
    computer: { label: screen.deviceLabel },
    holdSeconds: holdMs / 1000,
    authentication: await authenticationOptions(ctx, challenge),
    ...(canLink && { registration: await registrationOptions(ctx, session, challenge) }),
  };
}
