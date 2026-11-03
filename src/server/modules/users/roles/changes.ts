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
import { type By, type Holders, setHolders } from './holding.ts';
import { type AuditFields, type Data, type Done, refuse, underLock } from './lock.ts';
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

type NewRole = RoleFields & { name: string; permissions: string[]; give?: string[] | undefined };

// Cómo es un rol para la auditoría.
const shownAs = (role: Pick<Role, 'name' | 'description'>, permissions: readonly string[]) => ({
  name: role.name,
  description: role.description,
  permissions: [...permissions].sort(),
});
type Shown = ReturnType<typeof shownAs>;

// La línea de un rol creado, cambiado o borrado (05 · R2.4, R2.5): el rol con su nombre, y solo lo
// que cambió, con lo de antes y lo de después.
function roleRecord(roleId: string, before: Shown | null, after: Shown | null): AuditFields {
  const fields = ['name', 'description', 'permissions'] as const;
  const changed = fields.filter(
    (field) => JSON.stringify(before?.[field] ?? null) !== JSON.stringify(after?.[field] ?? null),
  );
  return {
    targets: [{ kind: 'role', id: roleId, name: (after ?? before)?.name as string }],
    changes: Object.fromEntries(
      changed.map((field) => [
        field,
        { before: before?.[field] ?? null, after: after?.[field] ?? null },
      ]),
    ),
  };
}

// Crear (también duplicar): da permisos, pide confirmar (R3.8). Con un tope de roles (seguridad, 38).
const createRole =
  (platform: Platform, confirmed: boolean, fields: NewRole, by: By) =>
  async (data: Data): Promise<Done<Role & { permissions: string[] }>> => {
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
    const people = await setHolders(data, role, { give: fields.give }, { confirmed, by });
    const affects = people.map((one) => one.userId);
    const audit = roleRecord(role.id, null, after);
    return { result: { ...role, permissions: after.permissions }, audit, affects, people };
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

// Lo que el pedido cambia de verdad del rol: si nada, su versión no sube (diseño de 02, § 18).
const differs = (old: Role, before: string[], fields: RoleFields, permissions: string[]) => {
  const { name, description } = clean(fields);
  return (
    (name !== undefined && name !== old.name) ||
    (description !== undefined && description !== old.description) ||
    permissions.join() !== before.join()
  );
};

// El rol con lo nuevo; si no cambia nada suyo, igual tiene que ser la versión que se vio (§ 19).
const saved = async (data: Data, old: Role, version: number, fields: RoleFields | false) => {
  if (fields) return (await renamed(data, old.id, version, fields)) ?? refuse('changed');
  return old.version === version ? old : refuse('changed');
};

// Guardar todo junto (R7.13): el nombre, la descripción, los permisos y a quiénes se les da o se les
// saca. Agregar permisos o dar el rol pide confirmar (R3.8).
const changeRole =
  (confirmed: boolean, id: string, version: number, fields: RoleFields & Holders, by: By) =>
  async (data: Data): Promise<Done<Role>> => {
    const old = (await data.roleById(id)) ?? refuse('not-found');
    const before = await permissionsOfRole(data, id);
    const permissions = withChanges(before, fields.permissions);
    const changes = differs(old, before, fields, permissions);
    const role = await saved(data, old, version, changes && fields);
    if (gives(before, permissions) && !confirmed) refuse('confirm-first');
    if (changes) await data.setPermissions(id, permissions);
    const people = await setHolders(data, role, fields, { confirmed, by });
    if (!changes) return { result: role, affects: people.map((one) => one.userId), people };
    const audit = roleRecord(id, shownAs(old, before), shownAs(role, permissions));
    return { result: role, audit, affects: 'all', people };
  };

// Los permisos que va a tener: los pedidos con lo que incluyen, o los de antes.
const withChanges = (before: string[], asked: string[] | undefined) =>
  asked ? [...withIncluded(asked as never)].sort() : before;

// Borrar: ni el del sistema ni uno que alguien tiene (R7.3, R7.4).
const removeRole =
  (id: string, version: number) =>
  async (data: Data): Promise<Done<{ name: string }>> => {
    const role = (await data.roleById(id)) ?? refuse('not-found');
    if (role.system) refuse('system-role');
    if (role.version !== version) refuse('changed');
    const before = shownAs(role, await permissionsOfRole(data, id));
    if (!(await data.deleteRole(id, version))) refuse('role-in-use');
    return { result: { name: role.name }, audit: roleRecord(id, before, null), affects: [] };
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
    const audit = {
      targets: [{ kind: 'person' as const, id: userId }],
      changes: { roles: { before: before.map(nameOf), after: roleIds.map(nameOf) } },
    };
    return { result: roleIds, audit, affects: [userId] };
  };

export function createRoleChanges(platform: Platform) {
  const run = <T>(asking: string, work: (data: Data) => Promise<Done<T>>) =>
    underLock(platform, asking, 'roles.manage', work);
  const by = (asking: string): By => ({ userId: asking, at: platform.clock.now() });
  return {
    create: (asking: string, confirmed: boolean, fields: NewRole) =>
      run(asking, createRole(platform, confirmed, fields, by(asking))),
    change: (
      asking: string,
      confirmed: boolean,
      id: string,
      version: number,
      fields: RoleFields & Holders,
    ) => run(asking, changeRole(confirmed, id, version, fields, by(asking))),
    remove: (asking: string, id: string, version: number) => run(asking, removeRole(id, version)),
    setUserRoles: (setting: Setting, roleIds: string[]) =>
      run(setting.asking, setRolesOf(platform, setting, roleIds)),
  };
}

const permissionsOfRole = async (data: Data, roleId: string) =>
  (await data.rolePermissionsOf(roleId)).sort();

export type RoleChanges = ReturnType<typeof createRoleChanges>;
export type { LockOutcome as RoleOutcome, Refused as RoleRefusal } from './lock.ts';
