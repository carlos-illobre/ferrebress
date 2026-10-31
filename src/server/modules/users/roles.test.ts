import { describe, expect, it } from 'vitest';
import { administrationProblem, cleanRoleText, gives, outranks } from './roles.ts';

describe('las reglas de los roles (02 · R7, R1.3)', () => {
  it('un nombre de rol: NFC, sin caracteres de control, sin espacios de más, con tope', () => {
    expect(cleanRoleText('  Encargado‎ de   turno ', 40)).toBe('Encargado de turno');
    expect(cleanRoleText('Café', 40)).toBe('Café');
    expect(cleanRoleText('x'.repeat(50), 40)).toHaveLength(40);
    expect(cleanRoleText('   ', 40)).toBeNull();
    expect(cleanRoleText(null, 200)).toBeNull();
  });

  it('R7.11: alguien tiene más si tiene algún permiso que el otro no tiene', () => {
    expect(outranks(['users.view', 'roles.manage'], ['users.view'])).toBe(true);
    expect(outranks(['users.view'], ['users.view', 'users.cut'])).toBe(false);
    expect(outranks([], ['users.view'])).toBe(false);
  });

  it('dar algo: lo de después tiene un permiso que lo de antes no tenía (R3.8)', () => {
    expect(gives(['users.view'], ['users.view', 'users.cut'])).toBe(true);
    expect(gives(['users.view', 'users.cut'], ['users.cut'])).toBe(false);
    expect(gives(['users.cut'], ['users.manage'])).toBe(true);
  });

  it('R1.3: quitarse a sí mismo es «self»; dejar sin nadie es «last-administrator»', () => {
    const fine = { managers: 1, roleManagers: 1, askingManages: true, askingManagesRoles: true };
    expect(administrationProblem(fine, fine)).toBeUndefined();
    expect(administrationProblem(fine, { ...fine, askingManagesRoles: false })).toBe('self');
    expect(administrationProblem(fine, { ...fine, roleManagers: 0 })).toBe('last-administrator');
    expect(administrationProblem(fine, { ...fine, managers: 0 })).toBe('last-administrator');
    // Quien ya no administraba no se «quita» nada.
    const outsider = { ...fine, askingManages: false, askingManagesRoles: false };
    expect(administrationProblem(outsider, outsider)).toBeUndefined();
  });
});
