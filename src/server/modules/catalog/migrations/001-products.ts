// La tabla de los productos (08 · R7; diseño de 08, § 2): lo que se vende, con el costo de su
// artículo. Nace con lo que crea una lista; 07 le suma el margen, el precio y la búsqueda.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createProducts: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('catalog')
      .createTable('products')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('description', 'text', (col) => col.notNull())
      .addColumn('brand', 'text')
      .addColumn('barcode', 'text')
      .addColumn('unit', 'text', (col) =>
        col.notNull().defaultTo('un.').check(sql`unit in ('un.', 'kg', 'm', 'L')`),
      )
      .addColumn('unit_manual', 'boolean', (col) => col.notNull().defaultTo(false))
      .addColumn('vat', 'smallint', (col) => col.notNull().check(sql`vat between 0 and 1000`))
      .addColumn('vat_manual', 'boolean', (col) => col.notNull().defaultTo(false))
      // En millonésimos de peso; sin artículo que lo traiga, ninguno.
      .addColumn('cost', 'bigint', (col) => col.check(sql`cost >= 0`))
      .addColumn('cost_supplier_id', 'uuid')
      .addColumn('discontinued', 'boolean', (col) => col.notNull().defaultTo(false))
      .execute();
  },
};
