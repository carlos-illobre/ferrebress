// La lista de los ajustes para todos y cómo se valida cada uno (06 · R2.2, R3.2, R4.2, R6.2, R7.2).
import { describe, expect, it } from 'vitest';
import {
  initialSettings,
  longestSessionHours,
  saveSettingBody,
  settingKeyOf,
  settingValue,
} from './administration.ts';

describe('los ajustes para todos', () => {
  it('los valores de arranque', () => {
    expect(initialSettings()).toEqual({
      roundingStep: 1000,
      quickMargins: [300, 200, 100, 50, 25],
      sessionIdle: 60,
      sessionMax: 8,
      pairingDays: 30,
    });
    expect(longestSessionHours).toBe(24);
  });

  it('una clave se busca en la lista, sin lo que hereda un objeto', () => {
    expect(settingKeyOf('pairingDays')).toBe('pairingDays');
    expect(settingKeyOf('__proto__')).toBeUndefined();
    expect(settingKeyOf('constructor')).toBeUndefined();
  });

  it('administration-E24: el redondeo, solo un paso de la lista', () => {
    expect(settingValue('roundingStep', 500)).toBe(500);
    expect(settingValue('roundingStep', 0)).toBe(0);
    expect(settingValue('roundingStep', 300)).toBeUndefined();
    expect(settingValue('roundingStep', '1000')).toBeUndefined();
  });

  it('administration-E25 y E26: los márgenes se ordenan de mayor a menor', () => {
    expect(settingValue('quickMargins', [300, 200, 150, 50, 25])).toEqual([300, 200, 150, 50, 25]);
    expect(settingValue('quickMargins', [300, 200, 100, 50, 400])).toEqual([400, 300, 200, 100, 50]);
  });

  it('administration-E27 y E28: sin repetidos, enteros de 1 a 10.000 y siempre cinco', () => {
    expect(settingValue('quickMargins', [300, 200, 100, 200, 25])).toBeUndefined();
    expect(settingValue('quickMargins', [300, 200, 100, 50, 0])).toBeUndefined();
    expect(settingValue('quickMargins', [10_001, 200, 100, 50, 25])).toBeUndefined();
    expect(settingValue('quickMargins', [300, 200, 100, 50, 2.5])).toBeUndefined();
    expect(settingValue('quickMargins', [300, 200, 100, 50])).toBeUndefined();
  });

  it('administration-E32 y E37: los tiempos de la sesión, solo de la lista', () => {
    expect(settingValue('sessionIdle', 30)).toBe(30);
    expect(settingValue('sessionIdle', 45)).toBeUndefined();
    expect(settingValue('sessionMax', 12)).toBe(12);
    expect(settingValue('sessionMax', 9)).toBeUndefined();
  });

  it('administration-E38: los días del vínculo, enteros de 1 a 365', () => {
    expect(settingValue('pairingDays', 1)).toBe(1);
    expect(settingValue('pairingDays', 365)).toBe(365);
    for (const bad of [0, 366, 1.5, null]) expect(settingValue('pairingDays', bad)).toBeUndefined();
  });

  it('el cuerpo de un cambio: estricto y con la versión acotada', () => {
    expect(saveSettingBody.safeParse({ value: 15, version: 0 }).success).toBe(true);
    expect(saveSettingBody.safeParse({ value: 15, version: 0, confirmed: 3 }).success).toBe(true);
    expect(saveSettingBody.safeParse({ value: 15, version: -1 }).success).toBe(false);
    expect(saveSettingBody.safeParse({ value: 15, version: 2 ** 31 }).success).toBe(false);
    expect(saveSettingBody.safeParse({ value: 15, version: 0, other: 1 }).success).toBe(false);
  });
});
