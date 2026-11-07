import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createDeviceNames } from './device-names.ts';
import { createGuards } from './guards.ts';
import type { Platform } from './modules.ts';
import type { RequestSession } from './session.ts';
import type { AuditEvent } from './storage/audit/event.ts';

const session: RequestSession = {
  ...{ id: 's', userId: 'u', deviceId: 'd', deviceLabel: 'Chrome en Windows' },
  ...{ isPhone: false, confirmedAt: null },
};

// Una ruta que anota, con sesión o sin ella según el pedido.
function server() {
  const events: AuditEvent[] = [];
  const devices = createDeviceNames();
  devices.provide((deviceId) => (deviceId === 'd' ? 'Caja' : undefined));
  const platform = {
    audit: { record: (event: AuditEvent) => void events.push(event) },
    clock: { now: () => new Date(0) },
    devices,
  } as unknown as Platform;
  const guards = createGuards(platform, { topic: 'x', window: { max: 1, windowMs: 1000 } });
  const http = new Hono();
  http.use(async (c, next) => {
    c.set('ipAddress' as never, '1.2.3.4' as never);
    if (c.req.header('Cookie')) c.set('session' as never, session as never);
    await next();
  });
  http.post('/x', (c) => {
    guards.record(c, 'x.done');
    return c.body(null, 204);
  });
  return { http, events };
}

describe('lo que se anota del dispositivo', () => {
  it('device-settings-E52, E56: con sesión, el nombre de ese momento del dispositivo de la sesión; sin sesión, ninguno', async () => {
    const { http, events } = server();
    const agent = { 'User-Agent': 'Chrome/1 Windows' };
    await http.request('/x', { method: 'POST', headers: { ...agent, Cookie: 'a' } });
    await http.request('/x', { method: 'POST', headers: agent });
    expect(events.map((event) => event.device)).toEqual([
      { phone: false, browser: 'chrome', os: 'windows', name: 'Caja' },
      { phone: false, browser: 'chrome', os: 'windows' },
    ]);
  });
});
