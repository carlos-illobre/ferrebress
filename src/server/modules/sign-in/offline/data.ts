// Las consultas de entrar sin conexión (diseño de 15, § 3 y § 4): las entradas que llegaron y la
// última sesión de un celular, que da su último contacto con sesión.
import type { Kysely } from 'kysely';
import type { SessionsTables } from '../sessions/data.ts';
import type { ClosedReason } from '../sessions/rules.ts';
import type { OfflineReason } from './rules.ts';

export type OfflineResult = 'confirmed' | 'ended' | 'rejected';

export type OfflineSignIn = {
  id: string;
  userId: string;
  deviceId: string;
  credentialId: string;
  signedAt: Date;
  receivedAt: Date;
  lastContactAt: Date | null;
  proofPublicKey: Uint8Array;
  result: OfflineResult;
  reason: OfflineReason | null;
  sessionId: string | null;
};

export type OfflineTables = SessionsTables & {
  'sign_in.offline_sign_ins': {
    id: string;
    user_id: string;
    device_id: string;
    credential_id: string;
    signed_at: Date;
    received_at: Date;
    last_contact_at: Date | null;
    proof_public_key: Uint8Array;
    result: OfflineResult;
    reason: OfflineReason | null;
    session_id: string | null;
  };
};

// Las entradas que llegaron.
const entries = (db: Kysely<OfflineTables>) => ({
  // Lo que ya se decidió de una entrada, y de quién es, si ya llegó.
  previousOf: (id: string): Promise<{ result: OfflineResult; userId: string } | undefined> =>
    db
      .selectFrom('sign_in.offline_sign_ins')
      .select(['result', 'user_id as userId'])
      .where('id', '=', id)
      .executeTakeFirst(),

  // La sesión que abrió una entrada confirmada: se abre después de guardar la entrada.
  linkSession: async (id: string, sessionId: string): Promise<void> => {
    await db
      .updateTable('sign_in.offline_sign_ins')
      .set({ session_id: sessionId })
      .where('id', '=', id)
      .execute();
  },

  // Guarda la entrada; si ya estaba (dos confirmaciones a la vez), no la pisa y devuelve false.
  insert: async (row: OfflineSignIn): Promise<boolean> => {
    const result = await db
      .insertInto('sign_in.offline_sign_ins')
      .values({
        id: row.id,
        user_id: row.userId,
        device_id: row.deviceId,
        credential_id: row.credentialId,
        signed_at: row.signedAt,
        received_at: row.receivedAt,
        last_contact_at: row.lastContactAt,
        proof_public_key: row.proofPublicKey,
        result: row.result,
        reason: row.reason,
        session_id: row.sessionId,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .executeTakeFirst();
    return result.numInsertedOrUpdatedRows === 1n;
  },

  removeOlderThan: async (at: Date): Promise<void> => {
    await db.deleteFrom('sign_in.offline_sign_ins').where('received_at', '<', at).execute();
  },
});

export const offlineData = (db: Kysely<OfflineTables>) => ({
  ...entries(db),

  // La sesión de esa persona en ese celular usada por última vez: su último uso es el último
  // contacto con sesión. Solo de esa persona: la sesión de otra cuenta con el mismo identificador de
  // celular no le alarga el plazo (revisión de seguridad, 10).
  lastSessionOf: (
    deviceId: string,
    userId: string,
  ): Promise<{ lastUsedAt: Date; closedReason: ClosedReason | null } | undefined> =>
    db
      .selectFrom('sign_in.sessions')
      .select(['last_used_at as lastUsedAt', 'closed_reason as closedReason'])
      .where('device_id', '=', deviceId)
      .where('user_id', '=', userId)
      .orderBy('last_used_at', 'desc')
      .limit(1)
      .executeTakeFirst(),
});
