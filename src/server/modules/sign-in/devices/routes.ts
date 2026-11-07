// El `nonce` que firma la llave del dispositivo al entrar (diseño de 01, § 6), y poner, cambiar o
// borrar el nombre del dispositivo de la sesión (04 · R9.2, R9.3; diseño de 04b, § 3): con sesión y
// sin permiso, siempre el de la sesión y nunca el que diga el pedido, con un límite por sesión y por
// dispositivo. Queda en Quién hizo qué con el nombre anterior y el nuevo, sin el identificador.
import {
  cleanDeviceName,
  type DeviceNameResponse,
  deviceNameBody,
  isRepeated,
} from '@ferrebress/shared/contracts/device-settings';
import type { DeviceNonceResponse } from '@ferrebress/shared/contracts/sign-in';
import { byAddress, readBody } from '../../../platform/guards.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';

export function registerDeviceRoutes(ctx: SignInContext) {
  const { http, sessions } = ctx.platform;
  const body = readBody((raw) => {
    const parsed = deviceNameBody.safeParse(raw);
    const name = parsed.success ? cleanDeviceName(parsed.data.name) : undefined;
    return name === undefined ? undefined : { name };
  });
  const limited = ctx.limit(
    // Por sesión y por dispositivo: entrar de nuevo no da más cambios.
    (c) => [
      `device-name:session:${sessionOf(c).id}`,
      `device-name:device:${sessionOf(c).deviceId}`,
    ],
    signInSettings.devices.renames,
  );
  // El `nonce` que firma la llave del dispositivo al entrar (diseño de 01, § 6), por cualquier camino;
  // con el límite de los pedidos sin sesión, por dirección.
  http.get(
    '/api/sign-in/device-nonce',
    ctx.limit(byAddress('start'), signInSettings.limits.start),
    (c) => {
      const nonce = ctx.deviceNonces.issue(c.get('ipAddress'), true);
      if (!nonce) return ctx.tooMany(c, signInSettings.deviceNonce.ttlMs);
      return c.json<DeviceNonceResponse>({ nonce });
    },
  );
  http.post('/api/me/device-name', sessions.require, limited, body.step, async (c) => {
    const { deviceId, deviceLabel } = sessionOf(c);
    const { name } = body.of(c);
    const repeated = name !== null && isRepeated(name, ctx.devices.othersThan(deviceId));
    if (name === (ctx.devices.nameOf(deviceId) ?? null))
      return c.json<DeviceNameResponse>({ name, repeated });
    const before = await ctx.devices.rename(deviceId, name);
    ctx.record(c, 'device.renamed', {
      targets: [{ kind: 'device', id: '', name: before ?? deviceLabel }],
      changes: { name: { before, after: name } },
    });
    return c.json<DeviceNameResponse>({ name, repeated });
  });
}
