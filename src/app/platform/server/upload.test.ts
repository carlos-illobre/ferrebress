// Subir con su avance (08 · R4.9, R4.11), con un XMLHttpRequest de mentira.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { online } from './api.ts';
import { upload } from './upload.ts';

class FakeRequest {
  static last: FakeRequest;
  headers: Record<string, string> = {};
  method = '';
  path = '';
  body: unknown;
  status = 0;
  responseText = '';
  responseHeaders = '';
  upload: { onprogress?: (event: { loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  constructor() {
    FakeRequest.last = this;
  }
  open(method: string, path: string) {
    this.method = method;
    this.path = path;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  getAllResponseHeaders() {
    return this.responseHeaders;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
  answer(status: number, body: unknown, headers = 'content-type: application/json\r\n') {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.responseHeaders = headers;
    this.onload?.();
  }
}

const file = new Blob(['Código;Precio']);

describe('subir un archivo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    online.set(true);
  });

  it('manda el archivo crudo con las cabeceras de la aplicación y avisa cuánto subió', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeRequest);
    const sent = vi.fn();
    const done = upload<{ id: string }>('/api/price-lists/lists?name=a.csv', file, sent);
    const request = FakeRequest.last;
    expect(request.method).toBe('POST');
    expect(request.body).toBe(file);
    expect(request.headers['Content-Type']).toBe('application/octet-stream');
    expect(Object.keys(request.headers).length).toBeGreaterThan(2);
    request.upload.onprogress?.({ loaded: 5, total: 14 });
    request.upload.onprogress?.({ loaded: 14, total: 0 });
    expect(sent.mock.calls).toEqual([
      [5, 14],
      [14, file.size],
    ]);
    request.answer(
      201,
      { id: 'l1' },
      'x-otra: 1\r\ncontent-type: application/json\r\nsin-dos-puntos',
    );
    expect(await done).toEqual({ ok: true, data: { id: 'l1' } });
  });

  it('un error del servidor se lee como cualquier pedido', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeRequest);
    const done = upload('/api/price-lists/lists', file, vi.fn());
    FakeRequest.last.answer(413, { error: 'file-too-large' });
    expect(await done).toEqual({ ok: false, error: 'file-too-large' });
  });

  it('sin conexión, como sin conexión; cancelar corta y no queda nada', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeRequest);
    const failed = upload('/api/price-lists/lists', file, vi.fn());
    FakeRequest.last.onerror?.();
    expect(await failed).toEqual({ ok: false, error: 'offline' });
    const controller = new AbortController();
    const cancelled = upload('/api/price-lists/lists', file, vi.fn(), controller.signal);
    controller.abort();
    expect(await cancelled).toBe('cancelled');
  });
});
