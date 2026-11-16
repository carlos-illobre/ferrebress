// Los artículos de cada proveedor (08 · R7, R8; diseño de 08, § 2): lo que trae con su código, con su
// costo y su base, y el producto del catálogo que le corresponde.
import type { Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createItems: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('price_lists');
    await schema
      .createTable('items')
      .addColumn('supplier_id', 'uuid', (col) => col.notNull())
      .addColumn('supplier_code', 'text', (col) => col.notNull())
      .addColumn('product_id', 'uuid', (col) => col.notNull())
      .addColumn('description', 'text', (col) => col.notNull())
      .addColumn('brand', 'text')
      .addColumn('barcode', 'text')
      .addColumn('search_key', 'text', (col) => col.notNull())
      .addColumn('vat', 'smallint', (col) => col.notNull())
      .addColumn('cost', 'bigint', (col) => col.notNull())
      .addColumn('basis', 'jsonb', (col) => col.notNull())
      .addColumn('list_id', 'uuid', (col) => col.notNull())
      // Dejó de venir (R7.4): desde qué lista, o ninguna si se dio de baja al proveedor.
      .addColumn('discontinued', 'boolean', (col) => col.notNull().defaultTo(false))
      .addColumn('discontinued_list_id', 'uuid')
      .addPrimaryKeyConstraint('items_pkey', ['supplier_id', 'supplier_code'])
      .execute();
    await schema
      .createIndex('items_by_name')
      .on('items')
      .columns(['supplier_id', 'discontinued', 'search_key'])
      .execute();
    await schema.createIndex('items_by_product').on('items').column('product_id').execute();
  },
};
