// La tabla de personas (diseño de 01, § 3): lo mínimo que necesita entrar. Los roles y las
// pantallas llegan con el módulo 02.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createUsers: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .withSchema('users')
      .createTable('users')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('email', 'text', (col) => col.notNull().unique())
      .addColumn('google_subject', 'text', (col) => col.unique())
      .addColumn('name', 'text')
      .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
      .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
      .execute();
  },
};
