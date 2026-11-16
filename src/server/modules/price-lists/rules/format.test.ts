// El formato de un archivo subido (08 · R4.2, E33): la extensión y los primeros bytes.
import { describe, expect, it } from 'vitest';
import { formatFits } from './format.ts';

const bytes = (...values: number[]) => Uint8Array.from(values);
const zip = bytes(0x50, 0x4b, 0x03, 0x04);
const ole = bytes(0xd0, 0xcf, 0x11, 0xe0);
const text = new TextEncoder().encode('Código;Precio');

describe('el formato de un archivo', () => {
  it('cada planilla con su extensión', () => {
    expect(formatFits('lista.XLSX', zip)).toBe(true);
    expect(formatFits('lista.xls', ole)).toBe(true);
    expect(formatFits('lista.csv', text)).toBe(true);
    expect(formatFits('tabla.xls', text)).toBe(true);
  });

  it('price-lists-E33: con otra extensión, otro contenido, vacío o un ejecutable, no', () => {
    expect(formatFits('lista.pdf', text)).toBe(false);
    expect(formatFits('lista.csv', zip)).toBe(false);
    expect(formatFits('lista.csv', ole)).toBe(false);
    expect(formatFits('lista.xlsx', text)).toBe(false);
    expect(formatFits('lista.csv', new Uint8Array())).toBe(false);
    for (const program of [
      bytes(0x4d, 0x5a),
      bytes(0x7f, 0x45, 0x4c, 0x46),
      bytes(0x23, 0x21),
      bytes(0xca, 0xfe, 0xba, 0xbe),
      bytes(0xcf, 0xfa, 0xed, 0xfe),
    ])
      expect(formatFits('lista.csv', program)).toBe(false);
  });
});
