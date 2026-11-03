// Las huellas de una persona se buscan por ella (su tarjeta, las cuentas de Usuarios, darla de
// baja): un índice para esa búsqueda.
import type { Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const indexPasskeysByUser: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('sign_in')
      .createIndex('passkeys_user_id')
      .on('passkeys')
      .column('user_id')
      .execute();
  },
};
