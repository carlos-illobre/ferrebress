import { describe, expect, it } from 'vitest';
import { formatServerHeader, parseServerHeader } from './server-header.ts';

describe('la cabecera X-Ferrebress', () => {
  it('se lee como se escribe', () => {
    const header = {
      version: 'abc123',
      serverTime: 1_700_000_000_000,
      environment: 'testing' as const,
    };
    expect(parseServerHeader(formatServerHeader(header))).toEqual(header);
  });

  it('con sesión lleva la huella de los permisos (02 · R7.8), que se lee igual', () => {
    const header = {
      version: 'abc123',
      serverTime: 1_700_000_000_000,
      environment: 'testing' as const,
      permissions: '0a1b2c3d',
    };
    expect(formatServerHeader(header)).toContain('; p=0a1b2c3d');
    expect(parseServerHeader(formatServerHeader(header))).toEqual(header);
    expect(parseServerHeader('v=a; t=1; e=testing; p=raro')).toEqual({
      version: 'a',
      serverTime: 1,
      environment: 'testing',
    });
  });

  it('lleva los campos que suma cada módulo; los mal formados o con letras de la cabecera no', () => {
    const header = {
      version: 'a',
      serverTime: 1,
      environment: 'testing' as const,
      fields: { l: '0a1b2c3d' },
    };
    expect(formatServerHeader(header)).toBe('v=a; t=1; e=testing; l=0a1b2c3d');
    expect(parseServerHeader(formatServerHeader(header))).toEqual(header);
    expect(parseServerHeader('v=a; t=1; e=testing; l=con espacio; xx=1; m=ok')?.fields).toEqual({
      m: 'ok',
    });
  });

  it.each([null, '', 'v=; t=1; e=testing', 'v=a; t=x; e=testing', 'v=a; t=1; e=otro'])(
    'no se acepta mal formada: %s',
    (value) => expect(parseServerHeader(value)).toBeUndefined(),
  );
});
