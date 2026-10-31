// Las sesiones en la memoria del servidor (ADR-015): comprobar un pase ya visto no consulta la
// base, y los últimos usos se escriben juntos una vez por minuto. Cerrar una sesión la saca de la
// memoria después de confirmar el cierre en la base; y lo leído de la base se guarda en memoria solo
// si nadie cerró sesiones mientras se leía, así un pedido que llega justo mientras se cierra su
// sesión no la vuelve a guardar abierta (diseño de 02, § 6).
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
  | 'userId'
  | 'deviceId'
  | 'deviceLabel'
  | 'ipAddress'
  | 'proofPublicKey'
  | 'googleAt'
  | 'way'
  | 'isPhone'
  | 'passkeyId'
  | 'passkeyAt'
  | 'approvedBy'
>;

const keyOf = (token: string): string => createHash('sha256').update(token).digest('hex');

// Lo que el servidor recuerda: las sesiones ya vistas, por el hash de su pase, y los últimos usos
// que todavía no se escribieron. `closings` sube antes y después de cada cierre.
function createMemory() {
  const byKey = new Map<string, Session>();
  const lastUsed = new Map<string, Date>();
  return {
    byKey,
    closings: 0,
    touch: (session: Session, at: Date) => {
      session.lastUsedAt = at;
      lastUsed.set(session.id, at);
    },
    forget(ids: string[]) {
      for (const [key, session] of byKey) if (ids.includes(session.id)) byKey.delete(key);
      for (const id of ids) lastUsed.delete(id);
      this.closings++;
    },
    lastUsedAt: (id: string) => lastUsed.get(id),
    drain() {
      const entries = [...lastUsed];
      lastUsed.clear();
      return entries;
    },
  };
}

type Data = ReturnType<typeof sessionsData>;
type Memory = ReturnType<typeof createMemory>;

async function createSession(data: Data, clock: Clock, fields: NewSession) {
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
  return { token, session };
}

// Quién es el dueño del pase, y anota el uso. Una cookie inventada no queda en memoria.
async function resolveSession(
  { data, memory, clock, onEnded }: Deps,
  token: string,
): Promise<Resolved> {
  const key = keyOf(token);
  const remembered = memory.byKey.get(key);
  const closings = memory.closings;
  const session = remembered ?? (await data.findByTokenHash(Buffer.from(key, 'hex')));
  if (!session) return { kind: 'closed', reason: 'unknown' };
  const now = clock.now();
  const reason = closedReasonOf(session, now, signInSettings.session);
  if (!reason) {
    if (!remembered && memory.closings === closings) memory.byKey.set(key, session);
    memory.touch(session, now);
    return { kind: 'open', session };
  }
  memory.forget([session.id]);
  if (!session.closedReason) {
    await data.close(session.id, reason, now);
    onEnded(session, reason);
  }
  return { kind: 'closed', reason };
}

// Cerrar una sesión (salir) o las de una persona dentro de la transacción de quien llama (la baja):
// lo de después de confirmarla (sacarlas de la memoria y anotarlas) se devuelve (ADR-004).
function closing({ data, memory, clock, onEnded }: Deps) {
  return {
    async close(id: string, reason: ClosedReason): Promise<void> {
      memory.closings++;
      await data.close(id, reason, clock.now());
      memory.forget([id]);
    },

    async closeForUser(trx: Kysely<unknown>, userId: string, reason: ClosedReason) {
      memory.closings++;
      const ids = await data.closeForUser(
        trx as Kysely<SessionsTables>,
        userId,
        reason,
        clock.now(),
      );
      return () => {
        memory.forget(ids);
        for (const id of ids) onEnded({ id, userId }, reason);
      };
    },
  };
}

// Lo que hacen otras consultas con las sesiones (Usuarios): cerrarlas (antes de escribir se avisa, y
// después de confirmar se sacan de la memoria y se anotan) y volver a confirmar con Google o la huella
// (02 · R3.8), que la sesión en memoria también tiene que saber.
function fromOutside(memory: Memory, onEnded: OnEnded) {
  return {
    beginClose: () => void memory.closings++,
    lastUsedOf: (id: string) => memory.lastUsedAt(id),
    ended(ids: string[], userId: string, reason: ClosedReason) {
      memory.forget(ids);
      for (const id of ids) onEnded({ id, userId }, reason);
    },
    confirmed(sessionId: string, field: 'googleAt' | 'passkeyAt', at: Date) {
      for (const session of memory.byKey.values())
        if (session.id === sessionId) session[field] = at;
    },
  };
}

// Avisa cuándo una sesión venció o la cerraron sin que la persona saliera, para la auditoría.
export type OnEnded = (session: { id: string; userId: string }, reason: ClosedReason) => void;
type Deps = { data: Data; memory: Memory; clock: Clock; onEnded: OnEnded };

export const createSessionStore = (db: Kysely<unknown>, clock: Clock, onEnded: OnEnded) =>
  sessionStoreOf(sessionsData(db as Kysely<SessionsTables>), clock, onEnded);

// La memoria sobre unas consultas dadas: las pruebas pasan unas que contestan cuando ellas quieren.
export function sessionStoreOf(data: Data, clock: Clock, onEnded: OnEnded) {
  const memory = createMemory();
  const deps = { data, memory, clock, onEnded };
  const flush = async () => {
    const entries = memory.drain();
    if (entries.length > 0) await data.writeLastUsed(entries);
  };

  return {
    // Crea la sesión; se guarda en memoria recién con `remember`, cuando se sabe que vale.
    create: (fields: NewSession) => createSession(data, clock, fields),
    remember: ({ token, session }: { token: string; session: Session }) =>
      void memory.byKey.set(keyOf(token), session),
    resolve: (token: string) => resolveSession(deps, token),
    // Si el pase es de una sesión que ya está en memoria (sin consultar la base).
    knows: (token: string) => memory.byKey.has(keyOf(token)),
    findById: (id: string) => data.findById(id),

    ...closing(deps),
    ...fromOutside(memory, onEnded),
    flush,

    // La limpieza diaria: las que venció las saca de la memoria y las anota.
    async cleanUp(): Promise<void> {
      await flush();
      const ended = await data.cleanUp(
        clock.now(),
        signInSettings.session,
        signInSettings.closedRetentionMs,
      );
      memory.forget(ended.map((session) => session.id));
      for (const session of ended) onEnded(session, session.reason);
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
