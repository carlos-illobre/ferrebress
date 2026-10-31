// Las consultas de las personas a la base, cada una de una escritura o una lectura. Las que dependen de que nadie
// cambie la fila a la vez llevan la condición en el mismo `where` (diseño de 02, § 5).
import { type Generated, type Kysely, sql } from 'kysely';
import type { User } from './rules.ts';

export type UsersTables = {
  'users.users': {
    id: string;
    email: string;
    google_subject: string | null;
    name: string | null;
    google_name: string | null;
    active: Generated<boolean>;
    last_sign_in_at: Date | null;
    authorized_by: string | null;
    deactivated_at: Date | null;
    version: Generated<number>;
    created_at: Generated<Date>;
    roles_changed_by: string | null;
    roles_changed_at: Date | null;
  };
};

const columns = [
  'id',
  'email',
  'google_subject as googleSubject',
  'name',
  'google_name as googleName',
  'active',
  'last_sign_in_at as lastSignInAt',
  'authorized_by as authorizedBy',
  'deactivated_at as deactivatedAt',
  'version',
  'created_at as createdAt',
  'roles_changed_by as rolesChangedBy',
  'roles_changed_at as rolesChangedAt',
  // Sus roles (02 · R3.1), que guarda la tabla de los roles; lo que se acaba de guardar en la misma
  // sentencia no se ve.
  sql<string[]>`array(select role_id::text from users.user_roles where user_id = users.id)`.as(
    'roleIds',
  ),
] as const;

type Db = Kysely<UsersTables>;
// Quién tiene cada rol, que crea la migración de los roles: para autorizar con sus roles.
type WithRoles = UsersTables & { 'users.user_roles': { user_id: string; role_id: string } };

// Buscar personas.
function finding(db: Db) {
  const users = () => db.selectFrom('users.users').select(columns);
  return {
    findById: (id: string): Promise<User | undefined> =>
      users().where('id', '=', id).executeTakeFirst(),

    findAll: (): Promise<User[]> => users().execute(),

    findByIds: (ids: string[]): Promise<User[]> =>
      ids.length === 0 ? Promise.resolve([]) : users().where('id', 'in', ids).execute(),

    // A lo sumo dos filas: la del identificador y la del correo.
    findGoogleCandidates: (subject: string, email: string): Promise<User[]> =>
      users()
        .where((eb) => eb.or([eb('google_subject', '=', subject), eb('email', '=', email)]))
        .execute(),
  };
}

// Lo que escribe entrar: atar la cuenta de Google y anotar la entrada.
function signingIn(db: Db) {
  return {
    // Solo si sigue siendo esa persona, con ese correo y sin cuenta atada: si la borraron o le
    // cambiaron el correo mientras entraba, no toca nada y la entrada se rechaza.
    linkGoogle: async (id: string, email: string, subject: string, googleName: string | null) =>
      (
        await db
          .updateTable('users.users')
          .set({ google_subject: subject, google_name: googleName })
          .where('id', '=', id)
          .where('email', '=', email)
          .where('google_subject', 'is', null)
          .executeTakeFirst()
      ).numUpdatedRows === 1n,

    // Anota la entrada solo si sigue activa, y dice si lo estaba.
    recordSignIn: async (id: string, at: Date): Promise<boolean> =>
      (
        await db
          .updateTable('users.users')
          .set({ last_sign_in_at: at })
          .where('id', '=', id)
          .where('active', '=', true)
          .executeTakeFirst()
      ).numUpdatedRows === 1n,

    // La primera persona de una instalación: con la tabla bloqueada, solo si no hay ninguna.
    addFirst: (id: string, email: string, name: string | null): Promise<boolean> =>
      db.transaction().execute(async (trx) => {
        await sql`lock table users.users in exclusive mode`.execute(trx);
        const inserted = await sql`insert into users.users (id, email, name)
          select ${id}, ${email}, ${name} where not exists (select 1 from users.users)`.execute(
          trx,
        );
        if (inserted.numAffectedRows !== 1n) return false;
        // El rol del sistema (02 · R7.4), que crea la migración de los roles.
        await sql`insert into users.user_roles (user_id, role_id)
          select ${id}, id from users.roles where system`.execute(trx);
        return true;
      }),
  };
}

type NewUser = Pick<User, 'id' | 'email' | 'name' | 'authorizedBy'>;

// Con sus roles (R3.3), en una sola sentencia: un rol que no existe la frena entera (la clave
// foránea, `23503`). Devuelve la persona como quedó, o nada si el correo ya estaba.
function insertWithRoles(
  db: Db,
  user: NewUser,
  roleIds: readonly string[],
): Promise<User | undefined> {
  return (db as Kysely<WithRoles>)
    .with('u', (qb) =>
      qb
        .insertInto('users.users')
        .values({
          id: user.id,
          email: user.email,
          name: user.name,
          authorized_by: user.authorizedBy,
        })
        .onConflict((oc) => oc.column('email').doNothing())
        .returning(columns),
    )
    .with('r', (qb) =>
      qb
        .insertInto('users.user_roles')
        .columns(['user_id', 'role_id'])
        .expression(
          qb
            .selectFrom('u')
            .select(['u.id', sql<string>`unnest(${roleIds}::uuid[])`.as('role_id')]),
        )
        .returning('user_id'),
    )
    .selectFrom('u')
    .selectAll()
    .executeTakeFirst();
}

// Autorizar y borrar a alguien (R3.3, R3.7).
function authorizing(db: Db) {
  return {
    insert: (user: NewUser, roleIds: readonly string[]) => insertWithRoles(db, user, roleIds),

    // Borrar, solo si nunca entró (R3.7).
    remove: async (id: string, version: number): Promise<boolean> =>
      (
        await db
          .deleteFrom('users.users')
          .where('id', '=', id)
          .where('version', '=', version)
          .where('google_subject', 'is', null)
          .where('last_sign_in_at', 'is', null)
          .executeTakeFirst()
      ).numDeletedRows === 1n,
  };
}

// Lo que cambia Usuarios, siempre con la versión que vio quien cambia.
function changing(db: Db) {
  const bump = () => sql<number>`version + 1`;
  return {
    rename: (id: string, version: number, name: string | null) =>
      db
        .updateTable('users.users')
        .set({ name, version: bump() })
        .where('id', '=', id)
        .where('version', '=', version)
        .returning(columns)
        .executeTakeFirst(),

    // El correo, solo si nunca entró (R3.6).
    changeEmail: (id: string, version: number, email: string, name?: string | null) =>
      db
        .updateTable('users.users')
        .set({ email, ...(name !== undefined && { name }), version: bump() })
        .where('id', '=', id)
        .where('version', '=', version)
        .where('google_subject', 'is', null)
        .where('last_sign_in_at', 'is', null)
        .returning(columns)
        .executeTakeFirst(),
  };
}

// Dar de alta y de baja: la baja, con las activas bloqueadas.
function status(db: Db) {
  const bump = () => sql<number>`version + 1`;
  return {
    activate: (id: string, version: number) =>
      db
        .updateTable('users.users')
        .set({ active: true, deactivated_at: null, version: bump() })
        .where('id', '=', id)
        .where('version', '=', version)
        .where('active', '=', false)
        .returning(columns)
        .executeTakeFirst(),

    deactivate: (trx: Db, id: string, version: number, at: Date) =>
      trx
        .updateTable('users.users')
        .set({ active: false, deactivated_at: at, version: bump() })
        .where('id', '=', id)
        .where('version', '=', version)
        .where('active', '=', true)
        .returning(columns)
        .executeTakeFirst(),
  };
}

export const usersData = (db: Db) => ({
  ...finding(db),
  ...signingIn(db),
  ...authorizing(db),
  ...changing(db),
  ...status(db),
});
