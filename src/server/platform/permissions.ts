// El paso de permisos (diseño de 02, §§ 17 y 21): el módulo que sabe de roles (users) da cómo se
// saben los permisos de alguien, y cualquier módulo pide el suyo en sus rutas con `require(id)`,
// después de la sesión. Sin el permiso, 403 con el que falta, sin cerrar la sesión (02 · R7.6), y
// se anota una vez por minuto por persona y permiso. Con cualquier sesión deja la huella de los
// permisos en el pedido, que la cabecera lleva para que la aplicación sepa que cambiaron (R7.8).
import type { Context, MiddlewareHandler } from 'hono';
import { permissionsHash } from '../../shared/contracts/can.ts';
import type { PermissionId } from '../../shared/contracts/permissions.ts';
import type { Clock } from './clock.ts';
import { fail } from './http.ts';
import type { RateLimiter } from './limits/rate-limit.ts';
import { type SessionGate, sessionOf } from './session.ts';
import type { AuditLog } from './storage/audit/write.ts';

type Resolve = (userId: string) => Promise<readonly string[]>;

const deniedAudit = { max: 1, windowMs: 60_000 };

export function createPermissionGate(
  {
    audit,
    clock,
    limiter,
  }: { audit: Pick<AuditLog, 'record'>; clock: Clock; limiter: RateLimiter },
  sessions: SessionGate,
) {
  let resolve: Resolve = async () => {
    throw new Error('Nadie dio cómo se saben los permisos');
  };
  sessions.onSession(async (c, session) => {
    const granted = await resolve(session.userId);
    c.set('permissions', granted);
    c.set('permissionsHash', permissionsHash(granted));
  });
  const denied = (c: Context, permission: PermissionId) => {
    const { userId } = sessionOf(c);
    if (limiter.hit(`audit:permission.denied:${userId}:${permission}`, deniedAudit).allowed)
      audit.record({
        type: 'permission.denied',
        at: clock.now(),
        actor: { kind: 'person', userId },
        ipAddress: c.get('ipAddress') as string,
        data: { permission, path: c.req.path },
      });
    return fail(c, 403, 'forbidden', { permission });
  };
  return {
    provide: (given: Resolve) => {
      resolve = given;
    },
    require:
      (permission: PermissionId): MiddlewareHandler =>
      async (c, next) =>
        permissionsOf(c).includes(permission) ? await next() : denied(c, permission),
  };
}

export type PermissionGate = ReturnType<typeof createPermissionGate>;

// Los permisos de quien pregunta, que dejó la sesión del pedido.
export const permissionsOf = (c: Context): readonly string[] =>
  (c.get('permissions') as readonly string[] | undefined) ?? [];

// La huella para la cabecera; sin sesión, ninguna.
export const permissionsHashOf = (c: Context): string | undefined =>
  c.get('permissionsHash') as string | undefined;
