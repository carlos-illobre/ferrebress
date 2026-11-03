// Los pasos que una ruta declara antes de lo suyo, iguales para cualquier módulo: leer y validar
// el cuerpo, frenar por límite de pedidos (anotándolo en la auditoría una vez por ventana) y anotar
// en la auditoría con lo que trae cada pedido (diseño de 05, § 2): quién (la persona de la sesión o
// la recién probada; si no, alguien sin entrar), el dispositivo y la dirección. Así la ruta queda
// solo con su regla:
//
//   http.post('/api/x', body.step, guards.limit(keys, window), (c) => hacer(body.of(c)))
import type { Context, MiddlewareHandler } from 'hono';
import { deviceCodes } from './device.ts';
import { fail } from './http.ts';
import type { Window } from './limits/rate-limit.ts';
import type { Platform } from './modules.ts';
import type { RequestSession } from './session.ts';
import type { Actor, AuditEvent } from './storage/audit/event.ts';

// El tema que se anota cuando un pedido se frena, y cada cuánto como mucho por clave.
export type ThrottledAudit = { topic: string; window: Window };

// Una persona que el pedido acaba de probar (un pase de Google, una firma de huella verificados),
// todavía sin sesión. Solo la arman esas verificaciones: así un intento fallido nunca queda a nombre
// de la persona que se intentó usar (revisión de seguridad de 05, punto 1).
declare const provenBrand: unique symbol;
export type Proven = { userId: string; name?: string; readonly [provenBrand]: true };
export const provenPerson = (userId: string, name?: string): Proven =>
  ({ userId, ...(name && { name }) }) as Proven;

// Lo que pone el módulo; quién, cuándo, el dispositivo y la dirección los pone el paso.
export type RecordFields = Pick<
  AuditEvent,
  'targets' | 'changes' | 'data' | 'people' | 'deviceTime'
> & {
  proven?: Proven;
  // El correo que usó alguien sin entrar.
  email?: string;
};

function actorOf(c: Context, { proven, email }: RecordFields): Actor {
  const session = c.get('session') as RequestSession | undefined;
  if (session) return { kind: 'person', userId: session.userId };
  if (proven)
    return { kind: 'person', userId: proven.userId, ...(proven.name && { name: proven.name }) };
  return { kind: 'outsider', ...(email && { email }) };
}

export function createGuards({ audit, clock, limiter }: Platform, throttled: ThrottledAudit) {
  const record = (c: Context, type: string, fields: RecordFields = {}) => {
    const { proven: _proven, email: _email, ...rest } = fields;
    audit.record({
      type,
      at: clock.now(),
      actor: actorOf(c, fields),
      device: deviceCodes((name) => c.req.header(name)),
      ipAddress: c.get('ipAddress') as string,
      ...rest,
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
      // Se anota el tema y por qué se frenó, nunca la clave: lleva correos y dispositivos (§ 2.2).
      if (limiter.hit(`audit:${key}`, throttled.window).allowed)
        record(c, 'request.throttled', { data: { topic: throttled.topic, by: key.split(':')[1] } });
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
