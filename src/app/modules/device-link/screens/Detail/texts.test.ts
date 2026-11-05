import { describe, expect, it } from 'vitest';
import { duration, since } from './texts.ts';

describe('las fechas y duraciones del detalle', () => {
  it('«desde» dice hoy o ayer, el día y la hora del negocio, como la maqueta', () => {
    // Lunes 2 de noviembre de 2026, 8:14 en Buenos Aires (11:14 UTC).
    const at = Date.UTC(2026, 10, 2, 11, 14);
    expect(since(at, at + 60_000)).toBe('hoy, lunes 2 de noviembre, 8:14');
    expect(since(at, Date.UTC(2026, 10, 3, 15))).toBe('ayer, lunes 2 de noviembre, 8:14');
    expect(since(at, Date.UTC(2026, 10, 9, 15))).toBe('lunes 2 de noviembre, 8:14');
  });

  it('cuánto: en horas y minutos', () => {
    expect(duration(11 * 60_000)).toBe('11 min');
    expect(duration(137 * 60_000)).toBe('2 h 17 min');
    expect(duration(120 * 60_000)).toBe('2 h');
  });
});
