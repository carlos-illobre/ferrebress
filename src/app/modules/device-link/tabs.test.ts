// Qué pestaña espeja (R6.4): la que se usó última. Un candado de mentira con el comportamiento de
// Web Locks: `steal` corta al que lo tenía; `ifAvailable` no espera.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTabs, lockName } from './tabs.ts';

type Holder = { reject: (error: Error) => void; done: Promise<unknown> };

function fakeLocks() {
  let holder: Holder | undefined;
  return {
    request: vi.fn(
      (
        name: string,
        options: LockOptions,
        callback: (lock: Lock | null) => Promise<unknown> | undefined,
      ) => {
        expect(name).toBe(lockName);
        if (holder && !options.steal) return Promise.resolve(callback(null));
        holder?.reject(new DOMException('robado', 'AbortError'));
        const outer = Promise.withResolvers<unknown>();
        const mine: Holder = { reject: outer.reject, done: outer.promise };
        holder = mine;
        void Promise.resolve(callback({ name } as Lock)).then((value) => {
          if (holder === mine) holder = undefined;
          outer.resolve(value);
        });
        return outer.promise;
      },
    ),
  };
}

const settle = () => new Promise((done) => setTimeout(done, 0));
let stops: (() => void)[] = [];
afterEach(() => {
  for (const stop of stops) stop();
  stops = [];
});

describe('la pestaña que espeja', () => {
  it('E35: al abrir lo toma si nadie lo tiene; la otra lo roba al usarla y la primera se entera', async () => {
    const locks = fakeLocks();
    const first = vi.fn();
    const one = createTabs({ locks: locks as never, onChange: first });
    stops.push(one.stop);
    await settle();
    expect(one.mine()).toBe(true);
    const second = vi.fn();
    const two = createTabs({ locks: locks as never, onChange: second });
    await settle();
    expect(two.mine()).toBe(false);
    dispatchEvent(new Event('keydown'));
    await settle();
    expect(first).toHaveBeenLastCalledWith(false);
    expect(two.mine()).toBe(true);
    two.stop();
    await settle();
    expect(two.mine()).toBe(false);
  });

  it('oculta, tocar no lo toma', async () => {
    const locks = fakeLocks();
    createTabs({ locks: locks as never, onChange: () => undefined }).stop();
    await settle();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    const tab = createTabs({ locks: locks as never, onChange: () => undefined });
    stops.push(tab.stop);
    await settle();
    locks.request.mockClear();
    dispatchEvent(new Event('pointerdown'));
    expect(locks.request).not.toHaveBeenCalled();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('sin candados en el navegador, esta pestaña es la que cuenta', () => {
    const onChange = vi.fn();
    const tab = createTabs({ locks: undefined, onChange });
    expect(tab.mine()).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    tab.stop();
  });
});
