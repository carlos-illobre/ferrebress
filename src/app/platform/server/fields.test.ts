// Los campos de la cabecera que suman los módulos, y las cabeceras que suma un módulo a los pedidos
// (diseño de 03, § 3.5 y § 7).
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import { createMirror } from '../mirror/registry.ts';
import { api, decorate, guardWrites } from './api.ts';
import { forgetFields, onField } from './fields.ts';

const header = (extra = '') => ({ 'X-Ferrebress': `v=app-test; t=1; e=testing${extra}` });
const answerWith = (extra: string) => {
  const fetch = vi.fn(async () => new Response('{}', { headers: header(extra) }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

describe('los campos de la cabecera', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    forgetFields();
  });

  it('avisa cuando un campo cambia, también cuando deja de venir, y espera antes de devolver', async () => {
    const seen: (string | undefined)[] = [];
    let release!: () => void;
    const stop = onField('l', (value) => {
      seen.push(value);
      return new Promise<void>((resolve) => (release = resolve));
    });
    answerWith('; l=0a1b2c3d');
    let answered = false;
    const pending = api('/api/start').then(() => (answered = true));
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(answered).toBe(false);
    release();
    await pending;
    answerWith('; l=0a1b2c3d');
    await api('/api/start');
    answerWith('');
    const waiting = api('/api/start');
    await new Promise((resolve) => setTimeout(resolve, 5));
    release();
    await waiting;
    expect(seen).toEqual(['0a1b2c3d', undefined]);
    stop();
    answerWith('; l=ffffffff');
    await api('/api/start');
    expect(seen).toHaveLength(2);
  });

  it('un módulo suma cabeceras a los pedidos, sabiendo si escriben', async () => {
    const fetch = answerWith('');
    const stop = decorate(({ write }) => (write ? { 'X-Pairing': 'p1' } : {}));
    await api('/api/x', {});
    await api('/api/y');
    stop();
    await api('/api/z', {});
    const sent = fetch.mock.calls.map(
      (call) =>
        ((call as unknown[])[1] as { headers: Record<string, string> }).headers['X-Pairing'],
    );
    expect(sent).toEqual(['p1', undefined, undefined]);
  });

  it('lo que llega del otro por el espejo nunca dispara una escritura (03, § 5.3)', async () => {
    const fetch = answerWith('');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const mirror = createMirror();
    const stop = guardWrites(mirror.applying);
    const value = mirror.register('k', 'a', z.string());
    const results: Promise<unknown>[] = [];
    // Una pantalla que escribe cada vez que cambia el valor.
    value.subscribe(() => results.push(api('/api/x', {})));
    mirror.receive([{ k: 'k', v: 'del otro', c: 5, l: true }]);
    value.set('de acá');
    expect(await Promise.all(results)).toEqual([
      { ok: false, error: 'unexpected' },
      { ok: true, data: {} },
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(errors).toHaveBeenCalled();
    stop();
    errors.mockRestore();
  });
});
