// Las tablas de entrar (diseño de 01, § 3): las sesiones y las huellas de cada celular. Los
// códigos QR, los desafíos y los intentos viven en memoria y no tienen tabla.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

type Schema = Kysely<unknown>['schema'];

async function createSessions(schema: Schema) {
  await schema
    .createType('closed_reason')
    .asEnum(['sign-out', 'revoked', 'deactivated', 'idle', 'max-age'])
    .execute();
  await schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('token_hash', 'bytea', (col) => col.notNull().unique())
    .addColumn('proof_public_key', 'bytea', (col) => col.notNull())
    .addColumn('user_id', 'uuid', (col) => col.notNull())
    .addColumn('device_id', 'uuid', (col) => col.notNull())
    .addColumn('device_label', 'text', (col) => col.notNull())
    .addColumn('ip_address', sql`inet`, (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull())
    .addColumn('last_used_at', 'timestamptz', (col) => col.notNull())
    .addColumn('google_at', 'timestamptz')
    .addColumn('closed_at', 'timestamptz')
    .addColumn('closed_reason', sql`sign_in.closed_reason`)
    .execute();
  await schema.createIndex('sessions_user_id').on('sessions').column('user_id').execute();
  await schema.createIndex('sessions_closed_at').on('sessions').column('closed_at').execute();
}

async function createPasskeys(schema: Schema) {
  await schema
    .createTable('passkeys')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'uuid', (col) => col.notNull())
    .addColumn('device_id', 'uuid', (col) => col.notNull())
    .addColumn('public_key', 'bytea', (col) => col.notNull())
    .addColumn('counter', 'bigint', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull())
    .addColumn('last_used_at', 'timestamptz')
    .addColumn('revoked_at', 'timestamptz')
    .execute();
  // Un celular, una cuenta (R2.3).
  await schema
    .createIndex('passkeys_one_account_per_phone')
    .on('passkeys')
    .column('device_id')
    .unique()
    .where(sql.ref('revoked_at'), 'is', null)
    .execute();
}

export const createSignIn: Migration = {
  async up(db: Kysely<unknown>) {
    await createSessions(db.schema.withSchema('sign_in'));
    await createPasskeys(db.schema.withSchema('sign_in'));
  },
};
