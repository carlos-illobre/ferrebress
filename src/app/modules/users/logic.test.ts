import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { describe, expect, it, vi } from 'vitest';
import { counts, dateOf, initialsOf, ordered, sinceOf, visible } from './logic.ts';

const person = (fields: Partial<PersonRow>): PersonRow => ({
  id: fields.displayName ?? 'x',
  name: null,
  displayName: 'x',
  email: 'x@example.com',
  active: true,
  self: false,
  authorizedAt: 0,
  authorizedBy: null,
  deactivatedAt: null,
  lastSignInAt: 1,
  neverSignedIn: false,
  version: 1,
  sessions: 0,
  phones: 0,
  ...fields,
});

const people = [
  person({ displayName: 'Zulema', active: false, sessions: 0 }),
  person({ displayName: 'Lucía Fernández', email: 'lucia@example.com', sessions: 2, phones: 1 }),
  person({ displayName: 'Rubén', self: true, sessions: 1 }),
  person({ displayName: 'nuevo@example.com', email: 'nuevo@example.com', neverSignedIn: true }),
  person({ displayName: 'Ana', active: false }),
];

describe('la lista de Usuarios', () => {
  it('users-E06: primero la propia, después las activas y al final las de baja, por nombre', () => {
    expect(ordered(people).map((p) => p.displayName)).toEqual([
      'Rubén',
      'Lucía Fernández',
      'nuevo@example.com',
      'Ana',
      'Zulema',
    ]);
  });

  it('el buscador, sin mayúsculas ni tildes y también por correo; y los filtros', () => {
    expect(visible(people, 'all', ' LUCIA ').map((p) => p.displayName)).toEqual([
      'Lucía Fernández',
    ]);
    expect(visible(people, 'all', 'nuevo@').length).toBe(1);
    expect(visible(people, 'active', '').length).toBe(3);
    expect(visible(people, 'never', '').map((p) => p.email)).toEqual(['nuevo@example.com']);
    expect(visible(people, 'off', '').map((p) => p.displayName)).toEqual(['Ana', 'Zulema']);
  });

  it('las cuentas, de las activas', () => {
    expect(counts(people)).toEqual({
      all: 5,
      active: 3,
      never: 1,
      off: 2,
      sessions: 3,
      phones: 1,
    });
  });

  it('las iniciales, del nombre o del correo', () => {
    expect(initialsOf(person({ displayName: 'Graciela Benítez' }))).toBe('GB');
    expect(initialsOf(person({ displayName: 'ana', email: 'ana' }))).toBe('AN');
  });
});

describe('cuándo pasó (users-R3.2)', () => {
  const now = new Date(2026, 9, 31, 10, 30).getTime();
  const at = (y: number, m: number, d: number, h = 0, min = 0) =>
    new Date(y, m, d, h, min).getTime();
  it('users-E07: de recién a una fecha', () => {
    expect(sinceOf(now - 20_000, now)).toBe('recién');
    expect(sinceOf(now - 5 * 60_000, now)).toBe('hace 5 min');
    expect(sinceOf(now - 60 * 60_000, now)).toBe('hace 1 hora');
    expect(sinceOf(now - 2 * 60 * 60_000, now)).toBe('hace 2 horas');
    expect(sinceOf(at(2026, 9, 31, 1, 5), now)).toBe('hoy 1:05');
    expect(sinceOf(at(2026, 9, 30, 8, 2), now)).toBe('ayer 8:02');
    expect(sinceOf(at(2026, 9, 28, 9), now)).toBe('hace 3 días');
    expect(sinceOf(at(2026, 9, 12, 9), now)).toBe('el 12/10');
    expect(dateOf(at(2025, 7, 3), now)).toBe('03/08/2025');
  });
});

describe('la hora de ahora', () => {
  it('antes de que conteste el servidor, la del dispositivo', async () => {
    vi.resetModules();
    vi.doMock('../../platform/server/clock.ts', () => ({ serverNow: () => undefined }));
    const { nowMs } = await import('./logic.ts');
    expect(Math.abs(nowMs() - Date.now())).toBeLessThan(1000);
    vi.doUnmock('../../platform/server/clock.ts');
  });
});
