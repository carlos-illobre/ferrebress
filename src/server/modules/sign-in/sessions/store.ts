// Las sesiones en la memoria del servidor (ADR-015): comprobar un pase ya visto no consulta la
// base, y los últimos usos se escriben juntos una vez por minuto. Cerrar una sesión la saca de la
// memoria al instante.
import { createHash, randomBytes } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Clock } from '../../../platform/clock.ts';
import { newId } from '../../../platform/ids.ts';
import { signInSettings } from '../settings.ts';
import { type SessionRow, type SessionsTables, sessionsData } from './data.ts';
import { type ClosedReason, closedReasonOf } from './rules.ts';

export type Session = SessionRow;
export type Resolved =
  | { kind: 'open'; session: Session }
  | { kind: 'closed'; reason: ClosedReason | 'unknown' };
export type NewSession = Pick<
  Session,
  'userId' | 'deviceId' | 'deviceLabel' | 'ipAddress' | 'proofPublicKey' | 'googleAt'
>;

const keyOf = (token: string): string => createHash('sha256').update(token).digest('hex');

// Lo que el servidor recuerda: las sesiones ya vistas, por el hash de su pase, y los últimos usos
// que todavía no se escribieron.
function createMemory() {
  const byKey = new Map<string, Session>();
  const lastUsed = new Map<string, Date>();
  return {
    byKey,
    touch: (session: Session, at: Date) => {
      session.lastUsedAt = at;
      lastUsed.set(session.id, at);
    },
    forget(ids: string[]) {
      for (const [key, session] of byKey) if (ids.includes(session.id)) byKey.delete(key);
      for (const id of ids) lastUsed.delete(id);
    },
    drain() {
      const entries = [...lastUsed];
      lastUsed.clear();
      return entries;
    },
  };
}

type Data = ReturnType<typeof sessionsData>;
type Memory = ReturnType<typeof createMemory>;

async function createSession(data: Data, memory: Memory, clock: Clock, fields: NewSession) {
  const now = clock.now();
  const session: Session = {
    ...fields,
    id: newId(clock),
    createdAt: now,
    lastUsedAt: now,
    closedReason: null,
  };
  const token = randomBytes(32).toString('base64url');
  await data.insert(session, Buffer.from(keyOf(token), 'hex'));
  memory.byKey.set(keyOf(token), session);
  return { token, session };
}

// Quién es el dueño del pase, y anota el uso. Una cookie inventada no queda en memoria.
async function resolveSession(
  data: Data,
  memory: Memory,
  clock: Clock,
  token: string,
): Promise<Resolved> {
  const key = keyOf(token);
  const session = memory.byKey.get(key) ?? (await data.findByTokenHash(Buffer.from(key, 'hex')));
  if (!session) return { kind: 'closed', reason: 'unknown' };
  const now = clock.now();
  const reason = closedReasonOf(session, now, signInSettings.session);
  if (!reason) {
    memory.byKey.set(key, session);
    memory.touch(session, now);
    return { kind: 'open', session };
  }
  memory.forget([session.id]);
  if (!session.closedReason) await data.close(session.id, reason, now);
  return { kind: 'closed', reason };
}

export function createSessionStore(db: Kysely<unknown>, clock: Clock) {
  const data = sessionsData(db as Kysely<SessionsTables>);
  const memory = createMemory();
  const flush = async () => {
    const entries = memory.drain();
    if (entries.length > 0) await data.writeLastUsed(entries);
  };

  return {
    create: (fields: NewSession) => createSession(data, memory, clock, fields),
    resolve: (token: string) => resolveSession(data, memory, clock, token),
    findById: (id: string) => data.findById(id),

    async close(id: string, reason: ClosedReason): Promise<void> {
      memory.forget([id]);
      await data.close(id, reason, clock.now());
    },

    async closeForUser(trx: Kysely<unknown>, userId: string, reason: ClosedReason): Promise<void> {
      memory.forget(
        await data.closeForUser(trx as Kysely<SessionsTables>, userId, reason, clock.now()),
      );
    },

    flush,

    async cleanUp(): Promise<void> {
      await flush();
      await data.cleanUp(clock.now(), signInSettings.session, signInSettings.closedRetentionMs);
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
