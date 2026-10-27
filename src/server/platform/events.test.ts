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
    });
    events.on('test.happened', async ({ n }) => {
      seen.push(`b${n}`);
    });
    await events.publish('test.happened', { n: 1 }, trx);
    expect(seen).toEqual(['a1true', 'b1']);
  });

  it('sin nadie que escuche, no pasa nada', async () => {
    await expect(createEvents().publish('test.happened', { n: 2 }, trx)).resolves.toBeUndefined();
  });
});
