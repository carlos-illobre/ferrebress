import { describe, expect, it } from 'vitest';
import { searchKey } from './search-key.ts';

describe('searchKey', () => {
  it('sin acentos, sin mayúsculas y sin espacios de más (08 · R2.1, E10, E16)', () => {
    expect(searchKey('  Ferretera   del SUR ')).toBe('ferretera del sur');
    expect(searchKey('Bulonería Ñandú')).toBe('buloneria nandu');
    expect(searchKey('BREMEN')).toBe(searchKey('Bremen'));
  });
});
