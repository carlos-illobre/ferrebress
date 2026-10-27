import { describe, expect, it, vi } from 'vitest';
import { asset, type Box, install, kindOf, page, shell, skeletonOf } from './worker.ts';

const origin = 'https://ferrebress.example';
const html = (version: string) =>
  `<script type="module" src="/assets/main-${version}.js"></script><link rel="stylesheet" href="/assets/main-${version}.css">`;

// Lo guardado, en memoria: la clave es la dirección.
function fakeBox() {
  const kept = new Map<string, Response>();
  const path = (key: Request | string) =>
    typeof key === 'string' ? key : new URL(key.url).pathname;
  const box: Box = {
    match: async (key) => kept.get(path(key as Request | string))?.clone(),
    put: async (key, response) => void kept.set(path(key as Request | string), response),
    keys: async () => [...kept.keys()].map((key) => new Request(origin + key)),
    delete: async (key) => kept.delete(path(key as Request | string)),
  };
  return { box, kept };
}

// El servidor: la página de una versión y cualquier archivo.
function fakeServer(version: { current: string }) {
  return vi.fn(async (request: Request | string) => {
    const where = typeof request === 'string' ? request : new URL(request.url).pathname;
    if (where === shell) return new Response(html(version.current));
    return where === '/assets/missing.js'
      ? new Response('', { status: 404 })
      : new Response(`archivo ${where}`);
  });
}

const request = (
  path: string,
  init: { method?: string; mode?: string; destination?: string } = {},
) =>
  ({
    url: origin + path,
    method: init.method ?? 'GET',
    mode: init.mode ?? 'cors',
    destination: init.destination ?? (init.mode === 'navigate' ? 'document' : 'script'),
  }) as Request;

describe('el service worker', () => {
  it('nunca toca /api, otros sitios ni lo que no se lee; distingue la página de los archivos', () => {
    expect(kindOf(request('/api/start'), origin)).toBe('skip');
    expect(kindOf(request('/assets/a.js', { method: 'POST' }), origin)).toBe('skip');
    expect(
      kindOf({ ...request('/x'), url: 'https://accounts.google.com/gsi/client' }, origin),
    ).toBe('skip');
    expect(kindOf(request('/manifest.webmanifest'), origin)).toBe('skip');
    expect(kindOf(request('/link', { mode: 'navigate' }), origin)).toBe('page');
    expect(
      kindOf(request('/google-button.html', { mode: 'navigate', destination: 'iframe' }), origin),
    ).toBe('skip');
    expect(kindOf(request('/assets/a.js'), origin)).toBe('asset');
  });

  it('el esqueleto es lo que la página carga de entrada', () => {
    expect(skeletonOf(html('v1'))).toEqual(['/assets/main-v1.js', '/assets/main-v1.css']);
  });

  it('al instalarse guarda la página y su esqueleto, nada más', async () => {
    const { box, kept } = fakeBox();
    await install(box, fakeServer({ current: 'v1' }));
    expect([...kept.keys()].sort()).toEqual(['/', '/assets/main-v1.css', '/assets/main-v1.js']);
  });

  it('la página va primero a la red; sin conexión abre la guardada (00 · R3.6)', async () => {
    const { box } = fakeBox();
    const version = { current: 'v1' };
    const server = fakeServer(version);
    await install(box, server);
    expect(await (await page(request('/', { mode: 'navigate' }), box, server)).text()).toBe(
      html('v1'),
    );
    const offline = vi.fn(async () => {
      throw new TypeError('sin conexión');
    });
    expect(await (await page(request('/', { mode: 'navigate' }), box, offline)).text()).toBe(
      html('v1'),
    );
    const empty = fakeBox().box;
    expect((await page(request('/', { mode: 'navigate' }), empty, offline)).type).toBe('error');
  });

  it('una versión nueva reemplaza lo guardado; la misma conserva lo que se guardó al usarla', async () => {
    const { box, kept } = fakeBox();
    const version = { current: 'v1' };
    const server = fakeServer(version);
    await install(box, server);
    await asset(request('/assets/screen-v1.js'), box, server);
    await page(request('/', { mode: 'navigate' }), box, server);
    expect(kept.has('/assets/screen-v1.js')).toBe(true);
    version.current = 'v2';
    await page(request('/', { mode: 'navigate' }), box, server);
    expect([...kept.keys()].sort()).toEqual(['/', '/assets/main-v2.css', '/assets/main-v2.js']);
    const failing = vi.fn(async () => new Response('', { status: 500 }));
    expect((await page(request('/', { mode: 'navigate' }), box, failing)).status).toBe(500);
    expect(await (await box.match(shell))?.text()).toBe(html('v2'));
  });

  it('los archivos se guardan la primera vez que se usan y después salen de lo guardado', async () => {
    const { box, kept } = fakeBox();
    const server = fakeServer({ current: 'v1' });
    expect(await (await asset(request('/assets/a.js'), box, server)).text()).toBe(
      'archivo /assets/a.js',
    );
    expect(await (await asset(request('/assets/a.js'), box, server)).text()).toBe(
      'archivo /assets/a.js',
    );
    expect(server).toHaveBeenCalledOnce();
    expect((await asset(request('/assets/missing.js'), box, server)).status).toBe(404);
    expect(kept.has('/assets/missing.js')).toBe(false);
  });
});
