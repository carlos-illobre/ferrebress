// Con qué huella se aprobó la entrada de una computadora con el código QR (02 · R5.6, R5.7): cortar
// ese celular cierra también esas computadoras.
import type { Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const addApproved: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('sign_in')
      .alterTable('sessions')
      .addColumn('approved_by', 'text')
      .execute();
  },
};
