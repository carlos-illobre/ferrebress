// Elegir roles (R3.3, R7.5), resuelto para cualquier vista: cada rol con si está elegido, tildar o
// destildar uno, lo que va a poder con los elegidos (y de cuáles le viene cada permiso) y lo que
// cambia contra los que tiene.
import { permissions } from '@ferrebress/shared/contracts/permissions';
import type { RoleRow, RoleSummary } from '@ferrebress/shared/contracts/roles';

export const picksOf = (roles: readonly RoleSummary[], chosen: readonly string[]) =>
  roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    on: chosen.includes(role.id),
  }));

export const toggled = (chosen: readonly string[], id: string) =>
  chosen.includes(id) ? chosen.filter((one) => one !== id) : [...chosen, id];

// Cada permiso, si lo va a tener y de qué roles le viene; mientras no llegaron los roles, ninguno.
export function abilitiesOf(roleRows: readonly RoleRow[] | undefined, chosen: readonly string[]) {
  const giving = (roleRows ?? []).filter((role) => chosen.includes(role.id));
  return permissions.map((one) => {
    const from = giving.filter((role) => (role.permissions as string[]).includes(one.id));
    return {
      id: one.id,
      name: one.name,
      on: from.length > 0,
      from: from.map((r) => r.name).join(' · '),
    };
  });
}

// Lo que gana y lo que pierde; dar un rol pide confirmar.
export function diffOf(
  roles: readonly RoleSummary[],
  had: readonly string[],
  chosen: readonly string[],
) {
  const name = (id: string) => roles.find((role) => role.id === id)?.name as string;
  const added = chosen.filter((id) => !had.includes(id));
  return {
    added: added.map((id) => ({ id, name: name(id) })),
    removed: had.filter((id) => !chosen.includes(id)).map((id) => ({ id, name: name(id) })),
    confirm: added.length > 0,
  };
}

// El primer nombre: de su nombre o, sin nombre, de su correo.
export const firstName = (displayName: string) => displayName.split(/[\s@]/)[0] as string;
