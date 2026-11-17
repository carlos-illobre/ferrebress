// Lo que comparten las pruebas de Anomalías (06 · pantalla 2): anomalías como las trae el servidor y la
// pantalla montada con un servidor de mentira.
import type { AnomalyView } from '@ferrebress/shared/contracts/anomalies';
import type { Reply } from '../../../testing/fake-server.ts';
import { administrator } from '../../../testing/person.ts';
import { mountScreen, type Who } from '../screen-kit.tsx';
import { Anomalies } from './Anomalies.tsx';

export const listId = '0190b000-0000-7000-8000-000000000001';
const hourAgo = new Date(1_700_000_000_000 - 3_600_000).toISOString();

export const unreadable: AnomalyView = {
  id: '0190c000-0000-7000-8000-000000000001',
  kind: 'price-list-unreadable',
  subject: 'price-lists:list:0190b000-0000-7000-8000-000000000009',
  status: 'open',
  summary: { file: 'precios.csv', reason: 'no-reader' },
  openedAt: hourAgo,
};
export const skipped: AnomalyView = {
  id: '0190c000-0000-7000-8000-000000000002',
  kind: 'price-list-skipped-rows',
  subject: `price-lists:list:${listId}`,
  status: 'open',
  summary: {
    supplier: { id: 's', name: 'Bulonera Centro' },
    file: 'lista.xlsx',
    skipped: 3,
    reasons: { 'no-code': 2, 'zero-price': 1 },
  },
  openedAt: hourAgo,
};

export const anomaliesPath = '/api/anomalies';
// Las abiertas, como las pide la pantalla al abrir.
export const openPath = `${anomaliesPath}?status=open`;
export const reviewOf = (a: AnomalyView) => `/api/anomalies/${a.id}/review`;
export const reopenOf = (a: AnomalyView) => `/api/anomalies/${a.id}/reopen`;
export const rowsOf = (cursor?: string) =>
  `/api/price-lists/lists/${listId}/rows?show=skipped${cursor ? `&after=${cursor}` : ''}`;

export const admin = { userId: 'ruben', name: 'Rubén', email: 'r@example.com', ...administrator };
export const noCosts = {
  ...admin,
  permissions: administrator.permissions.filter((id) => id !== 'price-lists.costs'),
};

export const openAnomalies = (routes: Record<string, Reply | Reply[]> = {}, who: Who = admin) =>
  mountScreen(Anomalies, {
    routes: { [openPath]: { body: { anomalies: [unreadable, skipped] } }, ...routes },
    who,
    now: 1_700_000_000_000,
  });

// La lista de anomalías, sin los filtros.
export const list = () => document.querySelector('.anomalies-list') as HTMLElement;
