// Entrar sin conexión (diseño de 15, § 3): cada entrada con una firma válida que llegó, confirmada
// o no, y el índice para saber el último contacto de un celular y su última sesión.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createOffline: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('sign_in');
    await schema.createType('offline_result').asEnum(['confirmed', 'ended', 'rejected']).execute();
    await schema
      .createType('offline_reason')
      .asEnum(['deactivated', 'not-allowed', 'revoked-session', 'too-late', 'too-old'])
      .execute();
    await schema
      .createTable('offline_sign_ins')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('user_id', 'uuid', (col) => col.notNull())
      .addColumn('device_id', 'uuid', (col) => col.notNull())
      .addColumn('credential_id', 'text', (col) => col.notNull())
      .addColumn('signed_at', 'timestamptz', (col) => col.notNull())
      .addColumn('received_at', 'timestamptz', (col) => col.notNull())
      .addColumn('last_contact_at', 'timestamptz')
      .addColumn('proof_public_key', 'bytea', (col) => col.notNull())
      .addColumn('result', sql`sign_in.offline_result`, (col) => col.notNull())
      .addColumn('reason', sql`sign_in.offline_reason`)
      .addColumn('session_id', 'uuid')
      .execute();
    // Para borrar las de más de 30 días.
    await schema
      .createIndex('offline_sign_ins_received_at')
      .on('offline_sign_ins')
      .column('received_at')
      .execute();
    await schema
      .createIndex('sessions_device_last_used')
      .on('sessions')
      .columns(['device_id', 'last_used_at'])
      .execute();
  },
};
