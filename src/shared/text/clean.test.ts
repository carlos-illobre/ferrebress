import { describe, expect, it } from 'vitest';
import { cleanText, lettersIn, sameText } from './clean.ts';

describe('limpiar un texto que ven otros', () => {
  it('saca lo invisible, lo de control y los espacios de más; vacío es ninguno', () => {
    expect(cleanText('  Compu‮del​   mostrador\n', 30)).toBe('Compudel mostrador');
    expect(cleanText('   ', 30)).toBeNull();
    expect(cleanText(undefined, 30)).toBeNull();
  });

  it('cuenta letras, no bytes, y escribe lo mismo de una sola forma', () => {
    expect(cleanText('Café', 30)).toBe('Café');
    expect(lettersIn('Café')).toBe(4);
    expect(cleanText('ñandú🔧ñandú', 6)).toBe('ñandú🔧');
  });

  it('dos nombres son el mismo sin importar mayúsculas', () => {
    expect(sameText('Compu del mostrador', 'compu DEL Mostrador')).toBe(true);
    expect(sameText('Compu', 'Compú')).toBe(false);
  });
});
