// Las llamadas al servidor de las listas de precios, una sola vez (diseño de 08, § 3). Todas necesitan
// conexión. Cada pantalla suma las suyas al programarse.
import type {
  ChangeSupplierBody,
  FilesPage,
  ItemsPage,
  ListNumbers,
  ListScope,
  ListState,
  ListSupplierBody,
  ReadersResponse,
  ReaderView,
  RowsPage,
  RowsShow,
  SupplierListsPage,
  SupplierResponse,
  SuppliersResponse,
  TermsBody,
  TermsResponse,
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

export const suppliersApi = {
  list: () => api<SuppliersResponse>(`${base}/suppliers`),
  inactive: () => api<SuppliersResponse>(`${base}/suppliers/inactive`),
  create: (name: string) => api<SupplierResponse>(`${base}/suppliers`, { name }),
  reactivate: (id: string) => api<{ ok: true }>(`${base}/suppliers/${id}/reactivate`, {}),
  one: (id: string) => api<SupplierResponse>(`${base}/suppliers/${id}`),
  change: (id: string, body: ChangeSupplierBody) =>
    api<SupplierResponse>(`${base}/suppliers/${id}`, body),
  terms: (id: string, body: TermsBody) => api<TermsResponse>(`${base}/suppliers/${id}/terms`, body),
  deactivate: (id: string, confirmed?: { costs: number; discontinued: number }) =>
    api<{ ok: true; costs: number; discontinued: number }>(
      `${base}/suppliers/${id}/deactivate`,
      confirmed ? { confirmed } : {},
    ),
  lists: (id: string, after: string) =>
    api<SupplierListsPage>(`${base}/suppliers/${id}/lists?${new URLSearchParams({ after })}`),
  items: (id: string, params: { q: string; discontinued: boolean; after?: string }) =>
    api<ItemsPage>(
      `${base}/suppliers/${id}/items?${new URLSearchParams({
        ...(params.q && { q: params.q }),
        discontinued: String(params.discontinued),
        ...(params.after && { after: params.after }),
      })}`,
    ),
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
  rows: (id: string, params: { show?: RowsShow; q?: string; after?: string }) => {
    const given = Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]);
    return api<RowsPage>(
      `${listsBase}/${id}/rows${given.length ? `?${new URLSearchParams(given)}` : ''}`,
    );
  },
  apply: (id: string, expected: ListNumbers) =>
    api<ListState>(`${listsBase}/${id}/apply`, { expected }),
  discard: (id: string) => api<ListState>(`${listsBase}/${id}/discard`, {}),
  supplier: (id: string, body: ListSupplierBody) =>
    api<ListState>(`${listsBase}/${id}/supplier`, body),
  scope: (id: string, scope: ListScope) => api<ListState>(`${listsBase}/${id}/scope`, { scope }),
  size: (id: string) => api<ListState>(`${listsBase}/${id}/size`, {}),
  cancel: (id: string) => api<ListState>(`${listsBase}/${id}/cancel`, {}),
};

// Las filas salteadas de una lista (R6.3), con lo que traía cada una: de a 50.
export const skippedRows = (listId: string, cursor?: string) =>
  listsApi.rows(listId, { show: 'skipped', ...(cursor && { after: cursor }) });
