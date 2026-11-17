// Lo que se dice de un proveedor en los bordes: ayer, un teléfono sin números.
import { describe, expect, it } from 'vitest';
import { supplierLines } from './suppliers-rules.ts';

const now = Date.parse('2023-11-14T22:13:20Z');

describe('lo que se dice de un proveedor', () => {
  it('una lista de ayer, y un teléfono sin números no lleva enlaces', () => {
    const lines = supplierLines(
      { id: 'x', name: 'Uno', lastListDate: '2023-11-13', phone: 'no tiene' },
      now,
      true,
    );
    expect(lines.last).toBe('Última lista: 13/11/2023 · ayer');
    expect(lines.phone).toBeUndefined();
  });
});
