// Un lector corre encerrado (08 · R5.10, E52, E53; ADR-021): no llega a nada que no se le dé, y se
// corta al pasar su tope de tiempo o de memoria.
import { describe, expect, it } from 'vitest';
import { runReader } from './sandbox.ts';

const limits = { memoryBytes: 16 * 2 ** 20, stackBytes: 256 * 1024, timeMs: 300 };
const reader = (body: string) =>
  `globalThis.reader = { recognizes(head) { ${body} }, read() { return []; } };`;
const run = (body: string, timeMs = limits.timeMs) =>
  runReader(reader(body), null, 'recognizes', [[]], { ...limits, timeMs });

describe('un lector encerrado', () => {
  it('recibe datos y devuelve datos', async () => {
    expect(await run('return head.length === 0 ? "no" : "yes";')).toEqual({ ok: 'no' });
    expect(
      await runReader(
        'globalThis.reader = { read: (b) => [b.n * 2] };',
        { x: 1 },
        'read',
        [{ n: 21 }],
        limits,
      ),
    ).toEqual({ ok: [42] });
    expect(
      await runReader(
        'globalThis.reader = { recognizes: () => params.x };',
        { x: 'yes' },
        'recognizes',
        [[]],
        limits,
      ),
    ).toEqual({ ok: 'yes' });
  });

  it('price-lists-E52: no llega al proceso, a los módulos, a la red ni a los archivos', async () => {
    for (const attempt of [
      'return typeof process;',
      'return typeof require;',
      'return typeof fetch;',
      'return this.constructor.constructor("return typeof process")();',
    ])
      expect(await run(attempt)).toEqual({ ok: 'undefined' });
    expect(await run('return require("fs");')).toEqual({ failed: 'error' });
    expect(await run('import("fs"); return "yes";')).toEqual({ ok: 'yes' });
  });

  it('price-lists-E53: un bucle sin fin se corta por tiempo; pedir memoria sin fin, por memoria', async () => {
    const started = Date.now();
    expect(await run('for (;;) {}')).toEqual({ failed: 'timeout' });
    expect(Date.now() - started).toBeLessThan(2000);
    // Con tiempo de sobra, para que corte la memoria y no el reloj.
    expect(await run('return "x".repeat(5e7);', 10_000)).toEqual({ failed: 'memory' });
    expect(await run('const a = []; for (;;) a.push([1, 2, 3, 4, 5, 6, 7, 8]);', 10_000)).toEqual({
      failed: 'memory',
    });
    expect(await run('const f = () => f(); f();')).toEqual({ failed: 'error' });
  });

  it('un lector que deja a QuickJS abortado al liberar es un error, y el siguiente corre bien', async () => {
    const deep =
      'const o = {}; let x = o; for (let i = 0; i < 1e5; i++) { x.a = {}; x = x.a; } return JSON.stringify(o);';
    expect(await run(deep)).toEqual({ failed: 'error' });
    expect(await run('return JSON.parse("[".repeat(1e5) + "]".repeat(1e5));')).toEqual({
      failed: 'error',
    });
    expect(await run('return "yes";')).toEqual({ ok: 'yes' });
  });

  it('un lector que no deja `reader` o que falla es un error', async () => {
    expect(await runReader('1 +', null, 'read', [], limits)).toEqual({ failed: 'error' });
    expect(await runReader('globalThis.reader = {};', null, 'read', [], limits)).toEqual({
      failed: 'error',
    });
    // Lo que no es nada llega como nada: la comprobación lo rechaza.
    expect(
      await runReader('globalThis.reader = { read: () => undefined };', null, 'read', [], limits),
    ).toEqual({ ok: undefined });
  });
});
