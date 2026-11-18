// Espejar lo que tiene un dueño (diseño de 03, § 5; ADR-017): cada lado comparte lo suyo en su valor y
// recibe lo del otro; solo viaja lo que cambió para el otro, y se puede dejar de espejar. Con dos lados
// cualquiera y un almacén cualquiera: la pieza no sabe de qué se trata.
import { describe, expect, it } from 'vitest';
import * as z from 'zod/mini';
import { mirrorByOwner } from './by-owner.ts';
import { createMirror, type Patch } from './registry.ts';

// Un almacén mínimo: un valor que avisa cuando cambia.
function source<S>(initial: S) {
  let value = initial;
  const listeners = new Set<(value: S) => void>();
  return {
    get: () => value,
    set(next: S) {
      value = next;
      for (const listener of listeners) listener(value);
    },
    subscribe(listener: (value: S) => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

// Dos dispositivos conectados entre sí, cada uno con lo suyo (unos pedidos, con lo que no se comparte).
function pair() {
  const left = createMirror();
  const right = createMirror();
  const sent: Patch[] = [];
  left.attach({
    leader: true,
    over: 'direct',
    send: (patches) => {
      sent.push(...patches);
      right.receive(patches);
    },
  });
  right.attach({ leader: false, over: 'direct', send: (p) => left.receive(p) });
  type Order = { id: string; secret: string; done: boolean };
  const side = (mirror: typeof left, mine: string, other: string) => {
    const orders = source<Order[]>([]);
    const got: { from: string; ids: string[] }[] = [];
    const stop = mirrorByOwner({
      key: 'orders',
      sides: { mine, other },
      schema: z.array(z.string()),
      nothing: [],
      source: orders,
      // Lo que no terminó, sin lo secreto.
      share: (all) => all.filter((one) => !one.done).map((one) => one.id),
      receive: (ids, from) => got.push({ from, ids }),
      mirror,
    });
    return { orders, got, stop };
  };
  return { sent, a: side(left, 'a', 'b'), b: side(right, 'b', 'a') };
}

describe('espejar lo que tiene un dueño', () => {
  it('cada lado ve lo del otro, sin lo que no se comparte, y nunca pisa lo suyo', () => {
    const { a, b } = pair();
    a.orders.set([{ id: '1', secret: 'x', done: false }]);
    b.orders.set([{ id: '9', secret: 'y', done: false }]);
    expect(b.got.at(-1)).toEqual({ from: 'a', ids: ['1'] });
    expect(a.got.at(-1)).toEqual({ from: 'b', ids: ['9'] });
    a.orders.set([{ id: '1', secret: 'x', done: true }]);
    expect(b.got.at(-1)).toEqual({ from: 'a', ids: [] });
  });

  it('solo viaja lo que cambió para el otro; dejar de espejar suelta los valores', () => {
    const { a, sent } = pair();
    a.orders.set([{ id: '1', secret: 'x', done: false }]);
    const before = sent.length;
    a.orders.set([{ id: '1', secret: 'otro', done: false }]);
    expect(sent).toHaveLength(before);
    a.stop();
    a.orders.set([{ id: '2', secret: 'x', done: false }]);
    expect(sent).toHaveLength(before);
  });

  it('lo que ya había al empezar sale enseguida; sin espejo propio, usa el de la aplicación', () => {
    const mirror = createMirror();
    const sent: Patch[] = [];
    mirror.attach({ leader: true, over: 'direct', send: (p) => sent.push(...p) });
    const stop = mirrorByOwner({
      key: 'k',
      sides: { mine: 'a', other: 'b' },
      schema: z.array(z.string()),
      nothing: [],
      source: source(['ya']),
      share: (all) => all,
      receive: () => undefined,
      mirror,
    });
    expect(sent.at(-1)).toMatchObject({ k: 'k.a', v: ['ya'] });
    stop();
    const app = mirrorByOwner({
      key: 'prueba.por-dueño',
      sides: { mine: 'a', other: 'b' },
      schema: z.array(z.string()),
      nothing: [],
      source: source<string[]>([]),
      share: (all) => all,
      receive: () => undefined,
    });
    app();
  });
});
