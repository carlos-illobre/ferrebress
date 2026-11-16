// Los tipos de acción de las listas de precios (capítulo 08, R9.1) en Quién hizo qué.
import type { SupplierField } from '../contracts/price-lists.ts';
import { type Entry, named, text } from './kinds.ts';

const fieldNames: Record<SupplierField, string> = {
  name: 'el nombre',
  seller: 'el vendedor',
  phone: 'el teléfono',
  email: 'el correo',
  note: 'la nota',
};
const fieldOf = (raw: unknown): string =>
  Object.hasOwn(fieldNames, String(raw)) ? fieldNames[raw as SupplierField] : 'un dato';
const supplier = (e: Parameters<Entry['says']>[0]) => named(e, 'supplier', 'un proveedor');
const count = (raw: unknown): number => (typeof raw === 'number' ? raw : 0);
const thousands = (n: number) => n.toLocaleString('es-AR');

export const priceListsTypes = {
  'suppliers.created': {
    group: 'price-lists',
    tone: 'plain',
    icon: 'store',
    name: 'Dio de alta a un proveedor',
    shows: [],
    says: (e) => [text('Dio de alta al proveedor '), supplier(e)],
  },
  // Del vendedor, el teléfono y el correo, solo qué cambió (R9.1, E11).
  'suppliers.changed': {
    group: 'price-lists',
    tone: 'plain',
    icon: 'notebook-pen',
    name: 'Cambió un dato de un proveedor',
    shows: ['field'],
    says: (e) => [text(`Cambió ${fieldOf(e.data.field)} de `), supplier(e)],
  },
  'suppliers.terms-changed': {
    group: 'price-lists',
    tone: 'plain',
    icon: 'tags',
    name: 'Cambió cómo cobra un proveedor',
    shows: ['costs'],
    says: (e) => {
      const costs = count(e.data.costs);
      return [
        text('Cambió cómo cobra '),
        supplier(e),
        ...(costs > 0 ? [text(` (cambiaron ${thousands(costs)} costos)`)] : []),
      ];
    },
  },
  'suppliers.deactivated': {
    group: 'price-lists',
    tone: 'amber',
    icon: 'archive',
    name: 'Dio de baja a un proveedor',
    shows: ['costs', 'discontinued'],
    says: (e) => [
      text('Dio de baja a '),
      supplier(e),
      text(
        ` (${thousands(count(e.data.costs))} perdieron su costo, ${thousands(count(e.data.discontinued))} quedaron dados de baja)`,
      ),
    ],
  },
  'suppliers.reactivated': {
    group: 'price-lists',
    tone: 'plain',
    icon: 'archive-restore',
    name: 'Reactivó a un proveedor',
    shows: [],
    says: (e) => [text('Reactivó a '), supplier(e)],
  },
  'lists.uploaded': {
    group: 'price-lists',
    tone: 'plain',
    icon: 'file-up',
    name: 'Subió una lista',
    shows: ['scope'],
    says: (e) => [
      text('Subió la lista '),
      named(e, 'list', 'sin nombre'),
      ...(e.data.scope === 'partial' ? [text(' (solo cambios)')] : []),
    ],
  },
  'lists.discarded': {
    group: 'price-lists',
    tone: 'plain',
    icon: 'file-x',
    name: 'Descartó una lista',
    shows: ['reason'],
    says: (e) => [
      text(e.data.reason === 'cancelled' ? 'Canceló la lista ' : 'Descartó la lista '),
      named(e, 'list', 'sin nombre'),
    ],
  },
} satisfies Record<string, Entry>;
