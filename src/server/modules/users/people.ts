// Lo que se hace con las personas desde Usuarios (02 · R3, R4; diseño de 02, §§ 4 a 6): autorizar,
// cambiar el nombre o el correo, borrar, dar de baja y de alta. Cada cambio lleva la versión que vio
// quien cambia; las reglas están en rules.ts y los bloqueos, en data.ts.
import type { Kysely } from 'kysely';
import type { AfterCommit } from '../../platform/events.ts';
import { newId } from '../../platform/ids.ts';
import type { Platform } from '../../platform/modules.ts';
import { type UsersTables, usersData } from './data.ts';
import { cleanName, normalizeEmail, type User, wouldLeaveNobody } from './rules.ts';

// Por qué un cambio no se guardó: otra persona lo cambió antes (`changed`), ya entró, es la propia, o
// quedaría sin nadie activo que administre.
export type Refusal =
  | 'not-found'
  | 'changed'
  | 'already-entered'
  | 'self'
  | 'last-administrator'
  | 'email-taken';

export type Outcome = { user: User } | { refused: Refusal; user?: User };

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
  return same === 'as-is' ? { user } : { refused: 'already-entered', user };
}

export function createPeople(platform: Platform) {
  const data = () => usersData(platform.db as Kysely<UsersTables>);

  return {
    async authorize(asking: string, email: string, name?: string | null): Promise<Outcome> {
      const user = {
        id: newId(platform.clock),
        email: normalizeEmail(email),
        name: cleanName(name),
      };
      const inserted = await data().insert({ ...user, authorizedBy: asking });
      return inserted ? { user: inserted } : { refused: 'email-taken' };
    },

    async change(id: string, version: number, change: { name?: string | null; email?: string }) {
      const name = cleanName(change.name);
      const changed =
        change.email === undefined
          ? await rename(platform, id, version, name)
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

// R1.3: nunca la propia, y nunca la última activa. Con las activas bloqueadas en orden, dos bajas a
// la vez se esperan, y la segunda ve que quedaría sin nadie (E05). Lo de después de confirmar (sign-in
// pone al día su memoria) corre al final.
async function deactivate(
  platform: Platform,
  asking: string,
  id: string,
  version: number,
): Promise<Outcome> {
  if (asking === id) return { refused: 'self' };
  const data = usersData(platform.db as Kysely<UsersTables>);
  const { outcome, after } = await platform.db.transaction().execute(async (trx) => {
    const locked = trx as Kysely<UsersTables>;
    if (wouldLeaveNobody(await data.lockActiveIds(locked), id))
      return { outcome: { refused: 'last-administrator' as const }, after: [] };
    const user = await data.deactivate(locked, id, version, platform.clock.now());
    if (!user) return { outcome: undefined, after: [] };
    return {
      outcome: { user },
      after: await platform.events.publish('user.deactivated', { userId: id }, trx),
    };
  });
  for (const then of after) then();
  return outcome ?? whyNot(data, id, version, 'as-is');
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
