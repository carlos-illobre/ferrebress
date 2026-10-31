// Las consultas de lo que Usuarios muestra y corta de las sesiones y las huellas (diseño de 02, § 4):
// cada una, una sola consulta. Una sesión «abierta» es la sin cerrar y sin vencer (60 minutos sin uso
// y 8 horas), mirando las horas y no solo `closed_at`, porque la limpieza corre una vez por día.
import { type Kysely, sql } from 'kysely';
import type { PasskeysTables } from '../passkeys/data.ts';
import type { SessionsTables } from '../sessions/data.ts';
import type { SessionLimits } from '../sessions/rules.ts';

type Db = Kysely<SessionsTables & PasskeysTables>;

// Las sesiones abiertas a esta hora.
const openSessions = (db: Db, now: Date, limits: SessionLimits) =>
  db
    .selectFrom('sign_in.sessions')
    .where('closed_at', 'is', null)
    .where('created_at', '>', new Date(now.getTime() - limits.maxMs))
    .where('last_used_at', '>', new Date(now.getTime() - limits.idleMs));

// Cuántas sesiones y huellas tiene cada persona.
function reading(db: Db) {
  const open = (now: Date, limits: SessionLimits) => openSessions(db, now, limits);
  return {
    sessionCounts: (userIds: string[], exceptSession: string, now: Date, limits: SessionLimits) =>
      open(now, limits)
        .select(['user_id as userId', sql<number>`count(*)::int`.as('n')])
        .where('user_id', 'in', userIds)
        .where('id', '!=', exceptSession)
        .groupBy('user_id')
        .execute(),

    passkeyCounts: (userIds: string[], exceptUser: string) =>
      db
        .selectFrom('sign_in.passkeys')
        .select(['user_id as userId', sql<number>`count(*)::int`.as('n')])
        .where('user_id', 'in', userIds)
        .where('user_id', '!=', exceptUser)
        .groupBy('user_id')
        .execute(),
  };
}

// La tarjeta de una persona.
function card(db: Db) {
  const open = (now: Date, limits: SessionLimits) => openSessions(db, now, limits);
  return {
    openSessionsOf: (userId: string, exceptSession: string, now: Date, limits: SessionLimits) =>
      open(now, limits)
        .select([
          'id',
          'device_label as deviceLabel',
          'way',
          'created_at as createdAt',
          'last_used_at as lastUsedAt',
        ])
        .where('user_id', '=', userId)
        .where('id', '!=', exceptSession)
        .orderBy('last_used_at', 'desc')
        .execute(),

    passkeysOf: (userId: string) =>
      db
        .selectFrom('sign_in.passkeys')
        .select([
          'public_id as id',
          'device_label as deviceLabel',
          'created_at as createdAt',
          'last_used_at as lastUsedAt',
        ])
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .execute(),
  };
}

// «Se perdió un celular»: las sesiones abiertas en celulares y todas las huellas.
function lost(db: Db) {
  const open = (now: Date, limits: SessionLimits) => openSessions(db, now, limits);
  return {
    // Para «Se perdió un celular»: las sesiones abiertas en celulares y todas las huellas.
    openPhoneSessions: (now: Date, limits: SessionLimits) =>
      open(now, limits)
        .select([
          'id',
          'user_id as userId',
          'device_id as deviceId',
          'device_label as deviceLabel',
          'last_used_at as lastUsedAt',
        ])
        .where('is_phone', '=', true)
        .orderBy('last_used_at', 'desc')
        .execute(),

    allPasskeys: () =>
      db
        .selectFrom('sign_in.passkeys')
        .select([
          'public_id as publicId',
          'id',
          'user_id as userId',
          'device_id as deviceId',
          'device_label as deviceLabel',
          'last_used_at as lastUsedAt',
        ])
        .execute(),
  };
}

// Lo que se corta: un celular, una sesión o todas, y volver a confirmar.
function cutting(db: Db) {
  return {
    // El celular que nombra un identificador opaco de esa persona: el de su huella o el de una sesión.
    phoneOf: async (userId: string, phoneId: string) => {
      const passkey = await db
        .selectFrom('sign_in.passkeys')
        .select(['device_id as deviceId', 'id'])
        .where('user_id', '=', userId)
        .where(sql<boolean>`public_id::text = ${phoneId}`)
        .executeTakeFirst();
      if (passkey) return passkey;
      return db
        .selectFrom('sign_in.sessions')
        .select(['device_id as deviceId', sql<null>`null`.as('id')])
        .where('user_id', '=', userId)
        .where('id', '=', phoneId)
        .executeTakeFirst();
    },

    // Cierra las sesiones de esa persona en ese celular y las abiertas con su huella desde otro
    // identificador (02, § 2), y borra su huella ahí. Devuelve qué cerró y si había huella.
    cutPhone: async (userId: string, deviceId: string, at: Date) => {
      const passkey = await db
        .deleteFrom('sign_in.passkeys')
        .where('user_id', '=', userId)
        .where('device_id', '=', deviceId)
        .returning('id')
        .executeTakeFirst();
      const closed = await db
        .updateTable('sign_in.sessions')
        .set({ closed_at: at, closed_reason: 'revoked' })
        .where('user_id', '=', userId)
        .where('closed_at', 'is', null)
        .where((eb) =>
          passkey
            ? eb.or([eb('device_id', '=', deviceId), eb('passkey_id', '=', passkey.id)])
            : eb('device_id', '=', deviceId),
        )
        .returning('id')
        .execute();
      return { sessionIds: closed.map((row) => row.id), passkey: passkey !== undefined };
    },
  };
}

// «Cerrar», «Cerrar todas» y volver a confirmar.
function closing(db: Db) {
  return {
    // «Cerrar» una, o «Cerrar todas» (`sessionId` nulo), de esa persona, nunca la del pedido.
    closeSessions: async (userId: string, sessionId: string | null, except: string, at: Date) =>
      (
        await db
          .updateTable('sign_in.sessions')
          .set({ closed_at: at, closed_reason: 'revoked' })
          .where('user_id', '=', userId)
          .where('closed_at', 'is', null)
          .where('id', '!=', except)
          .$if(sessionId !== null, (query) => query.where('id', '=', sessionId as string))
          .returning('id')
          .execute()
      ).map((row) => row.id),

    // Volver a confirmar con Google o la huella (02 · R3.8), sin abrir otra sesión.
    confirm: async (sessionId: string, field: 'google_at' | 'passkey_at', at: Date) => {
      await db
        .updateTable('sign_in.sessions')
        .set({ [field]: at })
        .where('id', '=', sessionId)
        .execute();
    },
  };
}

export const accessData = (db: Db) => ({
  ...reading(db),
  ...card(db),
  ...lost(db),
  ...cutting(db),
  ...closing(db),
});

export type AccessData = ReturnType<typeof accessData>;
