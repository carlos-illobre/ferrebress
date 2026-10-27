// Las consultas de las personas a la base: cada una, una sola consulta.
import type { Generated, Kysely } from 'kysely';
import type { User } from './rules.ts';

export type UsersTables = {
  'users.users': {
    id: string;
    email: string;
    google_subject: string | null;
    name: string | null;
    active: Generated<boolean>;
  };
};

const columns = ['id', 'email', 'google_subject as googleSubject', 'name', 'active'] as const;

export function usersData(db: Kysely<UsersTables>) {
  return {
    findById: (id: string): Promise<User | undefined> =>
      db.selectFrom('users.users').select(columns).where('id', '=', id).executeTakeFirst(),

    // A lo sumo dos filas: la del identificador y la del correo.
    findGoogleCandidates: (subject: string, email: string): Promise<User[]> =>
      db
        .selectFrom('users.users')
        .select(columns)
        .where((eb) => eb.or([eb('google_subject', '=', subject), eb('email', '=', email)]))
        .execute(),

    linkGoogle: async (id: string, subject: string, name: string): Promise<void> => {
      await db
        .updateTable('users.users')
        .set({ google_subject: subject, name })
        .where('id', '=', id)
        .execute();
    },

    createIfMissing: async (id: string, email: string): Promise<void> => {
      await db
        .insertInto('users.users')
        .values({ id, email })
        .onConflict((oc) => oc.column('email').doNothing())
        .execute();
    },

    deactivate: async (trx: Kysely<UsersTables>, id: string): Promise<boolean> => {
      const result = await trx
        .updateTable('users.users')
        .set({ active: false })
        .where('id', '=', id)
        .where('active', '=', true)
        .executeTakeFirst();
      return result.numUpdatedRows > 0n;
    },
  };
}
