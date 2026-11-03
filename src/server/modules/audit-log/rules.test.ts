import { describe, expect, it } from 'vitest';
import { dayCount, stripOf, viewOf } from './rules.ts';

const at = new Date('2026-11-04T13:26:00Z');

describe('cómo se muestra una acción', () => {
  it('audit-log-E09, R2.6: con las dos horas, el dispositivo, la dirección y si se cortó', () => {
    const view = viewOf(
      {
        id: '2026:1',
        type: 'sign-in.offline-rejected',
        at,
        tone: 'amber',
        actor: { kind: 'outsider', email: 'x@example.com' },
        device: { phone: true, os: 'android' },
        ipAddress: '190.0.0.1',
        arrivedAt: at,
        deviceTime: new Date('2026-11-04T12:40:00Z'),
        truncated: true,
      },
      new Map(),
    );
    expect(view).toMatchObject({
      actor: { kind: 'outsider', email: 'x@example.com' },
      targets: [],
      changes: {},
      device: { phone: true, os: 'android' },
      ipAddress: '190.0.0.1',
      arrivedAt: at.toISOString(),
      deviceTime: '2026-11-04T12:40:00.000Z',
      truncated: true,
    });
  });

  it('audit-log-E07: «(hoy: …)» solo si cambió; sin nombre de ese momento, el de hoy', () => {
    const names = new Map([['u1', 'Ana Gómez']]);
    const base = { id: '2026:1', type: 'sign-out', at, tone: 'plain' as const };
    expect(
      viewOf({ ...base, actor: { kind: 'person', userId: 'u1', name: 'Ana' } }, names).actor,
    ).toEqual({
      kind: 'person',
      id: 'u1',
      name: 'Ana',
      today: 'Ana Gómez',
    });
    expect(viewOf({ ...base, actor: { kind: 'person', userId: 'u1' } }, names).actor).toEqual({
      kind: 'person',
      id: 'u1',
      today: 'Ana Gómez',
    });
    expect(
      viewOf({ ...base, actor: { kind: 'person', userId: 'u2', name: 'Beto' } }, names).actor,
    ).toEqual({
      kind: 'person',
      id: 'u2',
      name: 'Beto',
    });
  });

  it('las cuentas de un día y la tira', () => {
    expect(dayCount('2026-11-04', {})).toEqual({ date: '2026-11-04', total: 0, amber: 0, red: 0 });
    expect(stripOf([{ id: '2026:1', at: 61_000, tone: 'red' }], 1_000)).toEqual([
      { id: '2026:1', at: 60, tone: 'red' },
    ]);
  });
});
