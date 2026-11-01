// Lo que puede dejar sin quien administre (02 · R1.3; diseño de 02, § 19) corre en una transacción
// que bloquea la fila del rol del sistema: todos esos cambios pasan de a uno. Bajo el bloqueo, quien
// lo pide tiene que seguir activo y con el permiso que hace falta (un pedido que estaba en camino
// cuando se lo sacaron no se guarda); se cuenta antes y después, y si queda alguien sin poder se
// deshace. Al confirmar se avisa que cambiaron los permisos, así se olvida lo que estaba en memoria.
import type { Kysely, Transaction } from 'kysely';
import type { AfterCommit } from '../../../platform/events.ts';
import type { Platform } from '../../../platform/modules.ts';
import { type RolesTables, rolesData } from './data.ts';
import { administrationProblem } from './rules.ts';

export type Refused =
  | 'not-found'
  | 'changed'
  | 'bad-request'
  | 'role-name-taken'
  | 'role-in-use'
  | 'system-role'
  | 'too-many-roles'
  | 'self'
  | 'last-administrator'
  | 'confirm-first'
  | 'forbidden';

// Deshace la transacción y dice por qué.
export class Rollback extends Error {
  readonly refusal: Refused;
  constructor(refusal: Refused) {
    super(refusal);
    this.refusal = refusal;
  }
}

export const refuse = (refusal: Refused): never => {
  throw new Rollback(refusal);
};

export type Data = ReturnType<typeof rolesData>;

// Lo que hizo un cambio: su resultado, lo que va a la auditoría (lo de antes y lo de después), a
// quiénes les cambiaron los permisos y otros avisos que salen con la misma transacción.
export type Done<T> = {
  result: T;
  audit: Record<string, unknown>;
  affects: string[] | 'all';
  also?: (trx: Transaction<unknown>) => Promise<AfterCommit[]>;
};

export type LockOutcome<T> = { result: T; audit: Record<string, unknown> } | { refused: Refused };

const notify = (platform: Platform, affects: string[] | 'all', trx: Transaction<unknown>) =>
  affects.length === 0
    ? Promise.resolve([])
    : platform.events.publish('users.permissions-changed', { userIds: affects }, trx);

export async function underLock<T>(
  platform: Platform,
  asking: string,
  need: 'users.manage' | 'roles.manage',
  work: (data: Data, trx: Transaction<unknown>) => Promise<Done<T>>,
): Promise<LockOutcome<T>> {
  try {
    const { done, after } = await platform.db.transaction().execute(async (trx) => {
      const data = rolesData(trx as Kysely<RolesTables>);
      const before = await data.lockAndCount(asking);
      if (!(need === 'users.manage' ? before.askingManages : before.askingManagesRoles))
        refuse('forbidden');
      const done = await work(data, trx as Transaction<unknown>);
      const problem = administrationProblem(before, await data.administration(asking));
      if (problem) refuse(problem);
      const sent = trx as Transaction<unknown>;
      const after = [
        ...(await notify(platform, done.affects, sent)),
        ...((await done.also?.(sent)) ?? []),
      ];
      return { done, after };
    });
    for (const then of after) then();
    return { result: done.result, audit: done.audit };
  } catch (error) {
    if (error instanceof Rollback) return { refused: error.refusal };
    throw error;
  }
}
