// El traspaso a los roles (02 · R7.10, E53): las personas que ya estaban quedan con el rol
// Administrador, también las dadas de baja (R4.3); hay un solo rol del sistema.
import { type Kysely, sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inMemoryUrl, migrate, openDatabase } from '../../../platform/storage/db.ts';
import { createUsers } from './001-users.ts';
import { addPeople } from './002-people.ts';
import { addRoles } from './003-roles.ts';

describe('el traspaso a los roles', () => {
  let db: Kysely<unknown>;
  beforeAll(async () => {
    db = await openDatabase(inMemoryUrl);
    await migrate(db, [
      { schema: 'users', migrations: { '001-users': createUsers, '002-people': addPeople } },
    ]);
    await sql`insert into users.users (id, email, active) values
      ('00000000-0000-7000-8000-000000000001', 'ana@example.com', true),
      ('00000000-0000-7000-8000-000000000002', 'baja@example.com', false)`.execute(db);
    await migrate(db, [
      {
        schema: 'users',
        migrations: { '001-users': createUsers, '002-people': addPeople, '003-roles': addRoles },
      },
    ]);
  });
  afterAll(() => db.destroy());

  it('users-E53: quienes ya estaban quedan con el Administrador, también los dados de baja', async () => {
    const { rows } = await sql<{ email: string; name: string; system: boolean }>`
      select u.email, r.name, r.system from users.user_roles ur
      join users.users u on u.id = ur.user_id join users.roles r on r.id = ur.role_id
      order by u.email`.execute(db);
    expect(rows).toEqual([
      { email: 'ana@example.com', name: 'Administrador', system: true },
      { email: 'baja@example.com', name: 'Administrador', system: true },
    ]);
  });

  it('hay un solo rol del sistema', async () => {
    const twice = sql`insert into users.roles (id, name, system)
      values (gen_random_uuid(), 'Otro', true)`.execute(db);
    await expect(twice).rejects.toThrow();
  });
});
