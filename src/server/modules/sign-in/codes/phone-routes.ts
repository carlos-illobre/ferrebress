// Lo que hace el celular con el código de la computadora (R2.5, R2.7; diseño de 01, § 5): leerlo
// lo reserva y muestra qué computadora pide entrar y dónde está; «No soy yo» la devuelve al
// código. Aprobar está en approve.ts.

import { randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers';
import {
  cancelCodeBody,
  type ReadCodeResponse,
  readCodeBody,
} from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { authenticationOptions, cannotLink, registrationOptions } from '../passkeys/webauthn.ts';
import { optionalSession } from '../sessions/require.ts';
import { codeSettings } from '../settings.ts';
import { registerApproveRoute } from './approve.ts';
import { placeOf } from './place.ts';
import type { Screen } from './screens.ts';

// La ciudad tarda poco o no importa: pasado ese tiempo es desconocida y la entrada sigue.
const cityTimeoutMs = 200;

export function registerPhoneRoutes(ctx: SignInContext): void {
  const { http } = ctx.platform;

  http.post('/api/sign-in/codes/read', async (c) => {
    const body = readCodeBody.safeParse(await c.req.json());
    if (!body.success) return fail(c, 400, 'bad-request');
    const blocked = ctx.throttle(c, [`codes:read:${c.get('ipAddress')}`], codeSettings.readPerIp);
    if (blocked) return blocked;
    const found = ctx.screens.find(body.data.code);
    if (typeof found === 'string') return fail(c, 410, found);
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

async function read(ctx: SignInContext, c: Context, screen: Screen): Promise<ReadCodeResponse> {
  const session = await optionalSession(ctx, c);
  const holdMs = session ? codeSettings.holdMs : codeSettings.holdWithSignInMs;
  const challenge = randomBytes(32).toString('base64url');
  const reservation = ctx.screens.reserve(screen, challenge, holdMs);
  screen.notify?.({ type: 'read' });
  const [computerCity, phoneCity] = await Promise.all([
    cityOf(ctx, screen.ipAddress),
    cityOf(ctx, c.get('ipAddress')),
  ]);
  const place = placeOf(
    { ipAddress: screen.ipAddress, city: computerCity },
    { ipAddress: c.get('ipAddress'), city: phoneCity },
  );
  ctx.record(c, 'code.read', {
    ...(session && { userId: session.userId }),
    data: { place, computerCity, phoneCity },
  });
  const canLink =
    session &&
    !cannotLink(ctx, c, session) &&
    !(await ctx.passkeys.findActiveByDevice(session.deviceId));
  return {
    secret: reservation.secret,
    computer: { label: screen.deviceLabel },
    place,
    holdSeconds: holdMs / 1000,
    authentication: await authenticationOptions(ctx, challenge),
    ...(canLink && { registration: await registrationOptions(ctx, session, challenge) }),
  };
}

const cityOf = (ctx: SignInContext, ipAddress: string): Promise<string | undefined> =>
  Promise.race([
    ctx.findCity(ipAddress).catch(() => undefined),
    new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), cityTimeoutMs).unref(),
    ),
  ]);
