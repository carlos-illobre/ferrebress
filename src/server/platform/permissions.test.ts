import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { permissionsHash } from '../../shared/contracts/can.ts';
import { createRateLimiter } from './limits/rate-limit.ts';
import { createPermissionGate, permissionsHashOf, permissionsOf } from './permissions.ts';
import { createSessionGate } from './session.ts';
import type { AuditEvent } from './storage/audit/write.ts';

function setUp(granted: Record<string, string[]>) {
  const clock = { now: () => new Date('2026-10-28T12:00:00Z') };
  const recorded: AuditEvent[] = [];
  const audit = {
    record: (event: AuditEvent) => void recorded.push(event),
    read: () => [],
    close() {},
  };
  const sessions = createSessionGate();
  sessions.provide(async (c) => {
    const userId = c.req.header('X-User');
    return userId
      ? {
          id: 's',
          userId,
          deviceId: 'd',
          deviceLabel: 'Chrome en Windows',
          isPhone: false,
          confirmedAt: null,
        }
      : c.json({ error: 'session-closed' }, 401);
  });
  const gate = createPermissionGate({ audit, clock, limiter: createRateLimiter(clock) }, sessions);
  let asked = 0;
  gate.provide(async (userId) => {
    asked++;
    return granted[userId] ?? [];
  });
  const http = new Hono();
  http.get('/ver', sessions.require, gate.require('users.view'), (c) =>
    c.json({ ok: true, hash: permissionsHashOf(c) }),
  );
  http.get('/solo-sesion', sessions.require, (c) => c.json({ hash: permissionsHashOf(c) }));
  return { http, gate, recorded, asked: () => asked };
}

const as = (userId: string) => ({ headers: { 'X-User': userId } });

describe('el paso de permisos (02 · R7.6)', () => {
  it('deja pasar a quien tiene el permiso y deja su huella para la cabecera', async () => {
    const { http } = setUp({ ana: ['users.view', 'roles.manage'] });
    const response = await http.request('/ver', as('ana'));
    expect(await response.json()).toEqual({
      ok: true,
      hash: permissionsHash(['users.view', 'roles.manage']),
    });
  });

  it('sin el permiso: 403 con el permiso que falta, sin cerrar la sesión, y lo anota una vez por minuto', async () => {
    const { http, recorded } = setUp({ beto: ['offline.work'] });
    const response = await http.request('/ver', as('beto'));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'forbidden', permission: 'users.view' });
    await http.request('/ver', as('beto'));
    expect(recorded.map((event) => event.type)).toEqual(['permission.denied']);
    expect(recorded[0]).toMatchObject({
      actor: { kind: 'person', userId: 'beto' },
      data: { permission: 'users.view' },
    });
  });

  it('una ruta que solo pide sesión también deja la huella; se pregunta una vez por pedido', async () => {
    const { http, asked } = setUp({ ana: ['users.view'] });
    const response = await http.request('/solo-sesion', as('ana'));
    expect(await response.json()).toEqual({ hash: permissionsHash(['users.view']) });
    await http.request('/ver', as('ana'));
    expect(asked()).toBe(2);
  });

  it('dice los permisos de una persona fuera de un pedido (un tema del canal)', async () => {
    const { gate } = setUp({ ana: ['audit-log.view'] });
    expect(await gate.of('ana')).toEqual(['audit-log.view']);
    expect(await gate.of('beto')).toEqual([]);
  });

  it('sin sesión no hay permisos ni huella', async () => {
    const http = new Hono();
    http.get('/x', (c) =>
      c.json({ granted: permissionsOf(c), hash: permissionsHashOf(c) ?? null }),
    );
    expect(await (await http.request('/x')).json()).toEqual({ granted: [], hash: null });
  });

  it('sin quien dé los permisos, falla en vez de dejar pasar', async () => {
    const clock = { now: () => new Date() };
    const sessions = createSessionGate();
    sessions.provide(async () => ({
      id: 's',
      userId: 'u',
      deviceId: 'd',
      deviceLabel: 'Chrome en Windows',
      isPhone: false,
      confirmedAt: null,
    }));
    const audit = { record() {}, read: () => [], close() {} };
    const gate = createPermissionGate(
      { audit, clock, limiter: createRateLimiter(clock) },
      sessions,
    );
    const http = new Hono();
    http.get('/x', sessions.require, gate.require('users.view'), (c) => c.json({}));
    expect((await http.request('/x')).status).toBe(500);
  });
});
