// Los textos del proveedor que dicen cuántos: de a uno, en singular.
import { describe, expect, it } from 'vitest';
import { supplierTexts as texts } from './texts.ts';

describe('los textos del proveedor, de a uno', () => {
  it('un costo y un producto, en singular', () => {
    expect(texts.confirmCosts(1)).toBe('Cambiar 1 costo');
    expect(texts.confirmCostsSays(1)).toContain('1 costo cambia');
    expect(texts.confirmDeactivate(1)).toBe('Dar de baja con sus 1 producto');
    expect(texts.deactivateSays(1, 1).long).toContain('1 producto pierde');
    expect(texts.deactivateSays(1, 1).long).toContain('1 queda dado');
  });
});
