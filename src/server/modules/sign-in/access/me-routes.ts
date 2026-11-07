// Lo mío (04 · R6 a R8; diseño de 04b, § 3): mis dispositivos, «Cerrar», «Cerrar todas», «Quitar»,
// «Se me perdió» y quitar la huella del celular en la mano. Con sesión y sin ningún permiso, siempre de
// la persona de la sesión, que nunca viene en el pedido. La misma lógica y el mismo límite que Usuarios.
import { cutMineBody, type MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { uuidParams } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';
import { closeSessions, cutPhone, removeHere } from './cutting.ts';
import { myDevices } from './listing.ts';

export function registerMyAccessRoutes(ctx: SignInContext) {
  const { http, sessions } = ctx.platform;
  const limited = ctx.limit(
    (c) => [`users:session:${sessionOf(c).id}`],
    signInSettings.limits.accessChanges,
  );
  const me = (c: Parameters<typeof sessionOf>[0]) => sessionOf(c).userId;
  http.get('/api/me/devices', sessions.require, async (c) =>
    c.json<MyDevicesResponse>(await myDevices(ctx, sessionOf(c))),
  );
  http.post(
    '/api/me/sessions/:sessionId/close',
    sessions.require,
    uuidParams('sessionId'),
    limited,
    (c) => closeSessions(ctx, c, me(c), c.req.param('sessionId') as string, 'settings'),
  );
  http.post('/api/me/sessions/close', sessions.require, limited, (c) =>
    closeSessions(ctx, c, me(c), null, 'settings'),
  );
  const cutting = readBody(bySchema(cutMineBody));
  http.post(
    '/api/me/devices/:deviceKey/cut',
    sessions.require,
    uuidParams('deviceKey'),
    limited,
    cutting.step,
    (c) =>
      cutPhone(ctx, c, {
        userId: me(c),
        key: c.req.param('deviceKey') as string,
        how: cutting.of(c).how,
        place: 'settings',
      }),
  );
  http.post('/api/me/passkey/remove', sessions.require, limited, (c) =>
    removeHere(ctx, c, 'settings'),
  );
}
