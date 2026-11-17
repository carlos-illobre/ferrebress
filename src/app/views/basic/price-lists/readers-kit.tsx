// Lo que comparten las pruebas de Lectores (08 · pantalla 5): los lectores como los trae el servidor y la
// pantalla montada con un servidor de mentira, vista por un Administrador o por quien no tiene «Cambiar
// los ajustes».
import type { ReaderView } from '@ferrebress/shared/contracts/price-lists';
import type { Reply } from '../../../testing/fake-server.ts';
import { administrator } from '../../../testing/person.ts';
import { mountScreen, type Who } from '../screen-kit.tsx';
import { Readers } from './Readers.tsx';

export const now = Date.parse('2026-11-04T17:30:00Z');

export const reader = (id: string, more: Partial<ReaderView> = {}): ReaderView => ({
  id,
  origin: 'auto',
  active: true,
  createdAt: '2026-08-14T13:00:00.000Z',
  ...more,
});

export const readers: ReaderView[] = [
  reader('r1', {
    supplier: { id: 's1', name: 'Bulonera Centro' },
    lastList: { id: 'l1', fileName: 'lista.xlsx', listDate: '2026-08-14' },
  }),
  reader('r2', { supplier: { id: 's1', name: 'Bulonera Centro' }, active: false }),
  reader('r3', { origin: 'programmer', createdAt: '2025-03-01T13:00:00.000Z' }),
  reader('r4', { origin: 'ai', supplier: { id: 's2', name: 'Ferretera del Sur' } }),
];

export const admin = {
  userId: 'ruben',
  name: 'Rubén Paredes',
  email: 'ruben@example.com',
  ...administrator,
};
export const viewer = {
  ...admin,
  userId: 'marta',
  name: 'Marta Benítez',
  roles: [{ id: 'v', name: 'Vendedora' }],
  permissions: ['users.view' as const],
};

export const openReaders = (routes: Record<string, Reply | Reply[]> = {}, who: Who = admin) =>
  mountScreen(Readers, {
    routes: { '/api/price-lists/readers': { body: { readers } }, ...routes },
    who,
    now: now,
  });

export const activeOf = (id: string) => `/api/price-lists/readers/${id}/active`;
export const toast = () => document.querySelector('.toast')?.textContent ?? '';
