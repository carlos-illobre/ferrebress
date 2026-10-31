// Las personas que se administran desde Usuarios (diseño de 02, § 2): el nombre escrito aparte del
// de Google, la última entrada, quién la autorizó, desde cuándo está dada de baja y la versión que
// frena un cambio sobre un dato viejo.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const addPeople: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('users')
      .alterTable('users')
      .addColumn('google_name', 'text')
      .addColumn('last_sign_in_at', 'timestamptz')
      .addColumn('authorized_by', 'uuid')
      .addColumn('deactivated_at', 'timestamptz')
      .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
      .execute();
    // Hasta hoy, `name` era el de Google y nadie escribió uno. Quien ya entró toma su `created_at`
    // como última entrada: es una cota (solo hay personas así en el ambiente de pruebas).
    await sql`update users.users set google_name = name, name = null,
      last_sign_in_at = case when google_subject is not null then created_at end`.execute(db);
  },
};
