// Las listas, sus archivos y lo que trajo cada fila (08 · R4, R6; diseño de 08, § 2).
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

type Schema = Kysely<unknown>['schema'];

async function createFiles(schema: Schema) {
  await schema
    .createTable('files')
    .addColumn('sha256', 'bytea', (col) => col.primaryKey())
    .addColumn('size', 'bigint', (col) => col.notNull())
    .addColumn('stored_at', 'timestamptz', (col) => col.notNull())
    .addColumn('deleting_at', 'timestamptz')
    .execute();
}

const statuses = sql`status in ('queued', 'reading', 'pending', 'applying', 'applied', 'discarded', 'unreadable')`;

async function createListsTable(schema: Schema) {
  await schema
    .createTable('lists')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('supplier_id', 'uuid')
    .addColumn('supplier_from', 'text', (col) =>
      col.check(sql`supplier_from in ('screen', 'reader', 'name', 'chosen')`),
    )
    .addColumn('supplier_confirmed', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('status', 'text', (col) => col.notNull().check(statuses))
    .addColumn('waiting_for', 'text', (col) => col.check(sql`waiting_for in ('supplier', 'size')`))
    .addColumn('scope', 'text', (col) =>
      col.notNull().defaultTo('full').check(sql`scope in ('full', 'partial')`),
    )
    .addColumn('file_sha256', 'bytea')
    .addColumn('file_name', 'text', (col) =>
      col.notNull().check(sql`char_length(file_name) between 1 and 200`),
    )
    .addColumn('list_date', 'date')
    .addColumn('date_from', 'text')
    .addColumn('reader_id', 'uuid')
    .addColumn('new_reader', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('rows_total', 'integer')
    .addColumn('rows_read', 'integer')
    .addColumn('attempts', 'smallint', (col) => col.notNull().defaultTo(0))
    .addColumn('reason', 'text')
    .addColumn('result', 'jsonb')
    .addColumn('uploaded_by', 'uuid', (col) => col.notNull())
    .addColumn('uploaded_at', 'timestamptz', (col) => col.notNull())
    .addColumn('decided_by', 'uuid')
    .addColumn('decided_at', 'timestamptz')
    .execute();
}

async function indexLists(schema: Schema) {
  await schema
    .createIndex('lists_by_supplier')
    .on('lists')
    .columns(['supplier_id', 'uploaded_at desc'])
    .execute();
  // Una sola lista viva por proveedor (R4.8); la que está en cola no cuenta.
  await schema
    .createIndex('lists_one_alive')
    .on('lists')
    .column('supplier_id')
    .unique()
    .where(sql.ref('status'), 'in', ['reading', 'pending', 'applying'])
    .execute();
}

async function createListRows(schema: Schema) {
  await schema
    .createTable('list_rows')
    .addColumn('list_id', 'uuid', (col) => col.notNull())
    .addColumn('sheet', 'smallint', (col) => col.notNull())
    .addColumn('row', 'integer', (col) => col.notNull())
    .addColumn('supplier_code', 'text', (col) => col.check(sql`char_length(supplier_code) <= 60`))
    .addColumn('description', 'text', (col) => col.check(sql`char_length(description) <= 300`))
    .addColumn('brand', 'text', (col) => col.check(sql`char_length(brand) <= 80`))
    .addColumn('barcode', 'text', (col) => col.check(sql`char_length(barcode) <= 40`))
    .addColumn('search_key', 'text')
    .addColumn('list_price', 'bigint')
    .addColumn('vat', 'smallint')
    .addColumn('cost', 'bigint')
    .addColumn('basis', 'jsonb')
    .addColumn('previous_cost', 'bigint')
    // Cuánto cambia el costo, sin signo: para «los que cambian primero» (R6.3).
    .addColumn('abs_variation', 'double precision', (col) =>
      col
        .generatedAlwaysAs(
          sql`case when previous_cost > 0 then abs(cost - previous_cost)::double precision / previous_cost end`,
        )
        .stored(),
    )
    .addColumn('change', 'text', (col) => col.check(sql`change in ('new', 'changed', 'same')`))
    .addColumn('skipped', 'text')
    .addColumn('cells', 'jsonb')
    .addPrimaryKeyConstraint('list_rows_pkey', ['list_id', 'sheet', 'row'])
    .execute();
  await schema
    .createIndex('list_rows_by_change')
    .on('list_rows')
    .expression(sql`list_id, change, abs_variation desc nulls last`)
    .execute();
  await schema
    .createIndex('list_rows_by_code')
    .on('list_rows')
    .columns(['list_id', 'supplier_code'])
    .execute();
}

export const createLists: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('price_lists');
    await createFiles(schema);
    await createListsTable(schema);
    await indexLists(schema);
    await createListRows(schema);
  },
};
