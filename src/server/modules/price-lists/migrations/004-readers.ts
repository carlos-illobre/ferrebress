// Los lectores (08 · R5; diseño de 08, § 2) y lo que la lectura guarda de cada lista: si ya se leyó
// entera (puede seguir esperando de quién es, R4.3) y si se confirmó leer una planilla grande (R4.12),
// para retomarla igual si se corta.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createReaders: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('price_lists');
    await schema
      .createTable('readers')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('supplier_id', 'uuid')
      .addColumn('origin', 'text', (col) =>
        col.notNull().check(sql`origin in ('programmer', 'auto', 'ai')`),
      )
      .addColumn('code', 'text', (col) => col.check(sql`octet_length(code) <= 204800`))
      .addColumn('template', 'text')
      .addColumn('params', 'jsonb')
      .addColumn('file_key', 'text', (col) => col.unique())
      .addColumn('code_sha', 'bytea')
      .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
      .addColumn('pending_list_id', 'uuid')
      .addColumn('proof_list_id', 'uuid')
      .addColumn('last_list_id', 'uuid')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .execute();
    await schema.createIndex('readers_by_supplier').on('readers').column('supplier_id').execute();
    await schema
      .alterTable('lists')
      .addColumn('read_at', 'timestamptz')
      .addColumn('size_confirmed', 'boolean', (col) => col.notNull().defaultTo(false))
      .execute();
  },
};
