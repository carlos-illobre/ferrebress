// Lo que comparten las rutas de entrar: la plataforma, las personas, las sesiones, lo que vive en
// memoria y los pasos comunes de cada ruta (anotar en la auditoría y frenar por límite de intentos).
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import type { Kysely } from 'kysely';
import { createGuards } from '../../platform/guards.ts';
import { createOneUse } from '../../platform/limits/one-use.ts';
import { createGuardedMemory } from '../../platform/memory.ts';
import type { Platform } from '../../platform/modules.ts';
import { displayName, type User, type Users } from '../users/index.ts';
import { createScreens } from './codes/computer/screens.ts';
import type { GoogleSettings } from './google/verify.ts';
import { type PasskeysTables, passkeysData } from './passkeys/data.ts';
import { createSessionStore } from './sessions/store.ts';
import { codeSettings, signInSettings } from './settings.ts';

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
};

const { throttledAudit } = signInSettings.limits;

// Los desafíos de la huella: para entrar, para vincular la huella de una sesión o para volver a
// confirmar quién es (02 · R3.8).
type Challenge = { purpose: 'sign-in' } | { purpose: 'link' | 'confirm'; sessionId: string };

export function createContext(platform: Platform, { users, google, wait }: SignInDependencies) {
  return {
    platform,
    users,
    google,
    store: createSessionStore(platform.db, platform.clock, (session, reason) =>
      platform.audit.record({
        type: 'session.ended',
        at: platform.clock.now(),
        actor: { kind: 'system' },
        targets: [{ kind: 'person', id: session.userId }],
        data: { reason },
      }),
    ),
    nonces: createOneUse<true>(platform.clock, signInSettings.nonce),
    challenges: createOneUse<Challenge>(platform.clock, signInSettings.challenge),
    passkeys: passkeysData(platform.db as Kysely<PasskeysTables>),
    // De quién es la huella de cada celular, ya consultada (diseño de 15, § 10): así /api/start con
    // la sesión en memoria sigue sin consultar la base. Vincular la actualiza.
    phoneOwners: new Map<string, string | undefined>(),
    relyingParty: {
      id: new URL(platform.config.PUBLIC_ORIGIN).hostname,
      origin: platform.config.PUBLIC_ORIGIN,
    },
    // Anotar en la auditoría y frenar por límite de intentos (platform/guards.ts).
    ...createGuards(platform, { topic: 'sign-in', window: throttledAudit }),
    people: createPeople(users),
    wait,
    screens: createScreens(platform.clock),
    // El permiso que la computadora cambia por su sesión, una vez y por 30 segundos. Uno por
    // pantalla: uno nuevo reemplaza al anterior sin usar, así siempre se puede dar. Sin tope total:
    // ya lo tienen las pantallas, y uno de una pantalla cerrada vence a los 30 segundos.
    permits: createOneUse<{ screenId: string; userId: string; approvedBy: string }>(
      platform.clock,
      {
        ttlMs: codeSettings.permitTtlMs,
        maxTotal: Number.POSITIVE_INFINITY,
        maxPerOwner: 1,
        replaceOldest: true,
      },
    ),
  };
}

export type SignInContext = ReturnType<typeof createContext>;
