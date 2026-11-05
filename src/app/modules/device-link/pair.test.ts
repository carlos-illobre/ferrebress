// Vincular con el botón (R1.3 a R1.7): qué código sirve, lo que contesta el servidor y la dirección
// que abre la cámara del teléfono.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { pc } from '../../testing/pairing.ts';
import { acceptTicket, pairCodeOf, pairUrl, readCode, takePairCode } from './pair.ts';

const reply = (status: number, body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );

afterEach(() => vi.unstubAllGlobals());

describe('vincular con el botón', () => {
  it('solo sirve un código de vincular de esta aplicación', () => {
    expect(pairCodeOf(pairUrl('abc'))).toBe('abc');
    expect(pairCodeOf(`${location.origin}/pair`)).toBeUndefined();
    expect(pairCodeOf(`${location.origin}/link#abc`)).toBeUndefined();
    expect(pairCodeOf('https://otro.com/pair#abc')).toBeUndefined();
    expect(pairCodeOf('no es una dirección')).toBeUndefined();
  });

  it('el servidor vincula, pregunta antes de reemplazar o dice por qué no', async () => {
    reply(200, { pairing: pc });
    expect(await readCode('c')).toEqual({ kind: 'paired', pairing: pc });
    reply(200, { ticket: 't', replaces: { phone: 'Chrome en Windows' } });
    expect(await readCode('c')).toEqual({ kind: 'replace', ticket: 't', was: 'Chrome en Windows' });
    reply(200, { ticket: 't', replaces: { computer: true } });
    expect(await readCode('c')).toEqual({ kind: 'replace', ticket: 't', was: undefined });
    reply(403, { error: 'other-account' });
    expect(await readCode('c')).toEqual({ kind: 'other-account' });
    reply(410, { error: 'code-used' });
    expect(await readCode('c')).toEqual({ kind: 'expired' });
    reply(500, { error: 'internal' });
    expect(await readCode('c')).toEqual({ kind: 'failed' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('sin red'))),
    );
    expect(await acceptTicket('t')).toEqual({ kind: 'offline' });
  });

  it('la dirección de la cámara del teléfono se lee una vez y se borra; sin sesión no vincula', () => {
    navigate('/pair#codigo', { replace: true });
    expect(takePairCode(true)).toBe('codigo');
    expect(route.get().path).toBe('/');
    expect(takePairCode(true)).toBeUndefined();
    navigate('/pair#codigo', { replace: true });
    expect(takePairCode(false)).toBeUndefined();
    expect(route.get().path).toBe('/');
  });
});
