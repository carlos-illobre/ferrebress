// Buscar un rol (02 · R7.12; diseño de 02, § 20): por su nombre o su descripción, el nombre de sus
// permisos o el nombre o el correo de alguien activo que lo tiene, sin mayúsculas ni tildes. Todo en
// la aplicación, con lo que ya está cargado. El texto de cada rol se arma una vez por lista, no en
// cada tecla.
import { permissionOf } from '@ferrebress/shared/contracts/permissions';
import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { plain } from '../../../platform/text.ts';

export type SearchIndex = { role: RoleRow; text: string }[];

export function searchIndex(roles: RoleRow[], people: PersonRow[]): SearchIndex {
  return roles.map((role) => {
    const holders = people.filter((one) => one.active && one.roleIds.includes(role.id));
    const words = [
      role.name,
      role.description ?? '',
      ...role.permissions.map((id) => permissionOf(id).name),
      ...holders.flatMap((one) => [one.displayName, one.email]),
    ];
    return { role, text: plain(words.join('\n')) };
  });
}

export const filterRoles = (index: SearchIndex, query: string): RoleRow[] => {
  const wanted = plain(query.trim());
  return index.filter((one) => one.text.includes(wanted)).map((one) => one.role);
};
