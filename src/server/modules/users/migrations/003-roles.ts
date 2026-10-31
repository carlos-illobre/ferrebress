// Los roles y sus permisos (02 · R7; diseño de 02, § 15): los roles, qué permisos da cada uno, quién
// tiene cada rol, los permisos que el sistema ya conoce y quién le cambió los roles a cada persona.
// El traspaso crea el rol Administrador, sin permisos (se los suma el arranque, como a cualquier
// permiso nuevo), y se lo da a todas las personas que ya están (R7.10).
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const addRoles: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('users');
    await schema
      .createTable('roles')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('system', 'boolean', (col) => col.notNull().defaultTo(false))
      .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
      .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
      .execute();
    await sql`create unique index roles_name on users.roles (lower(name))`.execute(db);
    // Un solo rol del sistema: el bloqueo de quien administra es siempre esa fila (§ 19).
    await sql`create unique index roles_one_system on users.roles ((true)) where system`.execute(
      db,
    );
    await addLinks(db);
    await schema
      .alterTable('users')
      .addColumn('roles_changed_by', 'uuid')
      .addColumn('roles_changed_at', 'timestamptz')
      .execute();
    await sql`insert into users.roles (id, name, description, system)
      values (gen_random_uuid(), 'Administrador',
        'Puede todo: las personas, sus sesiones y los roles.', true)`.execute(db);
    await sql`insert into users.user_roles (user_id, role_id)
      select users.id, roles.id from users.users, users.roles where roles.system`.execute(db);
  },
};

// Qué permisos da cada rol, quién tiene cada uno y los permisos que el sistema ya conoce.
async function addLinks(db: Kysely<unknown>) {
  const schema = db.schema.withSchema('users');
  await schema
    .createTable('role_permissions')
    .addColumn('role_id', 'uuid', (col) =>
      col.notNull().references('users.roles.id').onDelete('cascade'),
    )
    .addColumn('permission', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('role_permissions_key', ['role_id', 'permission'])
    .execute();
  await schema
    .createTable('user_roles')
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.users.id').onDelete('cascade'),
    )
    .addColumn('role_id', 'uuid', (col) =>
      col.notNull().references('users.roles.id').onDelete('restrict'),
    )
    .addPrimaryKeyConstraint('user_roles_key', ['user_id', 'role_id'])
    .execute();
  await schema.createIndex('user_roles_by_role').on('user_roles').column('role_id').execute();
  await schema
    .createTable('known_permissions')
    .addColumn('permission', 'text', (col) => col.primaryKey())
    .execute();
}
