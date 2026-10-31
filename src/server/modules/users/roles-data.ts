// Las consultas de los roles a la base (diseño de 02, §§ 15, 18 y 19). Lo que cuenta quién tiene un
// rol o un permiso mira solo a las personas activas (R4.3); quién administra, además, solo a las que
// ya entraron (R1.3).
import { type Kysely, sql } from 'kysely';
import type { Administration } from './roles.ts';
import { type Role, type RolesTables, roleColumns } from './roles-tables.ts';
import { writingHolders, writingPermissions, writingRoles } from './roles-writing.ts';

export type { Role, RolesTables } from './roles-tables.ts';

type Db = Kysely<RolesTables>;

// Leer los roles.
function readingRoles(db: Db) {
  return {
    roles: (): Promise<Role[]> =>
      db
        .selectFrom('users.roles')
        .select(roleColumns)
        .orderBy('system', 'desc')
        .orderBy(sql`lower(name)`)
        .execute(),

    systemRoleId: async (): Promise<string> =>
      (
        await db
          .selectFrom('users.roles')
          .select('id')
          .where('system', '=', true)
          .executeTakeFirstOrThrow()
      ).id,

    roleById: (id: string): Promise<Role | undefined> =>
      db.selectFrom('users.roles').select(roleColumns).where('id', '=', id).executeTakeFirst(),

    rolePermissions: () =>
      db.selectFrom('users.role_permissions').select(['role_id as roleId', 'permission']).execute(),
  };
}

// Leer quién tiene cada rol y sus permisos.
function readingHolders(db: Db) {
  return {
    // Quién tiene cada rol: todas las personas (las pastillas) o solo las activas (R4.3).
    userRoles: (activeOnly: boolean) =>
      db
        .selectFrom('users.user_roles as ur')
        .innerJoin('users.users as u', 'u.id', 'ur.user_id')
        .select(['ur.user_id as userId', 'ur.role_id as roleId'])
        .$if(activeOnly, (query) => query.where('u.active', '=', true))
        .execute(),

    // Los permisos que dan los roles de alguien; `activeOnly`, nada si está dada de baja.
    permissionsOf: async (userId: string, activeOnly: boolean): Promise<string[]> =>
      (
        await db
          .selectFrom('users.user_roles as ur')
          .innerJoin('users.role_permissions as rp', 'rp.role_id', 'ur.role_id')
          .innerJoin('users.users as u', 'u.id', 'ur.user_id')
          .select('rp.permission')
          .distinct()
          .where('ur.user_id', '=', userId)
          .$if(activeOnly, (query) => query.where('u.active', '=', true))
          .execute()
      ).map((row) => row.permission),
  };
}

// Leer los roles de una persona y si existe.
function readingPeople(db: Db) {
  return {
    roleIdsOf: async (userId: string): Promise<string[]> =>
      (
        await db
          .selectFrom('users.user_roles')
          .select('role_id')
          .where('user_id', '=', userId)
          .execute()
      ).map((row) => row.role_id),

    userExists: async (userId: string): Promise<boolean> =>
      !!(await db
        .selectFrom('users.users')
        .select('id')
        .where('id', '=', userId)
        .executeTakeFirst()),
  };
}

// Quién administra (R1.3), en una consulta: las personas activas que ya entraron con cada permiso, y
// si quien hace el cambio tiene cada uno. Con `lock`, antes bloquea la fila del rol del sistema, el
// bloqueo de todo lo que puede dejar sin quien administre (§ 19).
async function administration(db: Db, asking: string, lock: boolean): Promise<Administration> {
  const locked = lock
    ? sql`(select count(*) from (select id from users.roles where system for update) as l)`
    : sql`0`;
  const row = await sql<{
    managers: number;
    role_managers: number;
    asking_manages: boolean;
    asking_manages_roles: boolean;
  }>`select ${locked} as locked,
      count(distinct u.id) filter (where rp.permission = 'users.manage')::int as managers,
      count(distinct u.id) filter (where rp.permission = 'roles.manage')::int as role_managers,
      coalesce(bool_or(u.id = ${asking} and rp.permission = 'users.manage'), false) as asking_manages,
      coalesce(bool_or(u.id = ${asking} and rp.permission = 'roles.manage'), false)
        as asking_manages_roles
    from users.users u
    join users.user_roles ur on ur.user_id = u.id
    join users.role_permissions rp on rp.role_id = ur.role_id
    where u.active and (u.google_subject is not null or u.last_sign_in_at is not null)
      and rp.permission in ('users.manage', 'roles.manage')`.execute(db);
  // Una consulta que cuenta siempre trae una fila.
  const counts = row.rows[0] as (typeof row.rows)[number];
  return {
    managers: counts.managers,
    roleManagers: counts.role_managers,
    askingManages: counts.asking_manages,
    askingManagesRoles: counts.asking_manages_roles,
  };
}

export const rolesData = (db: Db) => ({
  ...readingRoles(db),
  ...readingHolders(db),
  ...readingPeople(db),
  ...writingRoles(db),
  ...writingHolders(db),
  ...writingPermissions(db),
  // Antes del cambio, bloqueando (§ 19); después, solo contando.
  lockAndCount: (asking: string) => administration(db, asking, true),
  administration: (asking: string) => administration(db, asking, false),
});
