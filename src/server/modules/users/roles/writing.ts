// Las escrituras de los roles a la base (diseño de 02, §§ 15, 18 y 19): los roles y sus permisos,
// quién tiene cada uno y los permisos que el sistema ya conoce. Con la versión que vio quien cambia.
import { type Kysely, sql } from 'kysely';
import { type RolesTables, roleColumns } from './tables.ts';

type Db = Kysely<RolesTables>;
const bump = () => sql<number>`version + 1`;

// Escribir roles.
export function writingRoles(db: Db) {
  return {
    insertRole: (role: { id: string; name: string; description: string | null }) =>
      db
        .insertInto('users.roles')
        .values(role)
        .onConflict((oc) => oc.expression(sql`lower(name)`).doNothing())
        .returning(roleColumns)
        .executeTakeFirst(),

    updateRole: (
      id: string,
      version: number,
      set: { name?: string; description?: string | null },
    ) =>
      db
        .updateTable('users.roles')
        .set({ ...set, version: bump() })
        .where('id', '=', id)
        .where('version', '=', version)
        .returning(roleColumns)
        .executeTakeFirst(),

    // Solo si nadie lo tiene y no es el del sistema (R7.3, R7.4).
    deleteRole: async (id: string, version: number): Promise<boolean> =>
      (
        await db
          .deleteFrom('users.roles')
          .where('id', '=', id)
          .where('version', '=', version)
          .where('system', '=', false)
          .where(({ not, exists, selectFrom }) =>
            not(exists(selectFrom('users.user_roles').select('user_id').where('role_id', '=', id))),
          )
          .executeTakeFirst()
      ).numDeletedRows === 1n,
  };
}

// Escribir quién tiene cada rol.
export function writingHolders(db: Db) {
  return {
    // Los roles de una persona, con quién los cambió; sube su versión (§ 19).
    setUserRoles: async (
      userId: string,
      version: number,
      roleIds: readonly string[],
      by: { userId: string; at: Date },
    ): Promise<boolean> => {
      const bumped = await db
        .updateTable('users.users')
        .set({ version: bump(), roles_changed_by: by.userId, roles_changed_at: by.at })
        .where('id', '=', userId)
        .where('version', '=', version)
        .executeTakeFirst();
      if (bumped.numUpdatedRows !== 1n) return false;
      await db.deleteFrom('users.user_roles').where('user_id', '=', userId).execute();
      await db
        .insertInto('users.user_roles')
        .values(roleIds.map((roleId) => ({ user_id: userId, role_id: roleId })))
        .execute();
      return true;
    },
  };
}

// Escribir los permisos de cada rol, y los permisos nuevos.
export function writingPermissions(db: Db) {
  return {
    setPermissions: async (roleId: string, permissions: readonly string[]) => {
      await db.deleteFrom('users.role_permissions').where('role_id', '=', roleId).execute();
      await db
        .insertInto('users.role_permissions')
        .values(permissions.map((permission) => ({ role_id: roleId, permission })))
        .execute();
    },

    // R7.4: los permisos que el sistema todavía no conocía, anotados y sumados al rol del sistema.
    addNewPermissions: async (ids: readonly string[]): Promise<string[]> => {
      const added = (
        await db
          .insertInto('users.known_permissions')
          .values(ids.map((permission) => ({ permission })))
          .onConflict((oc) => oc.column('permission').doNothing())
          .returning('permission')
          .execute()
      ).map((row) => row.permission);
      if (added.length > 0)
        await sql`insert into users.role_permissions (role_id, permission)
          select roles.id, p from users.roles, unnest(${added}::text[]) as p where roles.system
          on conflict do nothing`.execute(db);
      return added;
    },
  };
}
