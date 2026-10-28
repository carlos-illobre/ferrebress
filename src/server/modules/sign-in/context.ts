// Lo que comparten las rutas de entrar: la plataforma, las personas, las sesiones, lo que vive en
// memoria y las formas de anotar en la auditoría y de frenar por límite de intentos.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import type { Kysely } from 'kysely';
import { fail } from '../../platform/http.ts';
import { createOneUse } from '../../platform/limits/one-use.ts';
import type { Window } from '../../platform/limits/rate-limit.ts';
import type { Platform } from '../../platform/modules.ts';
import type { AuditEvent } from '../../platform/storage/audit.ts';
import type { User, Users } from '../users/index.ts';
import { createScreens } from './codes/computer/screens.ts';
import type { GoogleSettings } from './google/verify.ts';
import { type PasskeysTables, passkeysData } from './passkeys/data.ts';
import { createSessionStore } from './sessions/store.ts';
import { codeSettings, signInSettings } from './settings.ts';

// Anota en la auditoría y frena por límite de intentos, con lo que trae cada pedido.
function createGuards({ audit, clock, limiter }: Platform) {
  const record = (
    c: Context,
    type: string,
    fields: Pick<AuditEvent, 'userId' | 'email' | 'data'> = {},
  ) => {
    const deviceId = c.get('deviceId') as string | undefined;
    const event: AuditEvent = {
      type,
      at: clock.now(),
      ipAddress: c.get('ipAddress') as string,
      ...(deviceId && { deviceId }),
      ...fields,
    };
    audit.record(event);
  };
  const tooMany = (c: Context, retryAfterMs: number) =>
    fail(c, 429, 'too-many-attempts', { retryAfterSeconds: Math.ceil(retryAfterMs / 1000) });

  // Cuenta el pedido contra `window` con cada clave, en orden; en la primera que se pasó, frena y
  // lo anota una vez por ventana. Las demás ya no se cuentan: con la dirección primero, una
  // dirección frenada no agrega claves de dispositivos inventados (revisión de seguridad, 27).
  const throttle = (c: Context, keys: string[], window: Window): Response | undefined => {
    let blocked: { key: string; hit: ReturnType<typeof limiter.hit> } | undefined;
    for (const key of keys) {
      const hit = limiter.hit(key, window);
      if (!hit.allowed) {
        blocked = { key, hit };
        break;
      }
    }
    if (!blocked) return undefined;
    if (limiter.hit(`audit:${blocked.key}`, signInSettings.limits.throttledAudit).allowed) {
      record(c, 'sign-in.throttled', { data: { key: blocked.key } });
    }
    return tooMany(c, blocked.hit.retryAfterMs);
  };
  return { record, throttle, tooMany };
}

// Quién es cada persona con sesión, como la muestra la aplicación, en memoria: así /api/start con
// la sesión ya en memoria no consulta la base (diseño de 01, § 12). Solo para mostrar: si sigue
// activa se mira siempre en la base. Darla de baja cierra sus sesiones y la olvida acá; el nombre
// cambia solo al entrar con Google, que la actualiza si ya estaba.
function createPeople(users: Users) {
  const known = new Map<string, Person>();
  return {
    async of(userId: string): Promise<Person> {
      const cached = known.get(userId);
      if (cached) return cached;
      // Con la sesión abierta, la persona existe.
      const shown = person((await users.findById(userId)) as User);
      known.set(userId, shown);
      return shown;
    },
    update(user: User): void {
      if (known.has(user.id)) known.set(user.id, person(user));
    },
    forget: (userId: string) => void known.delete(userId),
  };
}

const person = (user: User): Person => ({
  userId: user.id,
  name: user.name ?? user.email,
  email: user.email,
  // Hasta el módulo 02, todas las personas son Administrador.
  role: 'Administrador',
});

// Lo que viene de afuera del módulo: las personas, Google y cómo esperar (las pruebas cambian los
// dos últimos).
export type SignInDependencies = {
  users: Users;
  google: GoogleSettings;
  wait: (ms: number) => Promise<void>;
};

export function createContext(platform: Platform, { users, google, wait }: SignInDependencies) {
  return {
    platform,
    users,
    google,
    store: createSessionStore(platform.db, platform.clock, (session, reason) =>
      platform.audit.record({
        type: 'session.ended',
        at: platform.clock.now(),
        userId: session.userId,
        data: { sessionId: session.id, reason },
      }),
    ),
    nonces: createOneUse<true>(platform.clock, signInSettings.nonce),
    // Los desafíos de la huella: para entrar, o para vincular la huella de una sesión.
    challenges: createOneUse<{ purpose: 'sign-in' } | { purpose: 'link'; sessionId: string }>(
      platform.clock,
      signInSettings.challenge,
    ),
    passkeys: passkeysData(platform.db as Kysely<PasskeysTables>),
    relyingParty: {
      id: new URL(platform.config.PUBLIC_ORIGIN).hostname,
      origin: platform.config.PUBLIC_ORIGIN,
    },
    ...createGuards(platform),
    person,
    people: createPeople(users),
    wait,
    screens: createScreens(platform.clock),
    // El permiso que la computadora cambia por su sesión, una vez y por 30 segundos. Uno por
    // pantalla: uno nuevo reemplaza al anterior sin usar, así siempre se puede dar. Sin tope total:
    // ya lo tienen las pantallas, y uno de una pantalla cerrada vence a los 30 segundos.
    permits: createOneUse<{ screenId: string; userId: string }>(platform.clock, {
      ttlMs: codeSettings.permitTtlMs,
      maxTotal: Number.POSITIVE_INFINITY,
      maxPerOwner: 1,
      replaceOldest: true,
    }),
  };
}

export type SignInContext = ReturnType<typeof createContext>;
