import { describe, expect, it } from 'vitest';
import { peopleNow, personChanges } from './audit.ts';
import type { User } from './rules.ts';

const user = (fields: Partial<User>): User =>
  ({
    id: 'u1',
    email: 'ana@example.com',
    name: 'Ana',
    googleName: null,
    active: true,
    ...fields,
  }) as User;

describe('cómo anota Usuarios', () => {
  it('audit-log-E30: las personas de hoy, con su estado', () => {
    expect(
      peopleNow([user({}), user({ id: 'u2', name: null, googleName: 'Beto', active: false })]),
    ).toEqual([
      { userId: 'u1', name: 'Ana', email: 'ana@example.com', state: 'active' },
      { userId: 'u2', name: 'Beto', email: 'ana@example.com', state: 'deactivated' },
    ]);
  });

  it('audit-log-E06: solo lo que cambió', () => {
    expect(personChanges(user({}), user({ name: 'Ana Gómez' }))).toEqual({
      name: { before: 'Ana', after: 'Ana Gómez' },
    });
    expect(personChanges(user({}), user({}))).toEqual({});
  });
});
