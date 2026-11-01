import { describe, expect, it } from 'vitest';
import { plain } from './text.ts';

describe('el texto para buscar', () => {
  it('sin mayúsculas ni tildes', () => {
    expect(plain('Lucía PÉREZ ñandú')).toBe('lucia perez nandu');
    expect(plain('Más · Usuarios ^ ´ ¨')).toBe('mas · usuarios ^ ´ ¨');
  });
});
