// La tabla del vínculo (diseño de 03, § 9): un celular y una computadora de una persona. El estado del
// espejo no se guarda en ningún lado; los códigos, los boletos y las huellas DTLS viven en memoria.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createPairings: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('device_link');
    await schema
      .createTable('pairings')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('user_id', 'uuid', (col) => col.notNull())
      .addColumn('phone_device_id', 'uuid', (col) => col.notNull())
      .addColumn('computer_device_id', 'uuid', (col) => col.notNull())
      .addColumn('phone_label', 'text', (col) => col.notNull())
      .addColumn('computer_label', 'text', (col) => col.notNull())
      .addColumn('paired_by', 'text', (col) =>
        col.notNull().check(sql`paired_by in ('button', 'sign-in')`),
      )
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('mirrored_at', 'timestamptz', (col) => col.notNull())
      .addColumn('paused_at', 'timestamptz')
      .execute();
    // Uno con uno por persona (R1.1), y la búsqueda del vínculo de una sesión desde cada lado.
    await schema
      .createIndex('pairings_one_per_phone')
      .on('pairings')
      .columns(['user_id', 'phone_device_id'])
      .unique()
      .execute();
    await schema
      .createIndex('pairings_one_per_computer')
      .on('pairings')
      .columns(['user_id', 'computer_device_id'])
      .unique()
      .execute();
  },
};
