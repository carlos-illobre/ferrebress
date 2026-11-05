// Las llamadas al servidor de Quién hizo qué (diseño de 05, § 5). Todas necesitan conexión. Salen
// cuando la persona toca algo o, con «Actualizar solo» prendido, al llegar un aviso (§ 7): esas llevan
// X-Auto, que no alarga la sesión ni anota que se abrió.
import type {
  AuditDay,
  AuditNewOnes,
  AuditPage,
  AuditPeople,
} from '@ferrebress/shared/contracts/audit-log';
import { automaticHeaderName } from '@ferrebress/shared/contracts/server-header';
import { api } from '../../platform/server/api.ts';

type Params = Record<string, string | number | undefined>;
const automatic = { [automaticHeaderName]: '1' };

// Los parámetros, en un orden fijo y sin los vacíos.
export function queryString(params: Record<string, string | number | undefined>): string {
  const filled = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  return filled.length === 0
    ? ''
    : `?${filled.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&')}`;
}

export const auditApi = {
  page: (params: Params, auto = false) =>
    api<AuditPage>(
      `/api/audit-log${queryString(params)}`,
      undefined,
      undefined,
      auto ? automatic : {},
    ),
  // Siempre sola: cuántas llegaron desde `since` con los filtros (R4.6).
  newOnes: (params: Params) =>
    api<AuditNewOnes>(`/api/audit-log/new${queryString(params)}`, undefined, undefined, automatic),
  people: () => api<AuditPeople>('/api/audit-log/people'),
  day: (date: string) => api<AuditDay>(`/api/audit-log/day${queryString({ date })}`),
};
