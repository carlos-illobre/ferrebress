// Lo que comparten las rutas de entrar: la plataforma, las personas, las sesiones, lo que vive en
// memoria y las formas de anotar en la auditoría y de frenar por límite de intentos.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { fail } from '../../platform/http.ts';
import type { Platform } from '../../platform/modules.ts';
import { createOneUse } from '../../platform/one-use.ts';
import type { Window } from '../../platform/rate-limit.ts';
import type { User, Users } from '../users/index.ts';
import type { GoogleSettings } from './google/verify.ts';
import { createSessionStore } from './sessions/store.ts';
import { signInSettings } from './settings.ts';

// Anota en la auditoría y frena por límite de intentos, con lo que trae cada pedido.
function createGuards({ audit, clock, limiter }: Platform) {
  const record = (
    c: Context,
    type: string,
    fields: { userId?: string; email?: string; data?: object } = {},
  ) => {
    const deviceId = c.get('deviceId') as string | undefined;
    audit.record({
      type,
      at: clock.now(),
      ipAddress: c.get('ipAddress'),
      ...(deviceId && { deviceId }),
      ...fields,
    } as never);
  };
  const tooMany = (c: Context, retryAfterMs: number) =>
    fail(c, 429, 'too-many-attempts', { retryAfterSeconds: Math.ceil(retryAfterMs / 1000) });

  // Cuenta el pedido contra `window` con cada clave; si alguna se pasó, frena y lo anota una vez
  // por ventana.
  const throttle = (c: Context, keys: string[], window: Window): Response | undefined => {
    const blocked = keys
      .map((key) => ({ key, hit: limiter.hit(key, window) }))
      .find(({ hit }) => !hit.allowed);
    if (!blocked) return undefined;
    if (limiter.hit(`audit:${blocked.key}`, signInSettings.limits.throttledAudit).allowed) {
      record(c, 'sign-in.throttled', { data: { key: blocked.key } });
    }
    return tooMany(c, blocked.hit.retryAfterMs);
  };
  return { record, throttle, tooMany };
}

const person = (user: User): Person => ({
  userId: user.id,
  name: user.name ?? user.email,
  email: user.email,
  // Hasta el módulo 02, todas las personas son Administrador.
  role: 'Administrador',
});

export function createContext(platform: Platform, users: Users, google: GoogleSettings) {
  return {
    platform,
    users,
    google,
    store: createSessionStore(platform.db, platform.clock),
    nonces: createOneUse<true>(platform.clock, signInSettings.nonce),
    ...createGuards(platform),
    person,
  };
}

export type SignInContext = ReturnType<typeof createContext>;
