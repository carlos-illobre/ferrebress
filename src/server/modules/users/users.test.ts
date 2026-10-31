import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from '../../app.ts';
import { testConfig } from '../../testing/config.ts';
import { addFirstAdministrator } from './first.ts';
import { createUsersModule, type Users } from './index.ts';
import type { People } from './people.ts';

describe('las personas', () => {
  let server: Awaited<ReturnType<typeof createServer>>;
  let users: Users;
  let people: People;
  const deactivated: string[] = [];

  beforeAll(async () => {
    const created = createUsersModule({ accessCounts: async () => new Map() });
    users = created.users;
    server = await createServer(testConfig, [created.module]);
    people = created.people();
    expect(
      await addFirstAdministrator(server.platform.db, server.platform.clock, ' Admin@Example.com '),
    ).toBe(true);
    server.platform.events.on('user.deactivated', async ({ userId }) => {
      deactivated.push(userId);
      return undefined;
    });
    await sql`insert into users.users (id, email, google_subject, active) values
      ('00000000-0000-7000-8000-000000000001', 'juan@example.com', 'sub-juan-viejo', true),
      ('00000000-0000-7000-8000-000000000002', 'baja@example.com', null, false)`.execute(
      server.platform.db,
    );
  });
  afterAll(() => server.close());

  it('users-E01, E02: el primer Administrador se carga una sola vez, con el correo en minúsculas', async () => {
    const { clock, db } = server.platform;
    expect(await addFirstAdministrator(db, clock, 'otra@example.com')).toBe(false);
    const admin = await users.matchGoogle('sub-admin', 'admin@example.com', 'Ana');
    expect(admin).toMatchObject({
      kind: 'found',
      user: { email: 'admin@example.com' },
      link: true,
    });
    const again = await users.matchGoogle('sub-admin', 'ADMIN@example.com', 'Ana');
    expect(again).toMatchObject({ kind: 'found', link: false });
  });

  it('la primera vez guarda el identificador de Google y el nombre de Google, aparte (users-R3.4)', async () => {
    const match = await users.matchGoogle('sub-admin', 'otro-correo@example.com', 'Ana');
    expect(match).toMatchObject({
      kind: 'found',
      user: { googleSubject: 'sub-admin', googleName: 'Ana', name: null },
    });
  });

  it('un correo reasignado por Google a otra persona no entra (revisión de seguridad, punto 3)', async () => {
    const match = await users.matchGoogle('sub-otra-persona', 'juan@example.com', 'Otro');
    expect(match).toMatchObject({ kind: 'not-authorized', reason: 'other-subject' });
    expect(await users.findById('00000000-0000-7000-8000-000000000001')).toMatchObject({
      googleSubject: 'sub-juan-viejo',
    });
  });

  it('una cuenta que no está autorizada, o dada de baja, no entra', async () => {
    expect(await users.matchGoogle('sub-x', 'nadie@example.com', 'X')).toEqual({
      kind: 'not-authorized',
      reason: 'unknown',
    });
    expect(await users.matchGoogle('sub-y', 'baja@example.com', 'Y')).toMatchObject({
      kind: 'not-authorized',
      reason: 'inactive',
    });
  });

  it('users-E03, E04: nadie se da de baja a sí mismo y nunca queda nadie activo', async () => {
    const admin = (await users.matchGoogle('sub-admin', 'admin@example.com', 'Ana')) as {
      user: { id: string; version: number };
    };
    const juan = '00000000-0000-7000-8000-000000000001';
    expect(await people.deactivate(admin.user.id, admin.user.id, 1)).toEqual({ refused: 'self' });
    const done = await people.deactivate(admin.user.id, juan, 1);
    expect(done).toMatchObject({ user: { active: false, version: 2 } });
    expect(deactivated).toEqual([juan]);
    // Otra vez con la misma versión: ya no coincide.
    expect(await people.deactivate(admin.user.id, juan, 1)).toMatchObject({ refused: 'changed' });
    // Con la versión nueva y ya dada de baja: queda como está, sin avisar de nuevo.
    expect(await people.deactivate(admin.user.id, juan, 2)).toMatchObject({
      user: { active: false },
    });
    expect(deactivated).toEqual([juan]);
    // La única activa es la propia: nadie la puede dar de baja, ni siquiera otro que ya no está.
    expect(await people.deactivate(juan, admin.user.id, admin.user.version)).toEqual({
      refused: 'last-administrator',
    });
  });

  it('dos primeras entradas con Google a la vez: una ata la cuenta y la otra no entra (02, § 5)', async () => {
    await people.authorize('00000000-0000-7000-8000-000000000001', 'doble@example.com');
    const both = await Promise.all([
      users.matchGoogle('sub-doble', 'doble@example.com', 'Uno'),
      users.matchGoogle('sub-doble-2', 'doble@example.com', 'Dos'),
    ]);
    expect(both.map((match) => match.kind).sort()).toEqual(['found', 'not-authorized']);
  });
});

describe('la persona de las pruebas de punta a punta', () => {
  it('con E2E_FIRST_ADMIN_EMAIL, el arranque la carga con la misma regla que el comando', async () => {
    const created = createUsersModule({ accessCounts: async () => new Map() });
    const config = { ...testConfig, E2E_FIRST_ADMIN_EMAIL: 'e2e@example.com' };
    const server = await createServer(config, [created.module]);
    const rows = await sql<{ email: string }>`select email from users.users`.execute(
      server.platform.db,
    );
    expect(rows.rows).toEqual([{ email: 'e2e@example.com' }]);
    await server.close();
  });
});
