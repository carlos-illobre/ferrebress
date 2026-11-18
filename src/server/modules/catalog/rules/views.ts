// Qué ve cada uno de un producto (07 · R2.4, R4.1), sin tecnología: el precio de venta y por qué no
// tiene, cualquiera con sesión; el margen, el costo, el proveedor y la cuenta, solo con «Ver costos»,
// porque con el margen y el precio a la vista se sacaría el costo. Toda respuesta con un producto se
// arma acá, también la de un cambio y la de un choque.
import type {
  CostSource,
  Product,
  ProductRow,
  ProductState,
  Unit,
  Vat,
} from '@ferrebress/shared/contracts/catalog';
import type { StoredProduct } from '../data-pages.ts';

const stateOf = (stored: StoredProduct): ProductState => {
  if (stored.cost === null) return 'no-cost';
  return stored.margin === null ? 'no-price' : 'priced';
};

export function rowOf(stored: StoredProduct, seesCosts: boolean): ProductRow {
  return {
    id: stored.id,
    code: stored.code,
    barcode: stored.barcode,
    description: stored.description,
    brand: stored.brand,
    unit: stored.unit as Unit,
    vat: stored.vat as Vat,
    vatManual: stored.vatManual,
    ...(stored.sale !== null && { sale: stored.sale }),
    state: stateOf(stored),
    discontinued: stored.discontinued,
    ...(seesCosts && { margin: stored.margin, cost: stored.cost }),
  };
}

// El producto con su cuenta (R2.6); `source`, de dónde sale su costo, solo si lo ve.
export function productOf(
  stored: StoredProduct,
  seesCosts: boolean,
  stepCents: number,
  source: CostSource | undefined,
): Product {
  return {
    ...rowOf(stored, seesCosts),
    stepCents,
    ...(seesCosts && {
      supplier: source?.supplier ?? null,
      basis: source?.basis ?? null,
      raw: stored.raw,
    }),
  };
}
