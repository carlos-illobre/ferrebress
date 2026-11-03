// Lo que users sabe de los permisos de cada persona (diseño de 02, §§ 16 y 17): los de una persona
// activa (la unión de sus roles), guardados en memoria hasta que cambian; si una persona tiene más
// que otra (R7.11); los roles de cada una para las pastillas (R3.1); quiénes tienen un permiso
// («Sin permiso», R7.7); y, al arrancar, los permisos nuevos que se le suman al Administrador (R7.4).
import {
  isPermission,
  type PermissionId,
  permissionIds,
} from '@ferrebress/shared/contracts/permissions';
import type { HoldersResponse, RoleSummary } from '@ferrebress/shared/contracts/roles';
import type { Kysely } from 'kysely';
import { createGuardedMemory } from '../../../platform/memory.ts';
import type { Platform } from '../../../platform/modules.ts';
import { displayName } from '../rules.ts';
import { type RolesTables, rolesData } from './data.ts';
import { outranks } from './rules.ts';

export function createAccess(platform: Platform) {
  const data = () => rolesData(platform.db as Kysely<RolesTables>);
  const memory = createGuardedMemory<string, PermissionId[]>();
  const permissionsOf = (userId: string): Promise<PermissionId[]> =>
    memory.load(userId, async () =>
      (await data().permissionsOf(userId, true)).filter(isPermission),
    );

  platform.events.on(
    'users.permissions-changed',
    async ({ userIds }) =>
      () =>
        memory.forget(userIds),
  );

  return {
    permissionsOf,

    // R7.11: la persona `target` tiene algún permiso que `asking` no tiene. Con los roles que tiene,
    // también si está dada de baja (dar de alta).
    async outranks(asking: string, target: string): Promise<boolean> {
      return outranks(
        (await data().permissionsOf(target, false)).filter(isPermission),
        await permissionsOf(asking),
      );
    },

    outranking: async (asking: string, userIds: readonly string[]) =>
      outranking(await permissionsOf(asking), await data().permissionsOfMany(userIds)),

    rolesForList: () => rolesForList(data()),
    holders: (permission: string, names: Names) => holdersOf(data(), permission, names),

    addNewPermissions: () => addNewPermissions(platform, memory),
  };
}

// R7.4: los permisos que el sistema todavía no conocía se le suman al Administrador, en una
// transacción (§ 16); queda anotado.
async function addNewPermissions(platform: Platform, memory: { forget: (keys: 'all') => void }) {
  const added = await platform.db
    .transaction()
    .execute((trx) => rolesData(trx as Kysely<RolesTables>).addNewPermissions(permissionIds));
  if (added.length === 0) return;
  memory.forget('all');
  platform.audit.record({
    type: 'role.permissions-added',
    at: platform.clock.now(),
    actor: { kind: 'system' },
    data: { permissions: added },
  });
}

type Data = ReturnType<typeof rolesData>;
type Names = Map<string, Parameters<typeof displayName>[0]>;

// De esas personas, las que tienen algún permiso que no está en `mine` (R7.11).
function outranking(mine: readonly string[], rows: { userId: string; permission: string }[]) {
  return new Set(rows.filter((row) => !mine.includes(row.permission)).map((row) => row.userId));
}

// Los roles para las pastillas y el filtro (R3.1).
async function rolesForList(data: Data): Promise<RoleSummary[]> {
  return (await data.roles()).map(({ id, name, description }) => ({ id, name, description }));
}

// «Sin permiso» (R7.7): solo nombres de personas activas, nunca correos.
async function holdersOf(data: Data, permission: string, names: Names): Promise<HoldersResponse> {
  const [roles, granting, holders] = await Promise.all([
    data.roles(),
    data.rolePermissions(),
    data.userRoles(true),
  ]);
  const nameOf = (userId: string) => {
    const user = names.get(userId);
    return user && (user.name ?? user.googleName) ? displayName(user) : 'Sin nombre';
  };
  // Cada persona una vez, aunque dos tengan el mismo nombre.
  const peopleWith = (allowed: (roleId: string) => boolean) =>
    [...new Set(holders.filter((row) => allowed(row.roleId)).map((row) => row.userId))].map(nameOf);
  const rolesWith = (wanted: string) =>
    new Set(granting.filter((row) => row.permission === wanted).map((row) => row.roleId));
  const having = rolesWith(permission);
  const grantors = rolesWith('roles.manage');
  return {
    roles: roles
      .filter((role) => having.has(role.id))
      .map((role) => ({
        id: role.id,
        name: role.name,
        people: peopleWith((id) => id === role.id),
      })),
    grantedBy: peopleWith((id) => grantors.has(id)),
  };
}

export type Access = ReturnType<typeof createAccess>;
