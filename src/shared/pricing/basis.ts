// La base de un costo (08 · R3.4, R3.5; diseño de 08, § 1): lo necesario para mostrar su cuenta paso a
// paso y para rehacerla cuando cambia cómo cobra el proveedor, sin volver a leer la lista. La usan el
// servidor (al leer, aplicar y recalcular) y la aplicación (al mostrar la cuenta).
import { searchKey } from '../text/search-key.ts';
import { type CostStep, costOf, type Discount, discountsFor } from './cost.ts';

export type CostBasis = {
  // El precio de lista de una unidad, en millonésimos, como texto.
  listPrice: string;
  vatIncluded: boolean;
  // El IVA que se quita si los precios lo incluyen, en décimos: el de la lista o el de arranque (R3.3).
  vat: number;
  // La marca como `searchKey`, para saber qué descuentos le tocan (E19).
  brand: string | null;
  discounts: { name: string; percent: number }[];
  listId: string;
  listDate: string | null;
};

// Lo que dice cómo cobra el proveedor, lo único que cambia la cuenta.
export type CostTerms = {
  vatIncluded: boolean;
  discounts: readonly { id: string; name: string; percent: number; brand: string | null }[];
};

// Los descuentos con la marca como `searchKey`, para compararla con la del producto.
export const keyedDiscounts = (terms: CostTerms): Discount[] =>
  terms.discounts.map((one) => ({
    ...one,
    brand: one.brand === null ? null : searchKey(one.brand),
  }));

export type Costed = { cost: bigint; basis: CostBasis };

// El costo de una fila de una lista con cómo cobra el proveedor.
export function costWith(
  row: {
    listPrice: bigint;
    vat: number;
    brand: string | null;
    listId: string;
    listDate: string | null;
  },
  terms: CostTerms,
): Costed {
  const brand = row.brand === null ? null : searchKey(row.brand) || null;
  const discounts = discountsFor(keyedDiscounts(terms), brand).map(({ name, percent }) => ({
    name,
    percent,
  }));
  const { cost } = costOf({
    listPrice: row.listPrice,
    vatIncluded: terms.vatIncluded,
    vat: row.vat,
    discounts,
  });
  return {
    cost,
    basis: {
      listPrice: String(row.listPrice),
      vatIncluded: terms.vatIncluded,
      vat: row.vat,
      brand,
      discounts,
      listId: row.listId,
      listDate: row.listDate,
    },
  };
}

// La misma base con lo nuevo de cómo cobra (R3.5): mismo precio, mismo IVA y misma lista.
export const recompute = (basis: CostBasis, terms: CostTerms): Costed =>
  costWith(
    { ...basis, listPrice: BigInt(basis.listPrice) },
    // La marca ya está como clave: se compara igual.
    terms,
  );

// La cuenta para mostrar (R3.4).
export const stepsOf = (basis: CostBasis): CostStep[] =>
  costOf({ ...basis, listPrice: BigInt(basis.listPrice) }).steps;
