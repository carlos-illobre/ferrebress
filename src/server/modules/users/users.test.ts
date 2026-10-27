import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from '../../app.ts';
import { testConfig } from '../../testing/config.ts';
import { createUsersModule, type Users } from './index.ts';

describe('las personas', () => {
  let server: Awaited<ReturnType<typeof createServer>>;
  let users: Users;
  const deactivated: string[] = [];

  beforeAll(async () => {
    const created = createUsersModule();
    users = created.users;
    server = await createServer({ ...testConfig, INITIAL_ADMIN_EMAIL: ' Admin@Example.com ' }, [
      created.module,
    ]);
    server.platform.events.on('user.deactivated', async ({ userId }) => {
      deactivated.push(userId);
    });
    await sql`insert into users.users (id, email, google_subject, active) values
      ('00000000-0000-7000-8000-000000000001', 'juan@example.com', 'sub-juan-viejo', true),
      ('00000000-0000-7000-8000-000000000002', 'baja@example.com', null, false)`.execute(
      server.platform.db,
    );
  });
  afterAll(() => server.close());

  it('el primer Administrador sale del .env, con el correo en minúsculas, una sola vez', async () => {
    const admin = await users.matchGoogle('sub-admin', 'admin@example.com', 'Ana');
    expect(admin).toMatchObject({
      kind: 'found',
      user: { email: 'admin@example.com' },
      link: true,
    });
    const again = await users.matchGoogle('sub-admin', 'ADMIN@example.com', 'Ana');
    expect(again).toMatchObject({ kind: 'found', link: false });
  });

  it('la primera vez guarda el identificador de Google y el nombre', async () => {
    const match = await users.matchGoogle('sub-admin', 'otro-correo@example.com', 'Ana');
    expect(match).toMatchObject({
      kind: 'found',
      user: { googleSubject: 'sub-admin', name: 'Ana' },
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

  it('dar de baja avisa una sola vez a quien escucha', async () => {
    await users.deactivate('00000000-0000-7000-8000-000000000001');
    await users.deactivate('00000000-0000-7000-8000-000000000001');
    expect(deactivated).toEqual(['00000000-0000-7000-8000-000000000001']);
    expect(await users.findById('00000000-0000-7000-8000-000000000001')).toMatchObject({
      active: false,
    });
  });
});
