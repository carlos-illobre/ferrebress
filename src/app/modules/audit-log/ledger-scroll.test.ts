// Si la lista está arriba de todo, según la vista que la muestra (R4.6).
import { describe, expect, it } from 'vitest';
import { ledgerScroll, scrolledTop, toTop } from './loading.ts';

describe('arriba de todo', () => {
  it('sin vista, cuenta como arriba y volver no hace nada; con vista, pregunta a la vista', () => {
    expect(scrolledTop()).toBe(true);
    toTop();
    const moved: string[] = [];
    const stop = ledgerScroll.set({ atTop: () => false, toTop: () => moved.push('top') });
    expect(scrolledTop()).toBe(false);
    toTop();
    expect(moved).toEqual(['top']);
    stop();
    expect(scrolledTop()).toBe(true);
  });
});
