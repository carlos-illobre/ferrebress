import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, environment, newVersion, online, sessionClosed, updateRequired } from './api.ts';
import { serverNow } from './clock.ts';

const serverHeader = (version = 'app-test') => ({
  'X-Ferrebress': `v=${version}; t=1793102400000; e=testing`,
});

function answer(status: number, body: unknown, headers: Record<string, string> = serverHeader()) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status, headers }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('hablar con el servidor', () => {
  beforeEach(() => {
    for (const store of [newVersion, updateRequired]) store.set(false);
    sessionClosed.set(undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('manda la versión del contrato y el dispositivo, y un cuerpo como JSON', async () => {
    const fetch = answer(200, { ok: true });
    expect(await api('/api/sign-out', {})).toEqual({ ok: true, data: { ok: true } });
    const [path, init] = fetch.mock.calls[0] as unknown as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(path).toBe('/api/sign-out');
    expect(init).toMatchObject({
      method: 'POST',
      body: '{}',
      headers: { 'X-App-Version': '1', 'Content-Type': 'application/json' },
    });
    expect(init.headers['X-Device-Id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('lee la hora y el ambiente del servidor, y si hay una versión nueva', async () => {
    answer(200, {});
    await api('/api/start');
    expect(serverNow()?.getUTCFullYear()).toBe(2026);
    expect(environment.get()).toBe('testing');
    expect(newVersion.get()).toBe(false);
    answer(200, {}, serverHeader('otra'));
    await api('/api/start');
    expect(newVersion.get()).toBe(true);
    answer(200, {}, {});
    await api('/api/start');
  });

  it('app-E24 y E26: sin conexión lo dice, y con la próxima respuesta vuelve', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    expect(await api('/api/start')).toEqual({ ok: false, error: 'offline' });
    expect(online.get()).toBe(false);
    answer(200, {});
    await api('/api/start');
    expect(online.get()).toBe(true);
    dispatchEvent(new Event('offline'));
    expect(online.get()).toBe(false);
    dispatchEvent(new Event('online'));
    expect(online.get()).toBe(true);
  });

  it('traduce los errores, y avisa una sesión cerrada o una versión que ya no sirve', async () => {
    answer(403, { error: 'not-authorized', email: 'a@b.com' });
    expect(await api('/api/sign-in/google', {})).toEqual({
      ok: false,
      error: 'not-authorized',
      email: 'a@b.com',
    });
    answer(401, { error: 'session-closed', reason: 'idle' });
    await api('/api/start');
    expect(sessionClosed.get()).toBe('idle');
    answer(426, { error: 'update-required' });
    await api('/api/start');
    expect(updateRequired.get()).toBe(true);
  });

  it('se puede cancelar un pedido', async () => {
    const fetch = answer(200, {});
    const controller = new AbortController();
    await api('/api/start', undefined, controller.signal);
    expect((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].signal).toBe(
      controller.signal,
    );
  });
});
