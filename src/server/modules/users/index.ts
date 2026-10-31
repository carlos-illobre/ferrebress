// La fachada de las personas (diseños de 01, § 2, y de 02, § 3): lo único que los otros módulos
// usan de users. Publica `user.deactivated` y `user.renamed`, así sign-in cierra las sesiones y
// olvida lo que recordaba sin que users lo conozca. En las pruebas de punta a punta, el arranque
// carga a la primera persona (02, § 7).
import { isPermission, type PermissionId } from '@ferrebress/shared/contracts/permissions';
import type { Kysely } from 'kysely';
import type { Platform, ServerModule } from '../../platform/modules.ts';
import { type Access, createAccess } from './access.ts';
import { type UsersTables, usersData } from './data.ts';
import { addFirstAdministrator } from './first.ts';
import { createUsers } from './migrations/001-users.ts';
import { addPeople } from './migrations/002-people.ts';
import { addRoles } from './migrations/003-roles.ts';
import { createPeople, type People } from './people.ts';
import { createRoleChanges } from './role-changes.ts';
import { type RolesTables, rolesData } from './roles-data.ts';
import { registerRoleRoutes } from './roles-routes.ts';
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
    // Cambiaron los permisos de esas personas (o de todas, al cambiar un rol): se olvidan los que
    // estaban en memoria (diseño de 02, § 17).
    'users.permissions-changed': { userIds: string[] | 'all' };
  }
}

export type { AccessCounts, GoogleMatch, User };
export { displayName };

// `accessCounts`: cuántas sesiones y celulares tiene cada persona, que da sign-in (02, § 3).
export function createUsersModule({ accessCounts }: { accessCounts: AccessCounts }) {
  let platform: Platform;
  let people: People;
  let access: Access;
  const data = () => usersData(platform.db as Kysely<UsersTables>);

  const module: ServerModule = {
    name: 'users',
    schema: {
      schema: 'users',
      migrations: { '001-users': createUsers, '002-people': addPeople, '003-roles': addRoles },
    },
    async register(given) {
      platform = given;
      people = createPeople(given);
      access = createAccess(given);
      given.permissions.provide(access.permissionsOf);
      await access.addNewPermissions();
      registerPeopleRoutes(given, people, () => data().findAll(), accessCounts, access);
      registerRoleRoutes(given, createRoleChanges(given), access);
      const first = given.config.E2E_FIRST_ADMIN_EMAIL;
      if (first) await addFirstAdministrator(given.db, given.clock, first);
    },
  };

  const users = facade(
    () => platform,
    data,
    () => access,
  );

  // Lo que se hace desde Usuarios; existe después de registrar el módulo.
  return { module, users, people: () => people };
}

// Los roles de una persona como los muestra la aplicación (diseño de 02, § 20).
export type Profile = {
  roles: { id: string; name: string }[];
  permissions: PermissionId[];
  rolesChangedBy: string | null;
  rolesChangedAt: number | null;
};

// Lo que usan los otros módulos.
function facade(
  platform: () => Platform,
  data: () => ReturnType<typeof usersData>,
  access: () => Access,
) {
  return {
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

    // Los permisos de una persona activa (la unión de sus roles; R7.1), y si `target` tiene alguno
    // que `asking` no tiene (R7.11).
    permissionsOf: (id: string) => access().permissionsOf(id),
    outranks: (asking: string, target: string) => access().outranks(asking, target),
    outranking: (asking: string, userIds: readonly string[]) =>
      access().outranking(asking, userIds),

    // Sus roles con nombre, sus permisos y quién le cambió los roles por última vez y cuándo (R7.8).
    async profileOf(user: User): Promise<Profile> {
      const { roles, permissions, changer } = await rolesData(
        platform().db as Kysely<RolesTables>,
      ).profileOf(user.id, user.rolesChangedBy);
      return {
        roles,
        permissions: permissions.filter(isPermission),
        rolesChangedBy: changer && displayName(changer),
        rolesChangedAt: user.rolesChangedAt?.getTime() ?? null,
      };
    },
  };
}

export type Users = ReturnType<typeof facade>;
