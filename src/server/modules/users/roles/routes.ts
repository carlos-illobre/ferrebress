// Las rutas de los roles (02 · R7; diseño de 02, § 18): verlos, crearlos, cambiarlos, borrarlos, darle
// roles a una persona y, para «Sin permiso», quiénes tienen un permiso. Todas con su permiso y con
// el límite de cambios de Usuarios; lo que da algo pide Google o la huella reciente (R3.8). Cada
// cambio queda en la auditoría con lo de antes y lo de después, con nombres (así se lee aunque el
// rol se borre); cada rechazo, una vez por minuto por motivo y por quien lo pide.
import { isPermission, type PermissionId } from '@ferrebress/shared/contracts/permissions';
import {
  changeRoleBody,
  createRoleBody,
  type RoleRow,
  type RolesResponse,
  userRolesBody,
  versionOnly,
} from '@ferrebress/shared/contracts/roles';
import type { Context, MiddlewareHandler } from 'hono';
import type { Kysely } from 'kysely';
import { bySchema, createGuards, type Guards, readBody } from '../../../platform/guards.ts';
import { fail, uuidParams } from '../../../platform/http.ts';
import type { Platform } from '../../../platform/modules.ts';
import { sessionOf } from '../../../platform/session.ts';
import { type UsersTables, usersData } from '../data.ts';
import { confirmed, usersSettings } from '../routes.ts';
import type { Access } from './access.ts';
import type { RoleChanges, RoleOutcome } from './changes.ts';
import { type RolesTables, rolesData } from './data.ts';
import type { PersonChange } from './lock.ts';

const statusOf: Record<string, 400 | 403 | 404> = {
  'not-found': 404,
  'bad-request': 400,
  'no-roles': 400,
  'confirm-first': 403,
  forbidden: 403,
};

// Los roles como los ve la pestaña, con sus permisos. Quiénes los tienen lo dice la lista de
// Usuarios, que ya trae los roles de cada persona (diseño de 02, § 18).
export async function roleRows(platform: Platform): Promise<RoleRow[]> {
  const data = rolesData(platform.db as Kysely<RolesTables>);
  const roles = await data.roles();
  const granting = await data.rolePermissions();
  return roles.map((role) => ({
    ...role,
    permissions: granting
      .filter((row) => row.roleId === role.id)
      .map((row) => row.permission)
      .filter(isPermission)
      .sort(),
  }));
}

type Answer = <T>(
  c: Context,
  outcome: RoleOutcome<T>,
  type: string,
  target: string,
) => Response | undefined;

// Lo que salió, en la auditoría: la línea del rol si cambió y una por cada persona a la que se le dio
// o se le sacó, todas con el mismo id del guardado (diseño de 02, § 21).
function recordDone(
  guards: Guards,
  c: Context,
  { type, target, asking }: { type: string; target: string; asking: string },
  outcome: { audit: Record<string, unknown>; people: PersonChange[] },
) {
  const save = outcome.people.length > 0 ? { save: crypto.randomUUID() } : {};
  if (Object.keys(outcome.audit).length > 0)
    guards.record(c, type, { userId: asking, data: { target, ...outcome.audit, ...save } });
  for (const one of outcome.people)
    guards.record(c, 'user.roles-changed', {
      userId: asking,
      data: {
        target: one.userId,
        roleId: one.roleId,
        before: one.before,
        after: one.after,
        ...save,
      },
    });
}

// La respuesta de un cambio: nada (sigue la ruta) si salió, o el rechazo, anotado.
function answering(platform: Platform, guards: Guards): Answer {
  return (c, outcome, type, target) => {
    const asking = sessionOf(c).userId;
    if ('refused' in outcome) {
      const key = `audit:roles:${outcome.refused}:${asking}`;
      if (platform.limiter.hit(key, usersSettings.throttledAudit).allowed)
        guards.record(c, 'users.rejected', {
          userId: asking,
          data: { target, reason: outcome.refused, ...outcome.detail },
        });
      return fail(c, statusOf[outcome.refused] ?? 409, outcome.refused, outcome.detail);
    }
    recordDone(guards, c, { type, target, asking }, outcome);
    return undefined;
  };
}

type RoleRoute = {
  platform: Platform;
  changes: RoleChanges;
  answer: Answer;
  // Con sesión, «Administrar roles» y el límite de cambios.
  manage: MiddlewareHandler[];
};

export function registerRoleRoutes(platform: Platform, changes: RoleChanges, access: Access) {
  const { http, sessions, permissions } = platform;
  const guards = createGuards(platform, {
    event: 'users.throttled',
    window: usersSettings.throttledAudit,
  });
  const limited = guards.limit((c) => [`users:session:${sessionOf(c).id}`], usersSettings.changes);
  const require = permissions.require('roles.manage');
  const route = {
    platform,
    changes,
    answer: answering(platform, guards),
    manage: [require, limited],
  };
  http.get('/api/roles', sessions.require, require, async (c) =>
    c.json<RolesResponse>({ roles: await roleRows(platform) }),
  );
  registerRoleEdits(route);
  registerHolding(route);
  // «Sin permiso» (R7.7): con cualquier sesión, solo nombres de personas activas.
  http.get('/api/permissions/:permission/holders', sessions.require, async (c) => {
    const permission = c.req.param('permission');
    if (!isPermission(permission)) return fail(c, 404, 'not-found');
    const users = await usersData(platform.db as Kysely<UsersTables>).findAll();
    return c.json(await access.holders(permission, new Map(users.map((user) => [user.id, user]))));
  });
}

const rowOf = async (platform: Platform, roleId: string) =>
  (await roleRows(platform)).find((row) => row.id === roleId);

// Crear, cambiar y borrar roles.
function registerRoleEdits({ platform, changes, answer, manage }: RoleRoute) {
  const { http, sessions } = platform;
  const id = uuidParams('id');
  const creating = readBody(bySchema(createRoleBody));
  http.post('/api/roles', sessions.require, ...manage, creating.step, async (c) => {
    const body = creating.of(c);
    const outcome = await changes.create(sessionOf(c).userId, confirmed(platform, c), body);
    if ('refused' in outcome) return answer(c, outcome, 'role.created', body.name);
    answer(c, outcome, 'role.created', outcome.result.name);
    const { permissions } = outcome.audit.after as { permissions: PermissionId[] };
    return c.json({ role: { ...outcome.result, permissions } });
  });
  const changing = readBody(bySchema(changeRoleBody));
  http.post('/api/roles/:id', sessions.require, ...manage, id, changing.step, async (c) => {
    const { version, ...fields } = changing.of(c);
    const roleId = c.req.param('id') as string;
    const asking = sessionOf(c).userId;
    const outcome = await changes.change(asking, confirmed(platform, c), roleId, version, fields);
    const target = 'refused' in outcome ? roleId : outcome.result.name;
    const row = () => rowOf(platform, roleId);
    return answer(c, outcome, 'role.changed', target) ?? c.json({ role: await row() });
  });
  const versioned = readBody(bySchema(versionOnly));
  http.post('/api/roles/:id/delete', sessions.require, ...manage, id, versioned.step, async (c) => {
    const roleId = c.req.param('id') as string;
    const outcome = await changes.remove(sessionOf(c).userId, roleId, versioned.of(c).version);
    const target = 'refused' in outcome ? roleId : outcome.result.name;
    return answer(c, outcome, 'role.deleted', target) ?? c.json({ removed: true });
  });
}

// Los roles de una persona (R7.5): la tarjeta de la persona y el diálogo de autorizar, que mandan el
// conjunto nuevo. La pestaña Roles da y saca con el rol, en give y take.
function registerHolding({ platform, changes, answer, manage }: RoleRoute) {
  const setting = readBody(bySchema(userRolesBody));
  const id = uuidParams('id');
  platform.http.post(
    '/api/users/:id/roles',
    platform.sessions.require,
    ...manage,
    id,
    setting.step,
    async (c) => {
      const { version, roles } = setting.of(c);
      if (roles.length === 0) return fail(c, 400, 'no-roles');
      const userId = c.req.param('id') as string;
      const asking = sessionOf(c).userId;
      const outcome = await changes.setUserRoles(
        { asking, confirmed: confirmed(platform, c), userId, version },
        roles,
      );
      return answer(c, outcome, 'user.roles-changed', userId) ?? c.json({ roles });
    },
  );
}
