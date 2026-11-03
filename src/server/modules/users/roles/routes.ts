// Las rutas de los roles (02 · R7; diseño de 02, § 18): verlos, crearlos, cambiarlos, borrarlos, darle
// roles a una persona y, para «Sin permiso», quiénes tienen un permiso. Todas con su permiso y con
// el límite de cambios de Usuarios; lo que da algo pide Google o la huella reciente (R3.8). Cada
// cambio queda en la auditoría con lo de antes y lo de después, con nombres (así se lee aunque el
// rol se borre); cada rechazo, una vez por minuto por motivo y por quien lo pide.
import { isPermission } from '@ferrebress/shared/contracts/permissions';
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
import { bySchema, type Guards, readBody } from '../../../platform/guards.ts';
import { fail, uuidParams } from '../../../platform/http.ts';
import type { Platform } from '../../../platform/modules.ts';
import { sessionOf } from '../../../platform/session.ts';
import { type UsersTables, usersData } from '../data.ts';
import { confirmed, statusOf, usersGuards } from '../guards.ts';
import type { Access } from './access.ts';
import type { RoleChanges, RoleOutcome } from './changes.ts';
import { type RolesTables, rolesData } from './data.ts';

// Los roles como los ve la pestaña, con sus permisos. Quiénes los tienen lo dice la lista de
// Usuarios, que ya trae los roles de cada persona (diseño de 02, § 18).
export async function roleRows(platform: Platform): Promise<RoleRow[]> {
  const data = rolesData(platform.db as Kysely<RolesTables>);
  const [roles, granting] = await Promise.all([data.roles(), data.rolePermissions()]);
  return roles.map((role) => ({
    ...role,
    permissions: granting
      .filter((row) => row.roleId === role.id)
      .map((row) => row.permission)
      .filter(isPermission)
      .sort(),
  }));
}

type Refused = Extract<RoleOutcome<unknown>, { refused: unknown }>;
type Saved = Exclude<RoleOutcome<unknown>, { refused: unknown }>;

// Lo que salió, en la auditoría: la línea del rol si cambió y una por cada persona a la que se le dio
// o se le sacó, todas con el mismo id del guardado (diseño de 02, § 21).
function recordDone(guards: Guards, c: Context, type: string, target: string, outcome: Saved) {
  const data = outcome.people.length > 0 ? { data: { save: crypto.randomUUID() } } : {};
  if (outcome.audit) guards.record(c, type, { ...outcome.audit, ...data });
  for (const one of outcome.people)
    guards.record(c, 'user.roles-changed', {
      targets: [
        { kind: 'person', id: one.userId },
        // Las personas cambian al guardar un rol: `target` es su nombre (05 · R2.4).
        { kind: 'role', id: one.roleId, name: target },
      ],
      changes: { roles: { before: one.before, after: one.after } },
      ...data,
    });
}

// Un rechazo: anotado una vez por minuto por motivo y por quien lo pide, y contestado.
function refusing(guards: Guards) {
  return (c: Context, outcome: Refused, target: string) => {
    const asking = sessionOf(c).userId;
    guards.recordOnce(c, `roles:${outcome.refused}:${asking}`, 'users.rejected', {
      data: { target, reason: outcome.refused, ...outcome.detail },
    });
    return fail(c, statusOf[outcome.refused], outcome.refused, outcome.detail);
  };
}

type RoleRoute = {
  platform: Platform;
  changes: RoleChanges;
  refused: ReturnType<typeof refusing>;
  done: (c: Context, type: string, target: string, outcome: Saved) => void;
  // Con sesión, «Administrar roles» y el límite de cambios.
  manage: MiddlewareHandler[];
};

export function registerRoleRoutes(platform: Platform, changes: RoleChanges, access: Access) {
  const { http, sessions, permissions } = platform;
  const { guards, limited } = usersGuards(platform);
  const require = permissions.require('roles.manage');
  const route = {
    platform,
    changes,
    refused: refusing(guards),
    done: (c: Context, type: string, target: string, outcome: Saved) =>
      recordDone(guards, c, type, target, outcome),
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

// Un rol como lo ve la pestaña, recién guardado: sin volver a leer todos.
async function rowOf(platform: Platform, roleId: string): Promise<RoleRow | undefined> {
  const data = rolesData(platform.db as Kysely<RolesTables>);
  const [role, permissions] = await Promise.all([
    data.roleById(roleId),
    data.rolePermissionsOf(roleId),
  ]);
  return role && { ...role, permissions: permissions.filter(isPermission).sort() };
}

// Crear, cambiar y borrar roles.
function registerRoleEdits({ platform, changes, refused, done, manage }: RoleRoute) {
  const { http, sessions } = platform;
  const id = uuidParams('id');
  const creating = readBody(bySchema(createRoleBody));
  http.post('/api/roles', sessions.require, ...manage, creating.step, async (c) => {
    const body = creating.of(c);
    const outcome = await changes.create(sessionOf(c).userId, confirmed(platform, c), body);
    if ('refused' in outcome) return refused(c, outcome, body.name);
    done(c, 'role.created', outcome.result.name, outcome);
    return c.json({ role: outcome.result });
  });
  const changing = readBody(bySchema(changeRoleBody));
  http.post('/api/roles/:id', sessions.require, ...manage, id, changing.step, async (c) => {
    const { version, ...fields } = changing.of(c);
    const roleId = c.req.param('id') as string;
    const asking = sessionOf(c).userId;
    const outcome = await changes.change(asking, confirmed(platform, c), roleId, version, fields);
    if ('refused' in outcome) return refused(c, outcome, roleId);
    done(c, 'role.changed', outcome.result.name, outcome);
    return c.json({ role: await rowOf(platform, roleId) });
  });
  const versioned = readBody(bySchema(versionOnly));
  http.post('/api/roles/:id/delete', sessions.require, ...manage, id, versioned.step, async (c) => {
    const roleId = c.req.param('id') as string;
    const outcome = await changes.remove(sessionOf(c).userId, roleId, versioned.of(c).version);
    if ('refused' in outcome) return refused(c, outcome, roleId);
    done(c, 'role.deleted', outcome.result.name, outcome);
    return c.json({ removed: true });
  });
}

// Los roles de una persona (R7.5): la tarjeta de la persona y el diálogo de autorizar, que mandan el
// conjunto nuevo. La pestaña Roles da y saca con el rol, en give y take.
function registerHolding({ platform, changes, refused, done, manage }: RoleRoute) {
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
      if ('refused' in outcome) return refused(c, outcome, userId);
      done(c, 'user.roles-changed', userId, outcome);
      return c.json({ roles });
    },
  );
}
