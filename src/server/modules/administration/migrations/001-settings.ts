// La tabla de los ajustes para todos (diseño de 06, § 2): una fila por ajuste que alguien cambió, con
// su versión. Lo que nunca cambió no tiene fila y vale lo de arranque, que está en el contrato.
import type { Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createSettings: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('administration')
      .createTable('settings')
      .addColumn('key', 'text', (col) => col.primaryKey())
      .addColumn('value', 'jsonb', (col) => col.notNull())
      .addColumn('version', 'integer', (col) => col.notNull())
      .addColumn('changed_by', 'uuid', (col) => col.notNull())
      .execute();
  },
};
