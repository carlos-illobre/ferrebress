// Lo que se hace con las personas desde Usuarios (02 · R3, R4; diseño de 02, §§ 4 a 6): autorizar,
// cambiar el nombre o el correo, borrar, dar de baja y de alta. Cada cambio lleva la versión que vio
// quien cambia; las reglas están en rules.ts y los bloqueos, en data.ts.
import type { Kysely } from 'kysely';
import type { AfterCommit } from '../../platform/events.ts';
import { newId } from '../../platform/ids.ts';
import type { Platform } from '../../platform/modules.ts';
import { type UsersTables, usersData } from './data.ts';
import { Rollback } from './roles/changes.ts';
import { type RolesTables, rolesData } from './roles/data.ts';
import { administrationProblem } from './roles/rules.ts';
import { cleanName, normalizeEmail, type User } from './rules.ts';

// Por qué un cambio no se guardó: otra persona lo cambió antes (`changed`), ya entró, es la propia, o
// quedaría sin nadie activo que administre.
export type Refusal =
  | 'not-found'
  | 'changed'
  | 'already-entered'
  | 'self'
  | 'last-administrator'
  | 'email-taken'
  | 'bad-request';

// `unchanged`: ya estaba así (dada de alta o de baja); se contesta cómo está, sin anotar nada.
// `audit`: lo que se suma a su línea de la auditoría.
export type Outcome =
  | { user: User; unchanged?: true; audit?: Record<string, unknown> }
  | { refused: Refusal; user?: User };

// Lo que no se tocó: o no existe, o cambió (y se devuelve como está), o con la misma versión no
// hacía falta (`same`: ya estaba dada de baja o de alta) o ya entró.
async function whyNot(
  data: ReturnType<typeof usersData>,
  id: string,
  version: number,
  same: 'already-entered' | 'as-is',
): Promise<Outcome> {
  const user = await data.findById(id);
  if (!user) return { refused: 'not-found' };
  if (user.version !== version) return { refused: 'changed', user };
  return same === 'as-is' ? { user, unchanged: true } : { refused: 'already-entered', user };
}

export function createPeople(platform: Platform) {
  const data = () => usersData(platform.db as Kysely<UsersTables>);

  return {
    authorize: (asking: string, email: string, name: string | null | undefined, roles: string[]) =>
      authorize(platform, asking, { email, name, roles }),

    // Sin `name`, el nombre no cambia (el contrato); con el correo, puede cambiar a la vez.
    async change(id: string, version: number, change: { name?: string | null; email?: string }) {
      const name = change.name === undefined ? undefined : cleanName(change.name);
      const changed =
        change.email === undefined
          ? await rename(platform, id, version, name ?? null)
          : await data().changeEmail(id, version, normalizeEmail(change.email), name);
      return changed ? { user: changed } : whyNot(data(), id, version, 'already-entered');
    },

    async remove(id: string, version: number): Promise<Outcome | { removed: true }> {
      return (await data().remove(id, version))
        ? { removed: true }
        : whyNot(data(), id, version, 'already-entered');
    },

    async activate(asking: string, id: string, version: number): Promise<Outcome> {
      if (asking === id) return { refused: 'self' };
      const user = await data().activate(id, version);
      return user ? { user } : whyNot(data(), id, version, 'as-is');
    },

    deactivate: (asking: string, id: string, version: number) =>
      deactivate(platform, asking, id, version),
  };
}

// Autorizar con sus roles (R3.3), en una sola sentencia: el correo repetido no guarda nada, y un rol
// que no existe tampoco.
async function authorize(
  platform: Platform,
  asking: string,
  given: { email: string; name: string | null | undefined; roles: string[] },
): Promise<Outcome> {
  const user = {
    id: newId(platform.clock),
    email: normalizeEmail(given.email),
    name: cleanName(given.name),
    authorizedBy: asking,
  };
  try {
    const inserted = await usersData(platform.db as Kysely<UsersTables>).insert(user, given.roles);
    if (!inserted) return { refused: 'email-taken' };
    const { roleNames, ...saved } = inserted;
    return { user: { ...saved, roleIds: given.roles }, audit: { roles: roleNames } };
  } catch (error) {
    if ((error as { code?: string }).code === '23503') return { refused: 'bad-request' };
    throw error;
  }
}

// R1.3: nunca la propia, y nunca dejar sin quien administre. Bajo el bloqueo de quien administra
// (diseño de 02, § 19), cuenta antes y después; si queda alguien sin poder, se deshace. Lo de después
// de confirmar (sign-in cierra sus sesiones, se olvidan sus permisos) corre al final.
async function deactivate(
  platform: Platform,
  asking: string,
  id: string,
  version: number,
): Promise<Outcome> {
  if (asking === id) return { refused: 'self' };
  const data = usersData(platform.db as Kysely<UsersTables>);
  try {
    const { outcome, after } = await platform.db.transaction().execute(async (trx) => {
      const roles = rolesData(trx as Kysely<RolesTables>);
      const before = await roles.lockAndCount(asking);
      const user = await data.deactivate(
        trx as Kysely<UsersTables>,
        id,
        version,
        platform.clock.now(),
      );
      if (!user) return { outcome: undefined, after: [] };
      const problem = administrationProblem(before, await roles.administration(asking));
      if (problem) throw new Rollback(problem);
      const events = platform.events;
      return {
        outcome: { user },
        after: [
          ...(await events.publish('user.deactivated', { userId: id }, trx)),
          ...(await events.publish('users.permissions-changed', { userIds: [id] }, trx)),
        ],
      };
    });
    for (const then of after) then();
    return outcome ?? whyNot(data, id, version, 'as-is');
  } catch (error) {
    if (error instanceof Rollback) return { refused: error.refusal as Refusal };
    throw error;
  }
}

// Cambiar el nombre y avisarlo en la misma transacción: quien lo recuerda en memoria se pone al día
// después de confirmarla (ADR-004).
async function rename(platform: Platform, id: string, version: number, name: string | null) {
  const { user, after } = await platform.db.transaction().execute(async (trx) => {
    const user = await usersData(trx as Kysely<UsersTables>).rename(id, version, name);
    const after: AfterCommit[] = user
      ? await platform.events.publish('user.renamed', { userId: id }, trx)
      : [];
    return { user, after };
  });
  for (const then of after) then();
  return user;
}

export type People = ReturnType<typeof createPeople>;
