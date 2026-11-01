// Una persona como la muestra la lista de Usuarios (02 · R3.1; diseño de 02, §§ 4 y 18), para quien
// mira: si es la propia y si tiene más permisos que quien mira.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { displayName, neverSignedIn, type User } from './rules.ts';

const time = (at: Date | null) => (at ? at.getTime() : null);

export function rowOf(
  user: User,
  askingUserId: string,
  counts = { sessions: 0, phones: 0 },
  outranks = false,
): PersonRow {
  return {
    id: user.id,
    name: user.name,
    displayName: displayName(user),
    email: user.email,
    active: user.active,
    self: user.id === askingUserId,
    authorizedAt: user.createdAt.getTime(),
    authorizedBy: user.authorizedBy,
    deactivatedAt: time(user.deactivatedAt),
    lastSignInAt: time(user.lastSignInAt),
    neverSignedIn: neverSignedIn(user),
    version: user.version,
    ...counts,
    roleIds: user.roleIds,
    outranks,
  };
}
