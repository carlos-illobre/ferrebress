// El protocolo del vínculo (diseño de 03, § 4.4): lo que tiene su forma pasa tipado; lo demás vuelve
// como desconocido, sin tirar; la foto se corta por bytes y se vuelve a juntar en orden.
import { describe, expect, it } from 'vitest';
import type { Patch } from '../../platform/mirror/registry.ts';
import { createSnapAssembler, read, type Snap, snapParts } from './wire.ts';

describe('los mensajes del vínculo', () => {
  it('pasan los que tienen su forma', () => {
    for (const message of [
      { t: 'hello', v: 1, app: 'abc', clock: 3 },
      { t: 'bye', why: 'handover' },
      { t: 'give-up' },
      { t: 'patch', p: [{ k: 'a', v: { x: [1] }, c: 2, l: true }] },
      { t: 'snap', p: [], part: 0, of: 1 },
    ])
      expect(read(message)).toEqual({ ok: true, message });
  });

  it('lo demás vuelve como desconocido, con su tipo y sin el contenido', () => {
    expect(read({ t: 'hello', v: 2, app: 'x' })).toEqual({ ok: false, kind: 'hello' });
    expect(read({ t: 'bye', why: 'porque sí' })).toEqual({ ok: false, kind: 'bye' });
    expect(read({ t: 'x'.repeat(50) })).toEqual({ ok: false, kind: 'x'.repeat(20) });
    expect(read([1])).toEqual({ ok: false, kind: 'object' });
    expect(read('hola')).toEqual({ ok: false, kind: 'string' });
    expect(read(null)).toEqual({ ok: false, kind: 'object' });
  });
});

describe('la foto en partes', () => {
  const photo: Patch[] = Array.from({ length: 10 }, (_, i) => ({
    k: `k${i}`,
    v: 'x'.repeat(40),
    c: 1,
    l: true,
  }));

  it('se corta por bytes y se junta igual', () => {
    const parts = snapParts(photo, 200);
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(JSON.stringify(part).length).toBeLessThan(400);
    const join = createSnapAssembler();
    const results = parts.map((part) => join(part));
    expect(results.slice(0, -1).every((r) => r === undefined)).toBe(true);
    expect(results.at(-1)).toEqual(photo);
  });

  it('una foto vacía es una parte; una parte fuera de orden se descarta y otra foto empieza de cero', () => {
    expect(snapParts([], 100)).toEqual([{ t: 'snap', p: [], part: 0, of: 1 }]);
    const join = createSnapAssembler();
    const [first, second] = snapParts(photo, 200) as [Snap, Snap];
    expect(join(second)).toBeUndefined();
    join(first);
    expect(join(first)).toBeUndefined();
    expect(join(second)).toBeUndefined();
  });
});
