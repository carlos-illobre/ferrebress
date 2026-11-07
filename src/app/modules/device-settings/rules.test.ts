import { describe, expect, it } from 'vitest';
import { defaults, installRowOf, isDefault, moves, type OfferCase, shouldOffer } from './rules.ts';

describe('la regla de Configuración', () => {
  it('device-settings-E12, E16, E34: de arranque, con movimiento y 24 horas', () => {
    expect(defaults).toEqual({ animations: true, timeFormat: 'h24' });
    expect(isDefault(defaults)).toBe(true);
    expect(isDefault({ animations: false, timeFormat: 'h24' })).toBe(false);
    expect(isDefault({ animations: true, timeFormat: 'h12' })).toBe(false);
  });

  it('device-settings-E15, E32: lo que pasa de verdad con el movimiento', () => {
    expect(moves(defaults, false)).toBe(true);
    expect(moves(defaults, true)).toBe(false);
    expect(moves({ ...defaults, animations: false }, false)).toBe(false);
  });

  it('device-settings-E20 a E24: qué dice el renglón de instalar', () => {
    expect(installRowOf('can')).toBe('button');
    expect(installRowOf('installed')).toBe('installed');
    expect(installRowOf('ios')).toBe('ios');
    expect(installRowOf('installed-here')).toBeUndefined();
    expect(installRowOf('cannot')).toBeUndefined();
  });

  it('device-settings-E25, E27, E38, E39: ofrecer instalar solo en el celular, una vez, fuera de pruebas y sin otra hoja', () => {
    const yes: OfferCase = {
      phone: true,
      signedIn: true,
      testing: false,
      install: 'can',
      offered: false,
      otherSheet: false,
    };
    expect(shouldOffer(yes)).toBe(true);
    expect(shouldOffer({ ...yes, phone: false })).toBe(false);
    expect(shouldOffer({ ...yes, signedIn: false })).toBe(false);
    expect(shouldOffer({ ...yes, testing: true })).toBe(false);
    expect(shouldOffer({ ...yes, install: 'cannot' })).toBe(false);
    expect(shouldOffer({ ...yes, offered: true })).toBe(false);
    expect(shouldOffer({ ...yes, otherSheet: true })).toBe(false);
  });
});
