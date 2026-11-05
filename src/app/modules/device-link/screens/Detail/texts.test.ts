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

describe('las horas de la tira del día', () => {
  it('como mucho cuatro, y ninguna pegada a «Ahora»', async () => {
    const { hours } = await import('./Today.tsx');
    const at = (h: number, m = 0) => Date.UTC(2026, 10, 2, h, m);
    // Dos horas y media: las dos en punto del medio; la de las 11 queda pegada a «Ahora» (11:20).
    expect(hours(at(8, 50), at(11, 20))).toEqual([at(9), at(10)]);
    // Un día largo: cada tres horas.
    expect(hours(at(8), at(20))).toEqual([at(8), at(11), at(14), at(17)]);
  });
});
