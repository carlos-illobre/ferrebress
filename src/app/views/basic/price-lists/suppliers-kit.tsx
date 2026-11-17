// Lo que comparten las pruebas de Catálogo → Listas (08 · pantalla 1): los proveedores como los trae el
// servidor y la pantalla montada con un servidor de mentira.
import type { SupplierRow } from '@ferrebress/shared/contracts/price-lists';
import type { Reply } from '../../../testing/fake-server.ts';
import { mountScreen, type Who } from '../screen-kit.tsx';
import { admin } from './readers-kit.tsx';
import { Suppliers } from './Suppliers.tsx';

// La hora del servidor de mentira: 14 de noviembre de 2023, 19:13 en Buenos Aires.
const now = 1_700_000_000_000;
const id = (n: number) => `0190d000-0000-7000-8000-00000000000${n}`;

export const rows: SupplierRow[] = [
  {
    id: id(1),
    name: 'Ferretera del Sur',
    seller: 'Juan Pérez',
    phone: '+54 9 11 5555-1234',
    email: 'ventas@sur.com',
    note: 'Entrega martes',
    lastListDate: '2023-11-12',
    pending: { listId: id(7), status: 'pending' },
  },
  {
    id: id(2),
    name: 'Bulonera Centro',
    lastListDate: '2023-11-14',
    pending: { listId: id(8), status: 'unreadable', reason: 'no-reader' },
  },
  { id: id(3), name: 'Álamo Herramientas', pending: { listId: id(9), status: 'reading' } },
];
export const inactiveRow: SupplierRow = { id: id(4), name: 'Corralón Viejo' };

export const suppliersPath = '/api/price-lists/suppliers';
export const inactivePath = `${suppliersPath}/inactive`;
export const reactivateOf = (n: number) => `${suppliersPath}/${id(n)}/reactivate`;
export { id };

export const sellerOnly = { ...admin, userId: 'marta', permissions: ['users.view' as const] };
export const loaderOnly = { ...admin, permissions: ['price-lists.load' as const] };
export const managerOnly = { ...admin, permissions: ['price-lists.suppliers' as const] };

export const openSuppliers = (routes: Record<string, Reply | Reply[]> = {}, who: Who = admin) =>
  mountScreen(Suppliers, {
    routes: {
      [suppliersPath]: { body: { suppliers: rows } },
      [inactivePath]: { body: { suppliers: [inactiveRow] } },
      ...routes,
    },
    who,
    now,
  });

// Los nombres de los proveedores, en el orden en que se ven.
export const names = () =>
  [...document.querySelectorAll('.supplier-name')].map((name) => name.textContent);

// El formulario del alta, para mandarlo con Enter.
export const addForm = () => document.querySelector('.supplier-add') as HTMLFormElement;
