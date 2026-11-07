// La llave de cada dispositivo (diseño de 01, § 6): la parte pública de un par que el navegador no deja
// exportar. Con ella, el identificador del dispositivo vale solo para quien la tiene.
import type { Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const addDeviceKeys: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('sign_in')
      .alterTable('devices')
      .addColumn('public_key', 'bytea')
      .execute();
  },
};
