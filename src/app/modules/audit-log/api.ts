// Las llamadas al servidor de Quién hizo qué (diseño de 05, § 5). Todas necesitan conexión y salen
// solo cuando la persona toca algo (§ 7).
import type { AuditDay, AuditPage, AuditPeople } from '@ferrebress/shared/contracts/audit-log';
import { api } from '../../platform/server/api.ts';

// Los parámetros, en un orden fijo y sin los vacíos.
export function queryString(params: Record<string, string | number | undefined>): string {
  const filled = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  return filled.length === 0
    ? ''
    : `?${filled.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&')}`;
}

export const auditApi = {
  page: (params: Record<string, string | number | undefined>) =>
    api<AuditPage>(`/api/audit-log${queryString(params)}`),
  people: () => api<AuditPeople>('/api/audit-log/people'),
  day: (date: string) => api<AuditDay>(`/api/audit-log/day${queryString({ date })}`),
};
