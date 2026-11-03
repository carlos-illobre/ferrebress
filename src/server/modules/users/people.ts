// Lo que se hace con las personas desde Usuarios (02 · R3, R4; diseño de 02, §§ 4 a 6 y 19):
// autorizar con sus roles, cambiar el nombre o el correo, borrar, dar de baja y de alta. Cada cambio
// lleva la versión que vio quien cambia; las reglas están en rules.ts y el bloqueo de la baja, en
// roles/lock.ts.
import type { Kysely } from 'kysely';
import type { AfterCommit } from '../../platform/events.ts';
import type { RecordFields } from '../../platform/guards.ts';
import { newId } from '../../platform/ids.ts';
import type { Platform } from '../../platform/modules.ts';
import { personChanges } from './audit.ts';
import { type UsersTables, usersData } from './data.ts';
import { refuse, underLock } from './roles/lock.ts';
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
  | 'bad-request'
  | 'forbidden';

// `unchanged`: ya estaba así (dada de alta o de baja); se contesta cómo está, sin anotar nada.
// `audit`: lo que se suma a su línea de la auditoría.
export type Outcome =
  | { user: User; unchanged?: true; audit?: Pick<RecordFields, 'changes' | 'data'> }
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
      if (!changed) return whyNot(data(), id, version, 'already-entered');
      const { previous, ...user } = changed;
      return { user, audit: { changes: personChanges(previous, user) } };
    },

    // Devuelve a quien se borró, para anotarlo con su nombre (05 · R2.4).
    async remove(
      id: string,
      version: number,
    ): Promise<Outcome | { removed: Omit<User, 'roleIds'> }> {
      const removed = await data().remove(id, version);
      return removed ? { removed } : whyNot(data(), id, version, 'already-entered');
    },

    async activate(asking: string, id: string, version: number): Promise<Outcome> {
      if (asking === id) return { refused: 'self' };
      const user = await activate(platform, id, version);
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
    return { user: { ...saved, roleIds: given.roles }, audit: { data: { roles: roleNames } } };
  } catch (error) {
    if ((error as { code?: string }).code === '23503') return { refused: 'bad-request' };
    throw error;
  }
}

// R1.3: nunca la propia, y nunca dejar sin quien administre: corre bajo el bloqueo de quien
// administra (diseño de 02, § 19), con «Administrar personas». Lo de después de confirmar (sign-in
// cierra sus sesiones, se olvidan sus permisos) corre al final.
async function deactivate(
  platform: Platform,
  asking: string,
  id: string,
  version: number,
): Promise<Outcome> {
  if (asking === id) return { refused: 'self' };
  const outcome = await underLock(platform, asking, 'users.manage', async (_, trx) => {
    const user =
      (await usersData(trx as Kysely<UsersTables>).deactivate(
        trx as Kysely<UsersTables>,
        id,
        version,
        platform.clock.now(),
      )) ?? refuse('changed');
    const also = (sent: typeof trx) =>
      platform.events.publish('user.deactivated', { userId: id }, sent);
    return { result: user, audit: {}, affects: [id], also };
  });
  if (!('refused' in outcome)) return { user: outcome.result };
  if (outcome.refused !== 'changed') return { refused: outcome.refused as Refusal };
  return whyNot(usersData(platform.db as Kysely<UsersTables>), id, version, 'as-is');
}

// Dar de alta, y avisar que cambiaron sus permisos: vuelve con sus roles (R4.3, seguridad 36).
async function activate(platform: Platform, id: string, version: number) {
  const { user, after } = await platform.db.transaction().execute(async (trx) => {
    const user = await usersData(trx as Kysely<UsersTables>).activate(id, version);
    const after: AfterCommit[] = user
      ? await platform.events.publish('users.permissions-changed', { userIds: [id] }, trx)
      : [];
    return { user, after };
  });
  for (const then of after) then();
  return user;
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
