// El costo de las filas de una lista (08 · R3.3, R6.2), sin tecnología: con cómo cobra el proveedor,
// y qué le pasa a cada una frente al costo que tenía su artículo: nuevo, cambia o igual.
import type { Terms } from '@ferrebress/shared/contracts/price-lists';
import { type CostBasis, costWith } from '@ferrebress/shared/pricing/basis';

export type RowToPrice = {
  sheet: number;
  row: number;
  code: string;
  listPrice: bigint;
  vat: number | null;
  brand: string | null;
};

export type PricedRow = {
  sheet: number;
  row: number;
  cost: bigint;
  basis: CostBasis;
  previous: bigint | null;
  change: 'new' | 'changed' | 'same';
};

export const priced = (
  rows: readonly RowToPrice[],
  previous: ReadonlyMap<string, bigint>,
  terms: Terms,
  list: { id: string; date: string | null },
): PricedRow[] =>
  rows.map((row) => {
    const { cost, basis } = costWith(
      { ...row, vat: row.vat ?? terms.defaultVat, listId: list.id, listDate: list.date },
      terms,
    );
    const before = previous.get(row.code) ?? null;
    const change = before === null ? 'new' : before === cost ? 'same' : 'changed';
    return { sheet: row.sheet, row: row.row, cost, basis, previous: before, change };
  });
