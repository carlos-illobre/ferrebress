// Las consultas de los dispositivos a la base (diseño de 04b, § 2): una por operación. La fila se
// crea la primera vez que se usa o que se le pone nombre.
import type { Kysely } from 'kysely';

export type DevicesTables = {
  'sign_in.devices': { device_id: string; name: string | null; last_seen_at: Date };
};

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

  // Borra los que nadie usa desde `before` (R9.6), también los de un celular con huella que nadie usó
  // en un año: el nombre puede ser un dato personal. Devuelve cuáles.
  forgetUnused: async (before: Date) =>
    (
      await db
        .deleteFrom('sign_in.devices')
        .where('last_seen_at', '<', before)
        .returning('device_id')
        .execute()
    ).map((row) => row.device_id),
});

export const devicesData = (db: Db) => ({ ...naming(db), ...using(db) });
