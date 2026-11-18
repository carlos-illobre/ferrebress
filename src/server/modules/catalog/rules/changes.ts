// Qué hace cada cambio de un producto (07 · R1.4, R1.5, R2.7), sin tecnología: choca solo si el valor
// que vio quien cambia ya no es el de ahora; un IVA cambiado queda puesto a mano, salvo «Deshacer», que
// lo deja como estaba, de la lista o a mano.
import type { MarginBody, UnitBody, VatBody } from '@ferrebress/shared/contracts/catalog';
import type { StoredProduct } from '../data/pages.ts';

export type ProductWrite =
  | { kind: 'margin'; margin: number | null }
  | { kind: 'unit'; unit: string }
  | { kind: 'vat'; vat: number; manual: boolean };

export type Change =
  | { field: 'margin'; body: MarginBody }
  | { field: 'unit'; body: UnitBody }
  | { field: 'vat'; body: VatBody };

const now = (stored: StoredProduct, field: Change['field']) =>
  field === 'margin' ? stored.margin : field === 'unit' ? stored.unit : stored.vat;

// El producto como queda con lo que se escribe, para calcular su precio.
export const pricedAfter = (stored: StoredProduct, write: ProductWrite) => ({
  id: stored.id,
  cost: stored.cost,
  margin: write.kind === 'margin' ? write.margin : stored.margin,
  vat: write.kind === 'vat' ? write.vat : stored.vat,
});

// Lo que se escribe, `'changed'` si otro lo cambió antes, o `'same'` si no cambia nada.
export function writeOf(stored: StoredProduct, change: Change): ProductWrite | 'changed' | 'same' {
  if (now(stored, change.field) !== change.body.before) return 'changed';
  if (change.body.value === change.body.before) return 'same';
  if (change.field === 'margin') return { kind: 'margin', margin: change.body.value };
  if (change.field === 'unit') return { kind: 'unit', unit: change.body.value };
  return { kind: 'vat', vat: change.body.value, manual: change.body.manual ?? true };
}
