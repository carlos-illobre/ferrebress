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

  it.each([null, '', 'v=; t=1; e=testing', 'v=a; t=x; e=testing', 'v=a; t=1; e=otro'])(
    'no se acepta mal formada: %s',
    (value) => expect(parseServerHeader(value)).toBeUndefined(),
  );
});
