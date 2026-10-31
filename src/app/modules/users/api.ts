// Las llamadas al servidor de Usuarios, una sola vez (diseño de 02, § 4). Todas necesitan conexión.
import type {
  AccessResponse,
  ClosedResponse,
  CutResponse,
  LostPhonesResponse,
  PeopleResponse,
  PersonResponse,
} from '@ferrebress/shared/contracts/users';
import { api } from '../../platform/server/api.ts';

const at = (id: string) => `/api/users/${encodeURIComponent(id)}`;

export const usersApi = {
  people: () => api<PeopleResponse>('/api/users'),
  authorize: (email: string, name: string) =>
    api<PersonResponse>('/api/users', { email, ...(name && { name }) }),
  // `name` vacío vuelve al de Google (R3.5).
  change: (id: string, version: number, change: { name?: string | null; email?: string }) =>
    api<PersonResponse>(at(id), { version, ...change }),
  remove: (id: string, version: number) => api<{ removed: true }>(`${at(id)}/delete`, { version }),
  deactivate: (id: string, version: number) =>
    api<PersonResponse>(`${at(id)}/deactivate`, { version }),
  activate: (id: string, version: number) => api<PersonResponse>(`${at(id)}/activate`, { version }),
  access: (id: string) => api<AccessResponse>(`${at(id)}/access`),
  closeSession: (id: string, sessionId: string) =>
    api<ClosedResponse>(`${at(id)}/sessions/${encodeURIComponent(sessionId)}/close`, {}),
  closeAll: (id: string) => api<ClosedResponse>(`${at(id)}/sessions/close`, {}),
  cut: (id: string, phoneId: string, from: 'card' | 'lost') =>
    api<CutResponse>(`${at(id)}/phones/${encodeURIComponent(phoneId)}/cut`, { from }),
  lostPhones: () => api<LostPhonesResponse>('/api/lost-phones'),
};
