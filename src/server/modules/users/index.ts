// La fachada de las personas (diseño de 01, § 2): lo único que los otros módulos usan de users.
// Crea el primer Administrador al arrancar y publica `user.deactivated` al dar de baja, así
// sign-in cierra las sesiones sin que users lo conozca.
import type { Kysely } from 'kysely';
import { newId } from '../../platform/ids.ts';
import type { Platform, ServerModule } from '../../platform/modules.ts';
import { type UsersTables, usersData } from './data.ts';
import { createUsers } from './migrations/001-users.ts';
import { type GoogleMatch, matchGoogleAccount, normalizeEmail, type User } from './rules.ts';

declare module '../../platform/events.ts' {
  interface ServerEvents {
    'user.deactivated': { userId: string };
  }
}

export type { GoogleMatch, User };

export function createUsersModule() {
  let platform: Platform;
  const data = () => usersData(platform.db as Kysely<UsersTables>);

  const module: ServerModule = {
    name: 'users',
    schema: { schema: 'users', migrations: { '001-users': createUsers } },
    async register(given) {
      platform = given;
      const email = normalizeEmail(given.config.INITIAL_ADMIN_EMAIL);
      await data().createIfMissing(newId(given.clock), email);
    },
  };

  const users = {
    findById: (id: string) => data().findById(id),

    async matchGoogle(subject: string, email: string, name: string): Promise<GoogleMatch> {
      const match = matchGoogleAccount(
        await data().findGoogleCandidates(subject, normalizeEmail(email)),
        subject,
        email,
      );
      if (match.kind !== 'found' || !match.link) return match;
      await data().linkGoogle(match.user.id, subject, name);
      return { ...match, user: { ...match.user, googleSubject: subject, name } };
    },

    deactivate: (id: string): Promise<void> =>
      platform.db.transaction().execute(async (trx) => {
        if (await data().deactivate(trx as Kysely<UsersTables>, id)) {
          await platform.events.publish('user.deactivated', { userId: id }, trx);
        }
      }),
  };

  return { module, users };
}

export type Users = ReturnType<typeof createUsersModule>['users'];
