// Ponerles el costo a las filas leídas de una lista cuando se sabe de quién es (08 · R3.3, R6.2):
// todas de a tandas, o las de un bloque recién leído.
import type { Transaction } from 'kysely';
import { asDb } from '../data/db.ts';
import { rowsData } from '../data/rows.ts';
import { type SupplierRecord, suppliersData } from '../data/suppliers.ts';
import type { ProductRow } from '../rules/check.ts';
import { priced, type RowToPrice } from '../rules/pricing.ts';
import { priceListsSettings } from '../settings.ts';

type ListOf = { id: string; supplierId: string; listDate: string | null };

export async function priceRows(
  trx: Transaction<unknown>,
  list: ListOf,
  rows: readonly RowToPrice[],
) {
  const db = asDb(trx);
  const supplier = await suppliersData(db).one(list.supplierId);
  const data = rowsData(db);
  const previous = await data.previousCosts(
    list.supplierId,
    rows.map((row) => row.code),
  );
  // El proveedor existe: está trabado por la lista.
  const { terms } = supplier as SupplierRecord;
  await data.savePrices(
    list.id,
    priced(rows, previous, terms, { id: list.id, date: list.listDate }),
  );
}

export const toPrice = (products: readonly ProductRow[]): RowToPrice[] =>
  products.map(({ sheet, row, code, listPrice, vat, brand }) => ({
    sheet,
    row,
    code,
    listPrice,
    vat,
    brand,
  }));

// Todas las filas de la lista, de a tandas, en orden.
export async function priceAll(trx: Transaction<unknown>, list: ListOf) {
  const data = rowsData(asDb(trx));
  let after: [number, number] = [-1, -1];
  for (;;) {
    const batch = await data.toPrice(list.id, after, priceListsSettings.batch);
    if (batch.length === 0) return;
    await priceRows(trx, list, batch);
    const last = batch.at(-1) as RowToPrice;
    after = [last.sheet, last.row];
  }
}
