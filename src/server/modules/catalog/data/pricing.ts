// El precio en la base (07 · R2.2, R2.5; 06 · R3.4, R3.5; diseño de 07, § 1 y § 4). Todo lo que
// escribe precios se ordena por la fila de `catalog.pricing`: lo que pone un precio la lee con
// `for share`, y el recálculo del redondeo la toma con `for update`. Así nunca conviven precios con dos
// pasos. La cuenta del precio está en `salePrice` (src/shared/pricing): la base solo redondea al paso.
import { roundUp } from '@ferrebress/shared/pricing/rounding';
import { rawCents } from '@ferrebress/shared/pricing/sale';
import { type Kysely, sql } from 'kysely';
import type { CatalogTables } from './products.ts';
import { type Priced, rowsOf } from './rows.ts';

type Db = Kysely<CatalogTables>;

export type { Priced } from './rows.ts';

// El precio sin redondear y el redondeado, o nada sin margen o sin costo (07 · R2.4).
export const pricesOf = (row: Priced, step: number) => {
  if (row.cost === null || row.margin === null) return { raw: null, sale: null };
  const raw = rawCents(BigInt(row.cost), row.margin, row.vat);
  return { raw, sale: roundUp(raw, step) };
};

export const pricingData = (db: Db) => ({
  // El paso de ahora, compartido: el recálculo del redondeo espera a que termine esta transacción.
  async stepForShare(): Promise<number> {
    const { rows } = await sql<{ step: number }>`
      select step_cents as step from catalog.pricing for share`.execute(db);
    return (rows[0] as { step: number }).step;
  },

  // La fila del paso, la primera vez, con el de Administración.
  async start(step: number): Promise<void> {
    await sql`insert into catalog.pricing (step_cents) values (${step}) on conflict do nothing`.execute(
      db,
    );
  },

  // Los precios de lo que se escribió, con el paso de ahora.
  async reprice(rows: readonly Priced[], step: number): Promise<void> {
    const prices = rows.map((row) => ({ id: row.id, ...pricesOf(row, step) }));
    await sql`
      update catalog.products p set raw_cents = v.raw, sale_cents = v.sale
      from jsonb_to_recordset(${rowsOf(prices)}) as v(id uuid, raw bigint, sale bigint)
      where p.id = v.id`.execute(db);
  },

  // Cuántos precios cambian con otro paso: una consulta, sobre el precio sin redondear.
  async changesWith(step: number): Promise<number> {
    const { rows } = await sql<{ count: string }>`
      select count(*) as count from catalog.products
      where raw_cents is not null and (raw_cents + ${step} - 1) / ${step} * ${step} <> sale_cents
      `.execute(db);
    return Number((rows[0] as { count: string }).count);
  },

  // Cambia el paso y recalcula todos los precios en una sola sentencia. Devuelve cuántos cambiaron.
  async applyStep(step: number): Promise<number> {
    await sql`select step_cents from catalog.pricing for update`.execute(db);
    await sql`update catalog.pricing set step_cents = ${step}`.execute(db);
    const { numAffectedRows } = await sql`
      update catalog.products
      set sale_cents = (raw_cents + ${step} - 1) / ${step} * ${step}
      where raw_cents is not null and (raw_cents + ${step} - 1) / ${step} * ${step} <> sale_cents
      `.execute(db);
    return Number(numAffectedRows ?? 0);
  },
});
