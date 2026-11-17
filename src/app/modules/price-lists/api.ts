// Las llamadas al servidor de las listas de precios, una sola vez (diseño de 08, § 3). Todas necesitan
// conexión. Cada pantalla suma las suyas al programarse.
import type {
  FilesPage,
  ListScope,
  ListState,
  ListSupplierBody,
  ReadersResponse,
  ReaderView,
  RowsPage,
  SupplierResponse,
  SuppliersResponse,
} from '@ferrebress/shared/contracts/price-lists';
import { api } from '../../platform/server/api.ts';
import { fetchFile } from '../../platform/server/download.ts';
import { type Sent, upload } from '../../platform/server/upload.ts';

const base = '/api/price-lists';

export const readersApi = {
  list: () => api<ReadersResponse>(`${base}/readers`),
  active: (id: string, active: boolean) =>
    api<ReaderView>(`${base}/readers/${id}/active`, { active }),
};

const after = (cursor?: string) => (cursor ? `?${new URLSearchParams({ after: cursor })}` : '');

export const filesApi = {
  page: (cursor?: string) => api<FilesPage>(`${base}/files${after(cursor)}`),
  remove: (sha: string) => api<{ ok: true }>(`${base}/files/${sha}/delete`, {}),
  restore: (sha: string) => api<{ ok: true }>(`${base}/files/${sha}/restore`, {}),
  download: (listId: string, name: string) => fetchFile(`${base}/lists/${listId}/file`, name),
};

// Las filas salteadas de una lista (R6.3), con lo que traía cada una: de a 50.
export const skippedRows = (listId: string, cursor?: string) =>
  api<RowsPage>(
    `${base}/lists/${listId}/rows?${new URLSearchParams({ show: 'skipped', ...(cursor && { after: cursor }) })}`,
  );

export const suppliersApi = {
  list: () => api<SuppliersResponse>(`${base}/suppliers`),
  inactive: () => api<SuppliersResponse>(`${base}/suppliers/inactive`),
  create: (name: string) => api<SupplierResponse>(`${base}/suppliers`, { name }),
  reactivate: (id: string) => api<{ ok: true }>(`${base}/suppliers/${id}/reactivate`, {}),
};

const listsBase = `${base}/lists`;

export const listsApi = {
  upload: (
    file: Blob,
    params: { name: string; supplierId?: string; scope: ListScope },
    onSent: Sent,
    signal: AbortSignal,
  ) =>
    upload<ListState>(
      `${listsBase}?${new URLSearchParams({ name: params.name, scope: params.scope, ...(params.supplierId && { supplierId: params.supplierId }) })}`,
      file,
      onSent,
      signal,
    ),
  one: (id: string) => api<ListState>(`${listsBase}/${id}`),
  supplier: (id: string, body: ListSupplierBody) =>
    api<ListState>(`${listsBase}/${id}/supplier`, body),
  scope: (id: string, scope: ListScope) => api<ListState>(`${listsBase}/${id}/scope`, { scope }),
  size: (id: string) => api<ListState>(`${listsBase}/${id}/size`, {}),
  cancel: (id: string) => api<ListState>(`${listsBase}/${id}/cancel`, {}),
};
