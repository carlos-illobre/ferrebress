// Lo que los módulos suman a /api/start.
import type { Context } from 'hono';
import { describe, expect, it } from 'vitest';
import { createStartParts } from './start-parts.ts';

describe('las partes de /api/start', () => {
  it('junta las de cada módulo, sin las que no dicen nada, y cada nombre tiene un dueño', async () => {
    const parts = createStartParts();
    parts.contribute('pairing', async () => ({ id: 'v' }));
    parts.contribute('nada', async () => undefined);
    expect(await parts.collect({} as Context)).toEqual({ pairing: { id: 'v' } });
    expect(() => parts.contribute('pairing', async () => 1)).toThrow('ya tiene dueño');
  });
});
