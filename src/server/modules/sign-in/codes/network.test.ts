import { describe, expect, it } from 'vitest';
import { networkOf, sameNetwork } from './network.ts';

describe('la misma red', () => {
  it('sign-in-E13: el celular y la computadora en el mismo Wi-Fi salen por la misma dirección', () => {
    expect(sameNetwork('190.1.2.3', '190.1.2.3')).toBe(true);
    expect(sameNetwork('2800:40:1:2::10', '2800:40:1:2:a::1')).toBe(true);
  });

  it('sign-in-E13b: con datos móviles, otra red', () => {
    expect(sameNetwork('190.1.2.3', '181.1.1.1')).toBe(false);
    expect(sameNetwork('2800:40:1:2::10', '2800:40:1:3::10')).toBe(false);
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
