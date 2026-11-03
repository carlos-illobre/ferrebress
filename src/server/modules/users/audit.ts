// Cómo se anota un cambio de Usuarios (05 · R2, diseño de 05, § 2): a quién, con su nombre de ese
// momento, solo lo que cambió y cómo queda la persona, para «(hoy: …)» y los filtros.
import type { RecordFields } from '../../platform/guards.ts';
import { displayName, type User } from './rules.ts';

type Shown = Pick<User, 'name' | 'googleName' | 'email'>;

const personTarget = (user: Pick<User, 'id'> & Shown) => ({
  kind: 'person',
  id: user.id,
  name: displayName(user),
});

function personNow(user: Pick<User, 'id' | 'active'> & Shown, deleted = false) {
  const state = deleted ? 'deleted' : user.active ? 'active' : 'deactivated';
  return { userId: user.id, name: displayName(user), email: user.email, state } as const;
}

export const peopleNow = (users: User[]) => users.map((user) => personNow(user));

// Del nombre (el que se ve) y el correo, solo lo que cambió.
export function personChanges(before: Shown, after: Shown): NonNullable<RecordFields['changes']> {
  const fields = [
    ['name', displayName(before), displayName(after)],
    ['email', before.email, after.email],
  ] as const;
  return Object.fromEntries(
    fields
      .filter(([, was, is]) => was !== is)
      .map(([key, was, is]) => [key, { before: was, after: is }]),
  );
}

// Lo que va en la línea de un cambio a una persona: ella, cómo queda y lo que agrega cada cambio.
export const personRecord = (
  user: User,
  extra: Pick<RecordFields, 'changes' | 'data'> = {},
  deleted = false,
): RecordFields => ({
  targets: [personTarget(user)],
  people: [personNow(user, deleted)],
  ...extra,
});
