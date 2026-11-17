// Las llamadas al servidor de las listas de precios, una sola vez (diseño de 08, § 3). Todas necesitan
// conexión. Cada pantalla suma las suyas al programarse.
import type { ReadersResponse, ReaderView } from '@ferrebress/shared/contracts/price-lists';
import { api } from '../../platform/server/api.ts';

const base = '/api/price-lists';

export const readersApi = {
  list: () => api<ReadersResponse>(`${base}/readers`),
  active: (id: string, active: boolean) =>
    api<ReaderView>(`${base}/readers/${id}/active`, { active }),
};
