// Las consultas de las sesiones a la base. Cada una es una sola consulta, también la que escribe
// juntos los últimos usos de muchas sesiones.
import { type Kysely, sql } from 'kysely';
import type { ClosedReason, SessionLimits } from './rules.ts';

export type SessionRow = {
  id: string;
  userId: string;
  deviceId: string;
  deviceLabel: string;
  ipAddress: string;
  proofPublicKey: Uint8Array;
  createdAt: Date;
  lastUsedAt: Date;
  googleAt: Date | null;
  closedReason: ClosedReason | null;
};

export type SessionsTables = {
  'sign_in.sessions': {
    id: string;
    token_hash: Uint8Array;
    proof_public_key: Uint8Array;
    user_id: string;
    device_id: string;
    device_label: string;
    ip_address: string;
    created_at: Date;
    last_used_at: Date;
    google_at: Date | null;
    closed_at: Date | null;
    closed_reason: ClosedReason | null;
  };
};

const columns = [
  'id',
  'user_id as userId',
  'device_id as deviceId',
  'device_label as deviceLabel',
  'ip_address as ipAddress',
  'proof_public_key as proofPublicKey',
  'created_at as createdAt',
  'last_used_at as lastUsedAt',
  'google_at as googleAt',
  'closed_reason as closedReason',
] as const;

// Crear y buscar sesiones.
function finding(db: Kysely<SessionsTables>) {
  const sessions = () => db.selectFrom('sign_in.sessions').select(columns);
  return {
    insert: async (row: SessionRow, tokenHash: Uint8Array): Promise<void> => {
      await db
        .insertInto('sign_in.sessions')
        .values({
          id: row.id,
          token_hash: tokenHash,
          proof_public_key: row.proofPublicKey,
          user_id: row.userId,
          device_id: row.deviceId,
          device_label: row.deviceLabel,
          ip_address: row.ipAddress,
          created_at: row.createdAt,
          last_used_at: row.lastUsedAt,
          google_at: row.googleAt,
        })
        .execute();
    },

    findByTokenHash: (hash: Uint8Array): Promise<SessionRow | undefined> =>
      sessions().where('token_hash', '=', hash).executeTakeFirst(),

    findById: (id: string): Promise<SessionRow | undefined> =>
      sessions().where('id', '=', id).executeTakeFirst(),
  };
}

// Cerrar sesiones, anotar sus últimos usos y limpiar las viejas.
function closing(db: Kysely<SessionsTables>) {
  return {
    close: async (id: string, reason: ClosedReason, at: Date): Promise<void> => {
      await db
        .updateTable('sign_in.sessions')
        .set({ closed_at: at, closed_reason: reason })
        .where('id', '=', id)
        .where('closed_at', 'is', null)
        .execute();
    },

    closeForUser: async (
      trx: Kysely<SessionsTables>,
      userId: string,
      reason: ClosedReason,
      at: Date,
    ) =>
      (
        await trx
          .updateTable('sign_in.sessions')
          .set({ closed_at: at, closed_reason: reason })
          .where('user_id', '=', userId)
          .where('closed_at', 'is', null)
          .returning('id')
          .execute()
      ).map((row) => row.id),

    writeLastUsed: async (entries: [id: string, at: Date][]): Promise<void> => {
      const values = sql.join(entries.map(([id, at]) => sql`(${id}::uuid, ${at}::timestamptz)`));
      await sql`update sign_in.sessions s set last_used_at = v.at
        from (values ${values}) as v(id, at) where s.id = v.id`.execute(db);
    },

    // Marca las vencidas que nadie volvió a usar y borra las cerradas hace más de `retentionMs`.
    cleanUp: async (now: Date, limits: SessionLimits, retentionMs: number): Promise<void> => {
      const maxAgeFrom = new Date(now.getTime() - limits.maxMs);
      const idleFrom = new Date(now.getTime() - limits.idleMs);
      await sql`update sign_in.sessions set closed_at = ${now}, closed_reason =
          case when created_at <= ${maxAgeFrom} then 'max-age' else 'idle' end::sign_in.closed_reason
        where closed_at is null and (created_at <= ${maxAgeFrom} or last_used_at <= ${idleFrom})`.execute(
        db,
      );
      await db
        .deleteFrom('sign_in.sessions')
        .where('closed_at', '<', new Date(now.getTime() - retentionMs))
        .execute();
    },
  };
}

export const sessionsData = (db: Kysely<SessionsTables>) => ({ ...finding(db), ...closing(db) });
