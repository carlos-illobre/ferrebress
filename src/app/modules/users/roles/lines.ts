// Lo que se dice de cada rol en la lista (02 · R7.12), resuelto para cualquier vista: cuántos permisos
// da, quiénes lo tienen y las iniciales que entran (con más, las primeras y «+N»).
import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { initialsOf } from '../logic.ts';
import { activeHolders } from './paths.ts';
import { rolesTexts as t } from './texts.ts';

// Las iniciales que entran en `max` lugares: las primeras y, si sobran, cuántas más.
export function facesOf(people: readonly PersonRow[], max: number) {
  const room = people.length > max ? max - 1 : max;
  return {
    faces: people
      .slice(0, room)
      .map((one, index) => ({ id: one.id, initials: initialsOf(one), index })),
    more: people.length > room ? people.length - room : undefined,
  };
}

export function roleRowLines(role: RoleRow, people: PersonRow[]) {
  const holders = activeHolders(people, role.id);
  const count = role.permissions.length;
  return {
    role,
    permissions: { count, word: t.permissionsWord(count) },
    // Quiénes lo tienen: en la computadora, hasta cuatro círculos; en el celular, dos y el número.
    holders:
      holders.length > 0
        ? {
            count: holders.length,
            text: t.holders(holders.length),
            word: t.peopleWord(holders.length),
            wide: facesOf(holders, 4),
            narrow: facesOf(holders, 2),
          }
        : undefined,
  };
}

export type RoleRowLines = ReturnType<typeof roleRowLines>;
