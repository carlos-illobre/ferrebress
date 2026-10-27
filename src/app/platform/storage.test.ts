import { afterEach, describe, expect, it, vi } from 'vitest';
import { forget, readStored, store } from './storage.ts';

describe('lo que se guarda en el dispositivo', () => {
  afterEach(() => vi.restoreAllMocks());

  it('se guarda, se lee y se olvida', () => {
    store('prueba', { a: 1 });
    expect(readStored('prueba')).toEqual({ a: 1 });
    forget('prueba');
    expect(readStored('prueba')).toBeUndefined();
  });

  it('si el navegador no deja guardar, sigue sin eso', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('sin lugar');
    });
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('sin permiso');
    });
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('sin permiso');
    });
    expect(() => store('x', 1)).not.toThrow();
    expect(readStored('x')).toBeUndefined();
    expect(() => forget('x')).not.toThrow();
  });
});
