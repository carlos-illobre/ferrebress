import { afterEach, describe, expect, it } from 'vitest';
import { formatHour, formatTime, formatTimeAs, timeFormat } from './time.ts';

// Las 17:05 en Greenwich son las 14:05 en Buenos Aires.
const afternoon = Date.UTC(2026, 10, 6, 17, 5);
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('cómo se escribe una hora', () => {
  afterEach(() => timeFormat.set('h24'));

  it('device-settings-E16: de arranque, 24 horas, en la zona del negocio y no en la del dispositivo', () => {
    expect(formatTime(afternoon)).toBe('14:05');
    expect(formatTime(new Date(Date.UTC(2026, 10, 6, 3, 5)))).toBe('00:05');
    expect(formatHour(afternoon)).toBe('14');
  });

  it('device-settings-E19: la misma hora del negocio, cada una en su formato', () => {
    const inH24 = formatTime(afternoon);
    timeFormat.set('h12');
    expect(plain(formatTime(afternoon))).toBe('2:05 p. m.');
    expect(plain(formatHour(afternoon))).toBe('2 p. m.');
    expect(inH24).toBe('14:05');
    // device-settings-E17: cómo se vería en el otro, sin cambiar el elegido.
    expect(formatTimeAs(afternoon, 'h24')).toBe('14:05');
    expect(timeFormat.get()).toBe('h12');
  });
});
