// Lo que se hace con los roles (02 · R7, R1.3, R3.8; diseño de 02, §§ 18 y 19): crearlos, cambiarlos,
// borrarlos y darle roles a una persona. Todo corre bajo el bloqueo de lock.ts, con «Administrar
// roles». Dar algo sin haber confirmado quién es (R3.8) se deshace. Cada cambio deja en la
// auditoría lo de antes y lo de después, con nombres e id, así se lee aunque el rol se renombre o se
// borre.
import { withIncluded } from '@ferrebress/shared/contracts/permissions';
import { maxRoleDescription, maxRoleName, maxRoles } from '@ferrebress/shared/contracts/roles';
import { newId } from '../../../platform/ids.ts';
import type { Platform } from '../../../platform/modules.ts';
import type { Role } from './data.ts';
import { type Data, type Done, refuse, underLock } from './lock.ts';
import { cleanRoleText, gives } from './rules.ts';

const clean = (fields: Pick<RoleFields, 'name' | 'description'>) => ({
  ...(fields.name !== undefined && {
    name: cleanRoleText(fields.name, maxRoleName) ?? refuse('bad-request'),
  }),
  ...(fields.description !== undefined && {
    description: cleanRoleText(fields.description, maxRoleDescription),
  }),
});

export type RoleFields = {
  name?: string | undefined;
  description?: string | null | undefined;
  permissions?: string[] | undefined;
};

type NewRole = RoleFields & { name: string; permissions: string[] };

// Cómo es un rol para la auditoría.
const shownAs = (role: Pick<Role, 'name' | 'description'>, permissions: readonly string[]) => ({
  name: role.name,
  description: role.description,
  permissions: [...permissions].sort(),
});

// Crear (también duplicar): da permisos, pide confirmar (R3.8). Con un tope de roles (seguridad, 38).
const createRole =
  (platform: Platform, confirmed: boolean, fields: NewRole) =>
  async (data: Data): Promise<Done<Role>> => {
    if (!confirmed) refuse('confirm-first');
    if ((await data.roles()).length >= maxRoles) refuse('too-many-roles');
    const permissions = withIncluded(fields.permissions as never);
    const { name, description } = clean(fields);
    const role =
      (await data.insertRole({
        id: newId(platform.clock),
        name: name as string,
        description: description ?? null,
      })) ?? refuse('role-name-taken');
    await data.setPermissions(role.id, permissions);
    const after = shownAs(role, permissions);
    return { result: role, audit: { roleId: role.id, before: null, after }, affects: [] };
  };

// Un nombre que ya tiene otro rol, sin importar mayúsculas: el índice único lo rechaza (`23505`).
const renamed = async (data: Data, id: string, version: number, fields: RoleFields) => {
  try {
    return await data.updateRole(id, version, clean(fields));
  } catch (error) {
    if ((error as { code?: string }).code === '23505') refuse('role-name-taken');
    throw error;
  }
};

// Cambiar el nombre, la descripción o los permisos; agregar permisos pide confirmar (R3.8).
const changeRole =
  (confirmed: boolean, id: string, version: number, fields: RoleFields) =>
  async (data: Data): Promise<Done<Role>> => {
    const old = (await data.roleById(id)) ?? refuse('not-found');
    const before = await permissionsOfRole(data, id);
    const role = (await renamed(data, id, version, fields)) ?? refuse('changed');
    const permissions = fields.permissions ? withIncluded(fields.permissions as never) : before;
    if (gives(before, permissions) && !confirmed) refuse('confirm-first');
    if (fields.permissions) await data.setPermissions(id, permissions);
    const audit = { roleId: id, before: shownAs(old, before), after: shownAs(role, permissions) };
    return { result: role, audit, affects: 'all' };
  };

// Borrar: ni el del sistema ni uno que alguien tiene (R7.3, R7.4).
const removeRole =
  (id: string, version: number) =>
  async (data: Data): Promise<Done<{ name: string }>> => {
    const role = (await data.roleById(id)) ?? refuse('not-found');
    if (role.system) refuse('system-role');
    if (role.version !== version) refuse('changed');
    const before = shownAs(role, await permissionsOfRole(data, id));
    if (!(await data.deleteRole(id, version))) refuse('role-in-use');
    return { result: { name: role.name }, audit: { roleId: id, before, after: null }, affects: [] };
  };

type Setting = { asking: string; confirmed: boolean; userId: string; version: number };

// Los roles de una persona (R7.5): que existan; dar algo pide confirmar (R3.8). Para la auditoría,
// con nombres: así se lee aunque el rol se borre.
const setRolesOf =
  (platform: Platform, { asking, confirmed, userId, version }: Setting, roleIds: string[]) =>
  async (data: Data): Promise<Done<string[]>> => {
    // Todos los roles existen: los de antes, por la clave foránea; los nuevos, se controla acá.
    const names = new Map((await data.roles()).map((role) => [role.id, role.name]));
    const nameOf = (roleId: string) => names.get(roleId) as string;
    if (!roleIds.every((roleId) => names.has(roleId))) refuse('bad-request');
    const before = await data.roleIdsOf(userId);
    const permissionsBefore = await data.permissionsOf(userId, false);
    const by = { userId: asking, at: platform.clock.now() };
    if (!(await data.setUserRoles(userId, version, roleIds, by)))
      refuse((await data.userExists(userId)) ? 'changed' : 'not-found');
    if (gives(permissionsBefore, await data.permissionsOf(userId, false)) && !confirmed)
      refuse('confirm-first');
    const audit = { before: before.map(nameOf), after: roleIds.map(nameOf) };
    return { result: roleIds, audit, affects: [userId] };
  };

export function createRoleChanges(platform: Platform) {
  const run = <T>(asking: string, work: (data: Data) => Promise<Done<T>>) =>
    underLock(platform, asking, 'roles.manage', work);
  return {
    create: (asking: string, confirmed: boolean, fields: NewRole) =>
      run(asking, createRole(platform, confirmed, fields)),
    change: (asking: string, confirmed: boolean, id: string, version: number, fields: RoleFields) =>
      run(asking, changeRole(confirmed, id, version, fields)),
    remove: (asking: string, id: string, version: number) => run(asking, removeRole(id, version)),
    setUserRoles: (setting: Setting, roleIds: string[]) =>
      run(setting.asking, setRolesOf(platform, setting, roleIds)),
  };
}

const permissionsOfRole = async (data: Data, roleId: string) =>
  (await data.rolePermissions())
    .filter((row) => row.roleId === roleId)
    .map((row) => row.permission)
    .sort();

export type RoleChanges = ReturnType<typeof createRoleChanges>;
export type { LockOutcome as RoleOutcome, Refused as RoleRefusal } from './lock.ts';
