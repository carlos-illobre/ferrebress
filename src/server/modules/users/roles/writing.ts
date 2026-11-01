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

// Las personas de un rol al guardarlo (R7.13; diseño de 02, § 18), en cuatro consultas para cualquier
// cantidad: bloquear y leer, dar, sacar y marcar a quienes cambiaron de verdad.
export type Holding = { id: string; active: boolean; roleIds: string[]; roleNames: string[] };

export function writingRoleHolders(db: Db) {
  return {
    // Bloquea las filas pedidas, en orden de id, y trae si están activas y sus roles.
    lockPeople: async (ids: readonly string[]): Promise<Holding[]> =>
      (
        await sql<{ id: string; active: boolean; role_ids: string[]; role_names: string[] }>`
          select u.id, u.active,
            array(select ur.role_id from users.user_roles ur join users.roles r on r.id = ur.role_id
              where ur.user_id = u.id order by r.name, r.id) as role_ids,
            array(select r.name from users.user_roles ur join users.roles r on r.id = ur.role_id
              where ur.user_id = u.id order by r.name, r.id) as role_names
          from users.users u where u.id = any(${ids}::uuid[]) order by u.id for update of u`.execute(
          db,
        )
      ).rows.map((row) => ({
        id: row.id,
        active: row.active,
        roleIds: row.role_ids,
        roleNames: row.role_names,
      })),

    // Dar el rol: a quienes ya lo tenían no les cambia nada.
    giveRole: async (roleId: string, ids: readonly string[]): Promise<string[]> =>
      (
        await sql<{ user_id: string }>`insert into users.user_roles (user_id, role_id)
          select p, ${roleId}::uuid from unnest(${ids}::uuid[]) as p
          on conflict do nothing returning user_id`.execute(db)
      ).rows.map((row) => row.user_id),

    // Sacar el rol: a quienes no lo tenían no les cambia nada.
    takeRole: async (roleId: string, ids: readonly string[]): Promise<string[]> =>
      (
        await sql<{ user_id: string }>`delete from users.user_roles
          where role_id = ${roleId}::uuid and user_id = any(${ids}::uuid[])
          returning user_id`.execute(db)
      ).rows.map((row) => row.user_id),

    // Solo a quienes cambiaron: su versión y quién les cambió los roles (§ 19).
    markRolesChanged: async (ids: readonly string[], by: { userId: string; at: Date }) => {
      await sql`update users.users set version = version + 1,
          roles_changed_by = ${by.userId}::uuid, roles_changed_at = ${by.at}
        where id = any(${ids}::uuid[])`.execute(db);
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
