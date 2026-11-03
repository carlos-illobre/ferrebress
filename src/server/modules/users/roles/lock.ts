// Lo que puede dejar sin quien administre (02 · R1.3; diseño de 02, § 19) corre en una transacción
// que bloquea la fila del rol del sistema: todos esos cambios pasan de a uno. Bajo el bloqueo, quien
// lo pide tiene que seguir activo y con el permiso que hace falta (un pedido que estaba en camino
// cuando se lo sacaron no se guarda); se cuenta antes y después, y si queda alguien sin poder se
// deshace. Al confirmar se avisa que cambiaron los permisos, así se olvida lo que estaba en memoria.
import type { Kysely, Transaction } from 'kysely';
import type { Publish } from '../../../platform/events.ts';
import type { RecordFields } from '../../../platform/guards.ts';
import type { Platform } from '../../../platform/modules.ts';
import { type RolesTables, rolesData } from './data.ts';
import { type Administration, administrationProblem } from './rules.ts';

export type Refused =
  | 'not-found'
  | 'changed'
  | 'bad-request'
  | 'role-name-taken'
  | 'role-in-use'
  | 'system-role'
  | 'too-many-roles'
  | 'no-roles'
  | 'person-inactive'
  | 'person-missing'
  | 'self'
  | 'last-administrator'
  | 'confirm-first'
  | 'forbidden';

// De quién o de qué permiso es el rechazo, para mostrarlo en su lugar (diseño de 02, § 18).
export type RefusalDetail = { userId?: string; permission?: string };

// Deshace la transacción y dice por qué.
class Rollback extends Error {
  readonly refusal: Refused;
  readonly detail: RefusalDetail;
  constructor(refusal: Refused, detail: RefusalDetail = {}) {
    super(refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

export const refuse = (refusal: Refused, detail?: RefusalDetail): never => {
  throw new Rollback(refusal, detail);
};

// A quién le cambiaron los roles al guardar un rol, para la auditoría.
export type PersonChange = { userId: string; roleId: string; before: string[]; after: string[] };

export type Data = ReturnType<typeof rolesData>;

// Lo que hizo un cambio: su resultado, lo que va a la auditoría (lo de antes y lo de después), a
// quiénes les cambiaron los permisos y otros avisos que salen con la misma transacción.
// Lo que va a la línea del cambio en la auditoría: a qué se le hizo y qué cambió; sin nada, no hay
// línea (solo cambiaron quiénes lo tienen).
export type AuditFields = Pick<RecordFields, 'targets' | 'changes'>;

export type Done<T> = {
  result: T;
  audit?: AuditFields;
  affects: string[] | 'all';
  people?: PersonChange[];
  also?: (publish: Publish) => Promise<void>;
};

export type LockOutcome<T> =
  | { result: T; audit?: AuditFields; people: PersonChange[] }
  | { refused: Refused; detail: RefusalDetail };

// R1.3 después del cambio: si quien lo hace se sacó lo suyo, dice qué permiso (diseño de 02, § 18).
async function checkAdministration(data: Data, before: Administration, asking: string) {
  const after = await data.administration(asking);
  const problem = administrationProblem(before, after);
  const lostRoles = before.askingManagesRoles && !after.askingManagesRoles;
  if (problem === 'self')
    refuse('self', { permission: lostRoles ? 'roles.manage' : 'users.manage' });
  if (problem) refuse(problem);
}

export async function underLock<T>(
  platform: Platform,
  asking: string,
  need: 'users.manage' | 'roles.manage',
  work: (data: Data, trx: Transaction<unknown>) => Promise<Done<T>>,
): Promise<LockOutcome<T>> {
  try {
    const done = await platform.events.transaction(platform.db, async (trx, publish) => {
      const data = rolesData(trx as Kysely<RolesTables>);
      const before = await data.lockAndCount(asking);
      if (!(need === 'users.manage' ? before.askingManages : before.askingManagesRoles))
        refuse('forbidden');
      const done = await work(data, trx);
      await checkAdministration(data, before, asking);
      // A quiénes les cambiaron los permisos, y otros avisos que salen con el mismo cambio.
      if (done.affects.length > 0)
        await publish('users.permissions-changed', { userIds: done.affects });
      await done.also?.(publish);
      return done;
    });
    return {
      result: done.result,
      people: done.people ?? [],
      ...(done.audit && { audit: done.audit }),
    };
  } catch (error) {
    if (error instanceof Rollback) return { refused: error.refusal, detail: error.detail };
    throw error;
  }
}
