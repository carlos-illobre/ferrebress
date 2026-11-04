// Bordes de las piezas del vínculo que una pestaña de verdad no alcanza.
import { describe, expect, it } from 'vitest';
import { createRotatingCodes } from '../../platform/realtime/rotating-codes.ts';
import { deviceLinkData } from './data.ts';

describe('las piezas del vínculo', () => {
  it('buscar los vínculos de ningún dispositivo no consulta la base', async () => {
    const data = deviceLinkData({} as never);
    expect(await data.forDevices('u', [])).toEqual([]);
    expect(await data.remove([])).toEqual([]);
  });

  it('parar los códigos de quien no los muestra no hace nada', () => {
    const codes = createRotatingCodes({ ttlMs: 1000, wait: async () => undefined, now: () => 0 });
    expect(() => codes.stop('nadie')).not.toThrow();
    expect(codes.take('x')).toBe('code-expired');
  });
});
