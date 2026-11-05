import { afterEach, describe, expect, it, vi } from 'vitest';
import { coalesce } from './coalesce.ts';
import type { Patch } from './registry.ts';

const patch = (k: string, v: string, c: number): Patch => ({ k, v, c, l: true });

afterEach(() => vi.useRealTimers());

describe('juntar los cambios por el servidor (diseño de 03, § 4.3)', () => {
  it('lo de los mismos 150 ms sale junto, de cada clave el último, en el orden de su último cambio', () => {
    vi.useFakeTimers();
    const sent: Patch[][] = [];
    const out = coalesce((patches) => sent.push(patches), 150);
    for (const [i, letters] of ['t', 'to', 'tor', 'torn'].entries())
      out.send([patch('buscar', letters, i + 1)]);
    out.send([patch('lista', 'a', 5)]);
    out.send([patch('buscar', 'tornillo', 6)]);
    expect(sent).toEqual([]);
    vi.advanceTimersByTime(150);
    expect(sent).toEqual([[patch('lista', 'a', 5), patch('buscar', 'tornillo', 6)]]);
  });

  it('al pararlo, lo que esperaba no sale', () => {
    vi.useFakeTimers();
    const send = vi.fn();
    const out = coalesce(send, 150);
    out.send([patch('k', 'v', 1)]);
    out.stop();
    vi.advanceTimersByTime(1000);
    expect(send).not.toHaveBeenCalled();
  });
});
