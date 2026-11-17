// Las llamadas al servidor de las anomalías (06 · R9; diseño de 08, § 3). Necesitan conexión.
import type {
  AnomaliesPage,
  AnomalyKind,
  AnomalyStatus,
  AnomalyView,
} from '@ferrebress/shared/contracts/anomalies';
import { api } from '../../platform/server/api.ts';

export const anomaliesApi = {
  page: (params: { status: AnomalyStatus; kind?: AnomalyKind; after?: string }) =>
    api<AnomaliesPage>(`/api/anomalies?${new URLSearchParams(params)}`),
  review: (id: string, note?: string) =>
    api<AnomalyView>(`/api/anomalies/${id}/review`, note ? { note } : {}),
  reopen: (id: string) => api<AnomalyView>(`/api/anomalies/${id}/reopen`, {}),
};
