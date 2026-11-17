// Bajar un archivo: el nombre de Content-Disposition, sin conexión y lo que no es un archivo.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../testing/fake-server.ts';
import { online } from './api.ts';
import { fetchFile, fileNameOf } from './download.ts';

describe('bajar un archivo', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('el nombre: el de UTF-8 si viene, si no el de reserva, y sin ninguno el que se dio', () => {
    expect(fileNameOf(`attachment; filename="a_b.csv"; filename*=UTF-8''a%C3%B1b.csv`, 'x')).toBe(
      'añb.csv',
    );
    expect(fileNameOf('attachment; filename="a_b.csv"', 'x')).toBe('a_b.csv');
    expect(fileNameOf('attachment', 'x')).toBe('x');
    expect(fileNameOf(null, 'x')).toBe('x');
  });

  it('trae el archivo y dice que hay conexión', async () => {
    online.set(false);
    fakeServer({ '/f': { stream: 'hola', headers: { 'Content-Disposition': 'attachment' } } });
    const result = await fetchFile('/f', 'lista.csv');
    expect(result.ok && result.data.name).toBe('lista.csv');
    expect(result.ok && (await result.data.blob.text())).toBe('hola');
    expect(online.get()).toBe(true);
  });

  it('sin conexión, o si se corta a mitad, es sin conexión; un error del servidor, ese error', async () => {
    fakeServer({ '/f': 'offline' });
    expect(await fetchFile('/f', 'x')).toEqual({ ok: false, error: 'offline' });
    fakeServer({ '/f': { status: 410, body: { error: 'file-gone' } } });
    expect(await fetchFile('/f', 'x')).toMatchObject({ ok: false, error: 'file-gone' });
    const broken = new Response('x', { headers: { 'Content-Disposition': 'attachment' } });
    vi.spyOn(broken, 'blob').mockRejectedValue(new TypeError('cortado'));
    vi.stubGlobal('fetch', async () => broken);
    expect(await fetchFile('/f', 'x')).toEqual({ ok: false, error: 'offline' });
  });
});
