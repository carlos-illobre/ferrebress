// Quien recalcula los precios cuando cambia el redondeo, para Administración (06 · R3.4, R3.5, R3.7;
// diseño de 07, § 4): cuántos precios hay, cuántos cambian con cada paso (una consulta) y unos
// ejemplos; y el recálculo, en una sola sentencia dentro de la transacción del cambio. Sin «Ver
// costos», los ejemplos son inventados: con el precio calculado y el margen se sacaría el costo.
import {
  inventedExamples,
  type RoundingResponse,
  roundingSteps,
} from '@ferrebress/shared/contracts/administration';
import { type Kysely, sql } from 'kysely';
import type { PriceRecalculator } from '../administration/index.ts';
import { pricingData } from './data/pricing.ts';
import type { CatalogTables } from './data/products.ts';

type Db = Kysely<CatalogTables>;

const examplesCount = 5;

async function counts(db: Db): Promise<Pick<RoundingResponse, 'total' | 'changes'>> {
  const each = roundingSteps.map(
    (step) =>
      sql`count(*) filter (where (raw_cents + ${step} - 1) / ${step} * ${step} <> sale_cents)`,
  );
  const { rows } = await sql<{ total: string; changes: string[] }>`
    select count(*) as total, array[${sql.join(each)}]::text[] as changes
    from catalog.products where raw_cents is not null`.execute(db);
  const row = rows[0] as { total: string; changes: string[] };
  return {
    total: Number(row.total),
    changes: Object.fromEntries(roundingSteps.map((step, i) => [step, Number(row.changes[i])])),
  };
}

async function realExamples(db: Db) {
  const { rows } = await sql<{ name: string; raw: string }>`
    select description as name, raw_cents::text as raw from catalog.products
    where raw_cents is not null order by search_key collate "C", id limit ${examplesCount}`.execute(
    db,
  );
  return rows.map((row) => ({ name: row.name, calculated: row.raw }));
}

export function createRecalculator(dbOf: () => Kysely<unknown>): PriceRecalculator {
  const db = () => dbOf() as Db;
  return {
    async preview(seesCosts) {
      const { total, changes } = await counts(db());
      if (total === 0) return { total, changes: {}, examples: [] };
      const examples = seesCosts ? await realExamples(db()) : inventedExamples;
      return { total, changes, examples };
    },
    changesWith: (step) => pricingData(db()).changesWith(step),
    apply: (step, trx) => pricingData(trx as Db).applyStep(step),
  };
}
