import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { openDbIpCities } from './index.ts';

// test-cities.mmdb sale de make-test-cities.py: Córdoba, Buenos Aires (solo en inglés), una red
// sin ciudad y Rosario en IPv6.
const testCities = join(import.meta.dirname, 'test-cities.mmdb');

describe('la ciudad con la base local', () => {
  it('da la ciudad en castellano, o en inglés si no está en castellano', async () => {
    const findCity = await openDbIpCities(testCities);
    expect(await findCity('190.1.2.3')).toBe('Córdoba');
    expect(await findCity('181.0.0.9')).toBe('Buenos Aires');
    expect(await findCity('2800:40::1')).toBe('Rosario');
  });

  it('sin ciudad, con una dirección desconocida o mal escrita, no sabe', async () => {
    const findCity = await openDbIpCities(testCities);
    expect(await findCity('200.0.0.1')).toBeUndefined();
    expect(await findCity('8.8.8.8')).toBeUndefined();
    expect(await findCity('esto no es una dirección')).toBeUndefined();
  });

  it('sin la base, todas son desconocidas y lo avisa al arrancar', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const findCity = await openDbIpCities('/no/existe.mmdb');
    expect(await findCity('190.1.2.3')).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
