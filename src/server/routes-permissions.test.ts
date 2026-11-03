// Cerrado por defecto (diseño de 02, § 21): cada ruta de /api dice qué pide, su permiso o solo la
// sesión, o que es pública (entrar, la salud del servidor). Esta prueba recorre las rutas que tiene
// Hono: una ruta nueva que no está en la tabla no pasa. Y cada una se pide sin lo que pide: sin la
// sesión, 401; sin el permiso, 403 con el que falta, y la sesión sigue (02 · R7.6).
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDevice } from './testing/sign-in/sign-in-server.ts';
import { createRolesKit, type RolesKit } from './testing/users/roles-kit.ts';

type Needs = 'public' | 'session' | PermissionId;

const routes: Record<string, Needs> = {
  'GET /api/health': 'public',
  'GET /api/start': 'public',
  'GET /api/sign-in/google/nonce': 'public',
  'POST /api/sign-in/google': 'public',
  'POST /api/sign-in/passkey/options': 'public',
  'POST /api/sign-in/passkey': 'public',
  'POST /api/sign-in/offline': 'public',
  'POST /api/sign-in/codes': 'public',
  'GET /api/realtime/sign-in-codes': 'public',
  'POST /api/sign-in/codes/claim': 'public',
  'POST /api/sign-in/codes/cancel': 'public',
  'POST /api/sign-out': 'public',
  // Leer un código no pide sesión (el celular puede no tenerla); aprobarlo, la huella.
  'POST /api/sign-in/codes/read': 'public',
  'POST /api/sign-in/codes/approve': 'public',
  'POST /api/passkeys/options': 'session',
  'POST /api/passkeys': 'session',
  'POST /api/session/confirm/google': 'session',
  'POST /api/session/confirm/passkey/options': 'session',
  'POST /api/session/confirm/passkey': 'session',
  'GET /api/permissions/:permission/holders': 'session',
  'GET /api/users': 'users.view',
  'GET /api/users/:id/access': 'users.view',
  'POST /api/users': 'users.manage',
  'POST /api/users/:id': 'users.manage',
  'POST /api/users/:id/delete': 'users.manage',
  'POST /api/users/:id/deactivate': 'users.manage',
  'POST /api/users/:id/activate': 'users.manage',
  'POST /api/users/:id/sessions/:sessionId/close': 'users.cut',
  'POST /api/users/:id/sessions/close': 'users.cut',
  'POST /api/users/:id/phones/:phoneId/cut': 'users.cut',
  'GET /api/lost-phones': 'users.cut',
  'GET /api/roles': 'roles.manage',
  'POST /api/roles': 'roles.manage',
  'POST /api/roles/:id': 'roles.manage',
  'POST /api/roles/:id/delete': 'roles.manage',
  'POST /api/users/:id/roles': 'roles.manage',
  'GET /api/audit-log': 'audit-log.view',
  'GET /api/audit-log/people': 'audit-log.view',
  'GET /api/audit-log/day': 'audit-log.view',
};

const anyId = '00000000-0000-7000-8000-000000000999';
const pathOf = (route: string) =>
  (route.split(' ')[1] as string).replace(':permission', 'users.view').replace(/:\w+/g, anyId);

describe('lo que pide cada ruta de /api', () => {
  let kit: RolesKit;
  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  it('cada ruta registrada dice lo que pide', () => {
    const registered = new Set(
      (kit.server.http.routes as { method: string; path: string }[])
        // Los pasos de todas las rutas (`/api/*`) no son rutas; una ruta para todos los métodos, sí.
        .filter((route) => route.path.startsWith('/api/') && !route.path.endsWith('*'))
        .map((route) => `${route.method} ${route.path}`),
    );
    expect([...registered].sort()).toEqual(Object.keys(routes).sort());
  });

  it('sin la sesión, 401', async () => {
    const stranger = createDevice(kit.server);
    for (const [route, needs] of Object.entries(routes)) {
      if (needs === 'public') continue;
      const method = route.split(' ')[0];
      const reply = await stranger.request(pathOf(route), method === 'POST' ? {} : undefined);
      expect([route, reply.status]).toEqual([route, 401]);
    }
  });

  it('users-E47: sin el permiso, 403 con el que falta, y la sesión sigue', async () => {
    const nobody = await kit.person([await kit.role('Sin Usuarios', ['offline.work'])]);
    for (const [route, needs] of Object.entries(routes)) {
      if (needs === 'public' || needs === 'session') continue;
      const method = route.split(' ')[0];
      const reply = await nobody.device.request(pathOf(route), method === 'POST' ? {} : undefined);
      expect([route, reply.status, reply.body]).toEqual([
        route,
        403,
        { error: 'forbidden', permission: needs },
      ]);
    }
    expect((await nobody.device.request('/api/start')).body.person.userId).toBe(nobody.id);
  });
});
