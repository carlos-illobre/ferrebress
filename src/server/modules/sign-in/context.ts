// Lo que comparten las rutas de entrar: la plataforma, las personas, las sesiones, lo que vive en
// memoria y los pasos comunes de cada ruta (anotar en la auditoría y frenar por límite de intentos).
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { MiddlewareHandler } from 'hono';
import type { Kysely } from 'kysely';
import { addressKey, createGuards, type Guards } from '../../platform/guards.ts';
import { createOneUse } from '../../platform/limits/one-use.ts';
import type { Window } from '../../platform/limits/rate-limit.ts';
import { createGuardedMemory } from '../../platform/memory.ts';
import type { Platform } from '../../platform/modules.ts';
import { displayName, type User, type Users } from '../users/index.ts';
import { createScreens } from './codes/computer/screens.ts';
import { createDeviceNames } from './devices/names.ts';
import type { GoogleSettings } from './google/verify.ts';
import { type PasskeysTables, passkeysData } from './passkeys/data.ts';
import { createSessionStore, type Limits } from './sessions/store.ts';
import { codeSettings, type SignInNow, signInSettings } from './settings.ts';

// Quién es cada persona con sesión, como la muestra la aplicación, en memoria: así /api/start con
// la sesión ya en memoria no consulta la base (diseño de 01, § 12). Solo para mostrar: si sigue
// activa se mira siempre en la base. Con contador (diseño de 02, § 17): un cambio de roles o de sus
// permisos, una baja o un nombre nuevo la olvidan, y lo que se leía mientras tanto no se guarda.
function createPeople(users: Users) {
  const known = createGuardedMemory<string, Person>();
  const names = new Map<string, string>();
  const build = async (user: User): Promise<Person> => ({
    userId: user.id,
    name: displayName(user),
    email: user.email,
    ...(await users.profileOf(user)),
  });
  return {
    // Con `user`, si recién se leyó; si no, se lee.
    of: (userId: string, user?: User): Promise<Person> =>
      known.load(userId, async () => build(user ?? ((await users.findById(userId)) as User))),
    // Los nombres de varias, con una sola consulta para las que no están en memoria.
    async namesOf(userIds: string[]): Promise<Map<string, string>> {
      const missing = userIds.filter((id) => !names.has(id));
      for (const user of await users.findByIds(missing)) names.set(user.id, displayName(user));
      return new Map(userIds.map((id) => [id, names.get(id) as string]));
    },
    forget(userIds: readonly string[] | 'all'): void {
      known.forget(userIds);
      if (userIds === 'all') names.clear();
      else for (const id of userIds) names.delete(id);
    },
  };
}

// Lo que viene de afuera del módulo: las personas, Google y cómo esperar (las pruebas cambian los
// dos últimos).
export type SignInDependencies = {
  users: Users;
  google: GoogleSettings;
  wait: (ms: number) => Promise<void>;
  limits: Limits;
  settings: () => SignInNow;
};

const { throttledAudit, entryPerIp, entryWindowMs, failedWindowMs } = signInSettings.limits;
const hour = 3_600_000;

// Los intentos de entrar con los números de Administración de ahora, así un cambio vale desde el
// próximo (06 · R11.4): primero la dirección, con su tope fijo, y después el dispositivo (01 · R2.9).
function createEntry(guards: Guards, settings: () => SignInNow) {
  const perDevice = (method: EntryMethod): Window => ({
    max: settings()[method === 'google' ? 'googleAttempts' : 'passkeyAttempts'],
    windowMs: entryWindowMs,
  });
  return {
    limit:
      (method: EntryMethod): MiddlewareHandler =>
      async (c, next) =>
        guards.throttle(c, [`${method}:ip:${addressKey(c.get('ipAddress'))}`], entryPerIp) ??
        guards.throttle(c, [`${method}:device:${c.get('deviceId')}`], perDevice(method)) ??
        (await next()),
    // Los fallos de una cuenta por hora (01 · R2.10).
    failed: (): Window => ({ max: settings().failedAttempts, windowMs: failedWindowMs }),
    // Cuánto se puede entrar sin conexión desde el último contacto (15 · R2.2).
    offlineMs: () => settings().offlineHours * hour,
  };
}
type EntryMethod = 'google' | 'passkey';

// Los desafíos de la huella: para entrar, para vincular la huella de una sesión o para volver a
// confirmar quién es (02 · R3.8).
type Challenge = { purpose: 'sign-in' } | { purpose: 'link' | 'confirm'; sessionId: string };

// El permiso de un uso que la computadora cambia por su sesión, con el celular que lo aprobó.
const createPermits = (clock: Platform['clock']) =>
  createOneUse<{
    screenId: string;
    userId: string;
    approvedBy: string;
    phone: { deviceId: string; label: string };
  }>(clock, {
    ttlMs: codeSettings.permitTtlMs,
    maxTotal: Number.POSITIVE_INFINITY,
    maxPerOwner: 1,
    replaceOldest: true,
  });

// Lo que se usa una sola vez: los nonces de Google, los desafíos de la huella y los nonces del
// dispositivo.
const oneUses = (clock: Platform['clock']) => ({
  nonces: createOneUse<true>(clock, signInSettings.nonce),
  challenges: createOneUse<Challenge>(clock, signInSettings.challenge),
  deviceNonces: createOneUse<true>(clock, signInSettings.deviceNonce),
});

export function createContext(
  platform: Platform,
  { users, google, wait, limits, settings }: SignInDependencies,
) {
  const guards = createGuards(platform, { topic: 'sign-in', window: throttledAudit });
  return {
    platform,
    users,
    google,
    // Los dos tiempos de la sesión de ahora (01 · R3.2).
    limits,
    // Salir ya queda anotado como «Salió»; los demás fines, como «Terminó una sesión». La plataforma
    // se entera de todos (el canal en tiempo real cierra lo de esa sesión).
    store: createSessionStore(platform.db, platform.clock, limits, (session, reason) => {
      if (reason !== 'sign-out')
        platform.audit.record({
          type: 'session.ended',
          at: platform.clock.now(),
          actor: { kind: 'system' },
          targets: [{ kind: 'person', id: session.userId }],
          data: { reason },
        });
      platform.sessions.ended(session, reason);
    }),
    ...oneUses(platform.clock),
    passkeys: passkeysData(platform.db as Kysely<PasskeysTables>),
    // El nombre de cada dispositivo, en memoria (04 · R9).
    devices: createDeviceNames(platform),
    // De quién es la huella de cada celular, ya consultada (diseño de 15, § 10): así /api/start con
    // la sesión en memoria sigue sin consultar la base. Vincular la actualiza.
    phoneOwners: new Map<string, string | undefined>(),
    relyingParty: {
      id: new URL(platform.config.PUBLIC_ORIGIN).hostname,
      origin: platform.config.PUBLIC_ORIGIN,
    },
    // Anotar en la auditoría y frenar por límite de intentos (platform/guards.ts).
    ...guards,
    // Los intentos de entrar y las horas sin conexión, de Administración (06 · R11).
    entry: createEntry(guards, settings),
    people: createPeople(users),
    wait,
    screens: createScreens(platform.clock),
    // El permiso que la computadora cambia por su sesión, una vez y por 30 segundos. Uno por
    // pantalla: uno nuevo reemplaza al anterior sin usar, así siempre se puede dar. Sin tope total:
    // ya lo tienen las pantallas, y uno de una pantalla cerrada vence a los 30 segundos.
    permits: createPermits(platform.clock),
  };
}

export type SignInContext = ReturnType<typeof createContext>;
