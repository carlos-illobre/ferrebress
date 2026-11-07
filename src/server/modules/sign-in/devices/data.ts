// Las consultas de los dispositivos a la base (diseño de 04b, § 2): una por operación. La fila se
// crea la primera vez que se usa o que se le pone nombre.
import { type Kysely, sql } from 'kysely';
import type { PasskeysTables } from '../passkeys/data.ts';
import type { SessionsTables } from '../sessions/data.ts';

export type DevicesTables = {
  'sign_in.devices': { device_id: string; name: string | null; last_seen_at: Date };
};

type Db = Kysely<DevicesTables & SessionsTables & PasskeysTables>;

// Si el dispositivo `d` todavía tiene alguna sesión guardada o una huella.
const inUse = (db: Db) =>
  db
    .selectFrom('sign_in.sessions')
    .select('device_id')
    .whereRef('device_id', '=', sql.ref('d.device_id'))
    .union(
      db
        .selectFrom('sign_in.passkeys')
        .select('device_id')
        .whereRef('device_id', '=', sql.ref('d.device_id')),
    );

export const devicesData = (db: Db) => ({
  // Los que tienen nombre, los usados hace menos tiempo primero (hasta `max`).
  named: (max: number) =>
    db
      .selectFrom('sign_in.devices')
      .select(['device_id as deviceId', 'name'])
      .where('name', 'is not', null)
      .orderBy('last_seen_at', 'desc')
      .limit(max)
      .execute() as Promise<{ deviceId: string; name: string }[]>,

  // Pone, cambia o borra (nulo) el nombre.
  rename: async (deviceId: string, name: string | null, at: Date) => {
    await db
      .insertInto('sign_in.devices')
      .values({ device_id: deviceId, name, last_seen_at: at })
      .onConflict((oc) => oc.column('device_id').doUpdateSet({ name, last_seen_at: at }))
      .execute();
  },

  // Que se usaron hoy: una sola consulta para todos.
  seen: async (deviceIds: string[], at: Date) => {
    await db
      .insertInto('sign_in.devices')
      .values(deviceIds.map((id) => ({ device_id: id, name: null, last_seen_at: at })))
      .onConflict((oc) => oc.column('device_id').doUpdateSet({ last_seen_at: at }))
      .execute();
  },

  // Borra los que nadie usa desde `before`, sin sesión ni huella guardadas (R9.6). Devuelve cuáles.
  forgetUnused: async (before: Date) =>
    (
      await db
        .deleteFrom('sign_in.devices as d')
        .where('d.last_seen_at', '<', before)
        .where(({ not, exists }) => not(exists(sql`(${inUse(db)})`)))
        .returning('device_id')
        .execute()
    ).map((row) => row.device_id),
});
