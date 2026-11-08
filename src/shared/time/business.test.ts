import { describe, expect, it, vi } from 'vitest';
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

describe('la zona del negocio (06 · R5)', () => {
  const fresh = async () => {
    vi.resetModules();
    return import('./business.ts');
  };

  it('hasta que alguien la fija, vale la del sistema', async () => {
    const business = await fresh();
    expect(business.businessTimeZone()).toBe(new Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('fijarla cambia el día de un instante y los formatos', async () => {
    const business = await fresh();
    business.setBusinessTimeZone('Asia/Tokyo');
    expect(business.businessDateOf(new Date('2026-11-04T16:00:00Z'))).toBe('2026-11-05');
    const hour = business.businessFormat('en-US', { hour: 'numeric', hourCycle: 'h23' });
    expect(hour.format(new Date('2026-11-04T16:00:00Z'))).toBe('01');
    expect(business.businessFormat('en-US', { hour: 'numeric', hourCycle: 'h23' })).toBe(hour);
    business.setBusinessTimeZone('America/Argentina/Buenos_Aires');
    expect(business.businessDateOf(new Date('2026-11-04T16:00:00Z'))).toBe('2026-11-04');
    expect(
      business
        .businessFormat('en-US', { hour: 'numeric', hourCycle: 'h23' })
        .format(new Date('2026-11-04T16:00:00Z')),
    ).toBe('13');
  });

  it('fijada para siempre, no se puede cambiar', async () => {
    const business = await fresh();
    business.setBusinessTimeZone('America/Argentina/Buenos_Aires', { final: true });
    expect(() => business.setBusinessTimeZone('Asia/Tokyo')).toThrow('ya está fijada');
    expect(business.businessTimeZone()).toBe('America/Argentina/Buenos_Aires');
  });
});

describe('una zona horaria válida', () => {
  it('conoce las del sistema, también Buenos Aires de Argentina, y no las inventadas', async () => {
    const { isTimeZone } = await import('./business.ts');
    expect(isTimeZone('America/Argentina/Buenos_Aires')).toBe(true);
    expect(isTimeZone('UTC')).toBe(true);
    expect(isTimeZone('Marte/Olympus')).toBe(false);
  });
});
