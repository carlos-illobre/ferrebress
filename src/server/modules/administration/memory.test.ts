// Los ajustes en la memoria del servidor (diseño de 06, § 1): un cambio más viejo no pisa uno nuevo.
import { describe, expect, it } from 'vitest';
import { createMemory } from './memory.ts';

describe('los ajustes en memoria', () => {
  it('se reemplazan solo con una versión mayor', () => {
    const memory = createMemory();
    memory.load([{ key: 'pairingDays', value: 15, version: 3, changedBy: 'x' }]);
    memory.put('pairingDays', { value: 20, version: 2 });
    expect(memory.states().pairingDays).toEqual({ value: 15, version: 3 });
    memory.put('pairingDays', { value: 20, version: 4 });
    expect(memory.settings().pairingDays).toBe(20);
  });
});
