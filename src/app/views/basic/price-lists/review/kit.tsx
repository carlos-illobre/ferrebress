// Lo que comparten las pruebas de ver qué cambia (08 · pantalla 3): una lista en espera como la trae
// el servidor, su detalle, la pantalla montada con un servidor de mentira y el tema de la lista.
import type { ListRow, ListState, ListSummary } from '@ferrebress/shared/contracts/price-lists';
import { vi } from 'vitest';
import { realtime, type TopicHandler } from '../../../../platform/realtime/channel.ts';
import type { Reply } from '../../../../testing/fake-server.ts';
import { mountScreen, type Who } from '../../screen-kit.tsx';
import { admin } from '../readers-kit.tsx';
import { Review } from './Review.tsx';

export const listId = '0190e000-0000-7000-8000-000000000002';
export const listPath = `/api/price-lists/lists/${listId}`;
export const rowsPath = `${listPath}/rows`;

export const summary: ListSummary = {
  ...{ new: 4, changed: 31, same: 100, gone: 2, skipped: 1, reasons: { 'no-price': 1 } },
  ...{ averageChange: 12.5, review: 3, goneWarning: false, tooOld: false },
};

export const pending = (more: Partial<ListState> = {}): ListState => ({
  id: listId,
  status: 'pending',
  rowsRead: 138,
  rowsTotal: 138,
  fileName: 'lista noviembre.xlsx',
  scope: 'full',
  supplier: { id: 's', name: 'Bulonera Centro', from: 'reader', confirmed: true },
  listDate: '2023-11-10',
  uploadedAt: new Date(1_700_000_000_000 - 3_600_000).toISOString(),
  uploadedBy: 'Rubén Paredes',
  file: true,
  summary,
  ...more,
});

const basis = {
  ...{ listPrice: '1210000000', vatIncluded: true, vat: 210, brand: null },
  ...{ discounts: [{ name: 'Pronto pago', percent: 250 }], listId, listDate: '2023-11-10' },
};

export const rows: ListRow[] = [
  {
    ...{ code: 'A1', description: 'Mecha 6', brand: 'Bremen', change: 'changed' },
    ...{ cost: '975000000', previous: '850000000', variation: 14.7, basis },
  },
  { code: 'A2', description: 'Tarugo', change: 'new', cost: '120000000' },
  { code: 'A9', description: 'Clavo viejo', previous: '50000000' },
  { code: null, description: 'Sin código', skipped: 'no-code', cells: ['', 'Sin código', '100'] },
];

export function openReview(routes: Record<string, Reply | Reply[]> = {}, who: Who = admin) {
  const handlers = new Map<string, TopicHandler>();
  vi.spyOn(realtime, 'want').mockImplementation((token, handler) => {
    handlers.set(token, handler);
    return () => handlers.delete(token);
  });
  const server = mountScreen(() => <Review listId={listId} />, {
    routes: { [listPath]: { body: pending() }, [rowsPath]: { body: { rows } }, ...routes },
    who,
    now: 1_700_000_000_000,
  });
  const topic = (data: unknown) => handlers.get(`price-lists.list:${listId}`)?.onEvent(data);
  return { server, topic, listening: () => handlers.has(`price-lists.list:${listId}`) };
}
