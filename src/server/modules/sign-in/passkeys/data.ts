// Las consultas de las huellas de cada celular a la base. Un celular tiene a lo sumo una huella
// activa (R2.3): la base lo garantiza con un índice único.
import type { Kysely } from 'kysely';

export type Passkey = {
  id: string;
  userId: string;
  deviceId: string;
  publicKey: Uint8Array;
  counter: number;
};

export type PasskeysTables = {
  'sign_in.passkeys': {
    id: string;
    user_id: string;
    device_id: string;
    public_key: Uint8Array;
    counter: string | number;
    created_at: Date;
    last_used_at: Date | null;
    revoked_at: Date | null;
  };
};

// Buscar las huellas activas.
function finding(db: Kysely<PasskeysTables>) {
  const active = () => db.selectFrom('sign_in.passkeys').where('revoked_at', 'is', null);
  return {
    findActiveByDevice: (deviceId: string) =>
      active()
        .select(['id', 'user_id as userId'])
        .where('device_id', '=', deviceId)
        .executeTakeFirst(),

    findActive: async (id: string): Promise<Passkey | undefined> => {
      const row = await active()
        .select([
          'id',
          'user_id as userId',
          'device_id as deviceId',
          'public_key as publicKey',
          'counter',
        ])
        .where('id', '=', id)
        .executeTakeFirst();
      return row && { ...row, counter: Number(row.counter) };
    },
  };
}

// Vincular, revocar y anotar el uso de una huella.
function writing(db: Kysely<PasskeysTables>) {
  return {
    // Vincula la huella; si el celular ya tiene otra cuenta, no la guarda y devuelve false.
    insert: async (passkey: Passkey, at: Date): Promise<boolean> => {
      const { id, userId, deviceId, publicKey, counter } = passkey;
      const values = {
        id,
        user_id: userId,
        device_id: deviceId,
        public_key: publicKey,
        counter,
        created_at: at,
      };
      const result = await db
        .insertInto('sign_in.passkeys')
        .values(values)
        .onConflict((oc) => oc.column('device_id').where('revoked_at', 'is', null).doNothing())
        .executeTakeFirst();
      return result.numInsertedOrUpdatedRows === 1n;
    },

    // Revoca la huella activa de esa persona en ese celular, si tenía, para volver a vincularla.
    revokeOwn: async (userId: string, deviceId: string, at: Date): Promise<void> => {
      await db
        .updateTable('sign_in.passkeys')
        .set({ revoked_at: at })
        .where('user_id', '=', userId)
        .where('device_id', '=', deviceId)
        .where('revoked_at', 'is', null)
        .execute();
    },

    markUsed: async (id: string, counter: number, at: Date): Promise<void> => {
      await db
        .updateTable('sign_in.passkeys')
        .set({ counter, last_used_at: at })
        .where('id', '=', id)
        .execute();
    },
  };
}

export const passkeysData = (db: Kysely<PasskeysTables>) => ({ ...finding(db), ...writing(db) });
