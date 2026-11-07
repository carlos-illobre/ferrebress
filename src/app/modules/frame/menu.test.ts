import { describe, expect, it } from 'vitest';
import { route } from '../../platform/router.ts';
import { person, withoutScreens } from './frame-test-kit.tsx';
import { goToFirst, isMenuPath } from './menu.ts';

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

describe('ir a la primera opción', () => {
  it('app-R1.4: sin ninguna opción que exista, va al inicio', () => {
    withoutScreens(() => goToFirst(person));
    expect(route.get().path).toBe('/');
  });
});
