import { describe, expect, it } from 'vitest';
import { comboOf, shownKey } from './combo.ts';

const event = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);

describe('las combinaciones de teclas', () => {
  it('las letras y los números salen de la tecla física, con los modificadores en orden', () => {
    expect(comboOf(event({ key: 'ø', code: 'KeyO', altKey: true }))).toBe('Alt+O');
    expect(comboOf(event({ key: '!', code: 'Digit1', ctrlKey: true, shiftKey: true }))).toBe(
      'Ctrl+Shift+1',
    );
  });

  it('las demás teclas, por su nombre', () => {
    expect(comboOf(event({ key: '/', code: 'Slash' }))).toBe('/');
    expect(comboOf(event({ key: 'ArrowDown', code: 'ArrowDown', metaKey: true }))).toBe(
      'Meta+ArrowDown',
    );
  });

  it('sobre el botón se muestra sin Alt', () => {
    expect(shownKey('Alt+R')).toBe('R');
    expect(shownKey('Ctrl+Shift+F')).toBe('Ctrl+Shift+F');
  });
});
