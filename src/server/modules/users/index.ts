// La fachada de las personas (diseños de 01, § 2, y de 02, § 3): lo único que los otros módulos
// usan de users. Publica `user.deactivated` y `user.renamed`, así sign-in cierra las sesiones y
// olvida lo que recordaba sin que users lo conozca. En las pruebas de punta a punta, el arranque
// carga a la primera persona (02, § 7).
import type { Kysely } from 'kysely';
import type { Platform, ServerModule } from '../../platform/modules.ts';
import { type UsersTables, usersData } from './data.ts';
import { addFirstAdministrator } from './first.ts';
import { createUsers } from './migrations/001-users.ts';
import { addPeople } from './migrations/002-people.ts';
import { createPeople, type People } from './people.ts';
import { type AccessCounts, registerPeopleRoutes } from './routes.ts';
import {
  cleanName,
  displayName,
  type GoogleMatch,
  matchGoogleAccount,
  normalizeEmail,
  type User,
} from './rules.ts';

declare module '../../platform/events.ts' {
  interface ServerEvents {
    'user.deactivated': { userId: string };
    'user.renamed': { userId: string };
  }
}

export type { AccessCounts, GoogleMatch, User };
export { displayName };

// `accessCounts`: cuántas sesiones y celulares tiene cada persona, que da sign-in (02, § 3).
export function createUsersModule({ accessCounts }: { accessCounts: AccessCounts }) {
  let platform: Platform;
  let people: People;
  const data = () => usersData(platform.db as Kysely<UsersTables>);

  const module: ServerModule = {
    name: 'users',
    schema: {
      schema: 'users',
      migrations: { '001-users': createUsers, '002-people': addPeople },
    },
    async register(given) {
      platform = given;
      people = createPeople(given);
      registerPeopleRoutes(given, people, () => data().findAll(), accessCounts);
      const first = given.config.E2E_FIRST_ADMIN_EMAIL;
      if (first) await addFirstAdministrator(given.db, given.clock, first);
    },
  };

  const users = {
    findById: (id: string) => data().findById(id),
    findByIds: (ids: string[]) => data().findByIds(ids),

    // La cuenta que corresponde a un pase de Google. La primera vez la ata, solo si sigue siendo
    // esa persona con ese correo (02, § 5): si no, no está autorizada.
    async matchGoogle(subject: string, email: string, name: string): Promise<GoogleMatch> {
      const match = matchGoogleAccount(
        await data().findGoogleCandidates(subject, normalizeEmail(email)),
        subject,
        email,
      );
      if (match.kind !== 'found' || !match.link) return match;
      const googleName = cleanName(name);
      const linked = await data().linkGoogle(match.user.id, match.user.email, subject, googleName);
      if (!linked) return { kind: 'not-authorized', reason: 'unknown' };
      return { ...match, user: { ...match.user, googleSubject: subject, googleName } };
    },

    // R3.2: cuándo entró por última vez, con la hora del servidor. Solo si sigue activa: dice si lo
    // estaba (02, § 5).
    recordSignIn: (id: string, at: Date) => data().recordSignIn(id, at),
  };

  // Lo que se hace desde Usuarios; existe después de registrar el módulo.
  return { module, users, people: () => people };
}

export type Users = ReturnType<typeof createUsersModule>['users'];
