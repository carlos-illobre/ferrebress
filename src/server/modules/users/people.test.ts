// Las rutas de Usuarios para las personas (02 · R1, R3, R4; diseño de 02, §§ 4 y 5), desde la
// aplicación: con la sesión de una persona que entró con Google.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../testing/sign-in/sign-in-server.ts';

const minutes = (n: number) => n * 60_000;

describe('las personas, desde Usuarios', () => {
  let server: SignInServer;
  let now = new Date('2026-10-31T09:00:00Z').getTime();
  const clock = { now: () => new Date(now) };
  let admin: ReturnType<typeof createDevice>;
  let adminId: string;

  beforeAll(async () => {
    server = await createSignInServer(clock);
    admin = createDevice(server);
    const entered = await admin.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    adminId = entered.body.person.userId;
  });
  afterAll(() => server.close());

  const list = async () => (await admin.request('/api/users')).body.people;
  const authorize = (email: string, name?: string) =>
    admin.request('/api/users', { email, ...(name !== undefined && { name }) });

  it('users-E08, E12: autorizar deja a la persona con «Todavía no entró» y se ve su correo', async () => {
    const authorized = await authorize('Juan@Example.com');
    expect(authorized).toMatchObject({
      status: 200,
      body: {
        person: {
          email: 'juan@example.com',
          name: null,
          displayName: 'juan@example.com',
          neverSignedIn: true,
          authorizedBy: adminId,
          active: true,
        },
      },
    });
    const juan = createDevice(server);
    const entered = await juan.signInWithGoogle({
      sub: 'sub-juan',
      email: 'juan@example.com',
      name: 'Juan Pérez',
    });
    expect(entered.status).toBe(200);
    const row = (await list()).find((p: { email: string }) => p.email === 'juan@example.com');
    expect(row).toMatchObject({ displayName: 'Juan Pérez', neverSignedIn: false, sessions: 1 });
  });

  it('users-E09, E10: un correo ya cargado o sin forma de correo no se guarda', async () => {
    expect(await authorize('JUAN@example.com')).toMatchObject({
      status: 409,
      body: { error: 'email-taken' },
    });
    expect((await authorize('esto no es un correo')).status).toBe(400);
  });

  it('users-E11, E06: el nombre escrito manda sobre el de Google; la propia dice «Vos»', async () => {
    await authorize('lucia@example.com', 'Lucía del mostrador');
    await createDevice(server).signInWithGoogle({
      sub: 'sub-lucia',
      email: 'lucia@example.com',
      name: 'Lucía Fernández',
    });
    const people = await list();
    expect(people.find((p: { email: string }) => p.email === 'lucia@example.com')).toMatchObject({
      displayName: 'Lucía del mostrador',
    });
    expect(people.find((p: { self: boolean }) => p.self)).toMatchObject({ id: adminId });
  });

  it('users-E13 a E16: el correo se cambia y se borra solo si nunca entró', async () => {
    const sofia = (await authorize('sofia@example.com')).body.person;
    const changed = await admin.request(`/api/users/${sofia.id}`, {
      version: sofia.version,
      email: 'sofia.nueva@example.com',
    });
    expect(changed.body.person).toMatchObject({ email: 'sofia.nueva@example.com', version: 2 });
    const juan = (await list()).find((p: { email: string }) => p.email === 'juan@example.com');
    expect(
      await admin.request(`/api/users/${juan.id}`, {
        version: juan.version,
        email: 'x@example.com',
      }),
    ).toMatchObject({ status: 409, body: { error: 'already-entered' } });
    expect(
      await admin.request(`/api/users/${juan.id}/delete`, { version: juan.version }),
    ).toMatchObject({ status: 409, body: { error: 'already-entered' } });
    const removed = await admin.request(`/api/users/${sofia.id}/delete`, { version: 2 });
    expect(removed.body).toEqual({ removed: true });
    const sofiaEnters = await createDevice(server).signInWithGoogle({
      sub: 'sub-sofia',
      email: 'sofia.nueva@example.com',
    });
    expect(sofiaEnters.status).toBe(403);
  });

  it('users-R3.5: borrar el nombre escrito vuelve al de Google', async () => {
    const lucia = (await list()).find((p: { email: string }) => p.email === 'lucia@example.com');
    const renamed = await admin.request(`/api/users/${lucia.id}`, {
      version: lucia.version,
      name: '  ',
    });
    expect(renamed.body.person).toMatchObject({ name: null, displayName: 'Lucía Fernández' });
  });

  it('users-E30: un cambio con una versión vieja no se guarda y trae cómo está ahora', async () => {
    const lucia = (await list()).find((p: { email: string }) => p.email === 'lucia@example.com');
    const stale = await admin.request(`/api/users/${lucia.id}`, {
      version: lucia.version - 1,
      name: 'Otra',
    });
    expect(stale).toMatchObject({
      status: 409,
      body: { error: 'changed', person: { version: lucia.version } },
    });
    expect(
      (
        await admin.request('/api/users/0192d3a4-0000-7000-8000-000000000000', {
          version: 1,
          name: 'x',
        })
      ).status,
    ).toBe(404);
  });

  it('users-E03, E17 a E19: la propia no; la baja saca de todo y el alta deja entrar otra vez', async () => {
    const own = await admin.request(`/api/users/${adminId}/deactivate`, { version: 1 });
    expect(own).toMatchObject({ status: 409, body: { error: 'self' } });
    const juan = (await list()).find((p: { email: string }) => p.email === 'juan@example.com');
    const done = await admin.request(`/api/users/${juan.id}/deactivate`, { version: juan.version });
    expect(done.body.person).toMatchObject({ active: false, deactivatedAt: now });
    expect(
      (await createDevice(server).signInWithGoogle({ sub: 'sub-juan', email: 'juan@example.com' }))
        .status,
    ).toBe(403);
    const back = await admin.request(`/api/users/${juan.id}/activate`, { version: 2 });
    expect(back.body.person).toMatchObject({ active: true, deactivatedAt: null });
    // Dar de alta a quien ya está dado de alta contesta cómo está, sin anotar nada.
    const lines = server.platform.audit.read(2026).length;
    expect((await admin.request(`/api/users/${juan.id}/activate`, { version: 3 })).status).toBe(
      200,
    );
    expect(server.platform.audit.read(2026)).toHaveLength(lines);
    expect(
      (await createDevice(server).signInWithGoogle({ sub: 'sub-juan', email: 'juan@example.com' }))
        .status,
    ).toBe(200);
  });

  it('users-E04: dar de alta la propia no; con una versión vieja trae cómo está; ya activa, queda igual', async () => {
    expect(await admin.request(`/api/users/${adminId}/activate`, { version: 1 })).toMatchObject({
      status: 409,
      body: { error: 'self' },
    });
    const lucia = (await list()).find((p: { email: string }) => p.email === 'lucia@example.com');
    expect(
      await admin.request(`/api/users/${lucia.id}/activate`, { version: lucia.version - 1 }),
    ).toMatchObject({
      status: 409,
      body: { error: 'changed', person: { version: lucia.version } },
    });
    expect(
      (await admin.request(`/api/users/${lucia.id}/activate`, { version: lucia.version })).body,
    ).toMatchObject({ person: { active: true, version: lucia.version } });
    expect(
      (
        await admin.request('/api/users/0192d3a4-0000-7000-8000-000000000000/activate', {
          version: 1,
        })
      ).status,
    ).toBe(404);
  });

  it('users-E33: autorizar y dar de alta piden Google o la huella de los últimos 5 minutos', async () => {
    now += minutes(6);
    expect(await authorize('tarde@example.com')).toMatchObject({
      status: 403,
      body: { error: 'confirm-first' },
    });
    const lucia = (await list()).find((p: { email: string }) => p.email === 'lucia@example.com');
    expect(
      (await admin.request(`/api/users/${lucia.id}/activate`, { version: lucia.version })).body,
    ).toEqual({ error: 'confirm-first' });
    const start = await admin.request('/api/start');
    const credential = await server.google.credential({
      nonce: start.body.googleNonce,
      sub: 'sub-admin',
      email: 'admin@example.com',
    });
    expect((await admin.request('/api/session/confirm/google', { credential })).body).toEqual({
      ok: true,
    });
    expect((await authorize('tarde@example.com')).status).toBe(200);
  });

  it('users-R6.1: cada cambio y cada rechazo quedan en la auditoría, con quién y a quién', () => {
    const lines = server.platform.audit.read(2026);
    const types = lines.map((line) => line.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'user.authorized',
        'user.email-changed',
        'user.renamed',
        'user.deleted',
        'user.deactivated',
        'user.activated',
        'users.rejected',
      ]),
    );
    expect(lines.find((line) => line.type === 'user.deactivated')).toMatchObject({
      userId: adminId,
      data: { targetUserId: expect.any(String) },
    });
  });
});
