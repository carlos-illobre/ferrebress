// El nombre de cada dispositivo (04 · R9; diseño de 04b, § 2): uno por dispositivo, el mismo para
// todos los que lo usan, y el último día que se usó, para borrar lo que nadie usa en un año (R9.6).
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const addDevices: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('sign_in')
      .createTable('devices')
      .addColumn('device_id', 'uuid', (col) => col.primaryKey())
      .addColumn('name', 'text', (col) => col.check(sql`char_length(name) between 1 and 30`))
      .addColumn('last_seen_at', 'timestamptz', (col) => col.notNull())
      .execute();
  },
};
