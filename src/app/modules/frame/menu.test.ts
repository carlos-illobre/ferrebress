import { describe, expect, it } from 'vitest';
import { isMenuPath } from './menu.ts';

describe('las direcciones del menú', () => {
  it('el inicio, las opciones y lo de adentro sí; lo demás no (03, § 5.4)', () => {
    expect(isMenuPath('/')).toBe(true);
    expect(isMenuPath('/users')).toBe(true);
    expect(isMenuPath('/users/roles/x')).toBe(true);
    expect(isMenuPath('/users/audit-log')).toBe(true);
    expect(isMenuPath('/manual')).toBe(true);
    expect(isMenuPath('/pair')).toBe(false);
    expect(isMenuPath('/usersx')).toBe(false);
  });
});
