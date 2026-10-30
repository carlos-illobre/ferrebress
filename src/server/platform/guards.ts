// Los pasos que una ruta declara antes de lo suyo, iguales para cualquier módulo: leer y validar
// el cuerpo, frenar por límite de pedidos (anotándolo en la auditoría una vez por ventana) y anotar
// en la auditoría con lo que trae cada pedido. Así la ruta queda solo con su regla:
//
//   http.post('/api/x', body.step, guards.limit(keys, window), (c) => hacer(body.of(c)))
import type { Context, MiddlewareHandler } from 'hono';
import { fail } from './http.ts';
import type { Window } from './limits/rate-limit.ts';
import type { Platform } from './modules.ts';
import type { AuditEvent } from './storage/audit.ts';

// Qué se anota cuando un pedido se frena, y cada cuánto como mucho por clave.
export type ThrottledAudit = { event: string; window: Window };

export function createGuards({ audit, clock, limiter }: Platform, throttled: ThrottledAudit) {
  const record = (
    c: Context,
    type: string,
    fields: Pick<AuditEvent, 'userId' | 'email' | 'data'> = {},
  ) => {
    const deviceId = c.get('deviceId') as string | undefined;
    audit.record({
      type,
      at: clock.now(),
      ipAddress: c.get('ipAddress') as string,
      ...(deviceId && { deviceId }),
      ...fields,
    });
  };
  const tooMany = (c: Context, retryAfterMs: number) =>
    fail(c, 429, 'too-many-attempts', { retryAfterSeconds: Math.ceil(retryAfterMs / 1000) });

  // Cuenta el pedido contra `window` con cada clave, en orden; en la primera que se pasó, frena y
  // lo anota una vez por ventana. Las demás ya no se cuentan: con la dirección primero, una
  // dirección frenada no agrega claves de dispositivos inventados.
  const throttle = (c: Context, keys: string[], window: Window): Response | undefined => {
    for (const key of keys) {
      const hit = limiter.hit(key, window);
      if (hit.allowed) continue;
      if (limiter.hit(`audit:${key}`, throttled.window).allowed)
        record(c, throttled.event, { data: { key } });
      return tooMany(c, hit.retryAfterMs);
    }
    return undefined;
  };

  // El límite como paso de la ruta: las claves salen del pedido (la dirección, el dispositivo).
  const limit =
    (keysOf: (c: Context) => string[], window: Window): MiddlewareHandler =>
    async (c, next) =>
      throttle(c, keysOf(c), window) ?? (await next());

  return { record, throttle, tooMany, limit };
}

export type Guards = ReturnType<typeof createGuards>;

// El cuerpo como paso de la ruta: `read` lo valida y lo convierte; si no sirve, 400. Lo leído queda
// para la ruta en `of(c)`, con su tipo.
export function readBody<T>(read: (raw: unknown) => T | undefined) {
  const key = Symbol('body');
  const step: MiddlewareHandler = async (c, next) => {
    const data = read(await c.req.json());
    if (data === undefined) return fail(c, 400, 'bad-request');
    c.set(key as never, data as never);
    await next();
  };
  return { step, of: (c: Context) => c.get(key as never) as T };
}

// Un cuerpo que solo tiene que cumplir su esquema.
export const bySchema =
  <T>(schema: { safeParse(raw: unknown): { success: true; data: T } | { success: false } }) =>
  (raw: unknown): T | undefined => {
    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  };

// Las claves de siempre: la dirección y, si hay, el dispositivo, con un prefijo por tema.
export const byAddress = (prefix: string) => (c: Context) => [`${prefix}:ip:${c.get('ipAddress')}`];
export const byAddressAndDevice = (prefix: string) => (c: Context) => [
  `${prefix}:ip:${c.get('ipAddress')}`,
  `${prefix}:device:${c.get('deviceId')}`,
];
