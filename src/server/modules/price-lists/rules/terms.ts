// Cambiar cómo cobra un proveedor (08 · R3.5), sin tecnología: si cambia algún costo y cuáles. La
// cuenta es la de src/shared/pricing, igual que al leer y aplicar.
import type { Terms } from '@ferrebress/shared/contracts/price-lists';
import { type CostBasis, type Costed, costWith, recompute } from '@ferrebress/shared/pricing/basis';
import type { ItemCost } from '../data/items.ts';
import type { LiveRow, RowCost } from '../data/lists.ts';

// Solo el IVA incluido y los descuentos cambian costos; el IVA de arranque y qué pasa al cambiar, no.
const costing = (terms: Terms) =>
  JSON.stringify([
    terms.vatIncluded,
    terms.discounts.map(({ name, percent, brand }) => [name, percent, brand]),
  ]);
export const changesCosts = (before: Terms, after: Terms): boolean =>
  costing(before) !== costing(after);

// Lo que cambia la cuenta de una base: comparado campo por campo, porque la base que vuelve de la
// base de datos (jsonb) trae las claves en otro orden.
const accountOf = (basis: CostBasis) =>
  JSON.stringify([basis.vatIncluded, basis.discounts.map(({ name, percent }) => [name, percent])]);

// Los artículos con su costo nuevo: los que cambian de base (un descuento que solo cambió de nombre
// cambia la cuenta, no el costo) y cuántos cambian de costo.
export function recalculatedItems(items: readonly ItemCost[], terms: Terms) {
  const updates: ItemCost[] = [];
  let costs = 0;
  for (const item of items) {
    const next: Costed = recompute(item.basis, terms);
    if (next.cost !== item.cost) costs++;
    if (next.cost !== item.cost || accountOf(next.basis) !== accountOf(item.basis))
      updates.push({ ...item, ...next });
  }
  return { updates, costs };
}

// Las filas de su lista viva, con cómo cobra ahora: la lista siguiente se calcula con lo nuevo (E24).
export const recalculatedRows = (rows: readonly LiveRow[], terms: Terms): RowCost[] =>
  rows.map((row) => {
    const { cost, basis } = costWith({ ...row, vat: row.vat ?? terms.defaultVat }, terms);
    const change =
      row.previousCost === null ? 'new' : cost === row.previousCost ? 'same' : 'changed';
    return { listId: row.listId, sheet: row.sheet, row: row.row, cost, basis, change };
  });
