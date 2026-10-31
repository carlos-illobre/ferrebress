import { describe, expect, it } from 'vitest';
import { createGuardedMemory } from './memory.ts';

describe('la memoria que no guarda lo viejo (diseño de 02, § 17)', () => {
  it('lee una vez y después contesta de memoria', async () => {
    const memory = createGuardedMemory<string, number>();
    let reads = 0;
    const read = async () => ++reads;
    expect(await memory.load('a', read)).toBe(1);
    expect(await memory.load('a', read)).toBe(1);
    expect(reads).toBe(1);
  });

  it('olvidar hace leer de nuevo; olvidar todo, también', async () => {
    const memory = createGuardedMemory<string, number>();
    let value = 1;
    await memory.load('a', async () => value);
    await memory.load('b', async () => value);
    value = 2;
    memory.forget(['a']);
    expect(await memory.load('a', async () => value)).toBe(2);
    expect(await memory.load('b', async () => value)).toBe(1);
    memory.forget('all');
    expect(await memory.load('b', async () => value)).toBe(2);
  });

  it('una lectura que empezó antes de un cambio no queda guardada', async () => {
    const memory = createGuardedMemory<string, string>();
    let release: () => void = () => undefined;
    const slow = memory.load(
      'a',
      () =>
        new Promise<string>((done) => {
          release = () => done('viejo');
        }),
    );
    memory.forget(['a']);
    release();
    expect(await slow).toBe('viejo');
    expect(await memory.load('a', async () => 'nuevo')).toBe('nuevo');
  });
});
