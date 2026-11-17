// Lo que comparten las pruebas de subir una lista (08 · pantalla 2): el panel montado con un servidor
// de mentira, un XMLHttpRequest de mentira para la subida y el tema de cada lista, que la prueba manda.
import type { ListProgress, ListState } from '@ferrebress/shared/contracts/price-lists';
import { vi } from 'vitest';
import { realtime, type TopicHandler } from '../../../../platform/realtime/channel.ts';
import { FakeRequest } from '../../../../testing/fake-request.ts';
import type { Reply } from '../../../../testing/fake-server.ts';
import { mountScreen } from '../../screen-kit.tsx';
import { admin } from '../readers-kit.tsx';
import { UploadsPanel } from './Panel.tsx';

export const listId = '0190e000-0000-7000-8000-000000000001';
export const supplierId = '0190d000-0000-7000-8000-000000000001';
export const listPath = `/api/price-lists/lists/${listId}`;
export const MB = 2 ** 20;

export const sheet = (name = 'lista.xlsx', size = 1000) => new File(['x'.repeat(size)], name);

export const state = (more: Partial<ListState> = {}): ListState => ({
  id: listId,
  status: 'reading',
  rowsRead: 0,
  fileName: 'lista.xlsx',
  scope: 'full',
  uploadedAt: '2023-11-14T22:00:00.000Z',
  file: true,
  ...more,
});

export const bulonera = (from: 'reader' | 'name' | 'screen' | 'chosen', confirmed = false) => ({
  supplier: { id: supplierId, name: 'Bulonera Centro', from, confirmed },
});

const settings = { body: { settings: { maxFileMb: { value: 1, version: 0 } } } };

// El panel con el servidor de mentira; devuelve cómo mandar un aviso del tema de la lista.
export function openUploads(routes: Record<string, Reply | Reply[]> = {}) {
  vi.stubGlobal('XMLHttpRequest', FakeRequest);
  const handlers = new Map<string, TopicHandler>();
  vi.spyOn(realtime, 'want').mockImplementation((token, handler) => {
    handlers.set(token, handler);
    return () => handlers.delete(token);
  });
  const server = mountScreen(UploadsPanel, {
    routes: {
      '/api/administration': settings,
      '/api/price-lists/suppliers': {
        body: {
          suppliers: [
            { id: supplierId, name: 'Bulonera Centro' },
            { id: 's2', name: 'Álamo' },
          ],
        },
      },
      ...routes,
    },
    who: admin,
    now: 1_700_000_000_000,
  });
  const topic = (progress: ListProgress) =>
    handlers.get(`price-lists.list:${listId}`)?.onEvent(progress);
  return { server, topic, listening: () => handlers.has(`price-lists.list:${listId}`) };
}

export const request = () => FakeRequest.last;
