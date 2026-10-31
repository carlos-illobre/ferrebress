// Cambiar el correo (02 · R3.6, R3.8) y los identificadores de la dirección (diseño de 02, § 9).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../testing/sign-in/sign-in-server.ts';

const minutes = (n: number) => n * 60_000;

describe('cambiar el correo, desde Usuarios', () => {
  let server: SignInServer;
  let now = new Date('2026-10-31T09:00:00Z').getTime();
  const clock = { now: () => new Date(now) };
  let admin: ReturnType<typeof createDevice>;
  let _adminId: string;

  beforeAll(async () => {
    server = await createSignInServer(clock);
    admin = createDevice(server);
    const entered = await admin.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    _adminId = entered.body.person.userId;
  });
  afterAll(() => server.close());

  const _list = async () => (await admin.request('/api/users')).body.people;
  const authorize = (email: string, name?: string) =>
    admin.request('/api/users', { email, ...(name !== undefined && { name }) });

  it('users-R3.6, R3.8: cambiar solo el correo no toca el nombre y pide confirmar; sin nada, 400', async () => {
    const ana = (await authorize('ana@example.com', 'Ana del mostrador')).body.person;
    const changed = await admin.request(`/api/users/${ana.id}`, {
      version: ana.version,
      email: 'ana2@example.com',
    });
    expect(changed.body.person).toMatchObject({
      email: 'ana2@example.com',
      name: 'Ana del mostrador',
    });
    expect((await admin.request(`/api/users/${ana.id}`, { version: 2 })).status).toBe(400);
    // Los dos a la vez, también.
    const both = await admin.request(`/api/users/${ana.id}`, {
      version: 2,
      email: 'ana2@example.com',
      name: 'Ana',
    });
    expect(both.body.person).toMatchObject({ name: 'Ana', version: 3 });
    now += minutes(6);
    expect(
      await admin.request(`/api/users/${ana.id}`, { version: 3, email: 'ana3@example.com' }),
    ).toMatchObject({ status: 403, body: { error: 'confirm-first' } });
    // El nombre se cambia igual: no da acceso a nadie.
    expect((await admin.request(`/api/users/${ana.id}`, { version: 3, name: 'Ana' })).status).toBe(
      200,
    );
    now -= minutes(6);
  });

  it('un identificador que no tiene forma de UUID no existe', async () => {
    expect((await admin.request('/api/users/no-es-uuid/delete', { version: 1 })).status).toBe(404);
    expect((await admin.request('/api/users/no-es-uuid', { version: 1, name: 'x' })).status).toBe(
      404,
    );
  });
});
