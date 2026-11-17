// Lo que comparten las pruebas de la pantalla de un proveedor (08 · pantalla 4): el proveedor como lo
// trae el servidor, sus productos y la pantalla montada con un servidor de mentira.
import type {
  SupplierItem,
  SupplierResponse,
  Terms,
} from '@ferrebress/shared/contracts/price-lists';
import type { Reply } from '../../../../testing/fake-server.ts';
import { mountScreen, type Who } from '../../screen-kit.tsx';
import { admin } from '../readers-kit.tsx';
import { SupplierScreen } from './SupplierScreen.tsx';

export const supplierId = '0190d000-0000-7000-8000-000000000001';
export const supplierPath = `/api/price-lists/suppliers/${supplierId}`;
export const pendingId = '0190e000-0000-7000-8000-000000000001';

export const terms: Terms = {
  vatIncluded: false,
  discounts: [
    { id: 'g', name: 'General', percent: 2500, brand: null },
    { id: 'c', name: 'Contado', percent: 500, brand: 'Bremen' },
  ],
  defaultVat: 210,
  onChange: 'recalculate',
};

export const supplier = (more: Partial<SupplierResponse> = {}): SupplierResponse => ({
  id: supplierId,
  name: 'Bulonera Centro',
  seller: 'Juan Pérez',
  phone: '11 5555-1234',
  inactive: false,
  lastListDate: '2023-11-10',
  terms: { value: terms, version: 3 },
  lists: {
    lists: [
      {
        ...{ id: pendingId, status: 'pending', fileName: 'nov.xlsx', listDate: '2023-11-10' },
        ...{ uploadedAt: '2023-11-14T21:13:20.000Z', uploadedBy: 'Rubén', file: true },
      },
      {
        ...{
          id: 'old',
          status: 'applied',
          fileName: 'oct.xlsx',
          uploadedAt: '2023-10-01T12:00:00Z',
        },
        ...{ decidedBy: 'Marta', decidedAt: '2023-10-01T13:00:00Z', file: false },
      },
      {
        ...{
          id: 'bad',
          status: 'discarded',
          fileName: 'x.csv',
          uploadedAt: '2023-09-01T12:00:00Z',
        },
        ...{ decidedAt: '2023-09-01T13:00:00Z', reason: 'by-hand', file: false },
      },
    ],
    next: 'n1',
  },
  ...more,
});

const basis = {
  ...{ listPrice: '1000000000', vatIncluded: false, vat: 210, brand: null },
  ...{ discounts: [{ name: 'General', percent: 2500 }], listId: pendingId, listDate: '2023-11-10' },
};
export const item = (code: string, more: Partial<SupplierItem> = {}): SupplierItem => ({
  ...{ code, description: `Artículo ${code}`, cost: '750000000', basis, discontinued: false },
  ...more,
});

export const itemsPath = (query: string) => `${supplierPath}/items?${query}`;

export const openSupplier = (routes: Record<string, Reply | Reply[]> = {}, who: Who = admin) =>
  mountScreen(() => <SupplierScreen supplierId={supplierId} />, {
    routes: {
      [supplierPath]: { body: supplier() },
      [itemsPath('discontinued=false')]: { body: { items: [item('A1')] } },
      ...routes,
    },
    who,
    now: 1_700_000_000_000,
  });
