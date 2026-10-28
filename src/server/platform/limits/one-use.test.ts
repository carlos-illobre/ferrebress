import { describe, expect, it } from 'vitest';
import { createOneUse } from './one-use.ts';

function fakeClock() {
  let now = 0;
  return { now: () => new Date(now), advance: (ms: number) => (now += ms) };
}

describe('los valores de un solo uso', () => {
  it('sign-in-E43: sirven una vez y vencen a su tiempo', () => {
    const clock = fakeClock();
    const once = createOneUse<string>(clock, { ttlMs: 5_000, maxTotal: 10, maxPerOwner: 10 });
    const key = once.issue('ip', 'valor') as string;
    expect(once.take(key)).toBe('valor');
    expect(once.take(key)).toBeUndefined();
    const late = once.issue('ip', 'tarde') as string;
    clock.advance(5_000);
    expect(once.take(late)).toBeUndefined();
    expect(once.take('inventada')).toBeUndefined();
  });

  it('al llegar a un tope rechazan lo nuevo, y los vencidos dejan lugar', () => {
    const clock = fakeClock();
    const once = createOneUse<number>(clock, { ttlMs: 1_000, maxTotal: 3, maxPerOwner: 2 });
    expect(once.issue('a', 1)).toBeDefined();
    expect(once.issue('a', 2)).toBeDefined();
    expect(once.issue('a', 3)).toBeUndefined();
    expect(once.issue('b', 4)).toBeDefined();
    expect(once.issue('c', 5)).toBeUndefined();
    clock.advance(1_000);
    expect(once.issue('c', 6)).toBeDefined();
  });

  it('con replaceOldest, el dueño en su tope descarta el más viejo suyo y no el de otro', () => {
    const clock = fakeClock();
    const once = createOneUse<number>(clock, {
      ttlMs: 1_000,
      maxTotal: 4,
      maxPerOwner: 2,
      replaceOldest: true,
    });
    const first = once.issue('a', 1) as string;
    const second = once.issue('a', 2) as string;
    const other = once.issue('b', 3) as string;
    const third = once.issue('a', 5) as string;
    expect(once.take(first)).toBeUndefined();
    expect(once.take(second)).toBe(2);
    expect(once.take(third)).toBe(5);
    expect(once.take(other)).toBe(3);
  });
});
