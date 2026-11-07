import { describe, expect, it } from 'vitest';
import { createDeviceNames } from './device-names.ts';

describe('el nombre de los dispositivos', () => {
  it('sin quien lo dé no hay nombre; después, el que da sign-in', () => {
    const names = createDeviceNames();
    expect(names.nameOf('d')).toBeUndefined();
    names.provide((deviceId) => (deviceId === 'd' ? 'Caja' : undefined));
    expect(names.nameOf('d')).toBe('Caja');
    expect(names.nameOf('otro')).toBeUndefined();
  });
});
