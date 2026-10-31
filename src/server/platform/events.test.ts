import type { Transaction } from 'kysely';
import { describe, expect, it } from 'vitest';
import { createEvents } from './events.ts';

declare module './events.ts' {
  interface ServerEvents {
    'test.happened': { n: number };
  }
}

describe('los eventos dentro del proceso', () => {
  const trx = {} as Transaction<unknown>;

  it('llegan a cada uno que escucha, en orden y con la misma transacción', async () => {
    const events = createEvents();
    const seen: string[] = [];
    events.on('test.happened', async ({ n }, given) => {
      seen.push(`a${n}${given === trx}`);
      return undefined;
    });
    events.on('test.happened', async ({ n }) => {
      seen.push(`b${n}`);
      return () => seen.push('después');
    });
    const after = await events.publish('test.happened', { n: 1 }, trx);
    expect(seen).toEqual(['a1true', 'b1']);
    // Lo de después de confirmar lo corre quien publica.
    for (const then of after) then();
    expect(seen).toEqual(['a1true', 'b1', 'después']);
  });

  it('sin nadie que escuche, no pasa nada', async () => {
    await expect(createEvents().publish('test.happened', { n: 2 }, trx)).resolves.toEqual([]);
  });
});
