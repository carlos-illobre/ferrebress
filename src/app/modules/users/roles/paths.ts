// Las direcciones de la pestaña Roles (diseño de 02, § 20): la lista, el rol nuevo y cada rol, y
// quiénes tienen cada rol, que sale de la lista de Usuarios (R4.3).
import { rolesPath } from '../state.ts';

export const listPath = rolesPath;
export const rolePath = (id: string) => `${listPath}/${encodeURIComponent(id)}`;
export const newPath = `${listPath}/new`;

// Lo que lleva el rol nuevo: el nombre buscado, o el rol que se duplica.
export type NewState = { name?: string; duplicate?: string };

// Las personas activas que tienen ese rol; las dadas de baja no (E60).
export const activeHolders = <T extends { active: boolean; roleIds: string[] }>(
  people: T[],
  id: string,
) => people.filter((one) => one.active && one.roleIds.includes(id));

export const ids = (people: { id: string }[]) => people.map((one) => one.id);
