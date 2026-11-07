// Las llamadas al servidor de Usuarios, una sola vez (diseño de 02, § 4). Todas necesitan conexión.

import type { RolesResponse } from '@ferrebress/shared/contracts/roles';
import type {
  AccessResponse,
  LostPhonesResponse,
  PeopleResponse,
  PersonResponse,
} from '@ferrebress/shared/contracts/users';
import { api } from '../../platform/server/api.ts';

const at = (id: string) => `/api/users/${encodeURIComponent(id)}`;

export const usersApi = {
  people: () => api<PeopleResponse>('/api/users'),
  authorize: (email: string, name: string, roles: string[]) =>
    api<PersonResponse>('/api/users', { email, roles, ...(name && { name }) }),
  // `name` vacío vuelve al de Google (R3.5).
  change: (id: string, version: number, change: { name?: string | null; email?: string }) =>
    api<PersonResponse>(at(id), { version, ...change }),
  remove: (id: string, version: number) => api<{ removed: true }>(`${at(id)}/delete`, { version }),
  deactivate: (id: string, version: number) =>
    api<PersonResponse>(`${at(id)}/deactivate`, { version }),
  activate: (id: string, version: number) => api<PersonResponse>(`${at(id)}/activate`, { version }),
  access: (id: string) => api<AccessResponse>(`${at(id)}/access`),
  lostPhones: () => api<LostPhonesResponse>('/api/lost-phones'),
  // Los roles (R7.3, R7.5); crearlos, guardarlos y borrarlos, en roles/actions.ts.
  roles: () => api<RolesResponse>('/api/roles'),
  setRoles: (id: string, version: number, roles: string[]) =>
    api<{ roles: string[] }>(`${at(id)}/roles`, { version, roles }),
};
