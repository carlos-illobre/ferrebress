import type { Migration } from 'kysely/migration';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from './app.ts';
import { testConfig } from './testing/config.ts';

describe('el servidor', () => {
  let server: Awaited<ReturnType<typeof createServer>>;
  const registered: string[] = [];
  beforeAll(async () => {
    const plain = {
      name: 'demo',
      register: () => {
        registered.push('demo');
      },
    };
    const createNotes: Migration = {
      up: (db) =>
        db.schema.withSchema('notes').createTable('notes').addColumn('text', 'text').execute(),
    };
    const withSchema = {
      name: 'notes',
      schema: { schema: 'notes', migrations: { '001': createNotes } },
      register: () => {
        registered.push('notes');
      },
    };
    server = await createServer(testConfig, [plain, withSchema]);
  });
  afterAll(() => server.close());

  it('registra cada módulo y migra los que guardan algo', async () => {
    expect(registered).toEqual(['demo', 'notes']);
    const tables = await server.platform.db.introspection.getTables();
    expect(tables.map((table) => `${table.schema}.${table.name}`)).toContain('notes.notes');
  });

  it('dice que está sano si la base responde', async () => {
    const response = await server.http.request('/api/health');
    expect(await response.json()).toEqual({ ok: true, version: 'test' });
  });
});
