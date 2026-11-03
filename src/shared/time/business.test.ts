import { describe, expect, it } from 'vitest';
import {
  addDays,
  businessDateOf,
  firstOfMonth,
  isBusinessDate,
  mondayOf,
  startOfBusinessDate,
} from './business.ts';

describe('los días del negocio', () => {
  it('el día de un instante es el de Buenos Aires, no el de Greenwich', () => {
    expect(businessDateOf(new Date('2026-11-04T02:59:00Z'))).toBe('2026-11-03');
    expect(businessDateOf(new Date('2026-11-04T03:00:00Z'))).toBe('2026-11-04');
  });

  it('un día empieza a las 0 de Buenos Aires', () => {
    expect(startOfBusinessDate('2026-11-04').toISOString()).toBe('2026-11-04T03:00:00.000Z');
    expect(startOfBusinessDate('2027-01-01').toISOString()).toBe('2027-01-01T03:00:00.000Z');
  });

  it('suma días, el lunes de la semana y el primero del mes', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(mondayOf('2026-11-04')).toBe('2026-11-02');
    expect(mondayOf('2026-11-02')).toBe('2026-11-02');
    expect(mondayOf('2026-11-08')).toBe('2026-11-02');
    expect(firstOfMonth('2026-11-04')).toBe('2026-11-01');
  });

  it('una fecha real, con su forma', () => {
    expect(isBusinessDate('2026-11-04')).toBe(true);
    expect(isBusinessDate('2026-02-30')).toBe(false);
    expect(isBusinessDate('2026-13-01')).toBe(false);
    expect(isBusinessDate('2026-11-4')).toBe(false);
    expect(isBusinessDate('mañana')).toBe(false);
  });
});
