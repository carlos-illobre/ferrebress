// Lo que se hace con los roles (02 · R7, R1.3, R3.8; diseño de 02, §§ 18 y 19): crearlos, cambiarlos,
// borrarlos y darle roles a una persona. Lo que puede dejar sin quien administre corre bloqueando la
// fila del rol del sistema, cuenta antes y después y se deshace si queda alguien sin poder. Dar algo
// sin haber confirmado quién es (R3.8) también se deshace. Al confirmar, avisa que cambiaron los
// permisos (`users.permissions-changed`), así se olvida lo que estaba en memoria.
import { withIncluded } from '@ferrebress/shared/contracts/permissions';
import { maxRoleDescription, maxRoleName } from '@ferrebress/shared/contracts/roles';
import type { Kysely, Transaction } from 'kysely';
import type { AfterCommit } from '../../platform/events.ts';
import { newId } from '../../platform/ids.ts';
import type { Platform } from '../../platform/modules.ts';
import { administrationProblem, cleanRoleText, gives } from './roles.ts';
import { type Role, type RolesTables, rolesData } from './roles-data.ts';

export type RoleRefusal =
  | 'not-found'
  | 'changed'
  | 'bad-request'
  | 'role-name-taken'
  | 'role-in-use'
  | 'system-role'
  | 'self'
  | 'last-administrator'
  | 'confirm-first';

// Lo que cambió, para la auditoría: los permisos o los roles de antes y de después.
export type Changed<T> = { result: T; before: string[]; after: string[] };
export type RoleOutcome<T> = Changed<T> | { refused: RoleRefusal };

// Deshace la transacción y dice por qué.
export class Rollback extends Error {
  readonly refusal: RoleRefusal;
  constructor(refusal: RoleRefusal) {
    super(refusal);
    this.refusal = refusal;
  }
}

type Work<T> = (
  data: ReturnType<typeof rolesData>,
) => Promise<Changed<T> & { affects: string[] | 'all' }>;

// Corre `work` en una transacción; con `guard`, bajo el bloqueo de § 19 y con el control de R1.3.
async function inTransaction<T>(
  platform: Platform,
  asking: string,
  guard: boolean,
  work: Work<T>,
): Promise<RoleOutcome<T>> {
  try {
    const { changed, after } = await platform.db.transaction().execute(async (trx) => {
      const data = rolesData(trx as Kysely<RolesTables>);
      const before = guard ? await data.lockAndCount(asking) : undefined;
      const changed = await work(data);
      const problem = before && administrationProblem(before, await data.administration(asking));
      if (problem) throw new Rollback(problem);
      const userIds = changed.affects;
      const after: AfterCommit[] =
        userIds.length === 0
          ? []
          : await platform.events.publish(
              'users.permissions-changed',
              { userIds },
              trx as Transaction<unknown>,
            );
      return { changed, after };
    });
    for (const then of after) then();
    return { result: changed.result, before: changed.before, after: changed.after };
  } catch (error) {
    if (error instanceof Rollback) return { refused: error.refusal };
    throw error;
  }
}

const refuse = (refusal: RoleRefusal): never => {
  throw new Rollback(refusal);
};

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

type Data = ReturnType<typeof rolesData>;
type NewRole = RoleFields & { name: string; permissions: string[] };

// Crear (también duplicar): da permisos, pide confirmar (R3.8).
const createRole =
  (platform: Platform, confirmed: boolean, fields: NewRole) => async (data: Data) => {
    if (!confirmed) refuse('confirm-first');
    const after = withIncluded(fields.permissions as never);
    const { name, description } = clean(fields);
    const role =
      (await data.insertRole({
        id: newId(platform.clock),
        name: name as string,
        description: description ?? null,
      })) ?? refuse('role-name-taken');
    await data.setPermissions(role.id, after);
    return { result: role, before: [], after, affects: [] as string[] };
  };

// Cambiar el nombre, la descripción o los permisos; agregar permisos pide confirmar (R3.8).
const changeRole =
  (confirmed: boolean, id: string, version: number, fields: RoleFields) => async (data: Data) => {
    const before = await permissionsOfRole(data, id);
    const role =
      (await data.updateRole(id, version, clean(fields))) ?? refuse(await whyNot(data, id));
    const after = fields.permissions ? withIncluded(fields.permissions as never) : before;
    if (gives(before, after) && !confirmed) refuse('confirm-first');
    if (fields.permissions) await data.setPermissions(id, after);
    return { result: role, before, after, affects: 'all' as const };
  };

// Por qué no se guardó un cambio con versión: otro lo cambió antes, o ya no está.
const whyNot = async (data: Data, id: string): Promise<RoleRefusal> =>
  (await data.roleById(id)) ? 'changed' : 'not-found';

// Borrar: ni el del sistema ni uno que alguien tiene (R7.3, R7.4).
const removeRole = (id: string, version: number) => async (data: Data) => {
  const role = (await data.roleById(id)) ?? refuse('not-found');
  if (role.system) refuse('system-role');
  if (role.version !== version) refuse('changed');
  if (!(await data.deleteRole(id, version))) refuse('role-in-use');
  return { result: { name: role.name }, before: [], after: [], affects: [] as string[] };
};

type Setting = { asking: string; confirmed: boolean; userId: string; version: number };

// Los roles de una persona (R7.5): que existan; dar algo pide confirmar (R3.8). Para la auditoría,
// con nombres: así se lee aunque el rol se borre.
const setRolesOf =
  (platform: Platform, { asking, confirmed, userId, version }: Setting, roleIds: string[]) =>
  async (data: Data) => {
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
    const after = roleIds.map(nameOf);
    return { result: roleIds, before: before.map(nameOf), after, affects: [userId] };
  };

export function createRoleChanges(platform: Platform) {
  return {
    create: (asking: string, confirmed: boolean, fields: NewRole) =>
      inTransaction<Role>(platform, asking, false, createRole(platform, confirmed, fields)),
    change: (asking: string, confirmed: boolean, id: string, version: number, fields: RoleFields) =>
      inTransaction<Role>(platform, asking, true, changeRole(confirmed, id, version, fields)),
    remove: (asking: string, id: string, version: number) =>
      inTransaction<{ name: string }>(platform, asking, false, removeRole(id, version)),
    setUserRoles: (setting: Setting, roleIds: string[]) =>
      inTransaction<string[]>(
        platform,
        setting.asking,
        true,
        setRolesOf(platform, setting, roleIds),
      ),
  };
}

const permissionsOfRole = async (data: Data, roleId: string) =>
  (await data.rolePermissions())
    .filter((row) => row.roleId === roleId)
    .map((row) => row.permission)
    .sort();

export type RoleChanges = ReturnType<typeof createRoleChanges>;
