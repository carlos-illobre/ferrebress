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

  it('dos nombres son el mismo sin importar mayúsculas ni tildes', () => {
    expect(sameText('Compu del mostrador', 'compu DEL Mostrador')).toBe(true);
    expect(sameText('Compu', 'Compú')).toBe(true);
    expect(sameText('Compu', 'Caja')).toBe(false);
  });

  it('seguridad: sin rellenos que se ven en blanco, letras de nadie ni marcas apiladas', () => {
    expect(cleanText('\u3164\u2800\uFFA0\u115F', 30)).toBeNull();
    expect(cleanText('Ca\uE000ja\uD800', 30)).toBe('Caja');
    expect(cleanText('a\u0301\u0301\u0301\u0301b', 30)).toBe('á\u0301\u0301b');
  });
});
