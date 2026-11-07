// Las consultas de los dispositivos a la base (diseño de 04b, § 2): una por operación. La fila se
// crea la primera vez que se usa o que se le pone nombre.
import { type Kysely, sql } from 'kysely';
import type { DB } from '../tables.generated.ts';

export type DevicesTables = Pick<DB, 'sign_in.devices'>;

type Db = Kysely<DevicesTables>;

// Leer los que tienen nombre y cambiar uno.
const naming = (db: Db) => ({
  // Los que tienen nombre, los usados hace menos tiempo primero (hasta `max`).
  named: (max: number) =>
    db
      .selectFrom('sign_in.devices')
      .select(['device_id as deviceId', 'name'])
      .where('name', 'is not', null)
      .orderBy('last_seen_at', 'desc')
      .limit(max)
      .execute() as Promise<{ deviceId: string; name: string }[]>,

  // Pone, cambia o borra (nulo) el nombre, y dice el que tenía: el de la base, con la fila trabada
  // hasta confirmar, así dos cambios a la vez no anotan el mismo «antes».
  rename: async (deviceId: string, name: string | null, at: Date) => {
    const before = await db
      .selectFrom('sign_in.devices')
      .select('name')
      .where('device_id', '=', deviceId)
      .forUpdate()
      .executeTakeFirst();
    await db
      .insertInto('sign_in.devices')
      .values({ device_id: deviceId, name, last_seen_at: at })
      .onConflict((oc) => oc.column('device_id').doUpdateSet({ name, last_seen_at: at }))
      .execute();
    return before?.name ?? null;
  },
});

// El último día de uso y la limpieza de los que nadie usa.
const using = (db: Db) => ({
  // Que se usaron hoy: una sola consulta para todos.
  seen: async (deviceIds: string[], at: Date) => {
    await db
      .insertInto('sign_in.devices')
      .values(deviceIds.map((id) => ({ device_id: id, name: null, last_seen_at: at })))
      .onConflict((oc) => oc.column('device_id').doUpdateSet({ last_seen_at: at }))
      .execute();
  },

  // Borra el nombre de los que nadie usa desde `before` (R9.6), también el de un celular con huella
  // que nadie usó en un año: puede ser un dato personal. La fila queda, con su llave. Devuelve cuáles.
  forgetUnused: async (before: Date) =>
    (
      await db
        .updateTable('sign_in.devices')
        .set({ name: null })
        .where('last_seen_at', '<', before)
        .where('name', 'is not', null)
        .returning('device_id')
        .execute()
    ).map((row) => row.device_id),

  // Ata la llave al dispositivo si todavía no tenía una, y dice si la que tiene es esa: una consulta.
  bindKey: async (deviceId: string, key: Uint8Array, at: Date) => {
    const row = await db
      .insertInto('sign_in.devices')
      .values({ device_id: deviceId, name: null, last_seen_at: at, public_key: key })
      .onConflict((oc) =>
        oc.column('device_id').doUpdateSet({
          public_key: sql<Uint8Array>`coalesce(sign_in.devices.public_key, excluded.public_key)`,
        }),
      )
      .returning('public_key')
      .executeTakeFirstOrThrow();
    return !!row.public_key && Buffer.from(row.public_key).equals(Buffer.from(key));
  },
});

export const devicesData = (db: Db) => ({ ...naming(db), ...using(db) });
