import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inMemoryAudit, openAuditLog } from './audit.ts';

const at = new Date('2026-10-27T12:00:00Z');

describe('quién hizo qué', () => {
  afterEach(() => vi.useRealTimers());

  it('guarda cada evento con todo lo que trae y lo devuelve igual', () => {
    const audit = openAuditLog(inMemoryAudit);
    const full = {
      type: 'sign-in.succeeded',
      at,
      userId: 'u1',
      email: 'a@example.com',
      deviceId: 'd1',
      ipAddress: '190.0.0.1',
      data: { method: 'google' },
    };
    audit.record(full);
    audit.record({ type: 'sign-in.rejected', at });
    expect(audit.read(2026)).toEqual([full, { type: 'sign-in.rejected', at }]);
    audit.close();
  });

  it('un archivo por año', () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'ferrebress-audit-')), 'audit');
    const audit = openAuditLog(dir);
    audit.record({ type: 'a', at: new Date('2025-12-31T23:59:59Z') });
    audit.record({ type: 'b', at });
    expect(audit.read(2025).map((event) => event.type)).toEqual(['a']);
    expect(audit.read(2024)).toEqual([]);
    audit.close();
    expect(readdirSync(dir).sort()).toEqual(['2025.sqlite', '2026.sqlite']);
    expect(
      openAuditLog(dir)
        .read(2026)
        .map((event) => event.type),
    ).toEqual(['b']);
  });

  it('escribe por tandas: cada segundo, o al juntar 100 eventos', () => {
    vi.useFakeTimers();
    const dir = join(mkdtempSync(join(tmpdir(), 'ferrebress-audit-')), 'audit');
    const audit = openAuditLog(dir);
    const other = () => openAuditLog(dir);
    audit.record({ type: 'uno', at });
    expect(readdirSync(join(dir, '..'))).toEqual([]);
    vi.advanceTimersByTime(1_000);
    expect(other().read(2026)).toHaveLength(1);
    for (let i = 0; i < 100; i++) audit.record({ type: 'muchos', at });
    expect(other().read(2026)).toHaveLength(101);
    audit.close();
  });
});
