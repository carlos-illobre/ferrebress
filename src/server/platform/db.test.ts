import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inMemoryUrl, migrate, openDatabase, useMemoryTemplate } from './db.ts';

type Tables = { 'notes.notes': { text: string } };

const createNotes: Migration = {
  up: async (db) => {
    await db.schema.withSchema('notes').createTable('notes').addColumn('text', 'text').execute();
  },
};
const broken: Migration = {
  up: async (db) => {
    await sql`select nada`.execute(db);
  },
};

describe('la base', () => {
  let db: Kysely<Tables>;
  beforeAll(async () => {
    db = await openDatabase<Tables>(inMemoryUrl);
  });
  afterAll(() => db.destroy());

  it('sin una base de partida, PGlite crea la suya', async () => {
    useMemoryTemplate(undefined);
    const fresh = await openDatabase(inMemoryUrl);
    expect((await sql<{ one: number }>`select 1 as one`.execute(fresh)).rows).toEqual([{ one: 1 }]);
    await fresh.destroy();
  });

  it('en memoria corre las migraciones de cada módulo en su esquema, una sola vez', async () => {
    const notes = { schema: 'notes', migrations: { '001-notes': createNotes } };
    await migrate(db as Kysely<unknown>, [notes]);
    await migrate(db as Kysely<unknown>, [notes]);
    await db.insertInto('notes.notes').values({ text: 'hola' }).execute();
    expect(await db.selectFrom('notes.notes').selectAll().execute()).toEqual([{ text: 'hola' }]);
  });

  it('una migración que falla corta el arranque', async () => {
    const module = { schema: 'broken', migrations: { '001': broken } };
    await expect(migrate(db as Kysely<unknown>, [module])).rejects.toThrow();
  });

  it('con una dirección de PostgreSQL no se conecta hasta el primer pedido', async () => {
    const remote = await openDatabase<Tables>('postgres://localhost:1/base');
    await remote.destroy();
  });
});
