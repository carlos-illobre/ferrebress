import { describe, expect, it, vi } from 'vitest';
import { asset, type Box, type Fetch, install, kindOf, page, shell, skeletonOf } from './worker.ts';

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
    if (where === shell)
      return new Response(html(version.current), { headers: { 'content-type': 'text/html' } });
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

// Pide la página como el navegador y espera lo que el service worker sigue haciendo después.
async function open(box: Box, fetcher: Fetch) {
  const pending: Promise<unknown>[] = [];
  const response = await page(request('/', { mode: 'navigate' }), box, fetcher, (work) =>
    pending.push(work),
  );
  await Promise.all(pending);
  return response;
}

describe('el service worker', () => {
  it('nunca toca /api, otros sitios ni lo que no se lee; distingue la página de los archivos', () => {
    expect(kindOf(request('/api/start'), origin)).toBe('skip');
    expect(kindOf(request('/assets/a.js', { method: 'POST' }), origin)).toBe('skip');
    expect(
      kindOf({ ...request('/x'), url: 'https://accounts.google.com/gsi/client' }, origin),
    ).toBe('skip');
    expect(kindOf(request('/manifest.webmanifest'), origin)).toBe('skip');
    // Nada del manual ocupa lugar, ni su contenido ni su código (que vaya en manual/ lo controla
    // `pnpm boot`, app-E39).
    expect(kindOf(request('/manual/index.json'), origin)).toBe('skip');
    expect(kindOf(request('/manual/app-abc.js'), origin)).toBe('skip');
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
    expect(await (await open(box, server)).text()).toBe(html('v1'));
    const offline = vi.fn(async () => {
      throw new TypeError('sin conexión');
    });
    expect(await (await open(box, offline)).text()).toBe(html('v1'));
    const empty = fakeBox().box;
    expect((await open(empty, offline)).type).toBe('error');
  });

  it('una versión nueva reemplaza lo guardado; la misma conserva lo que se guardó al usarla', async () => {
    const { box, kept } = fakeBox();
    const version = { current: 'v1' };
    const server = fakeServer(version);
    await install(box, server);
    await asset(request('/assets/screen-v1.js'), box, server);
    await open(box, server);
    expect(kept.has('/assets/screen-v1.js')).toBe(true);
    version.current = 'v2';
    await open(box, server);
    expect([...kept.keys()].sort()).toEqual(['/', '/assets/main-v2.css', '/assets/main-v2.js']);
    const failing = vi.fn(async () => new Response('', { status: 500 }));
    expect((await open(box, failing)).status).toBe(500);
    expect(await (await box.match(shell))?.text()).toBe(html('v2'));
    // Una respuesta que no es HTML, aunque sea 200, tampoco reemplaza la página guardada.
    const portal = vi.fn(
      async () => new Response('{}', { headers: { 'content-type': 'text/plain' } }),
    );
    await open(box, portal);
    await install(box, portal);
    await install(
      box,
      vi.fn(async () => new Response(null)),
    );
    expect(await (await box.match(shell))?.text()).toBe(html('v2'));
  });

  it('la página nueva se muestra sin esperar a que se guarden sus archivos', async () => {
    const { box, kept } = fakeBox();
    const server = fakeServer({ current: 'v1' });
    const later: Promise<unknown>[] = [];
    const shown = await page(request('/', { mode: 'navigate' }), box, server, (work) =>
      later.push(work),
    );
    expect(await shown.text()).toBe(html('v1'));
    expect(kept.size).toBe(0);
    await Promise.all(later);
    expect([...kept.keys()].sort()).toEqual(['/', '/assets/main-v1.css', '/assets/main-v1.js']);
  });

  it('si un archivo de la versión nueva no llega, sigue la guardada entera y no guarda el error', async () => {
    const { box, kept } = fakeBox();
    const version = { current: 'v1' };
    const server = fakeServer(version);
    await install(box, server);
    version.current = 'v2';
    const broken = vi.fn(async (asked: Request | string) =>
      String(asked).endsWith('.css') ? new Response('', { status: 502 }) : server(asked),
    );
    expect(await (await open(box, broken)).text()).toBe(html('v2'));
    expect([...kept.keys()].sort()).toEqual(['/', '/assets/main-v1.css', '/assets/main-v1.js']);
    expect(await (await box.match(shell))?.text()).toBe(html('v1'));
    // Sin conexión a mitad de camino: la página nueva igual se muestra.
    const cut = vi.fn(async (asked: Request | string) => {
      if (typeof asked === 'string') throw new TypeError('sin conexión');
      return server(asked);
    });
    expect(await (await open(box, cut)).text()).toBe(html('v2'));
    expect(await (await box.match(shell))?.text()).toBe(html('v1'));
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
