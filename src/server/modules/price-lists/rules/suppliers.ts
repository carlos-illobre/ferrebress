// Los proveedores (08 · R1.3, R2), sin tecnología: qué se muestra a quién y cómo se valida un alta.
import {
  type NewSupplierBody,
  type SupplierContact,
  type SupplierPending,
  type SupplierResponse,
  type SupplierRow,
  supplierValue,
} from '@ferrebress/shared/contracts/price-lists';
import type { SupplierRecord } from '../data/suppliers.ts';

// El proveedor como dato afectado en Quién hizo qué.
export const supplierTarget = (record: Pick<SupplierRecord, 'id' | 'name'>) => ({
  kind: 'supplier',
  id: record.id,
  name: record.name,
});

const contactOf = (record: SupplierRecord): SupplierContact => ({
  ...(record.seller && { seller: record.seller }),
  ...(record.phone && { phone: record.phone }),
  ...(record.email && { email: record.email }),
  ...(record.note && { note: record.note }),
});

// En la lista: los datos los ve cualquiera (R1.3); la última lista y la viva, con «Ver costos».
export function rowOf(
  record: SupplierRecord,
  costs: boolean,
  pending: SupplierPending | undefined,
): SupplierRow {
  return {
    id: record.id,
    name: record.name,
    ...contactOf(record),
    ...(costs && record.lastListDate && { lastListDate: record.lastListDate }),
    ...(costs && pending && { pending }),
  };
}

export function responseOf(record: SupplierRecord, costs: boolean): SupplierResponse {
  return {
    id: record.id,
    name: record.name,
    ...contactOf(record),
    inactive: record.inactive,
    ...(costs && record.lastListDate && { lastListDate: record.lastListDate }),
    ...(costs && { terms: { value: record.terms, version: record.termsVersion } }),
  };
}

// Los datos de un alta, validados; el primero que no vale, si hay uno.
export function newSupplierOf(
  body: NewSupplierBody,
):
  | ({ name: string } & Record<'seller' | 'phone' | 'email' | 'note', string | null>)
  | { invalid: string } {
  const values: Record<string, string | null> = {};
  for (const field of ['name', 'seller', 'phone', 'email', 'note'] as const) {
    const value = supplierValue(field, body[field] ?? null);
    if (value === undefined) return { invalid: field };
    values[field] = value;
  }
  return values as { name: string } & Record<'seller' | 'phone' | 'email' | 'note', string | null>;
}
