// La foto de un pedido y las nuevas (diseño de 05, § 5): la última fila de cada archivo vivo, lo que
// se escribe después no entra en la foto, y cuántas llegaron desde ahí con los filtros.
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditEvent } from './event.ts';
import { createQuery, type Latest, type Query } from './query.ts';
import { fileSource, memorySource } from './source.ts';
import { where } from './where.ts';
import { type AuditLog, inMemoryAudit, openAuditLog } from './write.ts';

const marcos = { kind: 'person' as const, userId: 'u-marcos', name: 'Marcos' };
const lucia = { kind: 'person' as const, userId: 'u-lucia', name: 'Lucía' };
const at = (iso: string): AuditEvent => ({ type: 'sign-out', at: new Date(iso), actor: marcos });

describe('la foto del pedido y las nuevas', () => {
  let audit: AuditLog;
  let year = 2026;
  let query: Query;
  const write = (...events: AuditEvent[]) => {
    for (const event of events) audit.record(event);
    audit.flush();
  };
  beforeEach(() => {
    year = 2026;
    audit = openAuditLog(inMemoryAudit);
    query = createQuery(memorySource(audit), () => year);
    write(
      at('2024-06-01T12:00:00Z'),
      at('2025-12-31T20:00:00Z'),
      at('2026-11-04T13:00:00Z'),
      at('2026-11-04T13:01:00Z'),
    );
  });
  afterEach(() => audit.close());

  it('la última fila de cada archivo vivo; un año sin archivo, 0', () => {
    expect(query({ op: 'latest' })).toEqual([
      [2025, 1],
      [2026, 2],
    ]);
    year = 2027;
    expect(query({ op: 'latest' })).toEqual([
      [2026, 2],
      [2027, 0],
    ]);
  });

  it('lo escrito después de la foto no entra en ninguna consulta del pedido', () => {
    const upTo = query({ op: 'latest' }) as Latest;
    write(at('2026-11-04T13:02:00Z'), at('2025-12-31T21:00:00Z'));
    // Un archivo anterior a los vivos entra entero.
    expect(query({ op: 'count', filter: {} })).toBe(6);
    expect(query({ op: 'count', filter: { upTo } })).toBe(4);
    expect(query({ op: 'rows', filter: { upTo }, offset: 0, limit: 10 })).toHaveLength(4);
    // Un archivo de un año posterior a la foto tampoco entra.
    write(at('2027-01-01T03:00:00Z'));
    expect(query({ op: 'count', filter: { upTo } })).toBe(4);
  });

  it('cuenta las nuevas con los filtros, también una sin conexión en el archivo del año anterior', () => {
    const since = query({ op: 'latest' }) as Latest;
    write(
      at('2026-11-04T13:05:00Z'),
      { ...at('2026-11-04T13:06:00Z'), actor: lucia },
      at('2025-12-31T22:00:00Z'),
    );
    const newer = (filter = {}, limit = 100) => query({ op: 'newer', filter, since, limit });
    expect(newer()).toBe(3);
    expect(newer({ actor: { userId: 'u-marcos' } })).toBe(2);
    expect(newer({}, 2)).toBe(2);
  });

  it('el 1 de enero sin archivo nuevo, y el que aparece después, se cuentan', () => {
    year = 2027;
    const since = query({ op: 'latest' }) as Latest;
    expect(query({ op: 'newer', filter: {}, since, limit: 100 })).toBe(0);
    write(at('2027-01-01T03:00:00Z'), at('2026-12-31T20:00:00Z'));
    expect(query({ op: 'newer', filter: {}, since, limit: 100 })).toBe(2);
  });

  it('metas: contar las nuevas va por la fila, sin recorrer el archivo', () => {
    const file = audit.openFiles().years.get(2026);
    const { sql, params } = where({}, 2026);
    const plan = file
      ?.prepare(`explain query plan select 1 from events where ${sql} and id > ? limit ?`)
      .all(...params, 1, 100) as { detail: string }[];
    expect(plan.map((row) => row.detail).join(' ')).toMatch(/INTEGER PRIMARY KEY/);
  });

  it('los totales de un año cerrado se guardan aunque la foto cambie con cada escritura', () => {
    const prepared = vi.spyOn(DatabaseSync.prototype, 'prepare');
    const count = () => query({ op: 'count', filter: { upTo: query({ op: 'latest' }) as Latest } });
    count();
    write(at('2026-11-04T13:05:00Z'));
    prepared.mockClear();
    count();
    const counted = prepared.mock.calls.filter(([sql]) => /count\(\*\)/.test(sql)).length;
    prepared.mockRestore();
    // Solo el año en curso: 2024 y 2025 (cuya última fila no cambió) salen de lo guardado.
    expect(counted).toBe(1);
  });

  it('en el disco, contar las nuevas y la foto no crean archivos', () => {
    const path = mkdtempSync(join(tmpdir(), 'audit-newer-'));
    const disk = openAuditLog(path);
    disk.record(at('2026-11-04T13:00:00Z'));
    disk.flush();
    const before = readdirSync(path).sort();
    const reading = createQuery(fileSource(path), () => 2027);
    const since = reading({ op: 'latest' }) as Latest;
    expect(since).toEqual([
      [2026, 1],
      [2027, 0],
    ]);
    expect(reading({ op: 'newer', filter: {}, since, limit: 100 })).toBe(0);
    expect(readdirSync(path).sort()).toEqual(before);
    disk.close();
  });
});
