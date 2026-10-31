// Lo que Usuarios muestra de las sesiones y las huellas (diseño de 02, § 2): cómo se entró, si es un
// celular, con qué huella y cuándo se puso por última vez; y de cada huella, un identificador que
// puede ver la aplicación y el nombre de su celular. Las huellas quitadas se borran.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const addAccess: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('sign_in');
    await schema.createType('way').asEnum(['google', 'passkey', 'qr', 'offline']).execute();
    await schema
      .alterTable('sessions')
      .addColumn('way', sql`sign_in.way`, (col) => col.notNull().defaultTo('google'))
      .addColumn('is_phone', 'boolean', (col) => col.notNull().defaultTo(false))
      .addColumn('passkey_id', 'text')
      .addColumn('passkey_at', 'timestamptz')
      .execute();
    // Las sesiones de antes duran pocas horas: alcanza con deducir el celular de su nombre.
    await sql`update sign_in.sessions set is_phone =
      device_label like '% en Android' or device_label like '% en iPhone'`.execute(db);
    await sql`delete from sign_in.passkeys where revoked_at is not null`.execute(db);
    await schema
      .alterTable('passkeys')
      .addColumn('public_id', 'uuid', (col) => col.notNull().defaultTo(sql`gen_random_uuid()`))
      .addColumn('device_label', 'text', (col) => col.notNull().defaultTo('Celular'))
      .execute();
    await sql`update sign_in.passkeys p set device_label = s.device_label
      from (select distinct on (device_id) device_id, device_label from sign_in.sessions
        order by device_id, created_at desc) s
      where s.device_id = p.device_id`.execute(db);
    await schema
      .createIndex('passkeys_public_id')
      .on('passkeys')
      .column('public_id')
      .unique()
      .execute();
  },
};
