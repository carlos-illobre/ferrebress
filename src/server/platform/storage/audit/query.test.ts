import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import type { Worker } from 'node:worker_threads';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AuditEvent } from './event.ts';
import { createQuery, type Filter, maxClosedTotals, type Query } from './query.ts';
import { openAuditReader, readerLimits } from './reader.ts';
import { fileSource, memorySource } from './source.ts';
import { type AuditLog, inMemoryAudit, openAuditLog } from './write.ts';

const marcos = { kind: 'person' as const, userId: 'u-marcos', name: 'Marcos' };
const lucia = { kind: 'person' as const, userId: 'u-lucia', name: 'Lucía' };
const minute = 60_000;
const start = Date.parse('2026-11-04T13:00:00Z');

// Diez acciones: dos del 31 de diciembre en Buenos Aires (una ya es enero en Greenwich) y ocho de hoy.
const events: AuditEvent[] = [
  { type: 'sign-in.succeeded', at: new Date('2026-01-01T01:30:00Z'), actor: lucia },
  { type: 'sign-in.succeeded', at: new Date('2025-12-31T20:00:00Z'), actor: marcos },
  ...[0, 1, 2, 3, 4, 5, 6].map(
    (i): AuditEvent => ({
      type: i % 2 ? 'user.renamed' : 'sign-out',
      at: new Date(start + i * minute),
      actor: i === 3 ? { kind: 'system' } : marcos,
      ...(i % 2 === 1 && { targets: [{ kind: 'person', id: 'u-lucia', name: 'Lucía' }] }),
    }),
  ),
  { type: 'sign-in.rejected', at: new Date(start + 7 * minute), actor: { kind: 'outsider' } },
];

function filled(path: string): AuditLog {
  const audit = openAuditLog(path);
  audit.provideTone((event) =>
    event.type === 'sign-in.rejected' ? 'amber' : event.type === 'user.renamed' ? 'red' : 'plain',
  );
  for (const event of events) audit.record(event);
  audit.flush();
  return audit;
}

describe('quién hizo qué: la consulta', () => {
  let audit: AuditLog;
  let query: Query;
  beforeAll(() => {
    audit = filled(inMemoryAudit);
    query = createQuery(memorySource(audit), () => 2026);
  });
  afterAll(() => audit.close());

  const types = (filter: Filter, offset = 0, limit = 20) =>
    (query({ op: 'rows', filter, offset, limit }) as { type: string }[]).map((one) => one.type);

  it('audit-log-E17: de la más nueva a la más vieja, sobre los dos años, con el total', () => {
    expect(query({ op: 'count', filter: {} })).toBe(10);
    expect(types({}, 0, 3)).toEqual(['sign-in.rejected', 'sign-out', 'user.renamed']);
    // La página que cruza de un año al otro.
    expect(types({}, 8, 5)).toEqual(['sign-in.succeeded', 'sign-in.succeeded']);
    expect(types({}, 9, 5)).toEqual(['sign-in.succeeded']);
    expect(types({}, 20, 5)).toEqual([]);
  });

  it('audit-log-E23, E24, E27, E28: cada filtro y sus combinaciones', () => {
    expect(query({ op: 'count', filter: { actor: { userId: 'u-marcos' } } })).toBe(7);
    expect(query({ op: 'count', filter: { actor: 'system' } })).toBe(1);
    expect(query({ op: 'count', filter: { actor: 'outsider' } })).toBe(1);
    expect(query({ op: 'count', filter: { target: 'u-lucia' } })).toBe(3);
    expect(query({ op: 'count', filter: { types: ['user.renamed'] } })).toBe(3);
    expect(query({ op: 'count', filter: { types: [] } })).toBe(0);
    expect(query({ op: 'count', filter: { tone: 'amber' } })).toBe(1);
    expect(
      query({
        op: 'count',
        filter: { actor: { userId: 'u-marcos' }, types: ['user.renamed'], from: start },
      }),
    ).toBe(2);
  });

  it('audit-log-E25, E26: por fechas, eligiendo los archivos por el año de Greenwich', () => {
    // El 31 de diciembre a la noche en Buenos Aires ya está en el archivo de 2026.
    const lastDay = {
      from: Date.parse('2025-12-31T03:00:00Z'),
      until: Date.parse('2026-01-01T03:00:00Z'),
    };
    expect(types(lastDay)).toEqual(['sign-in.succeeded', 'sign-in.succeeded']);
    expect(query({ op: 'count', filter: { until: Date.parse('2026-01-01T00:00:00Z') } })).toBe(1);
    expect(query({ op: 'count', filter: { from: start + 6 * minute } })).toBe(2);
  });

  it('audit-log-R4.9: cuántas de cada color y la tira de lo más viejo a lo más nuevo', () => {
    expect(query({ op: 'tones', filter: { from: start } })).toEqual({ plain: 4, amber: 1, red: 3 });
    const marks = query({ op: 'marks', filter: {}, limit: 20 }) as { at: number; tone: string }[];
    expect(marks).toHaveLength(10);
    expect(marks[0]).toMatchObject({ id: '2025:1', tone: 'plain' });
    expect(marks.at(-1)).toMatchObject({ at: start + 7 * minute, tone: 'amber' });
    expect(query({ op: 'marks', filter: {}, limit: 2 })).toHaveLength(2);
  });

  it('audit-log-E30: las personas de hoy, por nombre', () => {
    expect(query({ op: 'people' })).toEqual([
      { userId: 'u-lucia', name: 'Lucía', state: 'active' },
      { userId: 'u-marcos', name: 'Marcos', state: 'active' },
    ]);
  });

  it('los totales guardados tienen un tope: pasado, se empieza de cero', () => {
    const fresh = createQuery(memorySource(audit), () => 2026);
    const closed = Date.parse('2025-01-01T00:00:00Z');
    for (let i = 0; i <= maxClosedTotals; i++)
      fresh({
        op: 'count',
        filter: { from: closed + i, until: Date.parse('2025-12-31T00:00:00Z') },
      });
    expect(fresh({ op: 'count', filter: {} })).toBe(10);
  });

  it('los totales de los años cerrados se guardan: no cambian', () => {
    audit.record({ type: 'tardía', at: new Date('2025-06-01T12:00:00Z'), actor: marcos });
    audit.flush();
    expect(query({ op: 'count', filter: {} })).toBe(10);
    expect(createQuery(memorySource(audit), () => 2026)({ op: 'count', filter: {} })).toBe(11);
  });

  it('metas: cada forma de consulta usa su índice', () => {
    const file = audit.openFiles().years.get(2026) as DatabaseSync;
    const plan = (sql: string, ...params: (string | number)[]) =>
      (file.prepare(`explain query plan ${sql}`).all(...params) as { detail: string }[])
        .map((row) => row.detail)
        .join(' | ');
    expect(plan('select * from events where 1 = 1 order by at desc, id desc limit 20')).toMatch(
      /events_at/,
    );
    expect(plan('select count(*) from events where 1 = 1 and user_id = ?', 'u')).toMatch(
      /events_user/,
    );
    expect(plan('select count(*) from events where 1 = 1 and tone = ?', 1)).toMatch(/events_tone/);
    expect(plan('select count(*) from events where 1 = 1 and actor_kind = ?', 1)).toMatch(
      /events_actor/,
    );
    expect(plan('select count(*) from events where 1 = 1 and type in (?, ?)', 'a', 'b')).toMatch(
      /events_type/,
    );
    expect(
      plan(
        'select count(*) from events where id in (select event_id from targets where target_id = ?)',
        'u',
      ),
    ).toMatch(/targets_target/);
  });
});

describe('quién hizo qué: leer del disco', () => {
  it('de solo lectura, sin crear archivos aunque se pida un período de miles de años', () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'ferrebress-audit-')), 'audit');
    const audit = filled(dir);
    const before = readdirSync(dir).sort();
    const query = createQuery(fileSource(dir), () => 2026);
    const huge = {
      from: Date.parse('0001-01-01T00:00:00Z'),
      until: Date.parse('9999-12-31T00:00:00Z'),
    };
    expect(query({ op: 'count', filter: huge })).toBe(10);
    expect(query({ op: 'people' })).toHaveLength(2);
    expect(query({ op: 'people' })).toHaveLength(2);
    expect(readdirSync(dir).sort()).toEqual(before);
    audit.close();
    const nothing = createQuery(fileSource(join(dir, 'nada')), () => 2026);
    expect(nothing({ op: 'people' })).toEqual([]);
    expect(nothing({ op: 'count', filter: {} })).toBe(0);
  });

  it('en un hilo aparte, después de escribir lo pendiente', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'ferrebress-audit-')), 'audit');
    const audit = filled(dir);
    const reader = openAuditReader(dir, audit);
    audit.record({ type: 'recién', at: new Date(start + 9 * minute), actor: marcos });
    expect(await reader.ask({ op: 'count', filter: {} })).toBe(11);
    // Un error en el hilo vuelve como error del pedido, sin tirar el hilo.
    await expect(
      reader.ask({ op: 'count', filter: { from: (10n ** 30n) as unknown as number } }),
    ).rejects.toThrow();
    expect(await reader.ask({ op: 'count', filter: {} })).toBe(11);
    await reader.close();
    audit.close();
  });

  it('seguridad, 12: si el hilo se cae, lo que esperaba falla y se vuelve a crear; si tarda, falla', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'ferrebress-audit-')), 'audit');
    const audit = filled(dir);
    const reader = openAuditReader(dir, audit);
    const thread = reader.thread?.() as Worker;
    thread.emit('error', new Error('se rompió'));
    // El aviso de que el hilo terminó llega antes que la respuesta, como si se hubiera caído.
    const failed = expect(reader.ask({ op: 'count', filter: {} })).rejects.toThrow('se cerró');
    thread.emit('exit', 1);
    await failed;
    await thread.terminate();
    expect(await reader.ask({ op: 'count', filter: {} })).toBe(10);
    const { answerMs } = readerLimits;
    // Un hilo que no contesta: el pedido falla al pasar el tiempo máximo.
    readerLimits.answerMs = 5;
    reader.thread?.().removeAllListeners('message');
    await expect(reader.ask({ op: 'count', filter: {} })).rejects.toThrow('tardó demasiado');
    readerLimits.answerMs = answerMs;
    await reader.close();
    audit.close();
  });

  it('con la auditoría en memoria, en el mismo hilo', async () => {
    const audit = filled(inMemoryAudit);
    const reader = openAuditReader(inMemoryAudit, audit);
    audit.record({ type: 'recién', at: new Date(start), actor: marcos });
    expect(await reader.ask({ op: 'count', filter: {} })).toBe(11);
    await reader.close();
    audit.close();
  });
});
