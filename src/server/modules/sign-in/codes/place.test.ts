import { describe, expect, it } from 'vitest';
import { networkOf, placeOf } from './place.ts';

describe('dónde está la computadora que pide entrar', () => {
  const computer = (ipAddress: string, city?: string) => ({ ipAddress, city });

  it('sign-in-E13c: si salen por la misma red, lo dice en lugar de la ciudad', () => {
    expect(placeOf(computer('190.1.2.3', 'Córdoba'), computer('190.1.2.3', 'Rosario'))).toEqual({
      kind: 'same-network',
    });
    expect(placeOf(computer('2800:40:1:2::10'), computer('2800:40:1:2:a::1'))).toEqual({
      kind: 'same-network',
    });
  });

  it('sign-in-E13: la misma ciudad', () => {
    expect(placeOf(computer('190.1.2.3', 'Córdoba'), computer('181.1.1.1', 'Córdoba'))).toEqual({
      kind: 'same-city',
      city: 'Córdoba',
    });
  });

  it('sign-in-E13b: ciudades distintas', () => {
    expect(
      placeOf(computer('190.1.2.3', 'Córdoba'), computer('181.1.1.1', 'Buenos Aires')),
    ).toEqual({
      kind: 'different-cities',
      computerCity: 'Córdoba',
      phoneCity: 'Buenos Aires',
    });
  });

  it('sign-in-E13d: una ciudad desconocida cuenta como que no coinciden', () => {
    expect(placeOf(computer('190.1.2.3'), computer('181.1.1.1', 'Córdoba')).kind).toBe(
      'unknown-city',
    );
    expect(placeOf(computer('190.1.2.3', 'Córdoba'), computer('181.1.1.1')).kind).toBe(
      'unknown-city',
    );
  });

  it.each([
    ['190.1.2.3', '190.1.2.3'],
    ['::ffff:190.1.2.3', '190.1.2.3'],
    ['2800:40:1:2:a:b:c:d', '2800:40:1:2'],
    ['2800:0040:0001:0002::1', '2800:40:1:2'],
    ['2800::1', '2800:0:0:0'],
    ['::1', '0:0:0:0'],
  ])('la red de %s es %s', (ip, network) => expect(networkOf(ip)).toBe(network));
});
