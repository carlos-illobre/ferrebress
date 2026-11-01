// Dar y sacar un rol al guardarlo (02 · R7.13, E65; diseño de 02, § 18), dentro del bloqueo de
// lock.ts y en cuatro consultas para cualquier cantidad de personas. Solo cuenta quien cambió de
// verdad: a esas personas se les sube la versión y van a la auditoría.
import { maxRolesPerPerson } from '@ferrebress/shared/contracts/roles';
import { type Data, type PersonChange, refuse } from './lock.ts';

// A quiénes se les da o se les saca el rol al guardarlo (R7.13).
export type Holders = { give?: string[] | undefined; take?: string[] | undefined };
export type By = { userId: string; at: Date };

// Lo que impide dar o sacar el rol a alguien (E65), o nada.
function holdingProblem(
  row: { active: boolean; roleIds: string[] } | undefined,
  roleId: string,
  giving: boolean,
) {
  if (!row) return 'person-missing' as const;
  if (!row.active) return 'person-inactive' as const;
  const has = row.roleIds.includes(roleId);
  if (giving && !has && row.roleIds.length >= maxRolesPerPerson) return 'too-many-roles' as const;
  if (!giving && has && row.roleIds.length === 1) return 'no-roles' as const;
  return undefined;
}

// Dar y sacar el rol, en cuatro consultas (diseño de 02, § 18): solo cuenta quien cambió de verdad.
// Dar a alguien pide confirmar quién es (R3.8).
export async function setHolders(
  data: Data,
  role: { id: string; name: string },
  { give = [], take = [] }: Holders,
  { confirmed, by }: { confirmed: boolean; by: By },
): Promise<PersonChange[]> {
  if (give.length === 0 && take.length === 0) return [];
  const rows = new Map((await data.lockPeople([...give, ...take])).map((row) => [row.id, row]));
  for (const [ids, giving] of [
    [give, true],
    [take, false],
  ] as const)
    for (const userId of ids) {
      const problem = holdingProblem(rows.get(userId), role.id, giving);
      if (problem) refuse(problem, { userId });
    }
  const given = await data.giveRole(role.id, give);
  const taken = await data.takeRole(role.id, take);
  if (given.length > 0 && !confirmed) refuse('confirm-first');
  await data.markRolesChanged([...given, ...taken], by);
  const changeOf = (userId: string, giving: boolean): PersonChange => {
    const row = rows.get(userId) as { roleNames: string[]; roleIds: string[] };
    const others = row.roleNames.filter((_, i) => row.roleIds[i] !== role.id);
    return giving
      ? { userId, roleId: role.id, before: others, after: [...others, role.name].sort() }
      : { userId, roleId: role.id, before: row.roleNames, after: others };
  };
  return [...given.map((id) => changeOf(id, true)), ...taken.map((id) => changeOf(id, false))];
}
