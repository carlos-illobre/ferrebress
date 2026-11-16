// Los proveedores (08 · R2, R3; diseño de 08, § 2): sus datos, cómo cobra cada uno y su última lista.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createSuppliers: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('price_lists')
      .createTable('suppliers')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('name', 'text', (col) =>
        col.notNull().check(sql`char_length(name) between 1 and 80`),
      )
      // Único entre todos, también los dados de baja (R2.1, E10, E94).
      .addColumn('name_key', 'text', (col) => col.notNull().unique())
      .addColumn('seller', 'text', (col) => col.check(sql`char_length(seller) <= 80`))
      .addColumn('phone', 'text', (col) => col.check(sql`char_length(phone) <= 40`))
      .addColumn('email', 'text', (col) => col.check(sql`char_length(email) <= 120`))
      .addColumn('note', 'text', (col) => col.check(sql`char_length(note) <= 500`))
      .addColumn('terms', 'jsonb', (col) => col.notNull())
      .addColumn('terms_version', 'integer', (col) => col.notNull())
      .addColumn('inactive', 'boolean', (col) => col.notNull().defaultTo(false))
      .addColumn('last_list_id', 'uuid')
      .addColumn('last_list_date', 'date')
      .execute();
  },
};
