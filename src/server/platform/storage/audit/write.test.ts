import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuditEvent } from './event.ts';
import { inMemoryAudit, openAuditLog } from './write.ts';

const at = new Date('2026-10-27T12:00:00Z');
const marcos = { kind: 'person' as const, userId: 'u-marcos' };
const tempDir = () => join(mkdtempSync(join(tmpdir(), 'ferrebress-audit-')), 'audit');
const people = (audit: ReturnType<typeof openAuditLog>) => {
  audit.flush();
  return audit.openFiles().people.prepare('select * from people order by user_id').all();
};

describe('quién hizo qué: escribir', () => {
  afterEach(() => vi.useRealTimers());

  it('audit-log-E01: guarda cada acción con su forma común y la devuelve igual, con su id', () => {
    const audit = openAuditLog(inMemoryAudit);
    const full: AuditEvent = {
      type: 'user.renamed',
      at,
      actor: { ...marcos, name: 'Marcos' },
      targets: [{ kind: 'person', id: 'u-lucia', name: 'Lucía' }],
      changes: { name: { before: 'Lucía', after: 'Lucía Fernández' } },
      data: { reason: 'typo' },
      device: { phone: true, browser: 'chrome', os: 'android' },
      ipAddress: '190.0.0.1',
      arrivedAt: new Date('2026-10-27T12:00:05Z'),
      deviceTime: new Date('2026-10-27T11:59:00Z'),
    };
    audit.record(full);
    audit.record({ type: 'sign-in.rejected', at, actor: { kind: 'outsider' } });
    audit.record({ type: 'role.permissions-added', at, actor: { kind: 'system' } });
    expect(audit.read(2026)).toEqual([
      { ...full, id: '2026:1', tone: 'plain' },
      { id: '2026:2', type: 'sign-in.rejected', at, actor: { kind: 'outsider' }, tone: 'plain' },
      {
        id: '2026:3',
        type: 'role.permissions-added',
        at,
        actor: { kind: 'system' },
        tone: 'plain',
      },
    ]);
    expect(audit.read(2025)).toEqual([]);
    audit.close();
  });

  it('audit-log-E21: el color lo calcula quien conoce los tipos, al anotar', () => {
    const audit = openAuditLog(inMemoryAudit);
    audit.provideTone((event) => (event.type === 'user.deleted' ? 'red' : 'amber'));
    audit.record({ type: 'user.deleted', at, actor: marcos });
    audit.record({ type: 'sign-in.rejected', at, actor: { kind: 'outsider' } });
    expect(audit.read(2026).map((event) => event.tone)).toEqual(['red', 'amber']);
    audit.close();
  });

  it('un archivo por año, con la forma v1; los de la forma vieja se borran al abrir', () => {
    const dir = tempDir();
    mkdirSync(dir, { recursive: true });
    for (const old of ['2026.sqlite', '2026.sqlite-wal', '2025.sqlite-shm', 'notas.txt'])
      writeFileSync(join(dir, old), 'viejo');
    const audit = openAuditLog(dir);
    expect(
      readdirSync(dir)
        .filter((name) => !/-(wal|shm)$/.test(name))
        .sort(),
    ).toEqual(['notas.txt', 'people.v1.sqlite']);
    audit.record({ type: 'a', at: new Date('2025-12-31T23:59:59Z'), actor: marcos });
    audit.record({ type: 'b', at, actor: marcos });
    expect(audit.read(2025).map((event) => event.type)).toEqual(['a']);
    audit.close();
    expect(
      readdirSync(dir)
        .filter((name) => name.endsWith('.v1.sqlite'))
        .sort(),
    ).toEqual(['2025.v1.sqlite', '2026.v1.sqlite', 'people.v1.sqlite']);
    const again = openAuditLog(dir);
    again.record({ type: 'c', at, actor: marcos });
    expect(again.read(2026).map((event) => event.type)).toEqual(['b', 'c']);
    again.close();
  });

  it('escribe por tandas: cada segundo, o al juntar 100 acciones', () => {
    vi.useFakeTimers();
    const dir = tempDir();
    const audit = openAuditLog(dir);
    const rows = () => {
      const other = openAuditLog(dir);
      const files = other.openFiles();
      const count = files.years.size;
      other.close();
      return count;
    };
    audit.record({ type: 'uno', at, actor: marcos });
    expect(rows()).toBe(0);
    vi.advanceTimersByTime(1_000);
    expect(readdirSync(dir)).toContain('2026.v1.sqlite');
    for (let i = 0; i < 100; i++) audit.record({ type: 'muchos', at, actor: marcos });
    expect(audit.read(2026)).toHaveLength(101);
    audit.close();
  });

  it('audit-log-E07: el nombre de ese momento, también después de cambiarlo, y las personas de hoy', () => {
    const audit = openAuditLog(inMemoryAudit);
    audit.knowPeople([
      { userId: 'u-marcos', name: 'Marcos', email: 'marcos@example.com', state: 'active' },
    ]);
    audit.record({ type: 'sign-out', at, actor: marcos });
    audit.record({
      type: 'user.renamed',
      at,
      actor: marcos,
      targets: [{ kind: 'person', id: 'u-marcos' }],
      people: [
        { userId: 'u-marcos', name: 'Marcos Pérez', email: 'marcos@example.com', state: 'active' },
      ],
    });
    audit.record({ type: 'sign-out', at, actor: marcos });
    const events = audit.read(2026);
    expect(events.map((event) => event.actor)).toEqual([
      { ...marcos, name: 'Marcos' },
      { ...marcos, name: 'Marcos' },
      { ...marcos, name: 'Marcos Pérez' },
    ]);
    expect(events[1]?.targets).toEqual([{ kind: 'person', id: 'u-marcos', name: 'Marcos' }]);
    // Ya conocida: no se pisa con lo que dice el arranque.
    audit.knowPeople([{ userId: 'u-marcos', name: 'Otro', state: 'active' }]);
    expect(people(audit)).toEqual([
      { user_id: 'u-marcos', name: 'Marcos Pérez', email: 'marcos@example.com', state: 'active' },
    ]);
    audit.close();
  });

  it('una persona que no conocía se suma con el nombre que trae la acción; sin nombre, queda sin él', () => {
    const audit = openAuditLog(inMemoryAudit);
    audit.record({
      type: 'sign-in.succeeded',
      at,
      actor: { kind: 'person', userId: 'u-first', name: 'Primera' },
      targets: [
        { kind: 'person', id: 'u-otra', name: 'Otra' },
        { kind: 'role', id: 'r-1', name: 'Vendedor' },
      ],
    });
    audit.record({ type: 'sign-out', at, actor: { kind: 'person', userId: 'u-nadie' } });
    expect(people(audit)).toEqual([
      { user_id: 'u-first', name: 'Primera', email: null, state: 'active' },
      { user_id: 'u-otra', name: 'Otra', email: null, state: 'active' },
    ]);
    expect(audit.read(2026)[1]?.actor).toEqual({ kind: 'person', userId: 'u-nadie' });
    audit.close();
  });

  it('audit-log-E30: al borrar a alguien, su correo desaparece y queda su nombre', () => {
    const audit = openAuditLog(inMemoryAudit);
    audit.record({
      type: 'user.deleted',
      at,
      actor: marcos,
      people: [
        { userId: 'u-camila', name: 'Camila', email: 'camila@example.com', state: 'deleted' },
      ],
    });
    expect(people(audit)).toContainEqual({
      user_id: 'u-camila',
      name: 'Camila',
      email: null,
      state: 'deleted',
    });
    audit.close();
  });

  it('nunca deja de anotar: corta los nombres, el correo y, si pesa de más, data y después changes', () => {
    const audit = openAuditLog(inMemoryAudit);
    const long = 'x'.repeat(300);
    audit.record({
      type: 'sign-in.rejected',
      at,
      actor: { kind: 'outsider', email: `${long}@example.com` },
      targets: [{ kind: 'person', id: 'u-1', name: long }],
    });
    audit.record({
      type: 'role.changed',
      at,
      actor: marcos,
      changes: { description: { before: 'a', after: 'b' } },
      data: { big: 'y'.repeat(9_000) },
    });
    audit.record({
      type: 'role.changed',
      at,
      actor: marcos,
      changes: { description: { before: 'z'.repeat(9_000), after: 'b' } },
    });
    const [rejected, lighter, lightest] = audit.read(2026);
    expect(rejected?.actor).toEqual({
      kind: 'outsider',
      email: `${long}@example.com`.slice(0, 254),
    });
    expect(rejected?.targets?.[0]?.name).toHaveLength(80);
    expect(lighter).toMatchObject({
      truncated: true,
      data: { big: '…' },
      changes: { description: { before: 'a', after: 'b' } },
    });
    expect(lightest).toMatchObject({
      truncated: true,
      changes: { description: { before: '…', after: '…' } },
    });
    audit.close();
  });
});
