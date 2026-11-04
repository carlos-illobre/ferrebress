import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createSessionGate, sessionOf } from './session.ts';

describe('la sesión del pedido', () => {
  it('la deja en el pedido, o contesta lo que contestó quien la resuelve', async () => {
    const gate = createSessionGate();
    const http = new Hono();
    http.get('/x', gate.require, (c) => c.json(sessionOf(c)));
    await expect(http.request('/x')).resolves.toMatchObject({ status: 500 });
    const session = {
      id: 's',
      userId: 'u',
      deviceId: 'd',
      deviceLabel: 'Chrome en Windows',
      isPhone: false,
      confirmedAt: null,
    };
    gate.provide(async (c) =>
      c.req.header('Cookie') ? session : c.json({ error: 'session-closed' }, 401),
    );
    expect((await http.request('/x')).status).toBe(401);
    const open = await http.request('/x', { headers: { Cookie: 'a' } });
    expect(await open.json()).toEqual(session);
  });

  it('identifica sin contestar nada, avisa el fin de una sesión y dice si sigue abierta', async () => {
    const gate = createSessionGate();
    const session = {
      id: 's',
      userId: 'u',
      deviceId: 'd',
      deviceLabel: 'Chrome en Windows',
      isPhone: false,
      confirmedAt: null,
    };
    gate.provide(async (c) =>
      c.req.header('Cookie') ? session : c.json({ error: 'session-closed' }, 401),
    );
    expect(gate.isOpen('s')).toBe(true);
    const http = new Hono();
    http.get('/x', async (c) => c.json({ session: (await gate.identify(c)) ?? null }));
    expect(await (await http.request('/x')).json()).toEqual({ session: null });
    expect(await (await http.request('/x', { headers: { Cookie: 'a' } })).json()).toEqual({
      session,
    });
    const ended: string[] = [];
    gate.onEnded((s, reason) => ended.push(`${s.id}:${reason}`));
    gate.ended({ id: 's', userId: 'u' }, 'revoked');
    expect(ended).toEqual(['s:revoked']);
    gate.provide(
      async () => session,
      (id) => id !== 's',
    );
    expect(gate.isOpen('s')).toBe(false);
  });
});
