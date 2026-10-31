// Saber que cambiaron los permisos (02 · R7.8): con otra huella en la cabecera, se vuelve a pedir la
// persona una vez por huella, y queda al día.
import { permissionsHash as hashOf } from '@ferrebress/shared/contracts/can';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { permissionsHash } from '../../platform/server/api.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { administrator } from '../../testing/person.ts';
import { watchPermissions } from './permissions-watch.ts';
import { person } from './session.ts';

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', ...administrator };
const fewer = { ...ana, permissions: ['offline.work' as const], rolesChangedBy: 'Rubén' };
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('los permisos que cambian', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    permissionsHash.set(undefined);
    person.set(undefined);
  });

  it('users-E48: con otra huella vuelve a pedir la persona, una vez por huella; con la misma, no', async () => {
    person.set(ana);
    const server = fakeServer({ '/api/start': [{ body: { person: fewer } }, { body: {} }] });
    const stop = watchPermissions();
    permissionsHash.set(hashOf(ana.permissions));
    await settle();
    expect(server.sent).toEqual([]);
    permissionsHash.set('00000000');
    await settle();
    expect(person.get()?.permissions).toEqual(['offline.work']);
    permissionsHash.set(hashOf(['offline.work']));
    permissionsHash.set('00000000');
    await settle();
    expect(server.sent).toHaveLength(1);
    permissionsHash.set('11111111');
    await settle();
    expect(server.sent).toHaveLength(2);
    expect(person.get()?.userId).toBe('u1');
    stop();
  });

  it('sin conexión, la persona sigue como estaba', async () => {
    person.set(ana);
    fakeServer({ '/api/start': 'offline' });
    const stop = watchPermissions();
    permissionsHash.set('33333333');
    await settle();
    expect(person.get()).toEqual(ana);
    stop();
  });

  it('sin sesión no pide nada', async () => {
    const server = fakeServer({});
    const stop = watchPermissions();
    permissionsHash.set('22222222');
    await settle();
    expect(server.sent).toEqual([]);
    stop();
  });
});
