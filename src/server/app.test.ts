import type { Migration } from 'kysely/migration';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer } from './app.ts';
import type { Platform } from './platform/modules.ts';
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

  it('corre los trabajos periódicos y los de cierre, y un trabajo que falla no tira el servidor', async () => {
    const runs: string[] = [];
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const jobs = {
      name: 'jobs',
      register: (platform: Platform) => {
        platform.every(1_000, async () => void runs.push('cada segundo'));
        platform.every(1_000, () => Promise.reject(new Error('falló')));
        platform.onClose(async () => void runs.push('al cerrar'));
      },
    };
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const withJobs = await createServer(testConfig, [jobs]);
    await vi.advanceTimersByTimeAsync(1_000);
    await withJobs.close();
    vi.useRealTimers();
    expect(runs).toEqual(['cada segundo', 'al cerrar']);
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });
});
