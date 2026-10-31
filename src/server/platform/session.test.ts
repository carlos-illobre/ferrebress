import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createSessionGate, sessionOf } from './session.ts';

describe('la sesión del pedido', () => {
  it('la deja en el pedido, o contesta lo que contestó quien la resuelve', async () => {
    const gate = createSessionGate();
    const http = new Hono();
    http.get('/x', gate.require, (c) => c.json(sessionOf(c)));
    await expect(http.request('/x')).resolves.toMatchObject({ status: 500 });
    const session = { id: 's', userId: 'u', deviceId: 'd', confirmedAt: null };
    gate.provide(async (c) =>
      c.req.header('Cookie') ? session : c.json({ error: 'session-closed' }, 401),
    );
    expect((await http.request('/x')).status).toBe(401);
    const open = await http.request('/x', { headers: { Cookie: 'a' } });
    expect(await open.json()).toEqual(session);
  });
});
