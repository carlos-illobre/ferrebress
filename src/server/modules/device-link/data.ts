// Las consultas del vínculo (diseño de 03, § 9). Solo el estado actual: un vínculo que termina se
// borra, y lo que pasó queda en la auditoría.
import type { Kysely } from 'kysely';
import type { Pairing } from './rules.ts';

type PairingsTable = {
  id: string;
  user_id: string;
  phone_device_id: string;
  computer_device_id: string;
  phone_label: string;
  computer_label: string;
  paired_by: 'button' | 'sign-in';
  created_at: Date;
  mirrored_at: Date;
  paused_at: Date | null;
};
export type DeviceLinkTables = { 'device_link.pairings': PairingsTable };
type Db = Kysely<DeviceLinkTables>;

const columns = [
  'id',
  'user_id as userId',
  'phone_device_id as phoneDeviceId',
  'computer_device_id as computerDeviceId',
  'phone_label as phoneLabel',
  'computer_label as computerLabel',
  'paired_by as pairedBy',
  'created_at as createdAt',
  'mirrored_at as mirroredAt',
  'paused_at as pausedAt',
] as const;

const rowOf = (pairing: Pairing): PairingsTable => ({
  id: pairing.id,
  user_id: pairing.userId,
  phone_device_id: pairing.phoneDeviceId,
  computer_device_id: pairing.computerDeviceId,
  phone_label: pairing.phoneLabel,
  computer_label: pairing.computerLabel,
  paired_by: pairing.pairedBy,
  created_at: pairing.createdAt,
  mirrored_at: pairing.mirroredAt,
  paused_at: pairing.pausedAt,
});

// Leer: el vínculo de un dispositivo, los de varios y los vencidos.
function reading(db: Db) {
  const select = () => db.selectFrom('device_link.pairings').select(columns);
  const ofDevices = (userId: string, deviceIds: string[]) =>
    select()
      .where('user_id', '=', userId)
      .where((eb) =>
        eb.or([eb('phone_device_id', 'in', deviceIds), eb('computer_device_id', 'in', deviceIds)]),
      );
  return {
    // El vínculo de una persona en un dispositivo, desde cualquiera de los dos lados.
    forDevice: (userId: string, deviceId: string): Promise<Pairing | undefined> =>
      ofDevices(userId, [deviceId]).executeTakeFirst(),
    // Los de la persona en esos dispositivos (lo que termina un vínculo nuevo o un aviso).
    forDevices: (userId: string, deviceIds: string[]): Promise<Pairing[]> =>
      deviceIds.length === 0 ? Promise.resolve([]) : ofDevices(userId, deviceIds).execute(),
    forUser: (userId: string): Promise<Pairing[]> =>
      select().where('user_id', '=', userId).execute(),
    // Los que llevan los días sin espejar (R2.2), para terminarlos.
    olderThan: (before: Date): Promise<Pairing[]> =>
      select().where('mirrored_at', '<=', before).execute(),
  };
}

// Escribir: crear, borrar (devuelve lo que terminó), la pausa y la última vez que espejaron.
function writing(db: Db) {
  return {
    insert: async (pairing: Pairing) => {
      await db.insertInto('device_link.pairings').values(rowOf(pairing)).execute();
    },
    remove: (ids: string[]): Promise<Pairing[]> =>
      ids.length === 0
        ? Promise.resolve([])
        : db.deleteFrom('device_link.pairings').where('id', 'in', ids).returning(columns).execute(),
    setPaused: (id: string, at: Date | null) =>
      db
        .updateTable('device_link.pairings')
        .set({ paused_at: at })
        .where('id', '=', id)
        .returning(columns)
        .executeTakeFirst(),
    // Por tandas; una hora más vieja que la guardada no la pisa.
    touch: async (entries: [string, Date][]) => {
      for (const [id, at] of entries)
        await db
          .updateTable('device_link.pairings')
          .set({ mirrored_at: at })
          .where('id', '=', id)
          .where('mirrored_at', '<', at)
          .execute();
    },
  };
}

export const deviceLinkData = (db: Db) => ({ ...reading(db), ...writing(db) });

export type DeviceLinkData = ReturnType<typeof deviceLinkData>;
