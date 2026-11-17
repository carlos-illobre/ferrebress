// El almacén de las listas que se suben, en sus bordes: sin poder traer los proveedores, olvidar o
// cortar una que no existe, un estado completo y un aviso de una lista que ya no está.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { realtime, type TopicHandler } from '../../../platform/realtime/channel.ts';
import { fakeServer } from '../../../testing/fake-server.ts';
import {
  cutUpload,
  find,
  forget,
  knownSuppliers,
  listen,
  loadSuppliers,
  stateArrived,
  uploads,
} from './store.ts';

describe('el almacén de las listas que se suben', () => {
  afterEach(() => {
    uploads.set([]);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sin poder traer los proveedores, quedan los que había; olvidar o cortar lo que no está no hace nada', async () => {
    knownSuppliers.set([{ id: 'a', name: 'A' }]);
    fakeServer({ '/api/price-lists/suppliers': { status: 500, body: { error: 'unexpected' } } });
    await loadSuppliers();
    expect(knownSuppliers.get()).toEqual([{ id: 'a', name: 'A' }]);
    expect(() => {
      forget('nadie');
      cutUpload('nadie');
    }).not.toThrow();
  });

  it('un estado con lo que espera, cuántas filas tiene y su motivo', () => {
    uploads.set([
      { key: 'k', fileName: 'a.csv', bytes: 1, scope: 'full', phase: 'sending', sent: 1 },
    ]);
    stateArrived('k', {
      ...{ id: 'l', status: 'unreadable', rowsRead: 3, waitingFor: 'size', rowsTotal: 9 },
      ...{ reason: 'damaged', fileName: 'a.csv', scope: 'full', uploadedAt: '', file: true },
    });
    expect(find('k')).toMatchObject({
      phase: 'failed',
      progress: {
        status: 'unreadable',
        rowsRead: 3,
        waitingFor: 'size',
        rowsTotal: 9,
        reason: 'damaged',
      },
    });
  });

  it('un aviso de una lista que ya no está en el panel no hace nada', () => {
    let handler: TopicHandler | undefined;
    vi.spyOn(realtime, 'want').mockImplementation((_, given) => {
      handler = given;
      return () => {};
    });
    listen('nadie', 'l');
    handler?.onEvent({ status: 'reading', rowsRead: 1 });
    expect(uploads.get()).toEqual([]);
  });
});
